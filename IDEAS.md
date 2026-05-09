# Pulp Rework Ideas

## Core Loop

- Focus session → plant new sapling OR grow existing tree
- One tree per session, always
- Trees grow through stages: sapling → young → mature (3-5 sessions)
- Mature fruit trees produce juice passively
- Any tree can be cut down for lumber
- Juice buys new seeds, lumber upgrades notebooks

## Tree Types

### Fruit Trees
- Produce juice passively when mature
- Yield some lumber when cut
- Examples: tangerine, cherry, apple, lemon, plum

### Lumber Trees
- No juice, but yield significantly more lumber when cut
- Grow slower, look bigger in orchard
- Examples: redwood, pine, oak

### Trade-off
- Fruit trees = recurring income (juice to buy more seeds)
- Lumber trees = long-term investment, big one-time payout for notebook upgrades

## Growth System

- Finish a focus session → immediate reward (new sapling appears OR existing tree grows)
- Each session adds one growth stage to one tree
- Sapling → young → mature over 3-5 sessions
- Only mature fruit trees produce juice
- Cutting a young tree yields less lumber than a mature one
- No replanting — one plant action, multiple sessions to grow

## Resource Economy

- **Juice** — harvested from mature fruit trees, used to buy seeds/trees from the boutique
- **Lumber** — from cutting any tree, used for notebook pages, covers, cosmetics
- **Gems** — premium currency: expand orchard slots, grow multiple trees per session (expensive), pro sub features
- **Sunshine** — XP/progression (unchanged)

## Orchard Structure

- Per-notebook orchards — each notebook has its own small curated garden
- Default cap: 15-20 trees per orchard
- Gems (+ pro sub) expand orchard capacity beyond the cap
- Orchard overview page: grid of thumbnail orchards, click to enter
- Only show orchards that have trees
- "Harvest all" button: collect juice across all orchards at once
- Per-notebook identity — each garden has its own character
- Rivers and maybe a lake for visual variety

## Tree System

- Reduce to ~12-20 total species
- Rarities: common, uncommon, rare, legendary (4 tiers max)
- Rare seeds cost more juice in the boutique
- Rarer trees produce better juice value and more lumber

## Notebook Expansion via Lumber

- Lumber unlocks: extra pages, notebook covers, page textures, ink colors
- Core writing always available — never gate basic functionality
- Different tree species yield different paper styles
- Rare trees = unique/premium notebook materials

## Quota System

- Daily focus quota — user picks a tier:
  - **Easy**: 15min/day, 1.5x sap multiplier
  - **Medium**: 30min/day, 2x sap multiplier
  - **Advanced**: 60min/day, 3x sap multiplier
- No quota = 1x sap, no risk (opt-in system)
- 7-day lock-in: once you pick a tier, committed for a full week
- Miss a single day → youngest tree dies
- Want out early? Costs gems
- Multiplier applies to all sap earned from focus timer
- Encourages leaderboard competition

## Sap Sinks

### Seasonal Skins
- Rotate quarterly: spring blossoms, summer glow, autumn leaves, winter frost
- Pay sap to unlock per-tree or bulk unlock for whole orchard
- Season pass option: one large sap payment unlocks all skins for the quarter

### Gambling System
- **Mystery seeds**: 3 tiers (small/medium/large sap cost), weighted rarity odds
- **Tree grafting**: merge two trees, RNG outcome — hybrid (new visual), rarity bump, or failure (lose one). Higher rarity inputs = better odds
- **Daily spin**: sap entry fee, wheel with seeds/gems/cosmetics/nothing

### Tree Insurance
- Pay per-tree or blanket coverage for one session
- Per-tree: ~10% of seed cost in sap
- Blanket: expensive flat rate, covers all trees
- Single-use — expires after one session

### Timer Failure Penalty
- Giving up or failing a session costs 50% of sap (implemented)
- Makes insurance valuable
- Recoverable with gems

### Other Sap Sinks
- **Fertilizer** — boost tree growth stage progress
- **Watering can upgrade** — extend 8-min water deadline
- **Focus potions** — 2x XP for next session
- **Seed rerolls** — reroll boutique daily stock
- **Terrain cosmetics** — pond, paths, stone wall, lanterns, benches, flower beds
- **Weather effects** — rain, snow, autumn leaves overlays
- **Bucket upgrades** — bigger buckets = higher sap cap per tree
- **Notebook themes** — custom orchard biomes per notebook (desert, snow, tropical)
- **Auto-collect** — pay sap for automatic collection for X hours
- **Session multiplier** — pay before session, tree grows 2x faster
- **Seed crafting** — combine 3 common seeds + sap for uncommon seed
- **Tree relocation** — move trees between notebooks for a fee
- **Prestige reset** — reset orchard for permanent +% sap rate, huge cost
- **Tree auras** — glowing rings, sparkles, fireflies around specific trees
- **Golden bucket** — shimmering bucket skin
- **Fairy lights** — string lights between trees
- **Custom fences** — wooden, stone, hedgerow, iron
- **Tree diary** — unlock lore/flavor text per species
- **Undo chop** — recover chopped tree within 24h
- **Offline drip** — lump sum enables offline sap generation for 24h

## Sap Economy Balancing
- Use juiceYield from constants as per-tick production rate
- Diminishing returns: after 5th tree of same type, each additional produces 20% less (floor 40%)
- Tick interval: 60s, cap at 10 ticks (~10 min to fill)
- Paper/gem trees produce 0 sap — keeps fruit trees valuable

## Open Questions

- Exact tree species list and rarity assignments?
- Sessions per growth stage? (3 total? 5?)
- Juice harvest interval? (every few hours? daily?)
- Lumber yield per tree by maturity + rarity?
- How much does orchard expansion cost in gems?
- Cost curve for growing multiple trees per session?
- Notebook page limit before needing lumber expansion?
- Should cutting a tree require confirmation?
