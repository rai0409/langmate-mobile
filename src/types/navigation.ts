import type { MatchScoreResult, Profile } from "./domain";

export type RootStackParamList = {
  MainTabs: undefined;
  UserDetail: {
    profile: Profile;
    scoreResult: MatchScoreResult;
    isPreview?: boolean;
  };
  Chat: {
    matchId: string;
    partnerName?: string;
  };
  EditProfile: undefined;
  AccountDeletion: undefined;
};

export type MainTabsParamList = {
  Discover: undefined;
  Matches: undefined;
  Profile: undefined;
};
