#!/usr/bin/env node
import { scan } from "./index.mjs";

const args = process.argv.slice(2);
const wantJson = args.includes("--json");
const urlArg = args.find((a) => !a.startsWith("--"));

if (!urlArg || args.includes("--help") || args.includes("-h")) {
  console.log(`agentfix-mini-scanner — 8 AI-agent-readiness checks

Usage:
  agentfix-scan <url> [--json]

Examples:
  agentfix-scan example.com
  agentfix-scan https://acme.com --json

The full 33-check audit + fix pack lives at https://agentfix.pro.`);
  process.exit(urlArg ? 0 : 1);
}

const report = await scan(urlArg);

if (wantJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.fail === 0 ? 0 : 1);
}

// Human-readable output. ANSI colours only when stdout is a TTY.
const tty = process.stdout.isTTY;
const c = {
  bold: tty ? "\x1b[1m" : "",
  dim: tty ? "\x1b[2m" : "",
  green: tty ? "\x1b[32m" : "",
  red: tty ? "\x1b[31m" : "",
  yellow: tty ? "\x1b[33m" : "",
  cyan: tty ? "\x1b[36m" : "",
  reset: tty ? "\x1b[0m" : "",
};

console.log("");
console.log(`${c.bold}AgentFix Mini Scanner${c.reset} ${c.dim}— 8 of 33 signals${c.reset}`);
console.log(`Target: ${report.url}`);
console.log("");

for (const ch of report.checks) {
  const mark =
    ch.status === "pass"
      ? `${c.green}PASS${c.reset}`
      : ch.status === "fail"
      ? `${c.red}FAIL${c.reset}`
      : `${c.yellow}SKIP${c.reset}`;
  console.log(`  ${mark}  ${ch.label}`);
  console.log(`        ${c.dim}${ch.detail}${c.reset}`);
  if (ch.status === "fail" && ch.hint) {
    console.log(`        ${c.cyan}→ ${ch.hint}${c.reset}`);
  }
}

console.log("");
console.log(
  `${c.bold}Score: ${report.summary.score}%${c.reset} (Grade ${report.summary.grade}) — ${report.summary.pass}/${report.summary.total} passed`
);

if (report.summary.fail > 0) {
  console.log("");
  console.log(
    `${c.dim}Get the full 33-check audit + a $29 ready-to-install fix pack:${c.reset}`
  );
  console.log(`  ${c.cyan}https://agentfix.pro/?ref=oss${c.reset}`);
}

process.exit(report.summary.fail === 0 ? 0 : 1);
