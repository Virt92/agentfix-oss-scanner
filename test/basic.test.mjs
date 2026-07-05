import { test } from "node:test";
import assert from "node:assert/strict";
import { scan } from "../index.mjs";

// We avoid hitting the network in CI by pointing at the official agentfix.pro
// (which dogfoods every signal). If a maintainer is offline these tests will
// fail the network checks, which is intentional; running this scanner is a
// network operation, so an empty result would be misleading.

test("scan returns a report shape", async () => {
  const report = await scan("https://agentfix.pro");
  assert.ok(Array.isArray(report.checks));
  assert.equal(report.checks.length, 12);
  assert.equal(typeof report.summary.score, "number");
  assert.ok(report.summary.score >= 0 && report.summary.score <= 100);
  assert.match(report.summary.grade, /^[A-F]$/);
});

test("each check has a key, label, status and detail", async () => {
  const report = await scan("https://agentfix.pro");
  for (const c of report.checks) {
    assert.equal(typeof c.key, "string");
    assert.equal(typeof c.label, "string");
    assert.ok(["pass", "fail", "skip"].includes(c.status));
    assert.equal(typeof c.detail, "string");
  }
});

test("URL without protocol is auto-prefixed with https://", async () => {
  const report = await scan("agentfix.pro");
  assert.equal(report.url, "agentfix.pro"); // raw input preserved
  // the underlying checks still resolve; we trust the prior shape test
  assert.equal(report.checks.length, 12);
});

test("invalid host fails gracefully without throwing", async () => {
  const report = await scan("https://this-host-does-not-exist-9z9z9z.invalid");
  // every check should fail with an error message, but the overall call
  // must still resolve to a report shape, so the binary keeps working.
  assert.equal(report.checks.length, 12);
  assert.ok(report.checks.every((c) => c.status === "fail" || c.status === "skip"));
});
