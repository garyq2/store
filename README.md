# Store — headless e-commerce storefront on ERPNext

A vibrant, easy-on-the-eyes storefront (Next.js 16 / React 19 / Tailwind v4) that uses
**ERPNext** as the source of truth for catalog, pricing, stock, and orders. Headless: the
storefront reads ERPNext `Item` / `Item Price` / `Bin` directly via a server-side BFF — no
ERP credentials ever reach the browser.

## Stack
- Next.js (App Router) · React 19 · Tailwind v4 · TypeScript
- Design tokens in `design/` (Emerald & Clay, soft & friendly, Inter)
- Data layer in `src/lib/erpnext/` (swappable: mock ⇄ live ERPNext) + `src/lib/catalog/`
- Cart: cookie-backed, server-authoritative pricing/stock (`src/lib/cart/`)

## Run locally
```bash
npm install
cp .env.example .env.local   # set ERPNEXT_* + STOREFRONT_USE_MOCK
npm run dev                  # http://localhost:3000
```
- `STOREFRONT_USE_MOCK=true` (default) → built-in demo catalog, no ERPNext needed.
- `STOREFRONT_USE_MOCK=false` → reads a live ERPNext (`ERPNEXT_URL`, `ERPNEXT_API_KEY`,
  `ERPNEXT_API_SECRET`). The host running the app must be able to reach `ERPNEXT_URL`.

## Build a container image
```bash
docker build -t store:local .     # Next standalone output (next.config.ts: output: "standalone")
```

## Deploy (GitOps)
Cluster manifests live in the **home-ops** repo under `kubernetes/apps/store/` (Deployment
+ Service + HTTPRoute + SOPS secret), Flux-managed. This repo builds & pushes the image to
GHCR via `.github/workflows/`; home-ops references it by digest. See `docs/` for the full
design, user journeys, wireframes, deployment requirements, and the ERPNext seed.

## Docs
- `docs/DESIGN.md` · `docs/USER_JOURNEYS.md` · `docs/WIREFRAMES.md` · `docs/DESIGN_TOKENS.md`
- `docs/ERPNEXT_DEPLOYMENT_REQUIREMENTS.md`
- `security/` — supply-chain scan script + CI gate

Cluster manifests (ERPNext, seed, and the future storefront Deployment) live in the
separate **home-ops** GitOps repo, not here.
