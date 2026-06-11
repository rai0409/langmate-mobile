import type { Profile } from "../types/domain";

/**
 * Original fake preview users. Shown in Discover only when Firebase is not
 * configured or returns no candidates, always with a visible "Preview data"
 * label. Never written to Firestore.
 */
export const MOCK_CURRENT_PROFILE: Profile = {
  uid: "mock-current-user",
  displayName: "You (Preview)",
  nativeLang: "ja",
  targetLang: "en",
  level: "intermediate",
  learningGoal: "daily_conversation",
  interests: ["music", "travel", "food"],
  availableTimes: ["weekday_night", "weekend_daytime"],
  country: "Japan",
  bio: "Preview profile used when no real profile is available.",
  isDiscoverable: true,
};

export const MOCK_PROFILES: Profile[] = [
  {
    uid: "mock-haruka",
    displayName: "Haruka",
    nativeLang: "ja",
    targetLang: "en",
    level: "intermediate",
    learningGoal: "daily_conversation",
    interests: ["music", "movies", "food"],
    availableTimes: ["weekday_night", "weekend_daytime"],
    country: "Japan",
    bio: "Tokyo office worker who wants to chat casually in English about everyday life.",
    isDiscoverable: true,
  },
  {
    uid: "mock-oliver",
    displayName: "Oliver",
    nativeLang: "en",
    targetLang: "ja",
    level: "elementary",
    learningGoal: "daily_conversation",
    interests: ["games", "anime", "travel"],
    availableTimes: ["weekday_night", "weekend_night"],
    country: "United Kingdom",
    bio: "Learning Japanese for my first trip to Osaka. Happy to help with natural English.",
    isDiscoverable: true,
  },
  {
    uid: "mock-jiwoo",
    displayName: "Jiwoo",
    nativeLang: "ko",
    targetLang: "ja",
    level: "intermediate",
    learningGoal: "culture",
    interests: ["music", "books", "art"],
    availableTimes: ["weekend_morning", "weekend_daytime"],
    country: "South Korea",
    bio: "Seoul student interested in Japanese literature and indie music.",
    isDiscoverable: true,
  },
  {
    uid: "mock-lucia",
    displayName: "Lucia",
    nativeLang: "es",
    targetLang: "en",
    level: "advanced",
    learningGoal: "business",
    interests: ["technology", "travel", "food"],
    availableTimes: ["weekday_morning", "weekday_daytime"],
    country: "Mexico",
    bio: "Product designer polishing business English for international meetings.",
    isDiscoverable: true,
  },
  {
    uid: "mock-camille",
    displayName: "Camille",
    nativeLang: "fr",
    targetLang: "ja",
    level: "beginner",
    learningGoal: "travel",
    interests: ["food", "art", "movies"],
    availableTimes: ["weekend_daytime", "weekend_night"],
    country: "France",
    bio: "Paris-based cook dreaming about a food tour across Japan.",
    isDiscoverable: true,
  },
];
