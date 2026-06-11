import type { MatchScoreResult, Profile, UserLevel } from "../types/domain";

const LEVEL_VALUE: Record<UserLevel, number> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  advanced: 4,
  native: 5,
};

export function calculateMatchScore(
  currentProfile: Profile,
  candidateProfile: Profile
): MatchScoreResult {
  const missingFields: string[] = [];
  if (!currentProfile.nativeLang) missingFields.push("currentProfile.nativeLang");
  if (!currentProfile.targetLang) missingFields.push("currentProfile.targetLang");
  if (!candidateProfile.nativeLang)
    missingFields.push("candidateProfile.nativeLang");
  if (!candidateProfile.targetLang)
    missingFields.push("candidateProfile.targetLang");

  if (missingFields.length > 0) {
    return { score: null, whyMatched: [], missingFields };
  }

  let score = 0;
  const whyMatched: string[] = [];

  // 1. Reciprocal language pair: max 45
  const helpsMe = currentProfile.targetLang === candidateProfile.nativeLang;
  const helpsThem = currentProfile.nativeLang === candidateProfile.targetLang;
  if (helpsMe) score += 25;
  if (helpsThem) score += 20;
  if (helpsMe && helpsThem) {
    whyMatched.push("You can help each other with your target languages.");
  } else if (helpsMe || helpsThem) {
    whyMatched.push("This partner matches one side of your language goals.");
  }

  // 2. Shared interests: max 20 (+5 each, lowercase comparison)
  const candidateInterests = new Set(
    (candidateProfile.interests ?? []).map((i) => i.toLowerCase())
  );
  const shared = (currentProfile.interests ?? []).filter((i) =>
    candidateInterests.has(i.toLowerCase())
  );
  if (shared.length > 0) {
    score += Math.min(shared.length * 5, 20);
    whyMatched.push(`You share ${shared.length} interests.`);
  }

  // 3. Same learning goal: max 15
  if (
    currentProfile.learningGoal &&
    currentProfile.learningGoal === candidateProfile.learningGoal
  ) {
    score += 15;
    whyMatched.push("You have the same learning goal.");
  }

  // 4. Availability overlap: max 10
  const candidateTimes = new Set(candidateProfile.availableTimes ?? []);
  const hasOverlap = (currentProfile.availableTimes ?? []).some((t) =>
    candidateTimes.has(t)
  );
  if (hasOverlap) {
    score += 10;
    whyMatched.push("You have overlapping availability.");
  }

  // 5. Level balance: max 10
  const currentLevel = LEVEL_VALUE[currentProfile.level];
  const candidateLevel = LEVEL_VALUE[candidateProfile.level];
  if (currentLevel !== undefined && candidateLevel !== undefined) {
    const diff = Math.abs(currentLevel - candidateLevel);
    const levelPoints = diff <= 1 ? 10 : diff === 2 ? 5 : 0;
    if (levelPoints > 0) {
      score += levelPoints;
      whyMatched.push("Your levels look compatible.");
    }
  }

  return {
    score: Math.round(Math.min(Math.max(score, 0), 100)),
    whyMatched,
    missingFields,
  };
}

export interface RankedCandidate {
  profile: Profile;
  scoreResult: MatchScoreResult;
}

export function filterAndRankCandidates(
  currentProfile: Profile,
  candidates: Profile[]
): RankedCandidate[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.uid !== currentProfile.uid && candidate.isDiscoverable
    )
    .map((profile) => ({
      profile,
      scoreResult: calculateMatchScore(currentProfile, profile),
    }))
    .sort((a, b) => {
      if (a.scoreResult.score === null && b.scoreResult.score === null)
        return 0;
      if (a.scoreResult.score === null) return 1;
      if (b.scoreResult.score === null) return -1;
      return b.scoreResult.score - a.scoreResult.score;
    });
}
