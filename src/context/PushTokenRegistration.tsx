import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { registerExpoPushToken } from "../repositories/pushTokenRepository";

export function PushTokenRegistration(): null {
  const { currentUser } = useAuth();
  useEffect(() => {
    if (currentUser) void registerExpoPushToken(currentUser.uid);
  }, [currentUser]);
  return null;
}
