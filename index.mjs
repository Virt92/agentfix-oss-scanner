// agentfix-mini-scanner - 16 AI-agent-readiness checks.
//
// This is the OPEN-SOURCE subset of AgentFix's commercial scanner (which
// runs the full checklist across 9 categories, see
// https://agentfix.pro/methodology). The 16 checks here cover the most
// load-bearing discovery surfaces plus the emerging commerce layer for
// AI shopping agents. Pass them all and you're ahead of ~95% of the web;
// fail most and the full audit at https://agentfix.pro pinpoints every
// gap and ships a $29 ready-to-install fix pack.
//
// Zero dependencies. Single file. Node 18+.

const UA =
  "Mozilla/5.0 (compatible; agentfix-mini-scanner/1.2; +https://agentfix.pro)";
const TIMEOUT_MS = 8000;

/**
 * @typedef {Object} CheckResult
 * @property {string} key       Machine-readable check ID.
 * @property {string} label     Human label.
 * @property {string} category  discovery | ai_policy | content | schema | agent_protocols | commerce
 * @property {"pass"|"fail"|"skip"} status
 * @property {string} detail    Short reason / what was found.
 * @property {string=} hint     Suggested fix.
 */

/**
 * @typedef {Object} ScanReport
 * @property {string} url
 * @property {string} startedAt
 * @property {string} finishedAt
 * @property {CheckResult[]} checks
 * @property {{ pass: number, fail: number, skip: number, total: number, score: number, grade: string }} summary
 */

/**
 * Run all 16 checks against `url`. Always resolves — individual checks
 * catch their own errors and report `fail` with the message in `detail`.
 *
 * @param {string} url
 * @returns {Promise<ScanReport>}
 */
export async function scan(url) {
  const startedAt = new Date().toISOString();
  const normalized = normaliseUrl(url);

  const checks = await Promise.all([
    checkLlmsTxt(normalized),
    checkLlmsFullTxt(normalized),
    checkRobotsAllowsAi(normalized),
    checkOrgSchema(normalized),
    checkWebSiteSchema(normalized),
    checkMcpServerCard(normalized),
    checkA2AAgentCard(normalized),
    checkSitemap(normalized),
    checkLinkHeader(normalized),
    checkOpenApi(normalized),
    checkApiCatalog(normalized),
    checkOAuthProtectedResource(normalized),
    checkAgentCheckoutJson(normalized),
    checkAgentSignupJson(normalized),
    checkLlmsPayMd(normalized),
    checkSkillMd(normalized),
  ]);

  return finalise(url, startedAt, checks);
}

/* ---------- individual checks ---------- */

async function checkLlmsTxt(base) {
  return await safeCheck(
    "llms_txt",
    "/llms.txt accessible",
    "discovery",
    "Publish a /llms.txt at the site root summarising what AI agents should read.",
    async () => {
      const r = await fetchText(`${base}/llms.txt`);
      if (!r) return { status: "fail", detail: "/llms.txt missing or non-200" };
      if (r.body.length < 50)
        return { status: "fail", detail: "/llms.txt under 50 bytes — looks empty" };
      return { status: "pass", detail: `${r.body.length} bytes` };
    }
  );
}

async function checkLlmsFullTxt(base) {
  return await safeCheck(
    "llms_full_txt",
    "/llms-full.txt accessible",
    "discovery",
    "Add /llms-full.txt with the long-form text content of your site for agents that want the full corpus.",
    async () => {
      const r = await fetchText(`${base}/llms-full.txt`);
      if (!r) return { status: "fail", detail: "/llms-full.txt missing" };
      if (r.body.length < 500)
        return { status: "fail", detail: "Under 500 bytes — likely a stub" };
      return { status: "pass", detail: `${r.body.length} bytes` };
    }
  );
}

async function checkRobotsAllowsAi(base) {
  return await safeCheck(
    "robots_ai_allow",
    "robots.txt allows AI crawlers",
    "ai_policy",
    "Add explicit `User-agent: GPTBot` / `ClaudeBot` / `PerplexityBot` Allow directives.",
    async () => {
      const r = await fetchText(`${base}/robots.txt`);
      if (!r) return { status: "fail", detail: "/robots.txt missing" };
      const txt = r.body.toLowerCase();
      const bots = ["gptbot", "claudebot", "perplexitybot", "google-extended"];
      const seen = bots.filter((b) => txt.includes(b));
      if (seen.length === 0)
        return {
          status: "fail",
          detail: "No AI bots explicitly addressed — they may default to blocked",
        };
      return { status: "pass", detail: `Mentions: ${seen.join(", ")}` };
    }
  );
}

async function checkOrgSchema(base) {
  return await safeCheck(
    "org_schema",
    "schema.org Organization JSON-LD",
    "schema",
    "Embed a `<script type=\"application/ld+json\">` Organization block in your homepage <head>.",
    async () => {
      const r = await fetchText(base);
      if (!r) return { status: "fail", detail: "Homepage not reachable" };
      const blocks = [
        ...r.body.matchAll(
          /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ),
      ];
      if (!blocks.length)
        return { status: "fail", detail: "No JSON-LD blocks found in homepage HTML" };
      for (const m of blocks) {
        try {
          const data = JSON.parse(m[1].trim());
          const found = findTypeInGraph(data, "Organization");
          if (found) return { status: "pass", detail: `name=${found.name || "(unset)"}` };
        } catch {
          // ignore malformed block, keep scanning
        }
      }
      return {
        status: "fail",
        detail: "JSON-LD present but no @type: Organization found",
      };
    }
  );
}

async function checkMcpServerCard(base) {
  return await safeCheck(
    "mcp_server_card",
    "/.well-known/mcp/server-card.json",
    "agent_protocols",
    "Publish an MCP server-card so MCP-aware agents can discover what tools your site exposes.",
    async () => {
      const r = await fetchJson(`${base}/.well-known/mcp/server-card.json`);
      if (!r) return { status: "fail", detail: "Endpoint missing or non-JSON" };
      const tools = Array.isArray(r.data?.tools) ? r.data.tools.length : 0;
      return { status: "pass", detail: `${tools} tools declared` };
    }
  );
}

async function checkA2AAgentCard(base) {
  return await safeCheck(
    "a2a_agent_card",
    "/.well-known/agent-card.json (A2A)",
    "agent_protocols",
    "Add an A2A agent-card to identify your site to peer agents.",
    async () => {
      const r = await fetchJson(`${base}/.well-known/agent-card.json`);
      if (!r) return { status: "fail", detail: "Endpoint missing or non-JSON" };
      return {
        status: "pass",
        detail: r.data?.name ? `name=${r.data.name}` : "card present",
      };
    }
  );
}

async function checkSitemap(base) {
  return await safeCheck(
    "sitemap_xml",
    "sitemap.xml accessible",
    "discovery",
    "Generate a sitemap.xml at the site root listing your indexable URLs.",
    async () => {
      const r = await fetchText(`${base}/sitemap.xml`);
      if (!r) return { status: "fail", detail: "/sitemap.xml missing" };
      if (!/<urlset|<sitemapindex/i.test(r.body))
        return { status: "fail", detail: "File present but not a valid sitemap" };
      const urls = (r.body.match(/<loc>/g) || []).length;
      return { status: "pass", detail: `${urls} URLs listed` };
    }
  );
}

async function checkWebSiteSchema(base) {
  return await safeCheck(
    "website_schema",
    "schema.org WebSite JSON-LD",
    "schema",
    "Add a WebSite JSON-LD block with `potentialAction: SearchAction` so Google shows a sitelinks search box and agents discover your in-site search.",
    async () => {
      const r = await fetchText(base);
      if (!r) return { status: "fail", detail: "Homepage not reachable" };
      const blocks = [
        ...r.body.matchAll(
          /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ),
      ];
      if (!blocks.length)
        return { status: "fail", detail: "No JSON-LD blocks on homepage" };
      for (const m of blocks) {
        try {
          const data = JSON.parse(m[1].trim());
          const found = findTypeInGraph(data, "WebSite");
          if (found) {
            const hasSearch = !!(
              found.potentialAction &&
              JSON.stringify(found.potentialAction).includes("SearchAction")
            );
            return {
              status: "pass",
              detail: hasSearch ? "WebSite + SearchAction" : "WebSite (no SearchAction)",
            };
          }
        } catch {
          /* keep scanning */
        }
      }
      return { status: "fail", detail: "JSON-LD present but no @type: WebSite found" };
    }
  );
}

async function checkLinkHeader(base) {
  return await safeCheck(
    "link_header",
    "Link: service-desc / api-catalog header",
    "agent_protocols",
    "Add an RFC 8288 Link header advertising your OpenAPI / llms.txt / api-catalog so agents discover them without parsing HTML.",
    async () => {
      const r = await fetchHead(base);
      if (!r) return { status: "fail", detail: "Homepage HEAD failed" };
      const link = r.headers.get("link") || "";
      if (!link) return { status: "fail", detail: "No Link header on root" };
      const hits = [
        link.includes("service-desc"),
        link.includes("service-doc"),
        link.includes("api-catalog"),
        link.includes("agent-card"),
      ].filter(Boolean).length;
      if (hits === 0)
        return { status: "fail", detail: "Link header present but advertises nothing useful" };
      return { status: "pass", detail: `${hits} agent-discovery rel values` };
    }
  );
}

async function checkOpenApi(base) {
  return await safeCheck(
    "openapi_json",
    "/openapi.json (OpenAPI 3.x service-desc)",
    "agent_protocols",
    "Publish an OpenAPI 3.x document at /openapi.json so agents can discover and invoke your HTTP API. Even a 3-endpoint stub counts.",
    async () => {
      const r = await fetchJson(`${base}/openapi.json`);
      if (!r) return { status: "fail", detail: "/openapi.json missing or non-JSON" };
      const v = r.data?.openapi || r.data?.swagger;
      if (!v) return { status: "fail", detail: "File present but missing `openapi`/`swagger` version field" };
      const paths = r.data?.paths ? Object.keys(r.data.paths).length : 0;
      return { status: "pass", detail: `OpenAPI ${v}, ${paths} paths` };
    }
  );
}

async function checkApiCatalog(base) {
  return await safeCheck(
    "api_catalog",
    "/.well-known/api-catalog (RFC 9727 linkset+json)",
    "agent_protocols",
    "Publish a linkset+json catalog at /.well-known/api-catalog listing every machine-readable doc you serve (OpenAPI, llms.txt, agent-card).",
    async () => {
      const r = await fetchJson(`${base}/.well-known/api-catalog`);
      if (!r) return { status: "fail", detail: "/.well-known/api-catalog missing or non-JSON" };
      const links = Array.isArray(r.data?.linkset?.[0]?.["service-desc"])
        ? r.data.linkset[0]["service-desc"].length
        : Array.isArray(r.data?.linkset)
        ? r.data.linkset.length
        : 0;
      return { status: "pass", detail: `${links} catalog entries` };
    }
  );
}

async function checkOAuthProtectedResource(base) {
  return await safeCheck(
    "oauth_protected_resource",
    "/.well-known/oauth-protected-resource (RFC 9728)",
    "agent_protocols",
    "Even for unauthenticated APIs, publishing this stub tells OAuth-aware agents how to negotiate auth — required by some MCP clients.",
    async () => {
      const r = await fetchJson(`${base}/.well-known/oauth-protected-resource`);
      if (!r) return { status: "fail", detail: "Endpoint missing or non-JSON" };
      const resource = r.data?.resource || r.data?.authorization_servers;
      if (!resource) return { status: "fail", detail: "JSON present but no `resource`/`authorization_servers` field" };
      return { status: "pass", detail: "RFC 9728 metadata present" };
    }
  );
}

async function checkAgentCheckoutJson(base) {
  return await safeCheck(
    "agent_checkout_json",
    "/.well-known/agent-checkout.json (commerce discovery)",
    "commerce",
    "Publish /.well-known/agent-checkout.json describing how AI shopping agents complete a purchase on your site. See agentfix.pro/blog/three-commerce-discovery-files for the spec.",
    async () => {
      const r = await fetchJson(`${base}/.well-known/agent-checkout.json`);
      if (!r) return { status: "fail", detail: "Endpoint missing or non-JSON" };
      const v = r.data?.version || r.data?.spec_version || "unset";
      const products = Array.isArray(r.data?.products) ? r.data.products.length : 0;
      const providers = Array.isArray(r.data?.payment_providers)
        ? r.data.payment_providers.length
        : 0;
      return {
        status: "pass",
        detail: `version=${v}, ${products} product(s), ${providers} provider(s)`,
      };
    }
  );
}

async function checkAgentSignupJson(base) {
  return await safeCheck(
    "agent_signup_json",
    "/.well-known/agent-signup.json (auth discovery)",
    "commerce",
    "Publish /.well-known/agent-signup.json describing your signup model (guest-first, SSO options) so AI shopping agents can transact without human account creation.",
    async () => {
      const r = await fetchJson(`${base}/.well-known/agent-signup.json`);
      if (!r) return { status: "fail", detail: "Endpoint missing or non-JSON" };
      const model = r.data?.signup_model || r.data?.model || "unset";
      return { status: "pass", detail: `signup_model=${model}` };
    }
  );
}

async function checkLlmsPayMd(base) {
  return await safeCheck(
    "llms_pay_md",
    "/llms-pay.md (payments layer for AI)",
    "commerce",
    "Publish /llms-pay.md at the site root describing your payment providers, currencies, refund policy and pricing tiers for AI shopping agents.",
    async () => {
      const r = await fetchText(`${base}/llms-pay.md`);
      if (!r) return { status: "fail", detail: "/llms-pay.md missing" };
      if (r.body.length < 100)
        return { status: "fail", detail: "Under 100 bytes - likely a stub" };
      return { status: "pass", detail: `${r.body.length} bytes` };
    }
  );
}

async function checkSkillMd(base) {
  return await safeCheck(
    "skill_md",
    "/skill.md (agent-readable homepage)",
    "content",
    "Serve /skill.md - a clean markdown summary of your site (products, services, contact) so AI agents can read it without stripping HTML.",
    async () => {
      const r = await fetchText(`${base}/skill.md`);
      if (!r) return { status: "fail", detail: "/skill.md missing" };
      if (r.body.length < 100)
        return { status: "fail", detail: "Under 100 bytes - likely a stub" };
      const ct = r.headers.get("content-type") || "";
      const isMd = /markdown|text\/plain/i.test(ct);
      return {
        status: "pass",
        detail: `${r.body.length} bytes${isMd ? " (text/markdown)" : ""}`,
      };
    }
  );
}

/* ---------- helpers ---------- */

function normaliseUrl(input) {
  let u = String(input).trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  return `${parsed.protocol}//${parsed.host}`;
}

function findTypeInGraph(node, type) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const x of node) {
      const found = findTypeInGraph(x, type);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (node["@graph"]) return findTypeInGraph(node["@graph"], type);
  const t = node["@type"];
  if (Array.isArray(t) ? t.includes(type) : t === type) return node;
  return null;
}

async function safeCheck(key, label, category, hint, fn) {
  try {
    const r = await fn();
    return { key, label, category, status: r.status, detail: r.detail, hint };
  } catch (err) {
    return {
      key,
      label,
      category,
      status: "fail",
      detail: `error: ${err.message || err}`,
      hint,
    };
  }
}

async function fetchText(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return { body: await res.text(), headers: res.headers };
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const r = await fetchText(url);
  if (!r) return null;
  try {
    return { data: JSON.parse(r.body), headers: r.headers };
  } catch {
    return null;
  }
}

async function fetchHead(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

function finalise(url, startedAt, checks) {
  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const c of checks) counts[c.status] += 1;
  const total = checks.length;
  const denom = Math.max(1, total - counts.skip);
  const score = Math.round((counts.pass / denom) * 100);
  const grade =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";
  return {
    url,
    startedAt,
    finishedAt: new Date().toISOString(),
    checks,
    summary: { ...counts, total, score, grade },
  };
}
