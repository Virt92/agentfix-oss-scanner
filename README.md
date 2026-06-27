# agentfix-mini-scanner

A tiny, zero-dependency, MIT-licensed scanner that checks whether your website
is discoverable and usable by modern AI agents (ChatGPT, Claude, Perplexity,
Gemini, MCP clients).

It runs **12 of the 33 signals** the commercial AgentFix scanner uses. If your
site passes all twelve you're ahead of ~95% of the web. If it fails most, the
full audit + ready-to-install fix pack at [agentfix.pro](https://agentfix.pro)
will close the gap.

### See it visually — the AgentFix Workspace iceberg

For a free interactive visualisation of what AI agents look for, paste any URL into
[workspace.agentfix.pro](https://workspace.agentfix.pro). The Agent Lens window renders
your site as an iceberg: the tip is what classic Google indexers see, just under the
waterline is what AI agents reach for (llms.txt, schema, robots), deeper is the
agent-native protocol layer (A2A, MCP, OpenAPI), and the depths are signals nobody
ships yet (ACP/UCP commerce, streaming corpus). Same 12 checks as this CLI, rendered
side-by-side with Google vs AI vs Optimal.

```
$ npx agentfix-mini-scanner example.com

AgentFix Mini Scanner — 12 of 33 signals
Target: https://example.com

  PASS  /llms.txt accessible
        842 bytes
  FAIL  /llms-full.txt accessible
        /llms-full.txt missing
        → Add /llms-full.txt with the long-form text content of your site.
  PASS  robots.txt allows AI crawlers
        Mentions: gptbot, claudebot
  FAIL  schema.org Organization JSON-LD
        No JSON-LD blocks found in homepage HTML
        → Embed a <script type="application/ld+json"> Organization block.
  ...

Score: 50% (Grade D) — 6/12 passed
```

## What's new in 1.1

Four additional checks added:

- **schema.org WebSite + SearchAction** — sitelinks search box
- **`/openapi.json`** — OpenAPI 3.x service-desc for agents
- **`/.well-known/api-catalog`** — RFC 9727 linkset+json
- **`/.well-known/oauth-protected-resource`** — RFC 9728 auth metadata

8 → 12 signals. Same zero dependencies.

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

## Programmatic use

```js
import { scan } from "agentfix-mini-scanner";

const report = await scan("https://acme.com");
console.log(report.summary);
//  { pass: 6, fail: 6, skip: 0, total: 12, score: 50, grade: "D" }

for (const c of report.checks) {
  console.log(c.key, c.status, c.detail);
}
```

`scan(url)` always resolves — individual checks catch their own errors and
report `status: "fail"` with the cause in `detail`. Network timeout per check
is 8 seconds.

## What this scanner does NOT check (the other 21 signals)

The commercial AgentFix scanner additionally evaluates: declarative shadow
DOM accessibility, MCP tool input-schema validity, A2A skill descriptors,
agent-installable scripts (.well-known/install), per-page meta tags,
Article/FAQ/Product schema, RFC 8288 markdown content-negotiation, RSS/Atom
feed exposure, anti-bot WAF heuristics, heading hierarchy, image alt
coverage, anchor-tag density, Cloudflare Bot Verifications, SSR pre-render
readiness, ACP/UCP commerce stubs, runtime ARIA fixes, and several more — see
[agentfix.pro/docs](https://agentfix.pro/docs).

## Why open-source the basics?

Two reasons:
1. We think *every* site owner should be able to check at least these twelve
   signals for free, forever. They're the discovery foundation — without them
   AI agents can't even find your content.
2. If you run this and your score is bad, the $29 fix pack at agentfix.pro
   ships you a personalised ZIP that closes the gaps in a few minutes. The
   OSS scanner is the on-ramp to the paid product, and we're upfront about
   that.

## Changelog

- **1.1.1** (2026-06-27) — added Workspace iceberg link to README. Live
  visualisation companion at [workspace.agentfix.pro](https://workspace.agentfix.pro).
- **1.1.0** (2026-06-26) — added WebSite schema, openapi.json, api-catalog,
  oauth-protected-resource checks. 8 → 12 signals. Fixed GitHub repository URL.
- **1.0.0** (2026-06-19) — initial release with 8 checks.

## Support development

If this scanner helps you, [buy us a coffee on Ko-fi](https://ko-fi.com/agentfix) ☕.
Every coffee funds the next check — we ship the remaining 21 signals from the
commercial scanner one OSS release at a time.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/agentfix)

## License

MIT — see [LICENSE](LICENSE).

## Contributing

PRs welcome for the twelve checks above. New checks belong in the commercial
scanner so we can validate them against real buyer sites first — open an
issue if you have a candidate signal worth promoting to the OSS version.

Bug? Open a GitHub issue or email `support@agentfix.pro`.
