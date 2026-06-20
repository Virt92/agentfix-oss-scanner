# How to publish this repo + package

The scanner lives at `oss-scanner/` inside the main agentfix monorepo. To
release it as a standalone open-source repo + npm package, follow these
steps from the parent directory.

## 1. Push to GitHub

```bash
cd oss-scanner

# Initialise a fresh git repo (this dir lives inside the monorepo —
# we create a separate history for the public release).
git init -b main
git add .
git commit -m "Initial release — 8 of 33 AgentFix signals, MIT"

# Create the public repo + push (requires the `gh` CLI logged in).
# Adjust the org/name to whatever you own.
gh repo create agentfix-pro/oss-scanner \
  --public \
  --description "Open-source mini scanner for AI-agent readiness — 8 of the 33 signals AgentFix audits" \
  --source=. \
  --push \
  --homepage "https://agentfix.pro"
```

If you don't have the `gh` CLI:

```bash
git remote add origin git@github.com:<your-org>/oss-scanner.git
git push -u origin main
```

## 2. Publish to npm

```bash
# One-time: log in
npm login

# Publish — the package name in package.json is `agentfix-mini-scanner`.
# If that's already taken, rename in package.json + README before publishing.
npm publish --access public
```

Verify with:

```bash
npx agentfix-mini-scanner@latest example.com
```

## 3. Wire the link into the main site

Once the GitHub URL is live, add it to:

- `api/src/app/page.tsx` footer (Resources column)
- `api/src/app/about/page.tsx` — under "How it's different"
- `api/src/app/changelog/page.tsx` — new top entry: `OSS mini-scanner released`

A small AgentFix-side patch can do this in one deploy — keep the GitHub URL
in a single constant so future renames are one-line changes.
