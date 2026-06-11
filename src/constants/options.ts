import type {
  AvailabilitySlot,
  LanguageCode,
  LearningGoal,
  UserLevel,
} from "../types/domain";

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const LANGUAGE_OPTIONS: Option<LanguageCode>[] = [
  { value: "ja", label: "Japanese" },
  { value: "en", label: "English" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "id", label: "Indonesian" },
  { value: "other", label: "Other" },
];

export const LEVEL_OPTIONS: Option<UserLevel>[] = [
  { value: "beginner", label: "Beginner" },
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "native", label: "Native" },
];

export const LEARNING_GOAL_OPTIONS: Option<LearningGoal>[] = [
  { value: "daily_conversation", label: "Daily conversation" },
  { value: "business", label: "Business" },
  { value: "exam", label: "Exam prep" },
  { value: "travel", label: "Travel" },
  { value: "culture", label: "Culture" },
  { value: "friendship", label: "Friendship" },
];

export const AVAILABILITY_OPTIONS: Option<AvailabilitySlot>[] = [
  { value: "weekday_morning", label: "Weekday mornings" },
  { value: "weekday_daytime", label: "Weekday daytime" },
  { value: "weekday_night", label: "Weekday nights" },
  { value: "weekend_morning", label: "Weekend mornings" },
  { value: "weekend_daytime", label: "Weekend daytime" },
  { value: "weekend_night", label: "Weekend nights" },
];

export const DEFAULT_INTERESTS: string[] = [
  "music",
  "movies",
  "travel",
  "food",
  "sports",
  "books",
  "games",
  "anime",
  "technology",
  "art",
];

export function languageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export function levelLabel(value: string): string {
  return LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function learningGoalLabel(value: string): string {
  return LEARNING_GOAL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function availabilityLabel(value: string): string {
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
