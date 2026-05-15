# Market Shopkeeper Scene

Replaces the terraced hills background in the BoutiqueView market tab with an SVG shopkeeper stall scene.

## What changes

**File:** `app/components/BoutiqueView.tsx`, lines 549-630 (the `{/* Terraced landscape background */}` block and the tangerine tree sprites block).

**Remove:**
- 4-layer terrace SVG paths, gradients (`sh-t1` through `sh-t4`), terrace edge lines
- Grass tufts array (15 procedural tufts)
- Tangerine tree PlantIcon sprite overlay (13 positioned trees)

**Replace with:** A single SVG scene containing:

### Scene elements

| Element | Description | Theme handling |
|---------|-------------|----------------|
| **Counter** | Wooden horizontal plank with darker underside, two legs | Dark: `#5a4a32`/`#4a3a28`. Light: `#a89878`/`#988868` |
| **Back shelf** | Narrower plank behind keeper at shoulder height | Dark: `#3a2e20`. Light: `#8a7a60` |
| **Shopkeeper body** | Ellipse torso + circle head, silhouette only | Dark: `#2a2218`. Light: `#6a5a48` |
| **Hat** | Wide-brim ellipse + rounded crown rect | Dark: `#3a3020`. Light: `#7a6a50` |
| **Arms** | Two ellipses resting on counter edges | Same as body fill |
| **Lanterns (x2)** | Hanging line + rounded rect + amber circle + radial glow | Body: same as shelf. Glow: `#d97706` at 0.6 opacity, halo at 0.08 |
| **Crates (x2)** | Small rects on counter, left and right | Dark: `#5a4830`. Light: `#a08a60` |
| **Seed bags (x2)** | Small ellipses next to crates | Dark: `#6a5a40`. Light: `#b0a070` |
| **Ground** | Full-width rect at bottom | Dark: `#1a1410`. Light: `#d8d0c0` |

### Layout

- SVG viewBox: `0 0 800 400` (same as old terraces)
- `preserveAspectRatio="xMidYMax slice"` (same)
- Positioned: `position: absolute; bottom: 0; left: 0; width: 100%; height: 55%`
- Shopkeeper centered at x=400, counter spans ~x200-x600
- Lanterns at ~x260 and ~x540
- Scene vertically centered in lower portion

### Warm sky gradient

Kept as-is (the `div` above the SVG). No changes.

### What stays the same

- Container div structure (`position: absolute, inset: 0, pointerEvents: none, zIndex: 0`)
- The "Market" title, countdown, ornamental divider, and seed cards above (zIndex: 1)
- Ambient particles (pollen + leaves) remain untouched
- No new imports, no new components, no new state

### Constraints

- Pure inline SVG, no animation (static scene)
- All colors theme-aware via existing `isDark` boolean
- No facial features on shopkeeper (silhouette style matches existing dark terrain figures in OrchardView)
- No new CSS classes or keyframes needed
