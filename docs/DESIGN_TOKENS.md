# Store — Design System (Tokens)

> Status: **Locked v1** · 2026-06-03
> Direction: **Emerald & Clay · Soft & friendly · Inter · lifestyle/apparel/home**
> Source of truth: `design/tokens.css` (CSS variables) + `design/tailwind.theme.cjs`.
> This doc explains the *why* and the usage rules. Components use **semantic tokens
> only** — never raw hex.

---

## 1. Palette

### Brand
| Role | Light | Dark | Notes |
|---|---|---|---|
| Primary (brand) | `#059669` emerald-600 | `#10B981` | Reference accent; the chosen green. |
| Primary fill (solid CTA bg) | `#047857` emerald-700 | `#10B981` | Higher contrast so **white text passes AA** (5.5:1). |
| Primary hover | `#065F46` | `#34D399` | |
| Primary subtle (tint bg) | `#ECFDF5` | rgba emerald 14% | Badges, selected chips. |
| Secondary (clay) | `#D97706` clay-600 | `#F59E0B` | Warm counterpoint; sale/secondary CTAs, accents — **used sparingly**. |

### Neutrals (the calm base — ~90% of the UI)
| Role | Light | Dark |
|---|---|---|
| Page bg | `#F8FAF9` mint-white | `#0B1220` |
| Surface (cards/drawers) | `#FFFFFF` | `#111A2B` |
| Surface-2 (raised/subtle) | `#F1F5F4` | `#18233A` |
| Border | `#E2E8F0` | `#233047` |
| Text | `#0F172A` ink | `#E6EDF3` |
| Text muted | `#64748B` | `#94A3B8` |

### Status
Success `#16A34A` · Warning `#D97706` · Error `#DC2626` · Info `#0891B2`
(each has a `-bg` tint). Note: success green is intentionally distinct from the
emerald CTA so "it worked" never reads as a button.

---

## 2. The "vibrant but easy on the eyes" rule

1. **Neutrals carry the page.** Mint-white bg, white surfaces, ink text, generous
   whitespace. Calm by default.
2. **The accent is a spotlight, not a floodlight.** Emerald appears on the *one*
   primary action per view (Add to cart, Checkout, Pay), active/selected states, links,
   and focus rings. Clay is rarer still (sale tags, secondary emphasis).
3. **Everything meets WCAG AA.** Solid CTAs use `primary-fill` (#047857) so white labels
   pass 4.5:1; the lighter brand emerald is for tints, icons, and large text.
4. **Dark mode is a token swap**, not a separate design — brand brightens, neutrals
   invert, contrast preserved.

---

## 3. Typography — Inter

- Families: display + body both **Inter** (load via next/font; mono for SKUs/codes).
- Scale (1.25-ish): xs `12` · sm `14` · base `16` · lg `18` · xl `20` · 2xl `24` ·
  3xl `30` · 4xl `36` · 5xl `48`.
- Headings: weight 600–700, tracking `-0.01em`. Body: 400, line-height 1.5.
- Prices/CTAs: 600. Buttons: 16px / 600.

---

## 4. Shape & feel — "soft & friendly"

- **Radius:** pills for buttons (`--radius-full`), cards `xl` (24px), inputs/drawers
  `lg` (16px). Rounded = welcoming.
- **Shadows:** soft, low-opacity, large blur (`--shadow-md/lg`). No harsh edges.
- **Spacing:** generous — 4px base; sections breathe (≥`space-12`).
- **Motion:** 120–320ms, `ease-standard`; drawers/mini-cart slide with `ease-emphasized`.
  Respect `prefers-reduced-motion`.

---

## 5. Component recipes (Tailwind, using the theme)

```html
<!-- Primary CTA (Add to cart / Pay) -->
<button class="bg-primary-fill text-on-primary font-semibold rounded-full
               px-6 py-3 shadow-sm transition-colors duration-base ease-standard
               hover:bg-primary-hover focus-visible:shadow-focus">
  Add to cart
</button>

<!-- Secondary / ghost -->
<button class="bg-surface text-text border border-border rounded-full px-6 py-3
               hover:bg-surface-2 transition-colors">
  Keep shopping
</button>

<!-- Product card -->
<article class="bg-surface rounded-xl shadow-md overflow-hidden
                transition-transform duration-base hover:-translate-y-0.5">
  <img class="aspect-square w-full object-cover" ... />
  <div class="p-4">
    <h3 class="text-base font-semibold text-text">Product</h3>
    <p class="text-sm text-text-muted">Category</p>
    <p class="mt-1 text-lg font-semibold text-text">$XX</p>
  </div>
</article>

<!-- Input -->
<input class="w-full bg-surface text-text rounded-lg border border-border
              px-4 py-3 placeholder:text-text-subtle
              focus:outline-none focus-visible:shadow-focus focus:border-primary" />

<!-- In-stock badge -->
<span class="inline-flex items-center gap-1 rounded-full bg-primary-subtle
             text-primary text-xs font-medium px-2.5 py-1">In stock</span>
```

Because it's **lifestyle/apparel/home**: lead with big imagery (square/4:5 photos,
`object-cover`), minimal chrome around products, fewer specs and more lifestyle copy,
lookbook-style collection blocks on the home page.

---

## 6. Implementation notes
- Import `design/tokens.css` once at the app root; set `darkMode: 'class'` in Tailwind
  and toggle `.dark` (or `[data-theme]`) on `<html>`.
- Persist theme choice; default to system via the `prefers-color-scheme` fallback.
- Add a Storybook with these recipes as the first stories to keep components consistent.
- Accessibility: visible focus ring everywhere (`shadow-focus`), AA contrast enforced in
  CI (e.g. axe), hit targets ≥44px (the generous spacing already helps).
