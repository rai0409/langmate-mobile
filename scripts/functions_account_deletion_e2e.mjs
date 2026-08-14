import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { processDeletion, MAX_ATTEMPTS } from '../functions/lib/accountDeletionProcessor.js';
const requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = requireFunctions('firebase-admin/app');
const { getFirestore } = requireFunctions('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST required');
initializeApp({ credential: applicationDefault(), projectId: 'demo-langmate' });
const db = getFirestore();
const uid = 'account-delete-e2e-user',
  other = 'account-delete-e2e-other';
const req = db.doc(`accountDeletionRequests/${uid}`);
const now = Date.now();
const base = (extra = {}) => ({
  uid,
  status: 'scheduled',
  scheduledFor: new Date(now - 1),
  nextAttemptAt: new Date(now - 1),
  requestedAt: new Date(),
  ...extra,
});
await req.set(base());
await db.doc(`profiles/${uid}`).set({ email: 'never-audit@example.test', displayName: 'Private' });
await db.doc(`profiles/${other}`).set({ displayName: 'Other' });
await db.doc(`users/${uid}/pushTokens/device`).set({ token: 'secret-token', enabled: true });
await db.doc(`users/${other}/pushTokens/device`).set({ token: 'other', enabled: true });
await db.doc('notificationOutbox/pending').set({ recipientUid: uid, status: 'processing' });
await db.doc('notificationOutbox/sent').set({ recipientUid: uid, status: 'sent' });
await db.doc('notificationOutbox/other').set({ recipientUid: other, status: 'sent' });
await db.doc(`blocks/${uid}_${other}`).set({ blockerUid: uid, blockedUid: other });
await db.doc(`blocks/${other}_${uid}`).set({ blockerUid: other, blockedUid: uid });
await db.doc(`blocks/${other}_third`).set({ blockerUid: other, blockedUid: 'third' });
const steps = [];
const prefixes = [];
let statusAtAuth;
await processDeletion(uid, db, {
  deletePrefix: async (id) => {
    prefixes.push(`profilePhotos/${id}/`);
    return 0;
  },
  deleteAuth: async () => {
    statusAtAuth = (await req.get()).data().status;
    steps.push('auth');
  },
  observe: (s) => steps.push(s),
});
let result = (await req.get()).data();
assert.equal(result.status, 'completed');
assert.equal((await db.doc(`users/${uid}/pushTokens/device`).get()).data().enabled, false);
assert.equal((await db.doc(`users/${other}/pushTokens/device`).get()).data().enabled, true);
assert.equal((await db.doc('notificationOutbox/pending').get()).data().status, 'skipped');
assert.equal((await db.doc('notificationOutbox/sent').get()).data().status, 'sent');
assert.equal((await db.doc('notificationOutbox/other').get()).data().status, 'sent');
assert.equal((await db.doc(`profiles/${uid}`).get()).exists, false);
assert.equal((await db.doc(`profiles/${other}`).get()).exists, true);
assert.equal((await db.doc(`blocks/${uid}_${other}`).get()).exists, false);
assert.equal((await db.doc(`blocks/${other}_${uid}`).get()).exists, false);
assert.equal((await db.doc(`blocks/${other}_third`).get()).exists, true);
assert.deepEqual(prefixes, [`profilePhotos/${uid}/`]);
assert.equal(statusAtAuth, 'processing');
assert.ok(steps.indexOf('auth') > steps.indexOf('storage'));
assert.ok(steps.indexOf('completion_audit') > steps.indexOf('auth'));
assert.ok(steps.indexOf('completed') > steps.indexOf('completion_audit'));
const audit = await db.collection('accountDeletionAudit').get();
assert.ok(audit.size >= 2);
for (const d of audit.docs) {
  const x = JSON.stringify(d.data());
  assert.ok(
    !x.includes('never-audit@example.test') && !x.includes('secret-token') && !x.includes(uid),
  );
}
const retry = db.doc('accountDeletionRequests/retry');
await retry.set(base({ uid: 'retry', status: 'scheduled', nextAttemptAt: new Date(now - 1) }));
await processDeletion('retry', db, {
  deletePrefix: async () => 0,
  deleteAuth: async () => {
    throw Object.assign(new Error('temporary auth failure'), { code: 'auth/internal-error' });
  },
});
assert.equal((await retry.get()).data().status, 'retryable_failed');
await retry.set({ status: 'scheduled', nextAttemptAt: new Date(now - 1) }, { merge: true });
await processDeletion('retry', db, { deletePrefix: async () => 0, deleteAuth: async () => {} });
assert.equal((await retry.get()).data().status, 'completed');
const missing = db.doc('accountDeletionRequests/missing-auth');
await missing.set(
  base({ uid: 'missing-auth', status: 'scheduled', nextAttemptAt: new Date(now - 1) }),
);
await processDeletion('missing-auth', db, {
  deletePrefix: async () => 0,
  deleteAuth: async () => {
    throw Object.assign(new Error('already deleted'), { code: 'auth/user-not-found' });
  },
});
assert.equal((await missing.get()).data().status, 'completed');
const terminal = db.doc('accountDeletionRequests/terminal');
await terminal.set(base({ uid: 'terminal', attemptCount: MAX_ATTEMPTS - 1 }));
await processDeletion('terminal', db, {
  deletePrefix: async () => {
    throw new Error('x');
  },
  deleteAuth: async () => {},
});
assert.equal((await terminal.get()).data().status, 'permanently_failed');
console.log('PASS account deletion Functions E2E');
