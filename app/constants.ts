export const TREE_TYPES: Record<string, any> = {
  // ═══ FRUIT TREES — produce juice when mature ═══

  // DEFAULT — free, always available
  tangerine:     { name: 'Tangerine',      color: '#d97706', bg: 'rgba(234,88,12,0.1)',   cost: 0,   currency: 'juice', rarity: 'common',    weight: 0,    shape: 'citrus',       category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1608 0%, #24200e 50%, #2e2814 100%)' },

  // COMMON — 5 juice each
  lemon:         { name: 'Lemon',          color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'lemon',        category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1c0e 0%, #242412 50%, #2e2e18 100%)' },

  // UNCOMMON — 15 juice each
  plum:          { name: 'Plum',           color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'plum',         category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #18102a 0%, #1e1634 50%, #241c3e 100%)' },

  // RARE — 40 juice each
  pineapple:     { name: 'Pineapple',      color: '#eab308', bg: 'rgba(234,179,8,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'pineapple',    category: 'fruit', juiceYield: 5,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1a08 0%, #24220e 50%, #2e2a14 100%)' },
  passionfruit:  { name: 'Passionfruit',   color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'passionfruit', category: 'fruit', juiceYield: 8,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1a1028 0%, #221634 50%, #2a1c40 100%)' },

  // ═══ PAPER TREES — yield lots of paper when cut ═══

  // COMMON — 5 juice each
  birch:         { name: 'Birch',          color: '#a3e635', bg: 'rgba(163,230,53,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'birch',        category: 'paper', juiceYield: 0,  paperYield: 5,  sceneBg: 'linear-gradient(180deg, #161e18 0%, #1c2820 50%, #223228 100%)' },
  bamboo:        { name: 'Bamboo',         color: '#4d7c0f', bg: 'rgba(77,124,15,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'bamboo',       category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #101c10 0%, #162a16 50%, #1c381c 100%)' },

  // UNCOMMON — 15 juice each
  pine:          { name: 'Pine',           color: '#064e3b', bg: 'rgba(6,78,59,0.1)',     cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'conifer',      category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0a1c18 0%, #0e2a24 50%, #123830 100%)' },
  oak:           { name: 'Oak',            color: '#8b6914', bg: 'rgba(139,105,20,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'oak',          category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #222e1a 100%)' },

  // RARE — 40 juice each
  cypress:       { name: 'Cypress',        color: '#0f766e', bg: 'rgba(15,118,110,0.1)', cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'cypress',      category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #0a1610 0%, #0e2016 50%, #122a1c 100%)' },


  // ═══ TRUE RARE — 65 juice each ═══

  // FRUIT
  pomegranate:   { name: 'Pomegranate',   color: '#b33a3a', bg: 'rgba(179,58,58,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'pomegranate',  category: 'fruit', juiceYield: 8,  paperYield: 2, sceneBg: 'linear-gradient(180deg, #1c0e0e 0%, #281414 50%, #341a1a 100%)' },
  // SACRED — 100 juice each
  sakura:        { name: 'Cherry Blossom',         color: '#e8a0c0', bg: 'rgba(232,160,192,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'sakura',       category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #05050f 0%, #0a0a1a 50%, #0f0f25 100%)' },

  // ═══ GEM TREES — produce gems, extremely rare ═══

  // SACRED — 100 juice each
  abyss:         { name: 'Abyss Maw',     color: '#000000', bg: 'rgba(0,0,0,0.2)',       cost: 100, currency: 'juice', rarity: 'sacred', weight: 0.1,  shape: 'void',         category: 'gem',   juiceYield: 0,  paperYield: 5,  gemYield: 1, sceneBg: 'linear-gradient(180deg, #05050f 0%, #0a0a1a 50%, #0f0f25 100%)' },

  // ═══ UNIQUE TREES ═══
  mangrove:      { name: 'Mangrove',       color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'mangrove',     category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #0a1814 0%, #0e241e 50%, #123028 100%)' },
  winterveil:    { name: 'Winterveil',     color: '#8aacca', bg: 'rgba(138,172,202,0.1)', cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'winterveil',   category: 'paper', juiceYield: 0,  paperYield: 20, sceneBg: 'linear-gradient(180deg, #0a1018 0%, #101820 50%, #162028 100%)' },

  // ═══ NEW COMMON — 5 juice each ═══
  coconut:       { name: 'Coconut',        color: '#27ae60', bg: 'rgba(39,174,96,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'palm',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #0e1c14 0%, #142818 50%, #1a341e 100%)' },

  // ═══ NEW UNCOMMON — 15 juice each ═══
  bonsai:        { name: 'Bonsai',         color: '#8d6e63', bg: 'rgba(141,110,99,0.1)',  cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'bonsai',       category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #1a1614 0%, #221e1a 50%, #2a2620 100%)' },

  // ═══ NEW RARE — 40 juice each ═══
  baobab:        { name: 'Baobab',         color: '#795548', bg: 'rgba(121,85,72,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'baobab',       category: 'paper', juiceYield: 0,  paperYield: 20, sceneBg: 'linear-gradient(180deg, #1a1410 0%, #221c16 50%, #2a241c 100%)' },

  // ═══ NEW TRUE RARE — 65 juice each ═══
  coral:         { name: 'Coral',          color: '#f06292', bg: 'rgba(240,98,146,0.1)',  cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'coral',        category: 'fruit', juiceYield: 11, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #1c0e14 0%, #24141c 50%, #2e1a24 100%)' },

  // ═══ NEW SACRED — 100 juice each ═══
  starweaver:    { name: 'Starweaver',     color: '#1a237e', bg: 'rgba(26,35,126,0.1)',   cost: 100, currency: 'juice', rarity: 'sacred', weight: 0.1,  shape: 'starweaver',   category: 'gem',   juiceYield: 0,  paperYield: 8,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #04040e 0%, #08081a 50%, #0c0c26 100%)' },
  leviathan:     { name: 'Leviathan',      color: '#006064', bg: 'rgba(0,96,100,0.1)',    cost: 100, currency: 'juice', rarity: 'true rare', weight: 0.1,  shape: 'leviathan',    category: 'gem',   juiceYield: 0,  paperYield: 5,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #04101a 0%, #081a28 50%, #0c2436 100%)' },
  prismatic:     { name: 'Prismatic',      color: '#ffffff', bg: 'rgba(255,255,255,0.08)',cost: 100, currency: 'juice', rarity: 'sacred', weight: 0.1,  shape: 'prismatic',    category: 'gem',   juiceYield: 0,  paperYield: 4,  gemYield: 3, sceneBg: 'linear-gradient(180deg, #0e0e14 0%, #14141e 50%, #1a1a28 100%)' },



  sunflower:     { name: 'Sunflower',      color: '#fdd835', bg: 'rgba(253,216,53,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'sunflower',    category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c1a0c 0%, #242210 50%, #2e2a14 100%)' },





  papaya:        { name: 'Papaya',         color: '#d49a52', bg: 'rgba(212,154,82,0.1)',  cost: 65,  currency: 'juice', rarity: 'true rare', weight: 0.15, shape: 'papaya',       category: 'fruit', juiceYield: 12, paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c160a 0%, #24200e 50%, #2e2a12 100%)' },








  grape:         { name: 'Grape',          color: '#6a1b9a', bg: 'rgba(106,27,154,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'grape',        category: 'fruit', juiceYield: 3,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #14081c 0%, #1c1024 50%, #24182c 100%)' },
  pear:          { name: 'Pear',           color: '#c0ca33', bg: 'rgba(192,202,51,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'pear',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #181c0e 0%, #202612 50%, #283016 100%)' },
  melon:         { name: 'Melon',          color: '#558b2f', bg: 'rgba(85,139,47,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'melon',        category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #0e1c10 0%, #142816 50%, #1a341c 100%)' },




  // ═══ WAVE 3 — COMMON ═══
  mushroom:      { name: 'Mushroom',       color: '#d84315', bg: 'rgba(216,67,21,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'mushroom',     category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c120c 0%, #241a12 50%, #2e2218 100%)' },
  cactus:        { name: 'Cactus',         color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'cactus',       category: 'fruit', juiceYield: 4,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c1a0e 0%, #24220e 50%, #302a10 100%)' },
  ivy:           { name: 'Ivy',            color: '#1b5e20', bg: 'rgba(27,94,32,0.1)',    cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'ivy',          category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0c1a0e 0%, #102612 50%, #143218 100%)' },

  // ═══ WAVE 3 — UNCOMMON ═══

  // ═══ WAVE 3 — RARE ═══

  // ═══ WAVE 3 — TRUE RARE ═══
  whirlpool:     { name: 'Whirlpool',      color: '#2a7a84', bg: 'rgba(42,122,132,0.1)',   cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'whirlpool',    category: 'fruit', juiceYield: 12, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #061418 0%, #0c1e24 50%, #122830 100%)' },
  bloom:         { name: 'Everbloom',      color: '#c43a62', bg: 'rgba(196,58,98,0.1)',   cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'bloom',        category: 'fruit', juiceYield: 13, paperYield: 4,  sceneBg: 'linear-gradient(180deg, #1c0810 0%, #241018 50%, #2e1820 100%)' },

  // ═══ WAVE 4 — COMMON ═══

  cattail:       { name: 'Cattail',        color: '#6d4c41', bg: 'rgba(109,76,65,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'cattail',      category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #141210 0%, #1c1a16 50%, #24221c 100%)' },

  // ═══ WAVE 4 — UNCOMMON ═══
  sage:          { name: 'Sage',           color: '#78909c', bg: 'rgba(120,144,156,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'sage',         category: 'fruit', juiceYield: 4,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #101416 0%, #161c20 50%, #1c242a 100%)' },
  juniper:       { name: 'Juniper',        color: '#37474f', bg: 'rgba(55,71,79,0.1)',    cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'juniper',      category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #0c1014 0%, #12161c 50%, #181c24 100%)' },

  // ═══ WAVE 4 — RARE ═══
  cedarwood:     { name: 'Cedar',          color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'cedarwood',    category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #0c1a10 0%, #102614 50%, #143218 100%)' },

  // ═══ WAVE 4 — TRUE RARE ═══
  lotus:         { name: 'Lotus',          color: '#ec407a', bg: 'rgba(236,64,122,0.1)',  cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'lotus',        category: 'fruit', juiceYield: 12, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #1c0c14 0%, #24121c 50%, #2e1824 100%)' },
  agave:         { name: 'Agave',          color: '#558b2f', bg: 'rgba(85,139,47,0.1)',   cost: 65,  currency: 'juice', rarity: 'true rare',      weight: 0.15, shape: 'agave',        category: 'paper', juiceYield: 0,  paperYield: 22, sceneBg: 'linear-gradient(180deg, #101c0e 0%, #162812 50%, #1c3418 100%)' },

  // ═══ WAVE 4 — SACRED ═══
  lychee:        { name: 'Lychee',         color: '#d32f2f', bg: 'rgba(211,47,47,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'lychee',       category: 'fruit', juiceYield: 8,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #241010 50%, #2e1616 100%)' },

  // ═══ SPECIAL ═══
  spoiled:       { name: 'Spoiled',        color: '#71717a', bg: 'rgba(113,113,122,0.1)', cost: 0,   currency: 'juice', rarity: 'common',    weight: 0,    shape: 'dead',         category: 'none',  juiceYield: 0,  paperYield: 0, sceneBg: 'linear-gradient(180deg, #141414 0%, #1a1a1a 50%, #202020 100%)' }
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
  { name: "quillmaster", xp: 22400, juice: 4800 },
  { name: "midnightscribe", xp: 15200, juice: 3200 },
  { name: "inkdragon", xp: 11800, juice: 2400 },
  { name: "papertiger", xp: 8600, juice: 1700 },
  { name: "notanova", xp: 6300, juice: 1100 },
  { name: "draftpunk", xp: 4100, juice: 680 },
  { name: "blankpage_hero", xp: 2700, juice: 420 },
  { name: "lofi_writer", xp: 1500, juice: 210 },
  { name: "penpal99", xp: 800, juice: 95 },
  { name: "newleaf", xp: 200, juice: 30 },
]
