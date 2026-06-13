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
  collection,
  getDocs,
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
    reporterUid: ALICE, reportedUid: BOB, reason: "MVP report", createdAt: new Date(),
  });
});
await check("reporter can create report", "allow",
  addDoc(collection(aliceDb(), "reports"), {
    reporterUid: ALICE, reportedUid: BOB, reason: "MVP report", createdAt: new Date(),
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

// =========================================================
await testEnv.cleanup();
console.log(`\nRules tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`Failing: ${failures.join(", ")}`);
  process.exit(1);
}
process.exit(0);
