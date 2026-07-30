import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

const ALICE = 'alice';
const BOB = 'bob';
const path = (uid = ALICE) => `profilePhotos/${uid}/avatar.jpg`;
const bytes = (size = 1) => new Uint8Array(size);
const jpeg = () => ({ contentType: 'image/jpeg', customMetadata: {} });
const testEnv = await initializeTestEnvironment({
  projectId: 'demo-langmate',
  storage: { rules: readFileSync('storage.rules', 'utf8') },
});
const storage = (uid) => testEnv.authenticatedContext(uid).storage();
const anonymous = () => testEnv.unauthenticatedContext().storage();
async function seed(target = path()) {
  await testEnv.withSecurityRulesDisabled(async (context) =>
    uploadBytes(ref(context.storage(), target), bytes(), jpeg()),
  );
}
async function check(name, promise, allowed) {
  await (allowed ? assertSucceeds(promise) : assertFails(promise));
  console.log(`PASS ${name}`);
}

await check('unauthenticated read denied', getBytes(ref(anonymous(), path())), false);
await check(
  'unauthenticated upload denied',
  uploadBytes(ref(anonymous(), path()), bytes(), jpeg()),
  false,
);
await check(
  'owner avatar create allowed',
  uploadBytes(ref(storage(ALICE), path()), bytes(), jpeg()),
  true,
);
await check(
  'owner update allowed',
  uploadBytes(ref(storage(ALICE), path()), bytes(2), jpeg()),
  true,
);
await check('owner read allowed', getBytes(ref(storage(ALICE), path())), true);
await check('other authenticated read allowed', getBytes(ref(storage(BOB), path())), true);
await check('owner delete allowed', deleteObject(ref(storage(ALICE), path())), true);
await seed();
await check('other upload denied', uploadBytes(ref(storage(BOB), path()), bytes(), jpeg()), false);
await check('other update denied', uploadBytes(ref(storage(BOB), path()), bytes(2), jpeg()), false);
await check('other delete denied', deleteObject(ref(storage(BOB), path())), false);
await check(
  'unexpected filename denied',
  uploadBytes(ref(storage(ALICE), 'profilePhotos/alice/photo.jpg'), bytes(), jpeg()),
  false,
);
await check(
  'nested path denied',
  uploadBytes(ref(storage(ALICE), 'profilePhotos/alice/nested/avatar.jpg'), bytes(), jpeg()),
  false,
);
await check(
  'invalid MIME denied',
  uploadBytes(ref(storage(ALICE), path()), bytes(), { contentType: 'image/png' }),
  false,
);
await check(
  'oversized upload denied',
  uploadBytes(ref(storage(ALICE), path()), bytes(5 * 1024 * 1024 + 1), jpeg()),
  false,
);
await check(
  'size limit allowed',
  uploadBytes(ref(storage(ALICE), path()), bytes(5 * 1024 * 1024), jpeg()),
  true,
);
await check(
  'unknown path denied',
  uploadBytes(ref(storage(ALICE), 'other/alice/avatar.jpg'), bytes(), jpeg()),
  false,
);
await check(
  'UID prefix bypass denied',
  uploadBytes(ref(storage(ALICE), 'profilePhotos/alice-2/avatar.jpg'), bytes(), jpeg()),
  false,
);
await check(
  'missing content type denied',
  uploadBytes(ref(storage(ALICE), path()), bytes(), {}),
  false,
);
await check(
  'zero-byte upload denied',
  uploadBytes(ref(storage(ALICE), path()), bytes(0), jpeg()),
  false,
);
await seed();
await check(
  'overwrite MIME revalidated',
  uploadBytes(ref(storage(ALICE), path()), bytes(), { contentType: 'image/png' }),
  false,
);
await check(
  'overwrite size revalidated',
  uploadBytes(ref(storage(ALICE), path()), bytes(5 * 1024 * 1024 + 1), jpeg()),
  false,
);
await testEnv.cleanup();
