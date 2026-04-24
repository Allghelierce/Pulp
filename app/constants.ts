export const TREE_TYPES: Record<string, any> = {
  // COMMON — 5 sunshine each (Total: 10)
  navel:      { name: 'Navel Orange',   color: '#b85e22', bg: 'rgba(184,94,34,0.1)',   cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'oak',       sceneBg: 'linear-gradient(180deg, #1a2214 0%, #1e2a16 50%, #22301a 100%)' },
  blood:      { name: 'Blood Orange',   color: '#800000', bg: 'rgba(128,0,0,0.1)',     cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'maple',     sceneBg: 'linear-gradient(180deg, #1c1418 0%, #221a1e 50%, #281c1c 100%)' },
  clementine: { name: 'Clementine',     color: '#ff8c00', bg: 'rgba(255,140,0,0.1)',   cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'shrub',     sceneBg: 'linear-gradient(180deg, #1e1e10 0%, #252518 50%, #2a2a1a 100%)' },
  daisy:      { name: 'Daisy',          color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'daisy',     sceneBg: 'linear-gradient(180deg, #1a1e14 0%, #22281c 50%, #283020 100%)' },
  fern:       { name: 'Fern',           color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'fern',      sceneBg: 'linear-gradient(180deg, #0e1a12 0%, #142218 50%, #182a1c 100%)' },
  ivy:        { name: 'English Ivy',    color: '#14532d', bg: 'rgba(20,83,45,0.1)',    cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'shrub',     sceneBg: 'linear-gradient(180deg, #0a1a0a 0%, #102410 50%, #163016 100%)' },
  sunflower:  { name: 'Sunflower',      color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'daisy',     sceneBg: 'linear-gradient(180deg, #1c1c0a 0%, #2a2a0e 50%, #383812 100%)' },
  aloe:       { name: 'Aloe Vera',      color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'shrub',     sceneBg: 'linear-gradient(180deg, #0a1c14 0%, #102a1e 50%, #16382a 100%)' },
  cactus_mini:{ name: 'Mini Cactus',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'cactus',    sceneBg: 'linear-gradient(180deg, #141c0a 0%, #1a2a0e 50%, #223812 100%)' },
  willow:     { name: 'Weeping Willow', color: '#84cc16', bg: 'rgba(132,204,22,0.1)',  cost: 5,   currency: 'sunshine', rarity: 'common',    weight: 0.5,   shape: 'weeping',   sceneBg: 'linear-gradient(180deg, #101c10 0%, #162a16 50%, #1c381c 100%)' },

  // UNCOMMON — 25 sunshine each (Total: 8)
  tangerine:  { name: 'Tangerine',      color: '#ea580c', bg: 'rgba(234,88,12,0.1)',   cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'round',     sceneBg: 'linear-gradient(180deg, #1c1810 0%, #242014 50%, #2c2618 100%)' },
  lime:       { name: 'Key Lime',       color: '#65a30d', bg: 'rgba(101,163,13,0.1)',  cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'conifer',   sceneBg: 'linear-gradient(180deg, #101c14 0%, #142416 50%, #1a2e1c 100%)' },
  lavender:   { name: 'Lavender',       color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'lavender',  sceneBg: 'linear-gradient(180deg, #181420 0%, #1e1a28 50%, #241e30 100%)' },
  birch:      { name: 'Birch',          color: '#a3e635', bg: 'rgba(163,230,53,0.1)',  cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'birch',     sceneBg: 'linear-gradient(180deg, #161e18 0%, #1c2820 50%, #223228 100%)' },
  bamboo:     { name: 'Bamboo',         color: '#4d7c0f', bg: 'rgba(77,124,15,0.1)',   cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'birch',     sceneBg: 'linear-gradient(180deg, #0e1a12 0%, #142418 50%, #1a3220 100%)' },
  maple_red:  { name: 'Red Maple',      color: '#991b1b', bg: 'rgba(153,27,27,0.1)',   cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'maple',     sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #2a1010 50%, #381616 100%)' },
  juniper:    { name: 'Juniper',        color: '#064e3b', bg: 'rgba(6,78,59,0.1)',     cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'conifer',   sceneBg: 'linear-gradient(180deg, #0a1c18 0%, #0e2a24 50%, #123830 100%)' },
  mushroom_red:{ name: 'Toadstool',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   cost: 25,  currency: 'sunshine', rarity: 'uncommon',  weight: 0.3,   shape: 'mushroom',  sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #2a1010 50%, #381616 100%)' },

  // RARE — 125 sunshine each (Total: 6)
  kumquat:    { name: 'Kumquat',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  cost: 125, currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'topiary',   sceneBg: 'linear-gradient(180deg, #1a1a10 0%, #222216 50%, #2a2a1c 100%)' },
  meyer:      { name: 'Meyer Lemon',    color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 125, currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'citrus',    sceneBg: 'linear-gradient(180deg, #1c1c0e 0%, #242412 50%, #2e2e18 100%)' },
  bergamot:   { name: 'Bergamot',       color: '#4d7c0f', bg: 'rgba(77,124,15,0.1)',   cost: 125, currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'weeping',   sceneBg: 'linear-gradient(180deg, #0e1a0e 0%, #142214 50%, #1a2c1a 100%)' },
  cherry_blossom: { name: 'Cherry Blossom', color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', cost: 125, currency: 'sunshine', rarity: 'rare', weight: 0.12, shape: 'sakura', sceneBg: 'linear-gradient(180deg, #1c1420 0%, #221a26 50%, #28202c 100%)' },
  fig:        { name: 'Fiddle Leaf Fig', color: '#166534', bg: 'rgba(22,101,52,0.1)',   cost: 125, currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'topiary',   sceneBg: 'linear-gradient(180deg, #0a160e 0%, #0e2014 50%, #122a1a 100%)' },
  cypress:    { name: 'Bald Cypress',   color: '#166534', bg: 'rgba(22,101,52,0.1)',   cost: 125, currency: 'sunshine', rarity: 'rare',      weight: 0.12,  shape: 'cypress',   sceneBg: 'linear-gradient(180deg, #0a1610 0%, #0e2016 50%, #122a1c 100%)' },

  // TRUE RARE — 625 sunshine each (Total: 5)
  finger_lime: { name: 'Finger Lime',  color: '#166534', bg: 'rgba(22,101,52,0.1)',    cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'cypress',   sceneBg: 'linear-gradient(180deg, #0a1610 0%, #0e2016 50%, #122a1c 100%)' },
  buddha:     { name: 'Buddhas Hand',   color: '#fef08a', bg: 'rgba(254,240,138,0.1)', cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'exotic',    sceneBg: 'linear-gradient(180deg, #1c1c10 0%, #262616 50%, #30301c 100%)' },
  wisteria:   { name: 'Wisteria',       color: '#c084fc', bg: 'rgba(192,132,252,0.1)', cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'cascade',   sceneBg: 'linear-gradient(180deg, #18142a 0%, #1e1a34 50%, #24203e 100%)' },
  protea:     { name: 'King Protea',    color: '#be185d', bg: 'rgba(190,24,93,0.1)',    cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'exotic',    sceneBg: 'linear-gradient(180deg, #1c0a14 0%, #2a0e1e 50%, #381228 100%)' },
  bonsai_mini:{ name: 'Zen Bonsai',     color: '#15803d', bg: 'rgba(21,128,61,0.1)',    cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03,  shape: 'bonsai',    sceneBg: 'linear-gradient(180deg, #101610 0%, #162016 50%, #1c2a1c 100%)' },

  // PREMIUM — 3000 sunshine each (Total: 4)
  starfruit:  { name: 'Starfruit',      color: '#eab308', bg: 'rgba(234,179,8,0.1)',   cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'palm',      sceneBg: 'linear-gradient(180deg, #141a20 0%, #1a2228 50%, #202a32 100%)' },
  dragonfruit:{ name: 'Dragonfruit',    color: '#db2777', bg: 'rgba(219,39,119,0.1)',  cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'cactus',    sceneBg: 'linear-gradient(180deg, #1c1418 0%, #241820 50%, #2c1c26 100%)' },
  ghost:      { name: 'Ghost Oak',      color: '#f3f4f6', bg: 'rgba(243,244,246,0.1)', cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'ethereal',  sceneBg: 'linear-gradient(180deg, #14161a 0%, #1a1e22 50%, #20242a 100%)' },
  bonsai:     { name: 'Bonsai',         color: '#15803d', bg: 'rgba(21,128,61,0.1)',    cost: 3000,  currency: 'sunshine', rarity: 'premium',   weight: 0.01,  shape: 'bonsai',    sceneBg: 'linear-gradient(180deg, #141a14 0%, #1a221a 50%, #202a20 100%)' },

  // EXTINCT — 15000 sunshine each (Total: 3)
  elderberry: { name: 'Elderberry',     color: '#4c1d95', bg: 'rgba(76,29,149,0.1)',   cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'bramble',   sceneBg: 'linear-gradient(180deg, #14101e 0%, #1a1428 50%, #201a32 100%)' },
  prehistoric:{ name: 'Ancient Pine',   color: '#bedaf7', bg: 'rgba(190,218,247,0.1)', cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'ancient',   sceneBg: 'linear-gradient(180deg, #101820 0%, #142028 50%, #182830 100%)' },
  void:       { name: 'Void Tree',      color: '#000000', bg: 'rgba(0,0,0,0.2)',       cost: 15000, currency: 'sunshine', rarity: 'extinct',   weight: 0.003, shape: 'void',      sceneBg: 'linear-gradient(180deg, #0a0a0e 0%, #0e0e14 50%, #12121a 100%)' },

  // CHROMA — 50000 sunshine each (Total: 3)
  rainbow:    { name: 'Rainbow Willow', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.001, shape: 'crystal',   sceneBg: 'linear-gradient(180deg, #181428 0%, #1e1a32 50%, #28203e 100%)' },
  neon:       { name: 'Neon Fern',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.003, shape: 'mushroom',  sceneBg: 'linear-gradient(180deg, #0c1a14 0%, #10241a 50%, #143020 100%)' },
  gold_kumquat:{ name: 'Golden Kumquat',color: '#fbbf24', bg: 'rgba(251,191,36,0.2)',  cost: 50000, currency: 'sunshine', rarity: 'chroma',    weight: 0.001, shape: 'baobab',    sceneBg: 'linear-gradient(180deg, #1c1a0e 0%, #262414 50%, #322e1a 100%)' },

  spoiled:    { name: 'Spoiled',        color: '#71717a', bg: 'rgba(113,113,122,0.1)', cost: 0,   currency: 'sunshine', rarity: 'common',    weight: 0,     shape: 'dead',      sceneBg: 'linear-gradient(180deg, #141414 0%, #1a1a1a 50%, #202020 100%)' }
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
