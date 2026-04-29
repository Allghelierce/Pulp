export const TREE_TYPES: Record<string, any> = {
  // ═══ FRUIT TREES — produce juice when mature ═══

  // DEFAULT — free, always available
  tangerine:     { name: 'Tangerine',      color: '#ea580c', bg: 'rgba(234,88,12,0.1)',   cost: 0,   currency: 'juice', rarity: 'common',    weight: 0,    shape: 'citrus',       category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1608 0%, #24200e 50%, #2e2814 100%)' },

  // COMMON — 5 juice each
  cherry:        { name: 'Cherry',         color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'cherry',       category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #2a1010 50%, #381616 100%)' },
  lemon:         { name: 'Lemon',          color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'lemon',        category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1c0e 0%, #242412 50%, #2e2e18 100%)' },

  // UNCOMMON — 15 juice each
  apple:         { name: 'Apple',          color: '#4a8c3a', bg: 'rgba(74,140,58,0.1)',    cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'apple',        category: 'fruit', juiceYield: 4,  paperYield: 2, sceneBg: 'linear-gradient(180deg, #0e1c0e 0%, #142814 50%, #1a341a 100%)' },
  plum:          { name: 'Plum',           color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'plum',         category: 'fruit', juiceYield: 4,  paperYield: 2, sceneBg: 'linear-gradient(180deg, #18102a 0%, #1e1634 50%, #241c3e 100%)' },
  blackberry:    { name: 'Blackberry',     color: '#3d7a2e', bg: 'rgba(61,122,46,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'blackberry',   category: 'fruit', juiceYield: 5,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #101e10 0%, #142814 50%, #1a321a 100%)' },

  // RARE — 40 juice each
  peach:         { name: 'Peach',          color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'peach',        category: 'fruit', juiceYield: 7,  paperYield: 3, sceneBg: 'linear-gradient(180deg, #1c1408 0%, #24200e 50%, #2e2814 100%)' },
  pineapple:     { name: 'Pineapple',      color: '#eab308', bg: 'rgba(234,179,8,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'pineapple',    category: 'fruit', juiceYield: 8,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1a08 0%, #24220e 50%, #2e2a14 100%)' },
  passionfruit:  { name: 'Passionfruit',   color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'passionfruit', category: 'fruit', juiceYield: 8,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1a1028 0%, #221634 50%, #2a1c40 100%)' },

  // ═══ PAPER TREES — yield lots of paper when cut ═══

  // COMMON — 5 juice each
  birch:         { name: 'Birch',          color: '#a3e635', bg: 'rgba(163,230,53,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'birch',        category: 'paper', juiceYield: 0,  paperYield: 5,  sceneBg: 'linear-gradient(180deg, #161e18 0%, #1c2820 50%, #223228 100%)' },
  bamboo:        { name: 'Bamboo',         color: '#4d7c0f', bg: 'rgba(77,124,15,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'bamboo',       category: 'paper', juiceYield: 0,  paperYield: 5,  sceneBg: 'linear-gradient(180deg, #101c10 0%, #162a16 50%, #1c381c 100%)' },

  // UNCOMMON — 15 juice each
  pine:          { name: 'Pine',           color: '#064e3b', bg: 'rgba(6,78,59,0.1)',     cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'conifer',      category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #0a1c18 0%, #0e2a24 50%, #123830 100%)' },
  oak:           { name: 'Oak',            color: '#8b6914', bg: 'rgba(139,105,20,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'oak',          category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #222e1a 100%)' },

  // RARE — 40 juice each
  cypress:       { name: 'Cypress',        color: '#0f766e', bg: 'rgba(15,118,110,0.1)', cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'cypress',      category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #0a1610 0%, #0e2016 50%, #122a1c 100%)' },
  redwood:       { name: 'Redwood',        color: '#2d6b3f', bg: 'rgba(45,107,63,0.1)',    cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'redwood',      category: 'paper', juiceYield: 0,  paperYield: 20, sceneBg: 'linear-gradient(180deg, #1c1810 0%, #242014 50%, #2c2618 100%)' },

  // LEGENDARY — 100 juice each
  sakura:        { name: 'Sakura',         color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'sakura',       category: 'paper', juiceYield: 0,  paperYield: 30, sceneBg: 'linear-gradient(180deg, #1c1420 0%, #221a26 50%, #28202c 100%)' },

  // ═══ GEM TREES — produce gems, extremely rare ═══

  // LEGENDARY — 100 juice each
  abyss:         { name: 'Abyss Maw',     color: '#000000', bg: 'rgba(0,0,0,0.2)',       cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'void',         category: 'gem',   juiceYield: 0,  paperYield: 5,  gemYield: 1, sceneBg: 'linear-gradient(180deg, #0a0a0e 0%, #0e0e14 50%, #12121a 100%)' },

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
