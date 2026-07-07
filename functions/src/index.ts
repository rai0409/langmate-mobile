import { initializeApp } from "firebase-admin/app";

initializeApp();

export { incrementUnreadForMessage } from "./unread";
export * from "./notificationOutbox";
export * from "./accountDeletion";
export * from "./moderation";
