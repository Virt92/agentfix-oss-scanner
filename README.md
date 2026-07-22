# agentfix-mini-scanner

[![npm version](https://img.shields.io/npm/v/agentfix-mini-scanner.svg)](https://www.npmjs.com/package/agentfix-mini-scanner)
[![npm downloads](https://img.shields.io/npm/dm/agentfix-mini-scanner.svg)](https://www.npmjs.com/package/agentfix-mini-scanner)
[![Node](https://img.shields.io/node/v/agentfix-mini-scanner.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A tiny, zero-dependency, MIT-licensed scanner that checks whether your website
is discoverable and usable by modern AI agents (ChatGPT, Claude, Perplexity,
Gemini, MCP clients).

> **Bad score? Skip the spec rabbit-hole.** [**AgentFix Pack**](https://agentfix.pro)
> scans your site across the full AI-agent readiness checklist and emails you a ready-to-install ZIP
> with your real `llms.txt`, schema, A2A `agent-card`, MCP `server-card`, and
> install guides for WordPress / Webflow / Tilda / Shopify / cPanel. One-time
> $1 Mini · $29 Pack · $99 Pro (drift monitoring). No subscription.
>
> [**→ Scan your site at agentfix.pro**](https://agentfix.pro)

It runs **the discovery-critical subset** of signals the commercial AgentFix scanner uses
(see the full [AI-agent readiness checklist](https://agentfix.pro/methodology)). If your
site passes all sixteen here you're ahead of ~95% of the web. If it fails most, the
full audit + ready-to-install fix pack at [agentfix.pro](https://agentfix.pro)
closes the gap in minutes.

**New in 1.2.0** - four commerce and content-negotiation checks: `/.well-known/agent-checkout.json`,
`/.well-known/agent-signup.json`, `/llms-pay.md`, and `/skill.md`. See the
[three commerce discovery files](https://agentfix.pro/blog/three-commerce-discovery-files)
post for the emerging AI-shopping-agent discovery layer.

### See it visually - the AgentFix Workspace iceberg

For a free interactive visualisation of what AI agents look for, paste any URL into
[workspace.agentfix.pro](https://workspace.agentfix.pro). The Agent Lens window renders
your site as an iceberg: the tip is what classic Google indexers see, just under the
waterline is what AI agents reach for (llms.txt, schema, robots), deeper is the
agent-native protocol layer (A2A, MCP, OpenAPI), and the depths are the emerging
commerce layer (agent-checkout.json, agent-signup.json, llms-pay.md). Same 16 checks
as this CLI, rendered side-by-side with Google vs AI vs Optimal.

```
$ npx agentfix-mini-scanner example.com

AgentFix Mini Scanner - 16 discovery-critical checks (v1.2)
Target: https://example.com

  PASS  /llms.txt accessible
        842 bytes
  FAIL  /llms-full.txt accessible
        /llms-full.txt missing
        → Add /llms-full.txt with the long-form text content of your site.
  PASS  robots.txt allows AI crawlers
        Mentions: gptbot, claudebot
  FAIL  /.well-known/agent-checkout.json (commerce discovery)
        Endpoint missing or non-JSON
        → Publish /.well-known/agent-checkout.json describing how AI shopping agents
          complete a purchase on your site.
  ...

Score: 44% (Grade F) - 7/16 passed
```

## What's new in 1.2.0

Four commerce and content-negotiation checks added:

- **`/.well-known/agent-checkout.json`** - commerce discovery for AI shopping agents
- **`/.well-known/agent-signup.json`** - signup model + auth (guest-first, SSO)
- **`/llms-pay.md`** - payments layer (providers, currencies, refunds, tiers)
- **`/skill.md`** - clean markdown summary of your site for AI agents

12 → 16 signals. Same zero dependencies.

## Install

```
npm install -g agentfix-mini-scanner
```

or run once without installing:

```
npx agentfix-mini-scanner https://your-site.com
```

Node 18+ required (built on the global `fetch`).

## What it checks

| # | Check | Category |
|---|---|---|
| 1 | `/llms.txt` accessible | discovery |
| 2 | `/llms-full.txt` accessible | discovery |
| 3 | `robots.txt` explicitly allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) | ai_policy |
| 4 | `schema.org` `Organization` JSON-LD on homepage | schema |
| 5 | `schema.org` `WebSite` + `SearchAction` JSON-LD on homepage | schema |
| 6 | `/.well-known/mcp/server-card.json` (Model Context Protocol) | agent_protocols |
| 7 | `/.well-known/agent-card.json` (Agent-to-Agent / A2A) | agent_protocols |
| 8 | `sitemap.xml` accessible | discovery |
| 9 | `Link:` header advertising service-desc / api-catalog / agent-card | agent_protocols |
| 10 | `/openapi.json` (OpenAPI 3.x) | agent_protocols |
| 11 | `/.well-known/api-catalog` (RFC 9727 linkset+json) | agent_protocols |
| 12 | `/.well-known/oauth-protected-resource` (RFC 9728) | agent_protocols |
| 13 | `/.well-known/agent-checkout.json` (AI-shopping checkout flow) | commerce |
| 14 | `/.well-known/agent-signup.json` (signup model, auth options) | commerce |
| 15 | `/llms-pay.md` (payments layer for AI agents) | commerce |
| 16 | `/skill.md` (clean markdown summary for agents) | content |

## Programmatic use

```js
import { scan } from "agentfix-mini-scanner";

const report = await scan("https://acme.com");
console.log(report.summary);
//  { pass: 7, fail: 9, skip: 0, total: 16, score: 44, grade: "F" }

for (const c of report.checks) {
  console.log(c.key, c.status, c.detail);
}
```

`scan(url)` always resolves; individual checks catch their own errors and
report `status: "fail"` with the cause in `detail`. Network timeout per check
is 8 seconds.

## What this scanner does NOT check (the rest of the checklist)

The commercial AgentFix scanner additionally evaluates: declarative shadow
DOM accessibility, MCP tool input-schema validity, A2A skill descriptors,
agent-installable scripts (.well-known/install), per-page meta tags,
Article/FAQ/Product schema, RFC 8288 markdown content-negotiation, RSS/Atom
feed exposure, anti-bot WAF heuristics, heading hierarchy, image alt
coverage, anchor-tag density, Cloudflare Bot Verifications, SSR pre-render
readiness, ACP/UCP commerce stubs, runtime ARIA fixes, and several more (see
[agentfix.pro/docs](https://agentfix.pro/docs)).

## Why open-source the basics?

Two reasons:
1. We think *every* site owner should be able to check at least these sixteen
   signals for free, forever. They're the discovery and commerce foundation;
   without them AI agents can't find your content or transact with you.
2. If you run this and your score is bad, the $29 fix pack at agentfix.pro
   ships you a personalised ZIP that closes the gaps in a few minutes. The
   OSS scanner is the on-ramp to the paid product, and we're upfront about
   that.

## When to use what

| Goal | Tool |
|---|---|
| Quick CI check / curiosity / dev workflow | **This CLI** (free, MIT, npx) |
| You see your score is low and want it fixed today | **[AgentFix Pack](https://agentfix.pro)** $29 - ZIP with your llms.txt, schema, agent-card, server-card, install guides |
| You only need llms.txt to start | **AgentFix Mini** $1 |
| You want monthly drift monitoring + diff emails | **AgentFix Pro** $99 |
| You want to see what AI agents look for, visually | **[workspace.agentfix.pro](https://workspace.agentfix.pro)** (free, interactive iceberg) |

## Changelog

- **1.2.0** (2026-07-22) - added four commerce and content-negotiation checks:
  `/.well-known/agent-checkout.json`, `/.well-known/agent-signup.json`,
  `/llms-pay.md`, and `/skill.md`. New `commerce` category. 12 -> 16 signals.
  Description, help banner and README updated. Zero new dependencies.
- **1.1.4** (2026-07-10) - dropped hardcoded "12 of 33 signals" phrasing;
  README, help banner and package description now point to
  [agentfix.pro/methodology](https://agentfix.pro/methodology) as the single
  source of truth for the checklist (currently 34 signals across 7 categories,
  and the number will keep evolving). CLI checks unchanged.
- **1.1.3** (2026-07-05) - README polish + npm/Node badges. Package keywords
  expanded (MCP, A2A, GEO, OpenAPI, RFC 9727/9728, GPTBot, ClaudeBot) so npm
  and GitHub search surface the scanner for people looking to fix llms.txt,
  agent-card, server-card and the rest of the agent-readiness stack.
- **1.1.2** (2026-06-27) - README pivoted to lead with the AgentFix Pack pitch
  + when-to-use-what matrix. Workspace iceberg companion link prominent.
- **1.1.1** (2026-06-27) - added Workspace iceberg link to README. Live
  visualisation companion at [workspace.agentfix.pro](https://workspace.agentfix.pro).
- **1.1.0** (2026-06-26) - added WebSite schema, openapi.json, api-catalog,
  oauth-protected-resource checks. 8 -> 12 signals. Fixed GitHub repository URL.
- **1.0.0** (2026-06-19) - initial release with 8 checks.

## Support development

If this scanner helps you, [buy us a coffee on Ko-fi](https://ko-fi.com/agentfix) ☕.
Every coffee funds the next check; we ship additional signals from the
commercial scanner one OSS release at a time.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/agentfix)

## License

MIT - see [LICENSE](LICENSE).

## Contributing

PRs welcome for the sixteen checks above. New checks belong in the commercial
scanner so we can validate them against real buyer sites first; open an
issue if you have a candidate signal worth promoting to the OSS version.

Bug? Open a GitHub issue or email `support@agentfix.pro`.
