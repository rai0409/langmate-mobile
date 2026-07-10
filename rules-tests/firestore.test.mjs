// Firebase Emulator rules-unit tests for firestore.rules.
// Run via:  npm run test:rules
// (firebase emulators:exec sets FIRESTORE_EMULATOR_HOST automatically.)
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  increment,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const ALICE = "alice";
const BOB = "bob";
const CAROL = "carol";

const testEnv = await initializeTestEnvironment({
  projectId: "demo-langmate",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
});

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, kind, promise) {
  try {
    await (kind === "allow" ? assertSucceeds(promise) : assertFails(promise));
    passed += 1;
    console.log(`  PASS  [${kind}] ${name}`);
  } catch (e) {
    failed += 1;
    failures.push(name);
    console.log(`  FAIL  [${kind}] ${name} -> ${e.message ?? e}`);
  }
}

const aliceDb = () => testEnv.authenticatedContext(ALICE).firestore();
const bobDb = () => testEnv.authenticatedContext(BOB).firestore();
const carolDb = () => testEnv.authenticatedContext(CAROL).firestore();
const anonDb = () => testEnv.unauthenticatedContext().firestore();

const profile = (uid, isDiscoverable) => ({
  uid,
  displayName: uid,
  nativeLang: "ja",
  targetLang: "en",
  level: "intermediate",
  learningGoal: "daily_conversation",
  interests: [],
  availableTimes: [],
  bio: "hi",
  isDiscoverable,
  createdAt: new Date(),
  updatedAt: new Date(),
});

async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

// =========================================================
// profiles
// =========================================================
console.log("profiles:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "profiles", BOB), profile(BOB, true)); // discoverable
  await setDoc(doc(db, "profiles", CAROL), profile(CAROL, false)); // not discoverable
});
await check("owner can create own profile", "allow",
  setDoc(doc(aliceDb(), "profiles", ALICE), profile(ALICE, true)));
await check("owner cannot create profile for another uid", "deny",
  setDoc(doc(aliceDb(), "profiles", BOB), profile(BOB, true)));
await check("uid field must match doc id", "deny",
  setDoc(doc(aliceDb(), "profiles", ALICE), profile(BOB, true)));
await check("authed user can read discoverable profile", "allow",
  getDoc(doc(aliceDb(), "profiles", BOB)));
await check("authed user cannot read non-discoverable other profile", "deny",
  getDoc(doc(aliceDb(), "profiles", CAROL)));
await check("owner can read own non-discoverable profile", "allow",
  getDoc(doc(carolDb(), "profiles", CAROL)));
await check("unauthenticated cannot read profile", "deny",
  getDoc(doc(anonDb(), "profiles", BOB)));

// =========================================================
// swipes
// =========================================================
console.log("swipes:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "swipes", `${ALICE}_${BOB}`), {
    fromUid: ALICE, toUid: BOB, action: "connect", createdAt: new Date(),
  });
});
await check("user can create own outgoing connect swipe", "allow",
  setDoc(doc(aliceDb(), "swipes", `${ALICE}_${CAROL}`), {
    fromUid: ALICE, toUid: CAROL, action: "connect", createdAt: new Date(),
  }));
await check("user cannot create swipe with fromUid != auth uid", "deny",
  setDoc(doc(aliceDb(), "swipes", `${BOB}_${CAROL}`), {
    fromUid: BOB, toUid: CAROL, action: "connect", createdAt: new Date(),
  }));
await check("swipe id must equal fromUid_toUid", "deny",
  setDoc(doc(aliceDb(), "swipes", "wrong-id"), {
    fromUid: ALICE, toUid: BOB, action: "connect", createdAt: new Date(),
  }));
await check("swipe action must be connect/skip", "deny",
  setDoc(doc(aliceDb(), "swipes", `${ALICE}_${BOB}`), {
    fromUid: ALICE, toUid: BOB, action: "love", createdAt: new Date(),
  }));
await check("target can read incoming swipe (mutual-match check)", "allow",
  getDoc(doc(bobDb(), "swipes", `${ALICE}_${BOB}`)));
await check("unrelated user cannot read a swipe", "deny",
  getDoc(doc(carolDb(), "swipes", `${ALICE}_${BOB}`)));
// Reproduces the Prompt010 Connect bug: the mutual-match check reads the
// INCOMING swipe before the other side has swiped, i.e. a get on a doc that
// does not exist. Must be allowed (returns "not found", leaks nothing).
await check("user can get a non-existent incoming swipe (Connect mutual-match check)", "allow",
  getDoc(doc(aliceDb(), "swipes", `${CAROL}_${ALICE}`)));

// =========================================================
// matches
// =========================================================
console.log("matches:");
await testEnv.clearFirestore();
const M1 = `${ALICE}_${BOB}`;
await seed(async (db) => {
  await setDoc(doc(db, "matches", M1), {
    matchId: M1, memberUids: [ALICE, BOB], createdAt: new Date(),
  });
});
await check("member can read match", "allow",
  getDoc(doc(aliceDb(), "matches", M1)));
await check("non-member cannot read match", "deny",
  getDoc(doc(carolDb(), "matches", M1)));
// Reproduces the Prompt010 Connect bug: createMatchIfMutualConnect does a
// get() on matches/{matchId} to check existence BEFORE the match is created,
// i.e. a get on a doc that does not exist. Must be allowed.
await check("user can get a not-yet-created match (Connect existence check)", "allow",
  getDoc(doc(aliceDb(), "matches", `${ALICE}_${CAROL}`)));
await check("member can update lastMessage/lastSentAt", "allow",
  updateDoc(doc(aliceDb(), "matches", M1), {
    lastMessage: "hi", lastSentAt: new Date(),
  }));
await check("member cannot change memberUids", "deny",
  updateDoc(doc(aliceDb(), "matches", M1), { memberUids: [ALICE, CAROL] }));
await check("member can create a two-member match including self", "allow",
  setDoc(doc(aliceDb(), "matches", `${ALICE}_${CAROL}`), {
    matchId: `${ALICE}_${CAROL}`, memberUids: [ALICE, CAROL], createdAt: new Date(),
  }));
await check("non-member cannot create a match", "deny",
  setDoc(doc(carolDb(), "matches", `${ALICE}_${BOB}_x`), {
    matchId: "x", memberUids: [ALICE, BOB], createdAt: new Date(),
  }));

// =========================================================
// messages (subcollection of matches/M1, members alice+bob)
// =========================================================
console.log("messages:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "matches", M1), {
    matchId: M1, memberUids: [ALICE, BOB], createdAt: new Date(),
  });
  await setDoc(doc(db, "matches", M1, "messages", "seed1"), {
    fromUid: ALICE, text: "seeded", createdAt: new Date(),
  });
});
await check("member can create message with fromUid == auth.uid", "allow",
  addDoc(collection(aliceDb(), "matches", M1, "messages"), {
    fromUid: ALICE, text: "hello", createdAt: new Date(),
  }));
await check("member cannot create message with fromUid != auth.uid", "deny",
  addDoc(collection(aliceDb(), "matches", M1, "messages"), {
    fromUid: BOB, text: "spoof", createdAt: new Date(),
  }));
await check("message text must be non-empty", "deny",
  addDoc(collection(aliceDb(), "matches", M1, "messages"), {
    fromUid: ALICE, text: "", createdAt: new Date(),
  }));
await check("member can read messages", "allow",
  getDocs(collection(bobDb(), "matches", M1, "messages")));
await check("non-member cannot read messages", "deny",
  getDocs(collection(carolDb(), "matches", M1, "messages")));
{
  const db = aliceDb();
  const batch = writeBatch(db);
  batch.set(doc(collection(db, "matches", M1, "messages")), {
    fromUid: ALICE, text: "batched hello", createdAt: new Date(),
  });
  batch.set(doc(db, "matches", M1), {
    lastMessage: "batched hello", lastSentAt: new Date(),
  }, { merge: true });
  await check("member can batch message and match preview", "allow",
    batch.commit());
}
{
  const db = aliceDb();
  const batch = writeBatch(db);
  batch.set(doc(collection(db, "matches", M1, "messages")), {
    fromUid: ALICE, text: "batched hello", createdAt: new Date(),
  });
  batch.set(doc(db, "matches", M1), {
    lastMessage: "batched hello", lastSentAt: new Date(),
  }, { merge: true });
  batch.set(doc(db, "matches", M1, "memberStates", BOB), {
    unreadCount: increment(1), updatedAt: new Date(),
  }, { merge: true });
  await check("member cannot batch message, match preview, and recipient unread", "deny",
    batch.commit());
}

// =========================================================
// memberStates (subcollection of matches/M1, members alice+bob)
// =========================================================
console.log("memberStates:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "matches", M1), {
    matchId: M1, memberUids: [ALICE, BOB], createdAt: new Date(),
  });
  await setDoc(doc(db, "matches", M1, "memberStates", BOB), {
    unreadCount: 1, updatedAt: new Date(),
  });
});
await check("member can read own memberState", "allow",
  getDoc(doc(bobDb(), "matches", M1, "memberStates", BOB)));
await check("member cannot read another memberState", "deny",
  getDoc(doc(aliceDb(), "matches", M1, "memberStates", BOB)));
await check("non-member cannot read memberState", "deny",
  getDoc(doc(carolDb(), "matches", M1, "memberStates", BOB)));
await check("member can mark own match read", "allow",
  setDoc(doc(bobDb(), "matches", M1, "memberStates", BOB), {
    unreadCount: 0, lastReadAt: new Date(), updatedAt: new Date(),
  }, { merge: true }));
await check("member can create own memberState", "allow",
  setDoc(doc(aliceDb(), "matches", M1, "memberStates", ALICE), {
    unreadCount: 0, muted: false, updatedAt: new Date(),
  }, { merge: true }));
await check("sender match member cannot write recipient unread", "deny",
  setDoc(doc(aliceDb(), "matches", M1, "memberStates", BOB), {
    unreadCount: 2, updatedAt: new Date(),
  }, { merge: true }));
await check("sender cannot update recipient lastReadAt", "deny",
  updateDoc(doc(aliceDb(), "matches", M1, "memberStates", BOB), {
    lastReadAt: new Date(),
  }));
await check("non-member cannot write memberState", "deny",
  setDoc(doc(carolDb(), "matches", M1, "memberStates", BOB), {
    unreadCount: 3, updatedAt: new Date(),
  }, { merge: true }));

// =========================================================
// entitlements
// =========================================================
console.log("entitlements:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "entitlements", ALICE), {
    plan: "premium", active: true, updatedAt: new Date(),
  });
});
await check("user can read own entitlement", "allow",
  getDoc(doc(aliceDb(), "entitlements", ALICE)));
await check("user cannot read another entitlement", "deny",
  getDoc(doc(bobDb(), "entitlements", ALICE)));
await check("client cannot write entitlement", "deny",
  setDoc(doc(aliceDb(), "entitlements", ALICE), {
    plan: "premium", active: true, updatedAt: new Date(),
  }));

// =========================================================
// blocks
// =========================================================
console.log("blocks:");
await testEnv.clearFirestore();
const BLOCK_ID = `${ALICE}_${BOB}`;
await seed(async (db) => {
  await setDoc(doc(db, "blocks", BLOCK_ID), {
    blockerUid: ALICE, blockedUid: BOB, createdAt: new Date(),
  });
});
await check("blocker can create own block", "allow",
  setDoc(doc(aliceDb(), "blocks", `${ALICE}_${CAROL}`), {
    blockerUid: ALICE, blockedUid: CAROL, createdAt: new Date(),
  }));
await check("cannot create block with blockerUid != auth uid", "deny",
  setDoc(doc(bobDb(), "blocks", `${ALICE}_${CAROL}`), {
    blockerUid: ALICE, blockedUid: CAROL, createdAt: new Date(),
  }));
await check("blocker can read own block", "allow",
  getDoc(doc(aliceDb(), "blocks", BLOCK_ID)));
await check("blocked user can read the block", "allow",
  getDoc(doc(bobDb(), "blocks", BLOCK_ID)));
await check("unrelated user cannot read block", "deny",
  getDoc(doc(carolDb(), "blocks", BLOCK_ID)));

// =========================================================
// reports
// =========================================================
console.log("reports:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "reports", "seed1"), {
    reporterUid: ALICE, reportedUid: BOB, reason: "test report", createdAt: new Date(),
  });
});
await check("reporter can create report", "allow",
  addDoc(collection(aliceDb(), "reports"), {
    reporterUid: ALICE, reportedUid: BOB, reason: "test report", createdAt: new Date(),
  }));
await check("reporter cannot spoof reporterUid", "deny",
  addDoc(collection(aliceDb(), "reports"), {
    reporterUid: BOB, reportedUid: CAROL, reason: "spoof", createdAt: new Date(),
  }));
await check("report reason must be non-empty", "deny",
  addDoc(collection(aliceDb(), "reports"), {
    reporterUid: ALICE, reportedUid: BOB, reason: "", createdAt: new Date(),
  }));
await check("normal user cannot read reports", "deny",
  getDoc(doc(aliceDb(), "reports", "seed1")));
await check("normal user cannot list reports", "deny",
  getDocs(collection(aliceDb(), "reports")));

// =========================================================
// admin-only moderation collections
// =========================================================
console.log("moderation:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "reportReviews", "seed1"), {
    reportId: "seed1",
    reporterUid: ALICE,
    reportedUid: BOB,
    status: "open",
    severity: "medium",
    action: "none",
    adminNotes: "seeded",
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedBy: "admin",
  });
  await setDoc(doc(db, "moderationReviews", "review1"), {
    reportId: "seed1",
    reporterUid: ALICE,
    reportedUid: BOB,
    status: "open",
    severity: "medium",
    action: "none",
    adminNotes: "seeded",
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedBy: "admin",
  });
  await setDoc(doc(db, "userModeration", BOB), {
    uid: BOB,
    status: "warned",
    reason: "seeded",
    sourceReportId: "seed1",
    updatedAt: new Date(),
    updatedBy: "admin",
  });
});
await check("normal user cannot read report review", "deny",
  getDoc(doc(aliceDb(), "reportReviews", "seed1")));
await check("normal user cannot list report reviews", "deny",
  getDocs(collection(aliceDb(), "reportReviews")));
await check("normal user cannot write report review", "deny",
  setDoc(doc(aliceDb(), "reportReviews", "seed2"), {
    reportId: "seed2",
    reporterUid: ALICE,
    reportedUid: BOB,
    status: "open",
    severity: "low",
    action: "none",
    adminNotes: "client attempt",
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedBy: ALICE,
  }));
await check("normal user cannot read moderation review", "deny",
  getDoc(doc(aliceDb(), "moderationReviews", "review1")));
await check("normal user cannot write moderation review", "deny",
  setDoc(doc(aliceDb(), "moderationReviews", "review2"), {
    reportId: "seed1",
    reporterUid: ALICE,
    reportedUid: BOB,
    status: "reviewing",
    severity: "medium",
    action: "warning",
    adminNotes: "client attempt",
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedBy: ALICE,
  }));
await check("reported user cannot read own moderation status", "deny",
  getDoc(doc(bobDb(), "userModeration", BOB)));
await check("unrelated user cannot read moderation status", "deny",
  getDoc(doc(carolDb(), "userModeration", BOB)));
await check("normal user cannot write user moderation status", "deny",
  setDoc(doc(aliceDb(), "userModeration", ALICE), {
    uid: ALICE,
    status: "active",
    reason: "client attempt",
    sourceReportId: "seed1",
    updatedAt: new Date(),
    updatedBy: ALICE,
  }));

// =========================================================
// account deletion requests
// =========================================================
console.log("accountDeletionRequests:");
await testEnv.clearFirestore();
await seed(async (db) => {
  await setDoc(doc(db, "accountDeletionRequests", BOB), {
    uid: BOB,
    status: "requested",
    reason: "seeded request",
    contactEmail: "bob@example.test",
    requestedAt: new Date(),
    updatedAt: new Date(),
    source: "rules-test-seed",
  });
});
await check("user can create own account deletion request", "allow",
  setDoc(doc(aliceDb(), "accountDeletionRequests", ALICE), {
    uid: ALICE,
    status: "requested",
    reason: "please delete my account",
    contactEmail: "alice@example.test",
    requestedAt: new Date(),
    updatedAt: new Date(),
    source: "web",
  }));
await check("user can read own account deletion request", "allow",
  getDoc(doc(bobDb(), "accountDeletionRequests", BOB)));
await check("user cannot read another user's account deletion request", "deny",
  getDoc(doc(aliceDb(), "accountDeletionRequests", BOB)));
await check("user cannot list all account deletion requests", "deny",
  getDocs(collection(aliceDb(), "accountDeletionRequests")));
await check("user cannot create account deletion request for another uid", "deny",
  setDoc(doc(aliceDb(), "accountDeletionRequests", BOB), {
    uid: BOB,
    status: "requested",
    reason: "spoof",
    requestedAt: new Date(),
    updatedAt: new Date(),
    source: "web",
  }));
await check("account deletion request uid must match doc id", "deny",
  setDoc(doc(aliceDb(), "accountDeletionRequests", ALICE), {
    uid: BOB,
    status: "requested",
    reason: "mismatch",
    requestedAt: new Date(),
    updatedAt: new Date(),
    source: "web",
  }));
await check("account deletion request status is client-fixed to requested", "deny",
  setDoc(doc(aliceDb(), "accountDeletionRequests", ALICE), {
    uid: ALICE,
    status: "completed",
    requestedAt: new Date(),
    updatedAt: new Date(),
    source: "web",
  }));

// =========================================================
await testEnv.cleanup();
console.log(`\nRules tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`Failing: ${failures.join(", ")}`);
  process.exit(1);
}
process.exit(0);
