#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(
  __dirname,
  "fixtures",
  "moderation_reports_fixture.json"
);

const VALID_REVIEW_STATUSES = new Set([
  "open",
  "reviewing",
  "actioned",
  "dismissed",
]);
const VALID_SEVERITIES = new Set(["low", "medium", "high"]);
const VALID_ACTIONS = new Set(["none", "warning", "suspend", "ban"]);
const VALID_USER_STATUSES = new Set(["active", "warned", "suspended", "banned"]);

function requireString(value, field, context) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${context}.${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireOneOf(value, allowed, field, context) {
  const normalized = requireString(value, field, context);
  if (!allowed.has(normalized)) {
    throw new Error(
      `${context}.${field} must be one of ${[...allowed].join(", ")}`
    );
  }
  return normalized;
}

function validateReport(report, index) {
  const context = `reports[${index}]`;
  const id = requireString(report.id, "id", context);
  const reporterUid = requireString(report.reporterUid, "reporterUid", context);
  const reportedUid = requireString(report.reportedUid, "reportedUid", context);
  if (reporterUid === reportedUid) {
    throw new Error(`${context}.reportedUid must differ from reporterUid`);
  }
  const reason = requireString(report.reason, "reason", context);
  const createdAt = requireString(report.createdAt, "createdAt", context);
  return { id, reporterUid, reportedUid, reason, createdAt };
}

function buildReview(report, defaults) {
  const status = requireOneOf(
    defaults.status ?? "open",
    VALID_REVIEW_STATUSES,
    "status",
    "reviewDefaults"
  );
  const severity = requireOneOf(
    defaults.severity ?? "medium",
    VALID_SEVERITIES,
    "severity",
    "reviewDefaults"
  );
  const action = requireOneOf(
    defaults.action ?? "none",
    VALID_ACTIONS,
    "action",
    "reviewDefaults"
  );
  const reviewedBy = requireString(
    defaults.reviewedBy ?? "local-fixture-reviewer",
    "reviewedBy",
    "reviewDefaults"
  );

  return {
    reportId: report.id,
    reporterUid: report.reporterUid,
    reportedUid: report.reportedUid,
    status,
    severity,
    action,
    adminNotes: "Fixture review only. No Firebase data was read or written.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedBy,
  };
}

function buildUserModeration(review) {
  const statusByAction = {
    none: "active",
    warning: "warned",
    suspend: "suspended",
    ban: "banned",
  };
  const status = statusByAction[review.action];
  if (!VALID_USER_STATUSES.has(status)) {
    throw new Error(`Derived userModeration.status is invalid: ${status}`);
  }
  return {
    uid: review.reportedUid,
    status,
    reason:
      review.action === "none"
        ? "No action selected in fixture review."
        : `Fixture moderation action: ${review.action}`,
    sourceReportId: review.reportId,
    updatedAt: review.updatedAt,
    updatedBy: review.reviewedBy,
  };
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!Array.isArray(fixture.reports)) {
  throw new Error("Fixture reports must be an array");
}

const reports = fixture.reports.map(validateReport);
const reviews = reports.map((report) =>
  buildReview(report, fixture.reviewDefaults ?? {})
);
const userModeration = reviews.map(buildUserModeration);

console.log(
  JSON.stringify(
    {
      mode: "local-fixture-only",
      firebaseConnected: false,
      credentialsRequired: false,
      reportsReviewed: reports.length,
      reportReviews: reviews,
      userModeration,
    },
    null,
    2
  )
);
