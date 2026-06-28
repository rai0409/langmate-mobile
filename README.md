# LangMate Mobile

LangMate Mobile は、語学学習者同士をマッチングし、チャットで言語交換を行うためのモバイルアプリMVPです。
Expo / React Native / TypeScript / Firebase を使い、プロフィール登録、相互マッチング、リアルタイムチャット、安全機能までを一通り実装しています。

## 目的

このリポジトリは、語学交換アプリのMVPとして、以下を実装したものです。

* ユーザー登録・ログイン
* プロフィール作成
* 相互言語条件によるマッチ候補表示
* 双方Connect時のみMatch作成
* Firestoreリアルタイムチャット
* Report / Block
* Firebase未設定時のPreview Mode
* Firestore Rulesのローカル検証

## 主な機能

* メールアドレス・パスワード認証
* プロフィール登録

  * 表示名
  * 母語
  * 学習言語
  * レベル
  * 学習目的
  * 興味
  * 空き時間
  * 国
  * 自己紹介
* Discover画面

  * 相性スコア
  * マッチ理由
  * Skip / Connect / View Profile
* 相互ConnectによるMatch作成
* Matches一覧
* 1対1リアルタイムチャット
* 学習サポートUI

  * Translate
  * Correct
  * Suggest Reply
* Report / Block
* Logout / Web QA向けアカウント切替
* Firestore Rulesテスト

## 技術スタック

* Expo
* React Native
* React
* TypeScript
* Firebase Authentication
* Cloud Firestore
* React Navigation
* Firebase Emulator
* Firebase Rules Unit Testing

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` に Firebase Web App の設定値を入力します。

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

`.env` はGit管理しません。公開リポジトリには `.env.example` のみ含めます。

## 起動

```bash
npm start
```

Webで確認する場合：

```bash
npm run web
```

Expo Goで確認する場合は、Metro起動後に表示されるQRコードを読み取ります。

## Firestore Rules

本番を想定したFirestore Rulesは以下にあります。

```text
firestore.rules
```

ローカル検証：

```bash
npm run test:rules
```

このテストはFirebase Emulatorを使用し、実Firebaseプロジェクトや本番データには接続しません。

## 現在の実装範囲

実装済み：

* Auth
* Onboarding
* Discover
* Mutual Match
* Matches
* Chat
* Report
* Block
* Preview Mode
* Setup Required画面
* Firestore Rules
* Rulesテスト
* Account deletion requestの基礎
* Error logging / safe error message
* Logout UX

未実装または本番前に追加が必要：

* Push通知
* 画像アップロード
* 音声メッセージ
* AI翻訳・添削・返信提案の本実装
* 管理者向けmoderation dashboard
* 本番Cloud Functions
* 本番account deletion processor
* App Store / Google Play公開設定
* 法務レビュー済みのPrivacy Policy / Terms
* 本番監視・ログ運用

## セキュリティ方針

以下はGit管理しません。

```text
.env
.env.*
.claude/
.expo/
node_modules/
artifacts/
firestore-debug.log
serviceAccount*.json
*-firebase-adminsdk-*.json
```

Firebase Admin SDKのservice accountや秘密鍵は、Expoアプリや公開リポジトリには置きません。
本番のmoderation、account deletion、管理者操作は、Cloud Functionsまたはサーバー側Admin SDKで実装する想定です。

## 実務上の強み

このMVPでは、画面実装だけでなく、以下を重視しています。

* Auth / Firestore / UI状態管理の一貫した設計
* Preview ModeによるFirebase未設定時の安全なデモ
* Report / Blockを含む安全機能
* Firestore Rulesのローカルテスト
* `.env` と公開コードの分離
* 本番化に必要な未実装項目の明示

## ライセンス

Copyright (c) 2026 rai0409. All rights reserved.

本リポジトリのコード、設計、ドキュメントの無断複製、再配布、商用利用、改変利用を禁止します。
利用・共同開発・業務委託での利用を希望する場合は、事前に許可を取得してください。

依存ライブラリには、それぞれのライセンスが適用されます。
