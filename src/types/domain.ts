export type LanguageCode =
  | "ja"
  | "en"
  | "ko"
  | "zh"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "th"
  | "vi"
  | "id"
  | "other";

export type Plan = "free" | "premium";

export type UserLevel =
  | "beginner"
  | "elementary"
  | "intermediate"
  | "advanced"
  | "native";

export type LearningGoal =
  | "daily_conversation"
  | "business"
  | "exam"
  | "travel"
  | "culture"
  | "friendship";

export type AvailabilitySlot =
  | "weekday_morning"
  | "weekday_daytime"
  | "weekday_night"
  | "weekend_morning"
  | "weekend_daytime"
  | "weekend_night";

export interface Profile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  photoURL?: string;
  photoUpdatedAt?: unknown;
  nativeLang: LanguageCode;
  targetLang: LanguageCode;
  nativeLangs?: LanguageCode[];
  targetLangs?: LanguageCode[];
  level: UserLevel;
  learningGoal: LearningGoal;
  interests: string[];
  availableTimes: AvailabilitySlot[];
  country?: string;
  bio: string;
  isDiscoverable: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SwipeAction = "skip" | "connect";

export interface Swipe {
  fromUid: string;
  toUid: string;
  action: SwipeAction;
  createdAt?: unknown;
}

export interface Match {
  matchId: string;
  memberUids: string[];
  createdAt?: unknown;
  lastMessage?: string;
  lastSentAt?: unknown;
}

export interface Entitlement {
  plan: Plan;
  active: boolean;
  updatedAt?: unknown;
}

export interface MatchMemberState {
  unreadCount: number;
  lastReadAt?: unknown;
  muted?: boolean;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id?: string;
  fromUid: string;
  text: string;
  createdAt?: unknown;
}

export interface Block {
  blockerUid: string;
  blockedUid: string;
  createdAt?: unknown;
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "fake_profile"
  | "other";

export interface Report {
  reporterUid: string;
  reportedUid: string;
  reason: ReportReason;
  details?: string;
  createdAt?: unknown;
}

export interface MatchScoreResult {
  score: number | null;
  whyMatched: string[];
  missingFields: string[];
}
