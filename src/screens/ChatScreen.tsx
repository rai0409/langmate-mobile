import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LearningSupportBar } from "../components/LearningSupportBar";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useCurrentProfile } from "../context/ProfileContext";
import { hasFirebaseConfig } from "../firebase/config";
import { getMatch } from "../repositories/matchRepository";
import { markMatchRead } from "../repositories/memberStateRepository";
import {
  listenMessages,
  sendMessage,
} from "../repositories/messageRepository";
import { getProfile } from "../repositories/profileRepository";
import {
  isUidBlocked,
  listenBlocksForUser,
  toBlockSets,
} from "../repositories/safetyRepository";
import { calculateMatchScore } from "../services/matchingService";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { ChatMessage, Profile } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { getErrorMessage } from "../utils/errorMessage";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export function ChatScreen({ route, navigation }: Props) {
  const { matchId, partnerName: routePartnerName } = route.params;
  const { currentUser } = useAuth();
  const { profile: currentProfile } = useCurrentProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [supportNote, setSupportNote] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [partnerProfileError, setPartnerProfileError] = useState<string | null>(
    null
  );
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const partnerName =
    partnerProfile?.displayName ?? routePartnerName ?? "Language partner";

  useEffect(() => {
    if (!hasFirebaseConfig()) return;
    const unsubscribe = listenMessages(
      matchId,
      (next) => {
        setMessages(next);
        setLoadError(null);
      },
      (error) => {
        logDevError("ChatScreen.listenMessages", error);
        setLoadError(
          "Could not load messages. Check your connection and reopen this chat."
        );
      }
    );
    return unsubscribe;
  }, [matchId]);

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) return;
    markMatchRead(matchId, currentUser.uid).catch((error) => {
      logDevError("ChatScreen.markMatchRead", error);
    });
  }, [currentUser, matchId, messages.length]);

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) return;
    let cancelled = false;
    (async () => {
      try {
        const match = await getMatch(matchId);
        const otherUid =
          match?.memberUids.find((uid) => uid !== currentUser.uid) ?? null;
        if (cancelled) return;
        setPartnerUid(otherUid);
        if (!match || !otherUid) {
          setPartnerProfile(null);
          setPartnerProfileError("Could not load this chat partner.");
          return;
        }
        if (otherUid === currentUser.uid) {
          setPartnerProfile(null);
          setPartnerProfileError("This chat does not have another profile to show.");
          return;
        }
        const profile = await getProfile(otherUid);
        if (cancelled) return;
        setPartnerProfile(profile);
        setPartnerProfileError(
          profile ? null : "Could not load this chat partner's profile."
        );
      } catch (e) {
        if (cancelled) return;
        logDevError("ChatScreen.partnerProfile", e);
        setPartnerUid(null);
        setPartnerProfile(null);
        setPartnerProfileError("Could not load this chat partner's profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, matchId]);

  useEffect(() => {
    if (!currentUser || !partnerUid || !hasFirebaseConfig()) {
      setBlockedMessage(null);
      return;
    }
    const unsubscribe = listenBlocksForUser(
      currentUser.uid,
      (blocks) => {
        const blockSets = toBlockSets(currentUser.uid, blocks);
        if (blockSets.blockedByMe.has(partnerUid)) {
          setBlockedMessage("You blocked this user. Messaging is disabled.");
        } else if (blockSets.blockedMe.has(partnerUid)) {
          setBlockedMessage("This user has blocked you. Messaging is disabled.");
        } else if (isUidBlocked(blockSets, partnerUid)) {
          setBlockedMessage("Messaging is disabled for this chat.");
        } else {
          setBlockedMessage(null);
        }
      },
      (error) => {
        logDevError("ChatScreen.listenBlocks", error);
        setBlockedMessage(
          "Could not verify block status. Messaging is disabled until you reopen this chat."
        );
      }
    );
    return unsubscribe;
  }, [currentUser, partnerUid]);

  const openPartnerProfile = useCallback(() => {
    if (!currentProfile) {
      notify("Profile unavailable", "Please reopen this chat and try again.");
      return;
    }
    if (!partnerProfile || !partnerUid || partnerUid === currentUser?.uid) {
      notify(
        "Profile unavailable",
        partnerProfileError ?? "We could not load this partner's profile."
      );
      return;
    }
    navigation.navigate("UserDetail", {
      profile: partnerProfile,
      scoreResult: calculateMatchScore(currentProfile, partnerProfile),
    });
  }, [
    currentProfile,
    currentUser?.uid,
    navigation,
    partnerProfile,
    partnerProfileError,
    partnerUid,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          style={styles.headerProfile}
          onPress={openPartnerProfile}
          disabled={!partnerProfile}
        >
          <View style={styles.headerAvatarWrap}>
            <ProfileAvatar
              profile={partnerProfile}
              name={partnerName}
              size={28}
            />
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {partnerName}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, openPartnerProfile, partnerName, partnerProfile]);

  const send = async () => {
    if (!currentUser) {
      notify("Not signed in", "Please sign in again.");
      return;
    }
    if (blockedMessage) {
      notify("Messaging disabled", blockedMessage);
      return;
    }
    if (sending) return;
    const text = draft.trim();
    if (!text) {
      setSendError("Write a message before sending.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      // fromUid is always the real authenticated uid — never a placeholder.
      await sendMessage(matchId, currentUser.uid, text);
      setDraft("");
    } catch (e) {
      logDevError("ChatScreen.send", e);
      const message = getErrorMessage(e);
      setSendError(message);
      notify("Could not send message", message);
    } finally {
      setSending(false);
    }
  };

  const inputDisabled = Boolean(blockedMessage) || sending;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item, index) => item.id ?? String(index)}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => {
          const isMine = item.fromUid === currentUser?.uid;
          return (
            <View
              style={[
                styles.bubble,
                isMine ? styles.bubbleMine : styles.bubbleTheirs,
              ]}
            >
              <Text style={isMine ? styles.textMine : styles.textTheirs}>
                {item.text}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No messages yet. Break the ice — even a simple hello works.
          </Text>
        }
      />

      {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      {partnerProfileError ? (
        <Text style={styles.loadError}>{partnerProfileError}</Text>
      ) : null}
      {blockedMessage ? (
        <View style={styles.blockedNotice}>
          <Text style={styles.blockedNoticeText}>{blockedMessage}</Text>
        </View>
      ) : null}
      {sendError ? <Text style={styles.loadError}>{sendError}</Text> : null}

      {supportNote ? (
        <Pressable style={styles.supportNote} onPress={() => setSupportNote(null)}>
          <Text style={styles.supportNoteText}>{supportNote}</Text>
          <Text style={styles.supportNoteDismiss}>Tap to dismiss</Text>
        </Pressable>
      ) : null}

      <View style={styles.inputArea}>
        <LearningSupportBar
          onTranslate={() =>
            setSupportNote("Translation preview will appear here.")
          }
          onCorrect={() =>
            setSupportNote("Correction preview will appear here.")
          }
          onSuggestReply={() =>
            !inputDisabled &&
            setDraft("That sounds interesting! Could you tell me more?")
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, inputDisabled && styles.inputDisabled]}
            value={draft}
            onChangeText={setDraft}
            editable={!inputDisabled}
            placeholder={
              blockedMessage ? "Messaging is disabled" : "Write a message..."
            }
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            onPress={send}
            disabled={inputDisabled}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendPressed,
              inputDisabled && styles.sendDisabled,
            ]}
          >
            <Text style={styles.sendText}>{sending ? "Sending" : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  headerProfile: {
    maxWidth: 240,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatarWrap: {
    marginRight: spacing.sm,
  },
  headerName: {
    ...typography.subtitle,
    fontSize: 16,
    maxWidth: 190,
  },
  emptyText: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textMine: {
    ...typography.body,
    color: "#FFFFFF",
  },
  textTheirs: {
    ...typography.body,
  },
  loadError: {
    ...typography.caption,
    color: colors.danger,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  blockedNotice: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  blockedNoticeText: {
    ...typography.body,
    color: colors.danger,
  },
  supportNote: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  supportNoteText: {
    ...typography.body,
  },
  supportNoteDismiss: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  inputArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
  },
  inputDisabled: {
    backgroundColor: colors.chipBg,
    color: colors.textMuted,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  sendPressed: {
    opacity: 0.75,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});
