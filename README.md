# agentfix-mini-scanner

A tiny, zero-dependency, MIT-licensed scanner that checks whether your website
is discoverable and usable by modern AI agents (ChatGPT, Claude, Perplexity,
Gemini, MCP clients).

It runs **8 of the 33 signals** the commercial AgentFix scanner uses. If your
site passes all eight you're ahead of ~95% of the web. If it fails most, the
full audit + ready-to-install fix pack at [agentfix.pro](https://agentfix.pro)
will close the gap.

```
$ npx agentfix-mini-scanner example.com

AgentFix Mini Scanner — 8 of 33 signals
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

Score: 50% (Grade D) — 4/8 passed
```

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
| 5 | `/.well-known/mcp/server-card.json` (Model Context Protocol) | agent_protocols |
| 6 | `/.well-known/agent-card.json` (Agent-to-Agent / A2A) | agent_protocols |
| 7 | `sitemap.xml` accessible | discovery |
| 8 | `Link:` header advertising service-desc / api-catalog / agent-card | agent_protocols |

## Programmatic use

```js
import { scan } from "agentfix-mini-scanner";

const report = await scan("https://acme.com");
console.log(report.summary);
//  { pass: 4, fail: 4, skip: 0, total: 8, score: 50, grade: "D" }

for (const c of report.checks) {
  console.log(c.key, c.status, c.detail);
}
```

`scan(url)` always resolves — individual checks catch their own errors and
report `status: "fail"` with the cause in `detail`. Network timeout per check
is 8 seconds.

## What this scanner does NOT check (the other 25 signals)

The commercial AgentFix scanner additionally evaluates: declarative shadow
DOM accessibility, MCP tool input-schema validity, A2A skill descriptors,
agent-installable scripts (.well-known/install), per-page meta tags,
Article/FAQ/Product schema, OAuth protected resource metadata, RFC 8288
markdown content-negotiation, RSS/Atom feed exposure, anti-bot WAF heuristics,
heading hierarchy, image alt coverage, anchor-tag density, Cloudflare Bot
Verifications, SSR pre-render readiness, and ten more — see
[agentfix.pro/docs](https://agentfix.pro/docs).

## Why open-source the basics?

Two reasons:
1. We think *every* site owner should be able to check at least these eight
   signals for free, forever. They're the discovery foundation — without them
   AI agents can't even find your content.
2. If you run this and your score is bad, the $29 fix pack at agentfix.pro
   ships you a personalised ZIP that closes the gaps in a few minutes. The
   OSS scanner is the on-ramp to the paid product, and we're upfront about
   that.

## License

MIT — see [LICENSE](LICENSE).

## Contributing

PRs welcome for the eight checks above. New checks belong in the commercial
scanner so we can validate them against real buyer sites first — open an
issue if you have a candidate signal worth promoting to the OSS version.

Bug? Open a GitHub issue or email `egor.fermin@gmail.com`.
