import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { hasFirebaseConfig } from "../firebase/config";
import {
  listenMessages,
  sendMessage,
} from "../repositories/messageRepository";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { ChatMessage } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { getErrorMessage } from "../utils/errorMessage";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export function ChatScreen({ route }: Props) {
  const { matchId } = route.params;
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [supportNote, setSupportNote] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

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

  const send = async () => {
    if (!currentUser) {
      notify("Not signed in", "Please sign in again.");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      // fromUid is always the real authenticated uid — never a placeholder.
      await sendMessage(matchId, currentUser.uid, text);
    } catch (e) {
      setDraft(text);
      logDevError("ChatScreen.send", e);
      notify("Could not send message", getErrorMessage(e));
    }
  };

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
            setDraft("That sounds interesting! Could you tell me more?")
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            onPress={send}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendPressed,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
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
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  sendPressed: {
    opacity: 0.75,
  },
  sendText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});
