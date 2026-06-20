#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(
  __dirname,
  "fixtures",
  "account_deletion_requests_fixture.json"
);

function requireString(value, field, context) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${context}.${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field, context) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${context}.${field} must be a string when provided`);
  }
  return value.trim();
}

function validateIsoDate(value, field, context) {
  const text = requireString(value, field, context);
  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${context}.${field} must be an ISO-compatible date string`);
  }
  return new Date(timestamp).toISOString();
}

function validateRequest(request, index) {
  const context = `requests[${index}]`;
  const uid = requireString(request.uid, "uid", context);
  const status = requireString(request.status, "status", context);
  if (status !== "requested") {
    throw new Error(`${context}.status must be requested`);
  }

  return {
    path: `accountDeletionRequests/${uid}`,
    uid,
    status,
    reason: optionalString(request.reason, "reason", context),
    contactEmail: optionalString(request.contactEmail, "contactEmail", context),
    requestedAt: validateIsoDate(request.requestedAt, "requestedAt", context),
    updatedAt: new Date().toISOString(),
    source: optionalString(request.source, "source", context) ?? "local-fixture",
  };
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!Array.isArray(fixture.requests)) {
  throw new Error("Fixture requests must be an array");
}

const requests = fixture.requests.map(validateRequest);

console.log(
  JSON.stringify(
    {
      mode: "local-fixture-only",
      firebaseConnected: false,
      credentialsRequired: false,
      realDataDeleted: false,
      requestsValidated: requests.length,
      requests,
      nextProductionStep:
        "Implement an Admin SDK or Cloud Functions processor after legal and retention review.",
    },
    null,
    2
  )
);
