# Store — User Journeys, Implementation Map & Conversion UX

> Status: **Design** · Last updated: 2026-06-03
> Companion to `DESIGN.md`. Covers: the two user journeys (B2C + B2B), what each step
> requires us to build (page → component → BFF endpoint → ERPNext), and the UX levers
> that make the funnel convert.

---

## 0. The guiding principle

> Every screen has exactly one job: move the visitor to the next step with the least
> friction and the most confidence. Conversion = **speed × clarity × trust − friction.**

Cart abandonment averages ~70%. The top reasons are well documented and *designable
away*: surprise costs at the end, forced account creation, long/complicated checkout,
and trust/security doubts. Our entire UX is organized around removing those four.

---

## 1. B2C shopper journey (the conversion-critical path)

```
 Land → Browse → Product → Add to cart → Cart → Checkout → Pay → Confirm → Post-purchase
   1       2        3          4           5        6        7       8           9
```

### Step 1 — Land (home / campaign / search engine)
- **Goal:** orient in <3s, route to a product fast.
- **Build:** `/` landing (SSG/ISR), hero, featured collections, search bar, trust strip.
- **ERPNext:** featured `Website Item`s, collections.
- **Convert:** instant load (SSR/ISR + image CDN), prominent search, one clear value
  prop, no popup before the user has done anything.

### Step 2 — Browse catalog
- **Goal:** find candidates without thinking.
- **Build:** `/shop` + `/collections/[slug]`, `ProductGrid`, `ProductCard`,
  `FilterSidebar` (facets), sort, pagination/infinite scroll, instant search overlay.
- **BFF:** `GET /api/catalog?filters&sort&page` (cached in Redis).
- **ERPNext:** `Website Item` + `Item Price` (price list chosen by customer group),
  `Bin` for availability badges.
- **Convert:** faceted filtering, fast in-stock/price-at-a-glance cards, "quick add"
  from the card, skeleton loaders (perceived speed), remembered scroll position.

### Step 3 — Product detail (PDP)
- **Goal:** answer every objection, make Add-to-Cart obvious.
- **Build:** `/products/[slug]`, image gallery + zoom, `VariantSelector`,
  `QuantityStepper`, sticky `AddToCart`, stock/availability, shipping/returns blurb,
  reviews, related products.
- **BFF:** `GET /api/product/[slug]`.
- **ERPNext:** `Item`, variants, `Item Price`, `Bin.actual_qty`, attributes.
- **Convert:** big primary CTA, real stock signal ("Only 3 left" when true), clear
  variant state, delivery estimate, social proof (ratings), "notify when back in stock"
  instead of a dead end.

### Step 4 — Add to cart (the micro-moment)
- **Goal:** confirm the action *without leaving the page*.
- **Build:** slide-out **MiniCart drawer** (not a full navigation), optimistic update,
  cart badge count, free-shipping progress bar.
- **BFF:** `POST /api/cart` (session in Redis), `GET /api/cart`.
- **Convert:** never bounce the user to a cart page on add; show the drawer with
  "Checkout" + "Keep shopping". Optimistic UI = feels instant. Free-ship progress bar
  nudges AOV.

### Step 5 — Cart review
- **Goal:** edit confidently, see the true total forming.
- **Build:** `/cart`, `CartLineItem` (qty edit, remove, save-for-later), order summary
  with **estimated tax + shipping shown here**, promo code field, trust badges.
- **BFF:** `POST /api/checkout/validate` (revalidate price + stock against ERPNext).
- **Convert:** **no surprise costs** — surface shipping/tax estimate before checkout;
  persistent cart across sessions/devices; easy quantity edit; clear continue CTA.

### Step 6 — Checkout (where most carts die)
- **Goal:** fewest fields, fastest path, zero forced friction.
- **Build:** `/checkout` — **single-page, sectioned**:
  1. **Express checkout buttons at the very top** (Apple Pay / Google Pay / Stripe Link)
     — lets returning/mobile users skip the whole form.
  2. Contact (email) + "already have an account? log in" (optional, never forced).
  3. Shipping address with **autocomplete** (Google/USPS).
  4. Delivery method + cost.
  5. Payment (Stripe Payment Element).
  6. **Sticky order summary** (always visible, itemized total incl. tax + shipping).
- **BFF:** `POST /api/checkout/create-order` → creates `Sales Order` (draft) +
  `Stock Reservation Entry` + Stripe `PaymentIntent`; returns client secret.
- **Convert:** **guest checkout by default**; one page, progressive sections; inline
  validation; address autocomplete; saved totals; security/trust badges near the pay
  button; mobile keyboard types (numeric for zip/card).

### Step 7 — Pay
- **Goal:** frictionless, secure, reassuring.
- **Build:** Stripe Payment Element (cards + wallets + Link), 3DS handled by Stripe,
  clear loading + error states, disabled double-submit.
- **BFF:** Stripe handles card data (PCI = SAQ-A). **`POST /api/webhooks/stripe`** is the
  source of truth: on `payment_intent.succeeded` → submit Sales Order, create
  `Payment Entry` + `Sales Invoice` (+ optional `Delivery Note`). Idempotent.
- **Convert:** wallets/Link = one-tap; never charge then fail silently; show a clear
  "processing…" then a definitive result.

### Step 8 — Confirmation
- **Goal:** reassure + reduce "did it work?" anxiety.
- **Build:** `/checkout/confirmation/[orderId]`, order number, summary, what-happens-next,
  **soft account-creation prompt** ("set a password to track this order").
- **ERPNext:** read back the submitted `Sales Order`.
- **Convert:** instant, clear confirmation + email; offer account creation *after* the
  sale (post-purchase, not as a barrier); cross-sell gently.

### Step 9 — Post-purchase
- **Goal:** retention + reduce support load.
- **Build:** transactional email (confirmation, shipping), order tracking, account order
  history, returns flow, review request later.
- **ERPNext:** `Delivery Note` status, tracking; `Sales Invoice`.
- **Convert:** proactive shipping updates, easy reorder, review solicitation → reviews
  feed back into Step 3 social proof (the loop closes).

---

## 2. B2B buyer journey (layered on the same engine, Phase 2)

```
 Request account → Approved/Login → Wholesale catalog → Quick/bulk order
   → Cart (qty breaks) → Checkout (PO# / net terms) → [optional approval] → Order
```

Key differences from B2C:
- **Account required** before pricing is shown; maps to ERPNext `Customer` +
  `Customer Group` ("Wholesale"); may need admin approval.
- **Wholesale price list** + quantity-break pricing via ERPNext `Pricing Rules`.
- **Quick order / bulk entry:** paste SKUs or upload CSV, reorder from history — B2B
  buyers know what they want; speed of *re-ordering* is the conversion lever, not
  discovery.
- **Checkout extras:** PO number field, **net-terms / pay-on-account** option instead of
  card-only, tax-exempt (resale certificate) handling, ship-to multiple addresses.
- **Request a quote:** non-standard orders → ERPNext `Quotation` → sales rep follows up.
- **B2B convert levers:** minimize clicks-to-reorder, show contract pricing clearly,
  saved lists/templates, account dashboard with open invoices + credit available.

---

## 3. Implementation inventory (what actually gets built)

### Pages / routes (Next.js App Router)
```
/                         landing (ISR)
/shop                     catalog + filters
/collections/[slug]       category
/products/[slug]          PDP
/search                   results
/cart                     cart page
/checkout                 one-page checkout
/checkout/confirmation/[id]
/account                  dashboard
/account/orders[/id]      history + detail/tracking
/account/addresses
/login  /register  /reset
/pages/[slug]             CMS (about, returns, FAQ, policies)
# B2B (Phase 2)
/account/quick-order      SKU/CSV bulk entry
/account/reorder
/account/quotes[/id]
/account/invoices
```

### Core components
Header (nav + search + cart badge), MiniCart drawer, ProductCard, ProductGrid,
FilterSidebar, SortControl, Pagination, Gallery+Zoom, VariantSelector, QuantityStepper,
AddToCart (sticky), CartLineItem, OrderSummary (sticky), FreeShipBar, PromoCodeInput,
AddressForm (autocomplete), DeliveryMethodPicker, ExpressCheckoutButtons, StripePayment
Element, TrustBadges, ReviewStars/ReviewList, Toast/optimistic feedback, SkeletonLoaders,
EmptyStates, AccountDashboard, QuickOrderTable (B2B).

### BFF endpoints
```
GET  /api/catalog            list + filters + pagination (cached)
GET  /api/product/[slug]
GET  /api/search
GET  /api/cart               POST /api/cart  (add/update/remove; Redis session)
POST /api/checkout/validate  revalidate price + stock vs ERPNext
POST /api/checkout/create-order   -> Sales Order(draft) + Stock Reservation + PaymentIntent
POST /api/webhooks/stripe    -> confirm pay, submit SO, Payment Entry, Invoice (idempotent)
POST /api/webhooks/erpnext   -> invalidate catalog/price/stock cache
auth: /api/auth/* (login, register, reset, session)
account: /api/account/orders, /addresses, (B2B) /quotes, /invoices, /quick-order
```

### ERPNext touchpoints (recap)
Read: `Website Item`, `Item`, `Item Price`/`Price List`, `Bin` (stock), `Customer`.
Write: `Customer`, `Sales Order`, `Stock Reservation Entry`, `Payment Entry`,
`Sales Invoice`, `Delivery Note`, (B2B) `Quotation`.

---

## 4. Cross-cutting conversion levers (the "seamless" toolkit)

1. **Speed is a feature** — SSR/ISR, image CDN, edge caching, prefetch on hover,
   optimistic UI, skeletons. Sub-second feel = higher conversion.
2. **Kill surprise costs** — show tax + shipping estimates *in the cart*, not at the end.
3. **Never force account creation** — guest checkout for B2C; offer the account *after*
   the purchase.
4. **Express payment first** — wallet/Link buttons at the top of checkout collapse the
   whole funnel to one tap for many users.
5. **One-page, sectioned checkout** — fewer fields, inline validation, address
   autocomplete, sticky itemized summary.
6. **Trust everywhere it matters** — security badges by the pay button, clear returns
   policy, real reviews, honest stock signals.
7. **Mobile-first** — most B2C traffic; thumb-friendly CTAs, correct input types, sticky
   add-to-cart on PDP.
8. **Recover abandonment** — persistent cart, abandoned-cart emails, back-in-stock
   notifications, save-for-later.
9. **Reduce dead ends** — out-of-stock → notify-me; no results → suggestions; errors →
   recoverable, friendly states.
10. **Accessibility = reach + conversion** — WCAG AA contrast (ties into the vibrant-but-
    readable palette), keyboard nav, focus states, screen-reader labels.

---

## 5. Metrics to instrument from day one

Funnel: view → add-to-cart → begin-checkout → purchase (with drop-off at each step).
Plus: conversion rate, AOV, cart-abandonment rate, checkout completion time, search
exit rate, PDP bounce, mobile vs desktop conversion, payment-failure rate. These tell us
*where* to spend the next optimization cycle — instrument before guessing.
