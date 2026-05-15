# Market Shopkeeper Scene

Replaces the terraced hills background in the BoutiqueView market tab with an SVG shopkeeper stall scene featuring a cute orange character behind a detailed market cart.

## What changes

**File:** `app/components/BoutiqueView.tsx`, lines 549-630 (the `{/* Terraced landscape background */}` block and the tangerine tree sprites block).

**Remove:**
- 4-layer terrace SVG paths, gradients (`sh-t1` through `sh-t4`), terrace edge lines
- Grass tufts array (15 procedural tufts)
- Tangerine tree PlantIcon sprite overlay (13 positioned trees)

**Replace with:** A single SVG scene containing the elements below.

## The Orange (shopkeeper character)

- **Shape:** Single circle (r=20 in 400-wide viewBox), no separate head — literally an orange
- **Fill:** Radial gradient from `#e8a030` (highlight) through `#d97706` (mid) to `#b06205` (shadow)
- **Stem:** Small rect on top (`#4a6a2a`) with a leaf path (`#4a7a2a`)
- **Face:** Eyes (dot circles with white shine highlights) + O-shaped mouth (nested ellipses `#8a4a05`/`#6a3a04`). No cheeks, no nose, no eyebrows
- **Eyes animate:** Blink every ~5s using opacity keyframes on open/closed eye groups
- **Root arms:** Short, thin (1.8-2px), brown (`#5a3e1e`) branching paths that emerge from body sides, drape over the cart rail, and grip the front face with finger-roots. Each arm has different branching patterns, bark knots, tiny leaf buds. Arms are layered BEHIND the orange body
- **Outline:** Hairline 0.15px `#1a1410` stroke on body
- **Position:** Behind the cart — bottom half hidden by the counter. Centered in scene

## Cart / Stall

- **Structure:** Rect body with no wheels, sits flat. Individual plank fills with alternating brown tones
- **Wood detail:** Grain curve paths on each plank, wood knots (circle + inner circle), uneven vertical plank seams with nail dots
- **Top rail:** Multi-layer rect (base + highlight + worn surface), square nail heads, wear/scratch marks
- **Iron corners:** L-shaped bracket paths with rivet dots on both sides
- **3D shading:** Bottom planks slightly darker, subtle shadow under the rail, items cast small shadows on the rail surface
- **Items grounded:** Seed bags, plant pot, and bottle should have contact shadows and sit flush on the rail

## Cart Goods

- **Seed bags (x2):** Ellipse shapes with burlap weave texture (horizontal stroke lines), tied tops with knot detail
- **Potted plant:** Terra cotta trapezoidal pot with rim, soil ellipse, 3-4 varied plant sprigs with leaf tips
- **Glass bottle:** Rounded rect with glass highlight line, paper label with text lines, cork with grain marks, neck
- **SEEDS sign:** Hanging from rail on a string, wood rect with grain lines, carved amber text, nail at top

## Canopy

- **Poles:** Rect with visible wood grain lines, multiple twine wraps, turned-wood finial caps (concentric circles)
- **Fabric:** 3 layered stripe paths (amber/brown/amber), sewn seam dashes, stitch marks on scallop edge
- **Hanging beads:** 3 beads on strings from the lower canopy edge, solid `#d97706` with inner highlight

## Lanterns (x2)

- **Hanging:** Properly connected to canopy via stroke lines, small bracket at connection point
- **Body:** Outer rect with inner darker rect for glass, cross-bar dividers (horizontal + vertical lines), diagonal pane lines
- **Flame:** Layered circles (outer amber, mid brighter, inner brightest `#f0c050`)
- **Bottom cap:** Small rect + circle finial

## Layout

- SVG viewBox: `0 0 800 680` (doubled from mockup's 400x340)
- `preserveAspectRatio="xMidYMax slice"`
- Positioned: `position: absolute; bottom: 0; left: 0; width: 100%; height: 55%`
- All coordinates from mockup doubled to fit 800-wide viewBox
- Scene centered, orange at x=400

## Theme support

- All fills swap via `isDark` boolean
- Dark theme uses the brown/amber palette from the mockup
- Light theme: cart wood shifts to `#a89878`/`#988868` family, orange body keeps same gradient, ground becomes `#d8d0c0`, sky gradient becomes lighter warm tones
- Lantern flames stay amber in both themes

## Animations

- **Eye blink:** `blink-open` and `blink-shut` keyframes, ~5s cycle, brief close at 92.5%
- **Root arm sway:** Very subtle translate (0.2-0.3px), 6-7s cycle, different per arm
- **New keyframes needed:** `blink-open`, `blink-shut`, `root-sway-l`, `root-sway-r` — added as `<style>` inside the SVG

## What stays the same

- Container div structure (`position: absolute, inset: 0, pointerEvents: none, zIndex: 0`)
- Warm sky gradient div above the SVG
- The "Market" title, countdown, ornamental divider, and seed cards above (zIndex: 1)
- Ambient particles (pollen + leaves) remain untouched
- No new imports, no new components, no new state

## Still to nail in implementation

- 3D shading/shadows on cart elements
- Items properly grounded on cart rail (contact shadows)
- Lantern connection points to canopy (brackets)
- Light theme color mapping
