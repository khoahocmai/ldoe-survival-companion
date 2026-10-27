# UI Audit Report

Date: 2026-10-27 · Branch: `feat/ldoe-survival-companion` · Scope: UI only (no data/calculator logic)

Method: read the design tokens and every shared component, grepped the whole `src/` for consistency
patterns, ran the app (desktop 1440, mobile 375, light + dark) and computed WCAG contrast on the tokens.

## 0. Status after the standardisation pass

All five steps of section 4 were implemented on `feat/ui-standardization`, one commit per step.

| Finding | Status |
|---------|--------|
| A1, A2 contrast | Fixed (primary button 4.6:1 in light mode; `faint` >= 4.5:1 on surface, bg, subtle) |
| A3 modal focus management | Fixed: one `Dialog` (portal, focus trap + restore, `aria-labelledby`, topmost-only Escape, exit animation) used by Modal, search, wiki drawer, mobile menu |
| A4 focus ring on inputs | Fixed: shared `controlClass` (ring + border), slider and checkbox focus |
| A5 `title=` tooltips | Mostly fixed: `Tooltip` (hover + keyboard) on IconButton, sidebar, weapon rail, tiles. Truncation `title`s and `Badge title` remain (progressive hints only) |
| A6 skip link / live regions / feedback | Fixed: skip button, `role="status"` on combat and points results, toasts after save/hide/delete/import |
| A7 clickable Card | Open: still a `div role="button"` |
| C1 monolith | Fixed: `ConstructionCalculator` 1139 -> ~230 lines + 7 components |
| C2 tables | Fixed with composable `Table/Thead/Th/Tr/Td` (not a data-driven DataTable) |
| C3, C4, C8, C9 type, radius, height, z-index, backdrop | Fixed as tokens (`text-2xs`, `rounded-control/card/dialog`, `h-control*`, named z-scale); backdrop lives only in `Dialog`. `text-2xs` (11px) is still 11px |
| C5, C6 raw controls, select | Fixed: `Slider`, `Switch`, `ToggleChip`, styled `Select`; `cn()` merges class overrides |
| C7 theme | Fixed: follows the OS on first visit, `theme-color` meta |
| P1 font | Fixed: Inter Variable self-hosted |
| P2 dead code | Fixed: `ChopperCalculator.tsx`, `App.css`, unused svgs, empty folder removed |
| P3 tile fallbacks | Fixed: category icon on tiles without a picture |
| P4 tablet | Partly: construction page stacks below 1280px; wiki detail is still a drawer below 1280px |
| P5 mobile | Fixed for hit areas (`coarse:` variants, 16px inputs) and the page header; weapon-mods page unchanged |
| P6 toolbar | Partly: magic sticky offsets replaced by a `page-y` token; header + search + chips still take the same height |
| P7 i18n | Not done (out of scope) |
| P8 skeleton | Fixed for the initial load (`AppSkeleton`) |
| P9 PWA | Manifest, icons and theme colour added; no service worker, so no offline mode yet |

Still not verified: an automated axe/Lighthouse run and a screen-reader pass.

## 1. Overall verdict

The foundation is **already modern and in good shape**: Tailwind + semantic CSS-variable tokens
(`bg/surface/subtle/line/fg/muted/faint/accent/ok/info/warn/danger`), light/dark in one place,
shared primitives (`Button`, `Card`, `Badge`, `Modal`, `Field`, `Tabs`, `PageHeader`, `Stat`, `EmptyState`…),
a reusable `WikiPage` scaffold, responsive drawer/bottom-nav, reduced-motion support, ~0 hard-coded colours.

What is missing is the **last 20%**: accessibility details, a few missing primitives (Table, Tooltip, Toast),
one 1100-line page that bypasses the system, and some polish. Nothing needs a redesign — a standardisation pass is enough.

## 2. Findings (by priority)

### P1 — Accessibility / correctness

| # | Finding | Evidence | Fix direction |
|---|---------|----------|---------------|
| A1 | **Primary button fails contrast in light mode**: white on `accent-solid` (amber-600) = **3.19:1** (needs 4.5:1 for 14px text). Dark mode is fine (8.9:1). | `Button.tsx` primary, `--accent-solid: 217 119 6` | Use darker solid (amber-700 `180 83 9` → 5.0:1) for light, or dark text on amber. |
| A2 | **`text-faint` fails AA in both themes**: 3.45:1 (light) / 3.47:1 (dark) on surface, 3.05 / 3.19 on `subtle`. It is used for 11–12px labels, hints, placeholders, counts. | `--faint` token; used in Field hints, SearchInput, CompactWikiCard eyebrow, table headers | Darken light `faint` to ≈ `115 113 107`, lighten dark `faint` to ≈ `135 134 129`; reserve for decorative text only. |
| A3 | **Modals have no focus management**: no focus trap, no focus restore on close, no `aria-labelledby` (title is not linked to the dialog). Same for the search modal and the mobile drawer / wiki detail drawer. Only Escape + scroll-lock exist. | `Modal.tsx`, `GlobalSearchModal.tsx`, `WikiSplitLayout.tsx`, `AppLayout.tsx` | One shared `Dialog` base (native `<dialog>` or Radix/Headless UI) used by all four. |
| A4 | **Inputs remove the outline** (`focus:outline-none`) and rely on a 1px border colour change as the only focus indicator; `:focus-visible` is only defined globally (0 component-level usages). | `Field.tsx`, `SearchInput.tsx`, `ItemPicker.tsx`, `GlobalSearchModal.tsx` | Standard focus ring on all controls: `focus-visible:ring-2 ring-accent-solid/40`. |
| A5 | **Information only in `title=` tooltips** (60 usages in pages): not available on touch, not keyboard-reachable, not read reliably. E.g. `EntityTile` puts the hint only in `title`; EntityImage shows a file path via `title`. | grep `title=` | Real `Tooltip` primitive (hover + focus), and never put essential info there. |
| A6 | **No skip link, no live regions**: only 1 `aria-live/role=status` in the whole app; calculator results change silently; no feedback after save/delete/import (no toast, `ConfirmDialog` just closes). | grep | Add skip-to-content, a `Toast` system, `aria-live="polite"` on result summaries. |
| A7 | **Clickable `Card` is a `<div role="button">`** with hand-written Enter/Space handling, and uses `aria-pressed` for "selected" where `aria-current`/listbox semantics fit better. Not checked: whether any card puts another interactive element inside. | `Card.tsx`, `CompactWikiCard.tsx` | Render a real `<button>`/`<a>` for clickable cards. |

### P2 — Consistency / design-system gaps

| # | Finding | Evidence | Fix direction |
|---|---------|----------|---------------|
| C1 | **`ConstructionCalculator.tsx` is a 1139-line monolith** with its own inline headings, cards, tables and `text-[11px]` spans; it is the page that most deviates from the shared primitives (uses `text-xs uppercase` table headers, `rounded-xl border border-line overflow-hidden` wrappers, etc.). | 1139 lines; 4 of the 7 app tables live here | Split into `LocationPicker`, `StructureStages`, `ChopperPanel`, `CalculatorModal`; use `Section`/`Card`/`Table`. |
| C2 | **No shared `Table` component**: 7 hand-rolled `<table>`s with different header styles, paddings, `min-w-[480|500|560px]` hacks and hover states. | `CombatCalculator`, `PointCalculator`, `CraftingPlanner`, `ConstructionCalculator` ×4 | `DataTable` primitive (sticky header, density, numeric alignment, scroll-shadow, mobile card fallback). |
| C3 | **Type scale is a loose set**: `text-xs` 141× vs `text-sm` 90×; custom `text-[11px]` 13× (Badge, MobileNav, eyebrow, ModOption…). 11/12/14 px everywhere makes dense screens small on mobile. | grep | Define scale tokens (`caption 12`, `body 14`, `title 16`, `heading 20`) in Tailwind, drop `[11px]`, make body 15–16 on mobile. |
| C4 | **Radius/spacing mixed**: `rounded` (6) / `-md` (19) / `-lg` (53) / `-xl` (15) / `-2xl` (2); `Card` padding is `p-3.5` while `CompactWikiCard` overrides to `p-3`; controls are `h-9` in forms but `h-8` (topbar search), `h-11` (ItemPicker, lg button). | grep, `Field.tsx`, `Topbar.tsx`, `ItemPicker.tsx` | Fix tokens: control height (32/36/44), radius (md controls, lg cards, xl modals), card padding. |
| C5 | **Raw `<input>/<select>/<button>` still used in pages** (15 occurrences in pages/weaponmods/recipes) next to the `Field` set; range slider, chips and checkboxes are one-off styles. | grep | Add `Slider`, `Switch/Checkbox`, `Combobox` to the kit; ban raw controls in pages. |
| C6 | **Native `<select>` is unstyled** (`appearance` default, no custom chevron): looks different per OS, and in dark mode the opened list is an OS popup. | `Field.tsx` `Select` | Custom-styled select (`appearance-none` + icon) or a Listbox component. |
| C7 | **Dark mode is hard default** (ignores `prefers-color-scheme` on first visit); no `theme-color` meta; no light/dark/system choice (removed intentionally in `e75910f`). | `ThemeContext.tsx`, `index.html` | Default to system on first run; keep the 2-way toggle if you want, but store "unset" separately. |
| C8 | **Z-index is ad hoc** (`z-10/20/30/40/50`, modals and the wiki drawer both `z-50`). A modal opened from the drawer relies on DOM order. | grep | Define a z-scale (dropdown 30, drawer 40, modal 50, toast 60). |
| C9 | **Three different backdrops** (`bg-black/50` copied 4×), different open/close animations; no exit animation anywhere (only enter). | grep | Part of the shared `Dialog` / `Drawer`. |

### P3 — Polish / hygiene

| # | Finding | Fix |
|---|---------|-----|
| P1 | **Inter is declared but never loaded** (no `@font-face`, no `@fontsource`, no `<link>`); everyone gets the system font. Text metrics differ per OS (Segoe UI on Windows). | Self-host Inter (variable, `font-display: swap`, Vietnamese subset) via `@fontsource-variable/inter`. |
| P2 | **Dead code**: `src/App.css` (leftover Vite template, unused), `src/pages/ChopperCalculator.tsx` (395 lines, not imported — route redirects to `/construction?tab=chopper`), `public/favicon.svg` and `public/icons.svg` (neither is referenced; the favicon is inlined in `index.html`), and an empty `inventory-slots/` folder at the repo root. | Delete after confirming. |
| P3 | **Wiki tiles for Recipes show text-only dark squares** for recipes without a recipe-specific image; the zoom `scale-[1.85]` crop is tuned for the item blueprint screenshots and cuts other images. Many items also lack images (dark placeholder tiles), with no icon fallback. | Category icon fallback on tiles; crop only for blueprint-style sources. |
| P4 | **Construction page on a 800px-wide window** (laptop/tablet landscape) squeezes 3 columns; the EXP table is cut off and relies on horizontal scroll. Tablet range (768–1279) uses the phone-like single-column drawer pattern with no intermediate layout. | Add a tablet layout; collapse the picker into a top bar below `xl`. |
| P5 | **Mobile**: bottom nav is fine, but `PageHeader` action wraps below the title (the `Thêm` button gets its own row), the weapon-mods page stacks three panels with a long scroll, and tap targets such as `FilterChips` (h-8 = 32px) and `Tabs` are under the 44px guideline. 1 interactive element measured < 32px on the items page (`3× Pine Log`, 80×24). | Compact header on mobile, 44px hit areas (padding trick), sticky bottom action bar for builder pages. |
| P6 | **Page header + search + chips take ~170px of vertical space** before content on desktop; the sticky chip strip uses magic offsets (`-top-4 -mt-4`) coupled to `<main>` padding. | Move to a single toolbar row; use a `--header-h` variable instead of magic numbers. |
| P7 | Hard-coded Vietnamese strings everywhere (no i18n layer) — fine today, but blocks an English toggle and makes label/typo audits manual. | Optional: extract strings to a `messages` map. |
| P8 | No loading skeletons (the app shows one full-screen spinner while JSON loads); images use `loading="lazy"` but no placeholder/aspect box. | Skeleton tiles; `aspect-square` placeholder with blur colour. |
| P9 | No `manifest`/PWA metadata or touch icons although this is a "companion" app used on a phone next to the game. | Add `manifest.webmanifest`, icons, `theme-color`; optional offline cache. |

## 3. What is already good (keep)

- Semantic token layer with RGB-channel variables (opacity utilities work), dark/light parity.
- `prefers-reduced-motion` handled globally; FOUC-free theme script in `index.html`.
- `PageHeader / Section / Stat / StatGrid / PropertyList / EmptyState / Callout / ProgressBar` give a coherent vocabulary.
- `WikiPage` generic scaffold = all six wiki pages feel the same; URL-driven selection (`?select=`).
- Accessible basics: labelled `IconButton` (`aria-label` + `title`), nav landmarks with `aria-label`, `lang="vi"`, all images have `alt`, 1 `<h1>` per page, no unnamed controls found on the items page.
- Mobile bottom navigation with safe-area inset; collapsible desktop sidebar persisted in storage.

## 4. Suggested standardisation plan

Ordered so each step is independently shippable and low-risk:

1. **Tokens (small)** — fix A1/A2 contrast, add type scale, radius, control-height and z-index tokens, load Inter (P1), default theme to system (C7).
2. **Primitives (medium)** — shared `Dialog/Drawer` with focus trap (A3, C8, C9), `Tooltip` (A5), `Toast` (A6), `DataTable` (C2), `Select/Slider/Switch` (C5, C6), unified focus ring (A4).
3. **Refactor consumers (medium)** — migrate Modal/GlobalSearch/WikiSplitLayout/mobile menu to `Dialog`; replace the 7 hand-rolled tables; replace `text-[11px]` and raw controls.
4. **Split `ConstructionCalculator`** (C1) and remove dead code (P2).
5. **Responsive & polish** — tablet layout (P4), mobile header/hit-areas (P5), toolbar compaction (P6), tile fallbacks (P3), skeletons (P8), PWA (P9).

Rough size: steps 1–2 ≈ a day each; step 3 ≈ a day; step 4 ≈ half a day; step 5 ≈ a day.

## 5. Not verified

- No automated a11y run (axe/Lighthouse) and no screen-reader test; contrast numbers are computed from the tokens, not sampled from rendered pixels.
- Only 10 routes were viewed visually; modal flows (edit forms, planner modal, calculator modal) were reviewed in code, not clicked through.
- Vite dev server was used (port 5174 because 5173 was busy); `dist/` was not rebuilt.
