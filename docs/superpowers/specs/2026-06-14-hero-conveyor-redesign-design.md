# Hero Conveyor Redesign

## Problem

The landing hero (`app/pulp-landing.tsx`) shows two scrolling "conveyor belt" columns of
cards on the right. The content was uncurated and inconsistent: the left belt held four
tree cards (two of them sparse — bamboo, cattail) and the right belt held three feature
demos. The signature feature — the living orchard — was absent from the belts entirely.

## Goal

Keep the two-belt scrolling layout. Replace the content and art of **all 7 boxes** with a
curated, higher-impact set. No layout/animation changes to the belt mechanics.

## Decisions

- **Left belt (scrolls down) — "the collection," all wow-factor.** Four gem/sacred
  showpieces with strong, varied color so the cards read as a treasure shelf:
  1. **Starweaver** — navy cosmic tree, twinkling stars (keep + polish existing art)
  2. **Prismatic** — white iridescent tree, rainbow shimmer (NEW art)
  3. **Abyss Maw** — black void tree with gem glow (NEW art)
  4. **Leviathan** — teal gem tree (NEW art)
  - Drops the free Tangerine and the sparse bamboo/cattail. Max visual punch.

- **Right belt (scrolls up) — "the daily loop."** Three cards, the product in motion:
  1. **Inline AI** — redesigned cleaner (less busy rewrite demo)
  2. **Focus timer** — keep `DemoTimer` (hero feature)
  3. **Living orchard** — NEW. A compact terrain vista that *mirrors the real
     `OrchardView`*: layered mountains with snow caps, atmospheric haze, winding road,
     lake with shore, and a small cluster of trees. The signature feature, now present.

## Approach

All changes are local to the `leftCards` / `rightCards` arrays inside the conveyor IIFE in
`app/pulp-landing.tsx` (~lines 720–1003). Card sizing, rotation, border-radius variety, and
the `beltDown`/`beltUp` animations stay as-is.

- The orchard card is a self-contained `200x40`-ish SVG built to read as the same world as
  `OrchardView` (same palette family: snow `#e8e8e0`, lake `#5a8ab0`, shore `#6a8a5a`,
  grass `#6a9a50`). It is a faithful compact rendition, not a reuse of OrchardView's
  ~1500-line procedural generator.
- New tree cards follow the existing card pattern: parchment `#E0D7C1` background, centered
  bespoke SVG, rarity label top-right. Sacred trees get the glowing `cvSacredGlow` label
  treatment; Leviathan gets a plain "true rare" label.

## Out of scope

- Belt animation/timing, masking, mobile behavior (belts already hidden on mobile).
- Any change to the actual seed shop, OrchardView, or tree data in `constants.ts`.

## Verify

`npm run dev`, view `/` hero on desktop: both belts scroll, all 7 redesigned cards render,
orchard card reads as a mini OrchardView, no console errors, `npm run build` passes.
