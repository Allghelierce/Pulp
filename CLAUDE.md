## GLOBAL — READ FIRST
- Few words only. No yapping. Ever.

## Response Style
- One sentence responses max. Talk like caveman. Short. Blunt. No fluff.

# Pulp

A digital notebook app with gamification — focus timer, tree growing, achievements, and a boutique shop. Built with Next.js App Router.

## Stack

- **Framework**: Next.js 15 (App Router, TypeScript, `app/` directory)
- **Styling**: Tailwind CSS + inline styles, dark/light theme
- **Animation**: Framer Motion
- **AI**: Google Generative AI (`@google/generative-ai`)
- **Auth/DB**: Supabase (`@supabase/supabase-js`)
- **3D**: React Three Fiber (shelf room view)
- **Testing**: Playwright

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — eslint
- `npm run test` — playwright tests

## Architecture

### Core file: `app/page.tsx`
The main page is a large single-file component managing all top-level state (notes, grove, inventory, achievements, juice, gems, XP). State is persisted to localStorage (`pulp-grove`, etc.) and sessionStorage (timer state).

### Key types (`app/types.ts`)
- `NoteData` — notebook with pages, boxes, drawings, lines. Types: notebook, singlepage, flashcard, vault, cornell
- `Tree` — `{ id, type, stage, progress, plantedAt, notebookId? }` — grown via focus sessions
- `Achievement` — progress-tracked achievements with gem/juice rewards
- `DialogConfig` — prompt/confirm/alert dialog system

### Tree system (`app/constants.ts`)
- `TREE_TYPES` — all plant species with rarity, cost, shape, color
- `tangerine` is the default free tree (grown when no seed selected)
- Rarities: common, uncommon, rare, true rare, premium, extinct, chroma
- Shapes map to SVG renderings in `PlantIcon.tsx`

### Component map
- `Sidebar.tsx` — notebook list, folders, navigation
- `TimerSidebarPanel.tsx` — focus timer with tree visualization, seed selection, presets
- `VitalitySystem.tsx` — wraps timer, handles session completion, tree growth, achievement tracking
- `OrchardView.tsx` — notebook-specific orchard with terrain (mountains, roads, lake), forest placement
- `BoutiqueView.tsx` — seed shop
- `StatsView.tsx` — daily stats and streaks
- `LeaderboardView.tsx` — leaderboard display
- `PlantIcon.tsx` — SVG tree renderer by shape/stage (seed through mature)
- `AppDialog.tsx` — modal dialog system (prompt, confirm, alert)
- `BinderView.tsx` — grid view of planted trees

### Orchard terrain system
Trees are placed using cluster-based forest dispersal that avoids roads, lakes, and mountains. The terrain is rendered as layered SVG with: mountain range (3 layers + snow caps), winding main road + branch road, lake with shore/reeds/ripples, grass tufts, and atmospheric haze. Trees are notebook-specific — each notebook has its own orchard.

## Style conventions

- Accent color: `#d97706` (Pulp amber) everywhere — the one true orange
- Fonts: EB Garamond for UI text, system monospace for code
- All components use `memo()` for performance
- Inline styles over className when dynamic values are needed
- Dark theme uses zinc/neutral palette with orange accents
- Tree names are single-word (e.g. "Tangerine", "Heartwood", "Sentinel")

## State persistence

- `localStorage`: `pulp-grove` (sap [stored as `juice` key], gems, grove, inventory, achievements, lastCharCount, unlockedCosmetics)
- `sessionStorage`: `pulp-timer` (elapsed, total, running, done, preset, waterDeadline, selectedSeed)
- Notes are stored separately in localStorage

## Important patterns

- Trees get tagged with `notebookId` on timer completion via `activeTabId`
- Timer sessions plant a topic tree (tangerine if no seed) only if notes were written (~a sentence per 10 min); the timer grows it to sapling, recall on its topic finishes it
- Water mechanic: sessions >= 10min need watering every 15min; alerts 2min before due (chime, notification, tab blink); 3min overdue the tree wilts and the session pauses; 15min overdue it dies
- Giving up a session costs 15% sap; recoverable with 15 gems
- Sap is earned by collecting from grove trees (sapYield), not from focus sessions directly
- Gem trees (abyss, starweaver, leviathan, prismatic) yield gems when grove sap is collected
- Tree categories: fruit, flora, gem, none
- Achievement progress is checked via `checkAchievementRef` callback pattern
