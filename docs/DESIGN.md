# Store — Headless E-Commerce Storefront on ERPNext

> Status: **Brainstorm / pre-MVP** · Last updated: 2026-06-03
> Goal: A production-ready, SME-grade online store that sells through and is fully
> backed by **ERPNext** (open-source ERP) — Shopify-like functionality, our own look.

---

## 1. Product vision

A vibrant, easy-on-the-eyes storefront where a small/medium business can:
- publish a product **catalog**,
- let customers **browse → cart → checkout → pay**,
- and have every purchase **automatically create a Sales Order in ERPNext** and
  **decrement inventory** as items are reserved/fulfilled.

ERPNext is the single source of truth for products, prices, stock, customers, orders,
invoices, and accounting. The storefront is a thin, beautiful "head" on top of it.

---

## 2. Architecture — headless commerce

```
  Browser (storefront SPA/SSR)
        │  HTTPS (no ERP keys ever reach the browser)
        ▼
  BFF / API layer  (Next.js route handlers or a small Node/Python service)
   - holds ERPNext API key/secret as server-side secrets
   - cart/session, validation, rate limiting, caching
   - payment intent creation + webhook handling
        │  ERPNext REST/RPC API (token auth)
        ▼
  ERPNext + Frappe Framework  (Python / MariaDB / Redis)
   - DocTypes: Item, Item Price, Website Item, Customer, Sales Order,
     Sales Invoice, Payment Entry, Delivery Note, Bin (stock), Warehouse
        ▲
        │  webhooks (price/stock/catalog change)
        └─── keeps storefront cache fresh
```

**Why a BFF (backend-for-frontend) is non-negotiable:** ERPNext API credentials must
never live in the browser. The BFF mediates every call, lets us cache aggressively,
reshape ERPNext's verbose DocType payloads into clean storefront DTOs, and enforce
business rules (stock checks, price integrity) the client can't be trusted to do.

---

## 3. Tech stack recommendation

| Layer | Recommendation | Why / alternative |
|---|---|---|
| Storefront | **Next.js (React) — App Router** | Best-in-class SSR/SSG/ISR for SEO + speed, huge ecosystem, easy hiring. **Nuxt (Vue)** is the equivalent if you prefer Vue — same architecture, swap the layer. |
| Styling | **Tailwind CSS** + a headless component lib (shadcn/ui or Radix) | Fast, consistent, themeable design tokens (see §9). |
| State / data | TanStack Query (server cache) + lightweight client store (Zustand) | Cart, catalog caching. |
| BFF | Next.js route handlers (same repo) **or** standalone Fastify/NestJS service | Start in-repo; split out later if it grows. |
| Cache/session | Redis | Cart sessions, catalog cache, idempotency keys. |
| Payments | **Stripe** (default) | Or Razorpay (India), PayPal, Adyen — region-dependent (see §6). |
| ERP | **ERPNext (self-hosted Docker)** or Frappe Cloud | See §8 for the supply-chain/security plan. |
| Hosting | Vercel/Netlify (storefront) + VPS/managed K8s (ERPNext) | See §7. |

**React vs Vue verdict:** go React/Next.js unless the team already lives in Vue. The
headless-commerce ecosystem (examples, payment SDKs, component kits) skews React, which
de-risks an SME build. The architecture here is framework-agnostic, so it's reversible.

---

## 4. ERPNext data model mapping

| Storefront concept | ERPNext DocType(s) | Notes |
|---|---|---|
| Product | `Item` + `Website Item` | `Website Item` controls what's published online; `Item` holds the master + stock settings. |
| Price | `Item Price` under a `Price List` | Support multiple price lists (retail, wholesale, currency). |
| Stock level | `Bin` (per item+warehouse), `Stock Ledger Entry` | Read `actual_qty` / `projected_qty` for availability. |
| Customer | `Customer` (+ `Contact`, `Address`) | Guest checkout → create lightweight Customer on order. |
| Cart | *storefront-only* (Redis) until checkout | Don't create ERPNext docs per cart — too heavy. |
| Order | `Sales Order` | Created on successful checkout. |
| Payment | `Payment Entry` (+ `Sales Invoice`) | Created on payment webhook success. |
| Fulfillment | `Delivery Note` | **This is what actually decrements stock.** |

---

## 5. Inventory & order flow (the critical design decision)

ERPNext does **not** decrement physical stock when a Sales Order is created — stock
moves only on `Delivery Note` (or a `Sales Invoice` with "Update Stock"). So we must
decide how to prevent **overselling** between order and fulfillment:

- **Option A — Stock Reservation (recommended, ERPNext v14+):** create a *Stock
  Reservation Entry* against the Sales Order so `projected_qty` drops immediately.
  Prevents overselling without faking stock movements; releases if order is cancelled.
- **Option B — Availability check only:** read `Bin.actual_qty` at add-to-cart and
  again at checkout; reject if insufficient. Simpler, but a race window allows
  oversell under concurrency.
- **Option C — Decrement at order via Delivery Note immediately:** only for
  ship-on-order / digital goods; couples ordering to fulfillment.

**Proposed checkout sequence:**
1. Revalidate cart prices + stock against ERPNext (never trust client totals).
2. Create/lookup `Customer`.
3. Create `Sales Order` (draft) + `Stock Reservation Entry`.
4. Create payment intent (Stripe) → collect payment client-side.
5. On **payment-success webhook**: submit Sales Order, create `Payment Entry`
   (+ `Sales Invoice`), optionally create `Delivery Note` (decrements actual stock).
6. On failure/timeout: release reservation, mark order cancelled.

**Hard rules:** idempotency keys on every ERPNext write (retries must not double-book);
all money/stock decisions server-side; webhook is the source of truth for "paid", not
the browser redirect.

---

## 6. Payments

- **Default: Stripe** — use Stripe Checkout or Elements so card data never touches our
  servers (PCI scope = SAQ-A). Confirm via **webhook**, not client redirect.
- **Region matters:** Razorpay/PayU (India — note ERPNext's Indian origin), PayPal,
  Adyen, Mollie (EU). Pick by where the SME's customers are.
- Handle: refunds (→ ERPNext credit note / payment reversal), partial payments,
  failed/expired intents, currency, taxes (ERPNext tax templates), shipping rates.
- Idempotent webhook processing + signature verification on every webhook.

---

## 7. Production-readiness checklist (what "confidently usable" means)

**Security**
- ERP keys server-side only; secret manager (not .env in git).
- AuthN/AuthZ for customer accounts (JWT/session, password reset, optional social/OTP).
- Rate limiting, bot/abuse protection, CSRF on the BFF, input validation everywhere.
- HTTPS/HSTS, secure cookies, CSP headers.
- PCI-DSS scope minimized via hosted payment fields.
- GDPR/PII: data export/delete, cookie consent, privacy policy.

**Reliability & ops**
- Idempotency + retry/backoff for all ERPNext + payment calls; dead-letter queue for
  failed webhooks (orders must never silently drop).
- Observability: structured logs, error tracking (Sentry), metrics, uptime alerts.
- Backups (ERPNext DB + storefront config); tested restore.
- CI/CD with automated tests; staging environment mirroring prod.
- Graceful degradation if ERPNext is briefly down (cached catalog, queued orders).

**Performance & SEO**
- SSR/SSG + ISR for catalog pages; image CDN/optimization.
- Catalog cache in Redis, invalidated by ERPNext webhooks.
- Core Web Vitals budget; lazy loading; edge caching.
- Sitemap, structured data (schema.org Product), meta tags, clean URLs.

**Commerce features beyond MVP**
- Search + faceted filtering (Meilisearch/Typesense), categories/collections.
- Discounts/coupons (map to ERPNext Pricing Rules), gift cards.
- Order history, order tracking, email/SMS notifications (transactional email).
- Reviews/ratings, wishlists, related products.
- Tax & shipping calculation, multi-currency, multi-warehouse.
- Admin/config surface (or just use ERPNext's UI for back-office).
- Accessibility (WCAG 2.1 AA), i18n/l10n.
- Analytics + conversion tracking, consent-aware.

---

## 8. ERPNext supply-chain / "no malicious code" verification plan

ERPNext (by Frappe Technologies) is a mature, widely deployed OSS project — the real
risk isn't a backdoor in core, it's **supply-chain hygiene**. Plan:

1. **Use official, pinned releases only** — pin ERPNext + Frappe to a specific tagged
   version/commit; use the official `frappe/erpnext` Docker images and verify image
   digests (SHA256), not floating `latest` tags.
2. **Vendor & review** — clone the exact tag, diff against upstream, review any custom
   apps before installing. Treat third-party Frappe apps with extra scrutiny.
3. **Dependency scanning** — `pip-audit`/Safety (Python), `npm audit`/`osv-scanner`
   (JS), and **Trivy/Grype** on the Docker images. Generate an **SBOM** (Syft).
4. **SAST** — Bandit (Python) + Semgrep on any custom code/apps we add.
5. **Runtime hardening** — least-privilege DB user, network isolation (ERP not exposed
   publicly except the API the BFF needs), WAF, secrets in a vault, audit logging.
6. **Provenance** — verify checksums/signatures on downloads; lock the toolchain.
7. **Ongoing** — Dependabot/Renovate + scheduled re-scans; subscribe to Frappe security
   advisories; patch cadence.

This same scanning pipeline (Trivy, npm audit, Semgrep, SBOM) runs in our own CI for the
storefront, so security is continuous, not a one-time check.

---

## 9. Design & UX — "vibrant, easy on the eyes"

- **Design-token system** (CSS variables / Tailwind theme) so the whole palette is
  swappable. Light + dark mode from day one.
- **Palette direction (proposal):** a calm neutral base (warm off-white / near-black)
  with **one vibrant accent** + one secondary, chosen for contrast and AA-compliant
  text. "Vibrant but easy on the eyes" = saturated accents used *sparingly* on CTAs,
  generous whitespace, soft shadows, rounded corners, large readable type.
- Mobile-first; thumb-friendly cart/checkout; minimal steps to purchase.
- Distinct from Shopify visually (custom components, our tokens) while matching the
  proven UX patterns (sticky add-to-cart, mini-cart drawer, one-page checkout).
- Component-driven (Storybook) for consistency.

---

## 10. Phased roadmap

- **Phase 0 — Foundations:** stand up ERPNext (secured per §8), define DTOs, BFF skeleton,
  design tokens + component library, CI/CD + scanning.
- **Phase 1 — MVP:** catalog (list + detail) from Website Items, cart (Redis), guest
  checkout, Stripe payment, Sales Order + Payment Entry creation, stock availability
  check, transactional emails.
- **Phase 2 — Robust commerce:** stock reservation, accounts/order history, search +
  filters, discounts (Pricing Rules), refunds, observability, dark mode.
- **Phase 3 — Scale & polish:** multi-currency/warehouse, reviews/wishlist, advanced SEO,
  performance budget, A/B testing, i18n.

---

## 11. Locked decisions (2026-06-03)

1. **Region: US / North America** → Stripe processor, USD, US sales-tax (consider a tax
   service like TaxJar/Stripe Tax for nexus/jurisdiction handling).
2. **Audience: B2C *and* B2B** → dual pricing + accounts (see §12).
3. **ERPNext: fresh self-hosted deploy** → we stand it up via official pinned Docker
   images, secured per §8. We own the ops.
4. **Framework: Next.js (React) + Tailwind** — confirmed.

### Still open
- Catalog size & traffic → caching/search investment level.
- Digital vs physical goods → fulfillment + stock-decrement timing.
- Tax engine: ERPNext native tax templates vs Stripe Tax/TaxJar (US nexus is messy).

## 12. B2C + B2B implications (because we serve both)

Serving both is the biggest complexity driver. Design choices:

- **Price lists:** at least a *Retail (B2C)* and a *Wholesale (B2B)* `Price List` in
  ERPNext; the BFF picks the price list based on the logged-in customer's group.
  Guests always see retail.
- **Accounts:** B2C allows **guest checkout**; B2B **requires login** and maps to an
  ERPNext `Customer` with a `Customer Group` (e.g. "Wholesale") + credit terms.
- **B2B-only features (later phase):** min-order quantities, quantity-break pricing
  (ERPNext Pricing Rules), tax-exempt customers (resale certificates), purchase-order
  numbers on checkout, optional "request a quote" → ERPNext `Quotation`, and net-terms
  / pay-on-account instead of card-only.
- **Catalog visibility:** some items/prices may be B2B-only — gate via customer group at
  the BFF so retail visitors never see wholesale pricing.
- **Checkout fork:** one cart engine, two checkout paths (guest/card vs account/terms).

Recommendation: **ship B2C first (Phase 1), layer B2B onto the same engine (Phase 2)** —
the data model supports both from the start, but B2B UX (accounts, quotes, terms) is
where the extra work lives.
