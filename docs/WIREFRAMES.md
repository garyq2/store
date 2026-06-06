# Store — Wireframes (low-fi) & Design-Token Architecture

> Status: **Design** · Last updated: 2026-06-03
> Layout is intentionally color-agnostic here; the palette/type/radius come from the
> token system (§7), finalized once the brand direction is chosen.

Legend: `[ ]` button · `▾` dropdown · `▸/▾` accordion · `○ ●` radio/swatch · `▰▱` progress

---

## 1. Home / Landing  (SSG/ISR)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]    Shop   Collections   About        🔍   ♡   🛒(3) │  sticky header
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐
│ │  HERO — headline (one value prop)                       │
│ │  short subcopy                                          │  full-bleed
│ │  [ Shop now ]   [ secondary ]                           │  image/gradient
│ └────────────────────────────────────────────────────────┘
│  ✓ Free shipping over $X   ✓ Easy returns   ✓ Secure pay  │  trust strip
│                                                            │
│  Featured collections                                      │
│  [ card ] [ card ] [ card ] [ card ]                       │
│                                                            │
│  Best sellers                                              │
│  [ P ]   [ P ]   [ P ]   [ P ]                             │  product cards
│                                                            │
│  ── value props / newsletter signup ──                    │
│  Footer:  shop · help · policies · social · 🔒 pay badges  │
└──────────────────────────────────────────────────────────┘
Mobile: hamburger nav, 1–2 col scroll, sticky cart icon.
```

---

## 2. Catalog / Shop

```
┌──────────────────────────────────────────────────────────┐
│ header                                                     │
├───────────────┬──────────────────────────────────────────┤
│ FILTERS        │ Shop  (1,240 items)        Sort:[Featured▾]
│ Category       │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  □ Cat A       │ │ img  │ │ img  │ │ img  │ │ img  │       │
│  □ Cat B       │ │ name │ │ name │ │ name │ │ name │       │
│ Price          │ │ ★★★★ │ │      │ │      │ │      │       │
│  [min]—[max]   │ │ $XX  │ │ $XX  │ │ $XX  │ │ $XX  │       │
│ Brand          │ │[+add]│ │[+add]│ │[+add]│ │[+add]│       │  quick-add on hover
│ Rating ★★★★+   │ └──────┘ └──────┘ └──────┘ └──────┘       │
│ ☑ In stock     │ ... grid continues ...                    │
│ [Clear all]    │ [ Load more ]   (or infinite scroll)      │
└───────────────┴──────────────────────────────────────────┘
Mobile: filters in a bottom-sheet ("Filter (3)"), 2-col grid,
remembered scroll position on back.
```

---

## 3. Product detail (PDP)

```
┌──────────────────────────────────────────────────────────┐
│ header                                                     │
│ Home / Shop / Category / Product Name        (breadcrumb)  │
├────────────────────────────┬─────────────────────────────┤
│  ┌──────────────────────┐  │ Product Name                 │
│  │                      │  │ ★★★★☆  (128 reviews)         │
│  │     main image       │  │ $XX.XX   ($YY wholesale·B2B) │
│  │   (hover/click zoom) │  │                              │
│  │                      │  │ Color:  ○  ●  ○              │
│  └──────────────────────┘  │ Size :  [S][M][L][XL]        │
│  [t] [t] [t] [t]  thumbs   │ Qty  :  [ − 1 + ]            │
│                            │ ┌──────────────────────────┐ │
│                            │ │      Add to cart         │ │  sticky on mobile
│                            │ └──────────────────────────┘ │
│                            │ ✓ In stock · ships 2–4 days  │  honest signal
│                            │ ♡ Save     ⇄ Compare         │
│                            │ ▾ Description                │
│                            │ ▸ Shipping & returns         │
│                            │ ▸ Specs                      │
├────────────────────────────┴─────────────────────────────┤
│ Reviews (128)        |   You may also like  [P][P][P][P]  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Mini-cart (slide-out drawer — never navigates away)

```
            page dims ▒▒▒▒▒▒▒  ┌────────────────────────────┐
                               │ Your cart (3)            ✕ │
                               ├────────────────────────────┤
                               │ [img] Product name          │
                               │       Variant · Color       │
                               │       [ − 2 + ]      $XX  ⌫ │
                               │ ──────────────────────────  │
                               │ [img] Product name          │
                               │       [ − 1 + ]      $XX  ⌫ │
                               ├────────────────────────────┤
                               │ ▰▰▰▰▱  $12 away from free   │  free-ship nudge
                               │ Subtotal            $XXX    │
                               │ Tax (est.)          $XX     │  no surprises later
                               │ ┌────────────────────────┐  │
                               │ │       Checkout         │  │
                               │ └────────────────────────┘  │
                               │        Keep shopping        │
                               └────────────────────────────┘
Opens on add-to-cart with optimistic update.
```

---

## 5. Checkout (one-page, sectioned)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]                                       🔒 Secure      │  minimal header, NO nav
├────────────────────────────────────┬─────────────────────┤
│  ┌──────────────────────────────┐  │  ORDER SUMMARY       │  sticky (desktop)
│  │  Apple Pay  │   G Pay   │ Link│  │  [img] Name     $XX  │
│  └──────────────────────────────┘  │  [img] Name     $XX  │
│            ──── or ────             │  Promo [____][Apply] │
│                                     │  ──────────────────  │
│  ① Contact                          │  Subtotal      $XXX  │
│     email [____________________]    │  Shipping      $XX   │
│     ☐ create an account (optional)  │  Tax           $XX   │
│                                     │  ══════════════════  │
│  ② Shipping address                 │  Total        $XXX   │
│     [ start typing… (autocomplete)] │                      │
│     name · street · city · zip      │  (mobile: this is a  │
│                                     │   "Show order ▾"     │
│  ③ Delivery method                  │   accordion on top)  │
│     ○ Standard  $X  (2–4d)          │                      │
│     ○ Express   $Y  (1–2d)          │                      │
│                                     │                      │
│  ④ Payment                          │                      │
│     [ Stripe Payment Element ]      │                      │
│     ┌──────────────────────────┐    │                      │
│     │        Pay $XXX          │    │                      │
│     └──────────────────────────┘    │                      │
│     🔒 SSL · trusted badges         │                      │
├────────────────────────────────────┴─────────────────────┤
│ B2B variant adds: PO number field · "Pay on account (net  │
│ terms)" option · tax-exempt toggle · ship to multiple.    │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Confirmation (post-purchase)

```
┌──────────────────────────────────────────────────────────┐
│            ✓  Thank you! Order #SO-00123 confirmed         │
│  A receipt is on its way to you@email.com                  │
│  ┌── What happens next ──────────────────────────────────┐
│  │  • We're preparing your order                          │
│  │  • You'll get a shipping email with tracking           │
│  └───────────────────────────────────────────────────────┘
│  Order summary  [items · totals]                          │
│  ┌── Track this order ──┐  set a password →  [ Create acct ]│  account AFTER sale
│  You may also like  [P][P][P]                              │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Design-token architecture (to be filled once brand direction chosen)

Tokens live as CSS custom properties + a Tailwind theme, in **two layers**:
**primitives** (raw values) → **semantic tokens** (role-based, themeable, light/dark).

```
COLOR (semantic, both themes)
  --color-bg            page background      (warm/cool neutral)
  --color-surface       cards, drawers
  --color-surface-2     subtle raised
  --color-border        hairlines
  --color-text          primary text         (AA on bg)
  --color-text-muted    secondary text
  --color-primary       brand/CTA accent     (vibrant, used sparingly)
  --color-primary-hover
  --color-on-primary    text on CTA          (AA contrast)
  --color-secondary     supporting accent
  --color-success / --color-warning / --color-error / --color-info
  --color-focus-ring    a11y focus

TYPOGRAPHY
  --font-display / --font-body / --font-mono
  type scale: xs · sm · base · lg · xl · 2xl · 3xl · 4xl  (1.2–1.25 ratio)
  weights · line-heights · tracking

SPACING            4px base scale: 1,2,3,4,6,8,12,16,24…
RADIUS             --radius-sm/md/lg/xl/full   (drives "soft" vs "sharp" feel)
ELEVATION          --shadow-sm/md/lg  (soft, low-opacity)
MOTION             --dur-fast/base/slow · --ease-standard/emphasized
BREAKPOINTS        sm 640 · md 768 · lg 1024 · xl 1280
Z-INDEX            header · drawer · modal · toast scale
```

Rules: contrast meets **WCAG AA**; the vibrant accent appears only on CTAs/active
states; everything else rests on calm neutrals + whitespace. Dark mode is a token
swap, not a redesign.
