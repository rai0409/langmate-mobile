import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { PushTokenRegistration } from "./src/context/PushTokenRegistration";
import {
  isProfileComplete,
  ProfileProvider,
  useCurrentProfile,
} from "./src/context/ProfileContext";
import { UnreadProvider, useUnreadCounts } from "./src/context/UnreadContext";
import { hasFirebaseConfig } from "./src/firebase/config";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { MatchesScreen } from "./src/screens/MatchesScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SetupRequiredScreen } from "./src/screens/SetupRequiredScreen";
import { UserDetailScreen } from "./src/screens/UserDetailScreen";
import { colors } from "./src/theme/theme";
import type {
  MainTabsParamList,
  RootStackParamList,
} from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

function MainTabs() {
  const { totalUnreadCount } = useUnreadCounts();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>
            {route.name === "Discover"
              ? "◎"
              : route.name === "Matches"
                ? "✉"
                : "☺"}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="Discover" component={DiscoverScreen} />
      <Tabs.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarBadge:
            totalUnreadCount > 0
              ? totalUnreadCount > 99
                ? "99+"
                : totalUnreadCount
              : undefined,
        }}
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function EditProfileScreen() {
  const { profile } = useCurrentProfile();
  return <OnboardingScreen existingProfile={profile} />;
}

function AppFlow() {
  const { currentUser, loading } = useAuth();
  const { profile, profileLoading } = useCurrentProfile();

  if (!hasFirebaseConfig()) {
    return <SetupRequiredScreen />;
  }
  if (loading) {
    return <LoadingScreen />;
  }
  if (!currentUser) {
    return <AuthScreen />;
  }
  if (profileLoading) {
    return <><PushTokenRegistration /><LoadingScreen message="Loading your profile..." /></>;
  }
  if (!isProfileComplete(profile)) {
    // Saving the profile updates the listener, which moves the flow forward.
    return <><PushTokenRegistration /><OnboardingScreen existingProfile={profile} /></>;
  }

  return (
    <UnreadProvider>
      <PushTokenRegistration />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserDetail"
            component={UserDetailScreen}
            options={({ route }) => ({
              title: route.params.profile.displayName,
            })}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params.partnerName ?? "Chat",
            })}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Edit Profile" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UnreadProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <StatusBar style="dark" />
          <AppFlow />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
