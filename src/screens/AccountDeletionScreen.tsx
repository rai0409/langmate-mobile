import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { AppButton } from "../components/AppButton";
import { useAuth } from "../context/AuthContext";
import { cancelDeletionRequest, createDeletionRequest, listenDeletionRequest, type DeletionRequest } from "../repositories/accountDeletionRepository";
import { notify } from "../utils/notify";

export function AccountDeletionScreen() {
  const { currentUser } = useAuth(); const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!currentUser) return; return listenDeletionRequest(setRequest); }, [currentUser]);
  const submit = async () => { if (!currentUser || confirmation !== "DELETE") return notify("Confirmation required", "Type DELETE to continue."); if (!currentUser.email) return notify("Re-authentication unavailable", "This sign-in method is not supported."); setBusy(true); try { await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, password)); await createDeletionRequest(); setPassword(""); } catch { notify("Could not request deletion", "Re-enter your password and try again."); } finally { setBusy(false); } };
  const cancel = () => { setBusy(true); void cancelDeletionRequest().catch(() => notify("Could not cancel", "Try again later.")).finally(() => setBusy(false)); };
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}><Text>Delete account</Text>{request ? <><Text>Status: {request.status}</Text>{request.status === "scheduled" ? <AppButton title="Cancel deletion request" onPress={cancel} variant="secondary" disabled={busy} /> : <Text>Cancellation is unavailable after processing begins.</Text>}</> : <><Text>Type DELETE and re-enter your password.</Text><TextInput placeholder="DELETE" value={confirmation} onChangeText={setConfirmation} /><TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} /><AppButton title="Request account deletion" onPress={submit} variant="danger" disabled={busy} /></>}</ScrollView>;
}
