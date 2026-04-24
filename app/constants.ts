export const TREE_TYPES: Record<string, any> = {
  // COMMON — 5 sunshine each (Total: 5)
  heartwood:  { name: 'Heartwood Oak',    color: '#8b6914', bg: 'rgba(139,105,20,0.1)',  cost: 5,     currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'oak',       sceneBg: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #222e1a 100%)' },
  thicket:    { name: 'Inkberry Bush',    color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)',   cost: 5,     currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'shrub',     sceneBg: 'linear-gradient(180deg, #0e1a12 0%, #142218 50%, #182a1c 100%)' },
  penny:      { name: 'Penny Bloom',      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  cost: 5,     currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'daisy',     sceneBg: 'linear-gradient(180deg, #1a1e14 0%, #22281c 50%, #283020 100%)' },
  quill:      { name: 'Quill Fern',       color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   cost: 5,     currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'fern',      sceneBg: 'linear-gradient(180deg, #0e1a12 0%, #142218 50%, #182a1c 100%)' },
  pebble:     { name: 'Pebble Hedge',     color: '#65a30d', bg: 'rgba(101,163,13,0.1)',  cost: 5,     currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'round',     sceneBg: 'linear-gradient(180deg, #141c0a 0%, #1a2a0e 50%, #223812 100%)' },

  // UNCOMMON — 25 sunshine each (Total: 5)
  ember:      { name: 'Ember Maple',      color: '#991b1b', bg: 'rgba(153,27,27,0.1)',   cost: 25,    currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'maple',     sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #2a1010 50%, #381616 100%)' },
  sentinel:   { name: 'Sentinel Pine',    color: '#064e3b', bg: 'rgba(6,78,59,0.1)',     cost: 25,    currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'conifer',   sceneBg: 'linear-gradient(180deg, #0a1c18 0%, #0e2a24 50%, #123830 100%)' },
  manuscript: { name: 'Manuscript Birch',  color: '#a3e635', bg: 'rgba(163,230,53,0.1)',  cost: 25,    currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'birch',     sceneBg: 'linear-gradient(180deg, #161e18 0%, #1c2820 50%, #223228 100%)' },
  sorrow:     { name: 'Sorrow Willow',    color: '#84cc16', bg: 'rgba(132,204,22,0.1)',  cost: 25,    currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'weeping',   sceneBg: 'linear-gradient(180deg, #101c10 0%, #162a16 50%, #1c381c 100%)' },
  dusk:       { name: 'Dusk Lavender',    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', cost: 25,    currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'lavender',  sceneBg: 'linear-gradient(180deg, #181420 0%, #1e1a28 50%, #241e30 100%)' },

  // RARE — 125 sunshine each (Total: 4)
  parlor:     { name: 'Parlor Topiary',   color: '#166534', bg: 'rgba(22,101,52,0.1)',   cost: 125,   currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'topiary',   sceneBg: 'linear-gradient(180deg, #0a160e 0%, #0e2014 50%, #122a1a 100%)' },
  goldleaf:   { name: 'Goldleaf Citrus',   color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 125,   currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'citrus',    sceneBg: 'linear-gradient(180deg, #1c1c0e 0%, #242412 50%, #2e2e18 100%)' },
  spine:      { name: 'Spine Cactus',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   cost: 125,   currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'cactus',    sceneBg: 'linear-gradient(180deg, #141c0a 0%, #1a2a0e 50%, #223812 100%)' },
  inkcap:     { name: 'Inkcap Mushroom',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   cost: 125,   currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'mushroom',  sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #2a1010 50%, #381616 100%)' },

  // TRUE RARE — 625 sunshine each (Total: 3)
  monolith:   { name: 'Monolith Cypress', color: '#0f766e', bg: 'rgba(15,118,110,0.1)', cost: 625,   currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'cypress',   sceneBg: 'linear-gradient(180deg, #0a1610 0%, #0e2016 50%, #122a1c 100%)' },
  wisteria:   { name: 'Cascade Wisteria', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', cost: 625,   currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'cascade',   sceneBg: 'linear-gradient(180deg, #18142a 0%, #1e1a34 50%, #24203e 100%)' },
  hanami:     { name: 'Hanami Sakura',    color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', cost: 625,   currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'sakura',    sceneBg: 'linear-gradient(180deg, #1c1420 0%, #221a26 50%, #28202c 100%)' },

  // PREMIUM — 3000 sunshine each (Total: 3)
  odyssey:    { name: 'Odyssey Palm',     color: '#eab308', bg: 'rgba(234,179,8,0.1)',   cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'palm',      sceneBg: 'linear-gradient(180deg, #141a20 0%, #1a2228 50%, #202a32 100%)' },
  mythos:     { name: 'Mythos Orchid',    color: '#be185d', bg: 'rgba(190,24,93,0.1)',   cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'exotic',    sceneBg: 'linear-gradient(180deg, #1c0a14 0%, #2a0e1e 50%, #381228 100%)' },
  patience:   { name: 'Patience Bonsai',  color: '#15803d', bg: 'rgba(21,128,61,0.1)',   cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'bonsai',    sceneBg: 'linear-gradient(180deg, #101610 0%, #162016 50%, #1c2a1c 100%)' },

  // EXTINCT — 15000 sunshine each (Total: 3)
  thornscript:{ name: 'Thornscript',      color: '#4c1d95', bg: 'rgba(76,29,149,0.1)',   cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'bramble',   sceneBg: 'linear-gradient(180deg, #14101e 0%, #1a1428 50%, #201a32 100%)' },
  epoch:      { name: 'Epoch Baobab',     color: '#b85e22', bg: 'rgba(184,94,34,0.1)',   cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'baobab',    sceneBg: 'linear-gradient(180deg, #1c1810 0%, #242014 50%, #2c2618 100%)' },
  fossil:     { name: 'Fossil Pine',      color: '#bedaf7', bg: 'rgba(190,218,247,0.1)', cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'ancient',   sceneBg: 'linear-gradient(180deg, #101820 0%, #142028 50%, #182830 100%)' },

  // CHROMA — 50000 sunshine each (Total: 3)
  reverie:    { name: 'Reverie Wisp',     color: '#e0c3fc', bg: 'rgba(224,195,252,0.1)', cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.001, shape: 'ethereal',  sceneBg: 'linear-gradient(180deg, #14161a 0%, #1a1e22 50%, #20242a 100%)' },
  prism:      { name: 'Prism Shard',      color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.001, shape: 'crystal',   sceneBg: 'linear-gradient(180deg, #181428 0%, #1e1a32 50%, #28203e 100%)' },
  abyss:      { name: 'Abyss Maw',        color: '#000000', bg: 'rgba(0,0,0,0.2)',       cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.001, shape: 'void',      sceneBg: 'linear-gradient(180deg, #0a0a0e 0%, #0e0e14 50%, #12121a 100%)' },

  spoiled:    { name: 'Spoiled',           color: '#71717a', bg: 'rgba(113,113,122,0.1)', cost: 0,     currency: 'sunshine', rarity: 'common',    weight: 0,     shape: 'dead',      sceneBg: 'linear-gradient(180deg, #141414 0%, #1a1a1a 50%, #202020 100%)' }
}

export const XP_LEVELS: { xp: number; name: string }[] = [
  { xp: 0, name: "Seedling" },
  { xp: 100, name: "Sprout" },
  { xp: 300, name: "Sapling" },
  { xp: 600, name: "Scribe" },
  { xp: 1000, name: "Wordsmith" },
  { xp: 1600, name: "Inkweaver" },
  { xp: 2400, name: "Chronicler" },
  { xp: 3500, name: "Storyteller" },
  { xp: 5000, name: "Lorekeeper" },
  { xp: 7000, name: "Sage" },
  { xp: 10000, name: "Archivist" },
  { xp: 14000, name: "Oracle" },
  { xp: 20000, name: "Pulp Legend" },
]

export function getLevel(xp: number): { level: number; name: string; currentXp: number; nextXp: number; progress: number } {
  let level = 0
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) { level = i; break }
  }
  const current = XP_LEVELS[level]
  const next = XP_LEVELS[level + 1] || { xp: current.xp + 5000, name: "Beyond" }
  const range = next.xp - current.xp
  const progress = range > 0 ? (xp - current.xp) / range : 1
  return { level: level + 1, name: current.name, currentXp: xp - current.xp, nextXp: range, progress: Math.min(1, progress) }
}

export const LEADERBOARD_BOTS = [
  { name: "quillmaster", xp: 22400, sunshine: 4800 },
  { name: "midnightscribe", xp: 15200, sunshine: 3200 },
  { name: "inkdragon", xp: 11800, sunshine: 2400 },
  { name: "papertiger", xp: 8600, sunshine: 1700 },
  { name: "notanova", xp: 6300, sunshine: 1100 },
  { name: "draftpunk", xp: 4100, sunshine: 680 },
  { name: "blankpage_hero", xp: 2700, sunshine: 420 },
  { name: "lofi_writer", xp: 1500, sunshine: 210 },
  { name: "penpal99", xp: 800, sunshine: 95 },
  { name: "newleaf", xp: 200, sunshine: 30 },
]
