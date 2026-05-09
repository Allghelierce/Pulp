# Tree Creation Guide for Pulp

How to add new tree species to the Pulp app. Written from experience across 90+ tree attempts.

## Files to modify

1. **`app/constants.ts`** — `TREE_TYPES` object. One line per tree with: name, color, bg, cost, currency, rarity, weight, shape, category, juiceYield, paperYield, gemYield?, sceneBg.
2. **`app/components/PlantIcon.tsx`** — `renderShape()` switch. One case block per shape with 4 stages (s=0 sprout, s=1 young, s=2 adolescent, s=3 mature).

## Constants entry template

```ts
treename: { name: 'Display Name', color: '#hex', bg: 'rgba(r,g,b,0.1)', cost: 5, currency: 'juice', rarity: 'common', weight: 0.5, shape: 'treename', category: 'fruit', juiceYield: 2, paperYield: 1, sceneBg: 'linear-gradient(180deg, #dark 0%, #mid 50%, #light 100%)' },
```

- **rarity**: common (cost 5, weight 0.5), uncommon (15, 0.3), rare (40, 0.2), epic (65, 0.15), legendary (100, 0.1)
- **category**: fruit (produces juice), paper (yields paper when cut), gem (produces gems), none (spoiled)
- **sceneBg**: dark gradient matching the tree's color palette — used as orchard background

## PlantIcon rendering system

### SVG setup
- ViewBox: `"0 6 48 42"` — trees live in a 48x42 space
- Container: `width: size, height: size * 1.3`
- Ground line: y=46
- Trees are wrapped in a sway animation group with `transformOrigin: '24px 46px'`
- Shared filters applied: `${uid}-edge` (outline) for all stages, `${uid}-3d` (drop shadow) for s >= 2

### Variables available in renderShape()
- `color` — primary color from TREE_TYPES (hex string)
- `dark` — `darken(color, 40)` — darker shade
- `light` — `lighten(color, 25-50)` depending on rarity
- `uid` — unique ID string for SVG gradient/filter IDs (MUST use for all IDs to avoid collisions)
- `trunk` — `"#6b5b3e"` standard brown
- `s` — stage 0-3 (already clamped)

### Stage guidelines
- **s=0 (sprout)**: Tiny. Thin stem from y=46 up to ~y=34. 2-3 small leaves. 5-10 SVG elements.
- **s=1 (young)**: Small tree visible. Thin trunk, small canopy/form. 10-20 elements.
- **s=2 (adolescent)**: Medium. Thicker trunk, branches, fuller form. May use gradients. 20-40 elements.
- **s=3 (mature)**: Full size. Detailed trunk with bark texture, wide canopy, decorative elements. Element count by rarity:
  - Common: 20-40 elements
  - Uncommon: 30-50 elements
  - Rare: 40-60 elements with linearGradient/radialGradient
  - Epic: 50-80 elements with `<animate>`, feGaussianBlur glow filters, CSS @keyframes
  - Legendary: 60-100+ elements with multiple animations, particles, complex filters

### Case block template

```tsx
case 'treename':
  if (s === 0) return (
    <g>
      <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* small leaves */}
    </g>
  )
  if (s === 1) return (<g>{/* young form */}</g>)
  if (s === 2) return (<g>{/* adolescent with gradients */}</g>)
  return (<g>{/* full mature */}</g>)
```

### SVG techniques by tier

**All tiers:**
- `<path>` for trunks, branches, organic shapes
- `<ellipse>` and `<circle>` for canopy blobs, fruits, berries
- `fill={color}` / `fill={dark}` / `fill={light}` with varying `opacity` for depth
- `stroke` for bark detail lines, branch outlines

**Rare+:**
- `<linearGradient>` / `<radialGradient>` in `<defs>` — ID must include `${uid}`
- Layered canopy with gradient fills for 3D depth

**Epic+:**
- `<filter>` with `<feGaussianBlur>` for glow effects
- `<animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />`
- `<animate attributeName="cx" .../>` for particle movement
- CSS keyframes injected via `<defs><style>{\`@keyframes fx-${uid} { ... }\`}</style></defs>`
- Reference CSS: `style={{animation: \`fx-${uid} 3s linear infinite\`} as React.CSSProperties}`

**Legendary:**
- Multiple overlapping radialGradients
- Orbiting particle systems (circles with animated cx/cy/r/opacity)
- Pulsing ring effects (ellipses with animated rx/ry)
- CSS @keyframes for complex transforms (rotation, translation)

## Ground rendering

Special trees can add custom ground in `renderGround()` switch. Most trees use the default green ground mound. Only add custom ground for trees with unique environments (void gets dark ground, winterveil gets frost, mangrove gets swamp).

## Critical lessons learned

### 1. SILHOUETTE IS EVERYTHING
The #1 reason trees get rejected is looking too similar. Every tree must have a unique silhouette that's recognizable at thumbnail size. Before designing, ask: "Could I tell this apart from every other tree if they were all the same color?"

Good unique silhouettes:
- Mushroom (dome cap on stem — no canopy at all)
- Cactus (vertical columns with arms)
- Willow (hanging curtain of strands)
- Fern (ground rosette of fronds — no trunk)
- Lotus (flower on lily pad — aquatic)
- Totem (carved pole with faces)
- Jellyfish (dome with trailing tentacles)
- Clockwork (gear shapes — mechanical)

Bad (all look the same at thumbnail):
- "Round canopy on brown trunk" x20 with different fruit circles

### 2. NOT EVERYTHING HAS TO BE A TREE
The best additions are often NOT trees: mushroom, fern, cactus, lotus, venus trap, vine, melon, sunflower. Think "plants and magical objects" not just "trees."

### 3. FRUIT DIFFERENTIATION
If you DO make fruit trees, the fruit shape matters more than the canopy:
- Grape clusters (overlapping circles in triangle formation)
- Strawberry (heart/teardrop shape with seed dots)
- Pear (teardrop path)
- Melon (large round on ground vine)

Don't just put different-colored circles on identical tree shapes.

### 4. RARITY = VISUAL COMPLEXITY, NOT JUST STATS
Common trees should be simple and natural. Epic/legendary trees should feel magical — glow effects, animated particles, unusual forms. The visual complexity should match the rarity.

### 5. SEASONAL THEMES
User wanted seasonal variety. Think about what season a tree evokes:
- Spring: blossoms, flowers, fresh green
- Summer: tropical, lush, fruiting
- Autumn: warm reds/oranges, falling leaves
- Winter: bare branches, berries, evergreen (but don't overdo snow — user specifically complained about too many snow trees)

### 6. BATCH PROCESS
For creating many trees at once:
1. Add all constants entries first
2. Spawn parallel agents (3 works well) to generate SVG case blocks into temp files
3. Each agent gets: the rendering context, the specific trees to create, and STRONG instructions about visual uniqueness
4. Normalize indentation (6 spaces for case blocks in the switch)
5. Insert before the `default:` case using `sed -i '' 'LINE r tempfile'`
6. Verify: grep for all shape names, cross-check constants vs PlantIcon, run `npx next build`

### 7. AGENT PROMPTING
When spawning agents to generate tree SVGs:
- Give them the EXACT viewBox, variables, and stage system
- Show an example of a complex existing tree (void or winterveil)
- Be VERY specific about what makes each tree unique — don't just say "apple tree", say "apple tree with visible red apples hanging, broad spreading horizontal branches"
- Specify element count targets per rarity
- Emphasize: "each tree must have a different silhouette from every other tree"

### 8. INDENTATION
The switch statement is inside a function inside a component. Case blocks need 6 spaces of indent. Agents sometimes produce 0-indent or different amounts. Normalize with `sed 's/^/      /'` before inserting.

## Current tree inventory

Check `grep "case '" app/components/PlantIcon.tsx | sort -u` for the current shape list, and `grep "shape:" app/constants.ts` for all registered tree types.
