export const TREE_TYPES: Record<string, any> = {
  // COMMON — 5 sunshine each
  navel: { name: 'Navel Orange', color: '#b85e22', bg: 'rgba(184, 94, 34, 0.1)', cost: 5, currency: 'sunshine', rarity: 'common', weight: 0.5 },
  blood: { name: 'Blood Orange', color: '#800000', bg: 'rgba(128, 0, 0, 0.1)', cost: 5, currency: 'sunshine', rarity: 'common', weight: 0.5 },
  clementine: { name: 'Clementine', color: '#ff8c00', bg: 'rgba(255, 140, 0, 0.1)', cost: 5, currency: 'sunshine', rarity: 'common', weight: 0.5 },

  // UNCOMMON — 25 sunshine each
  valencia: { name: 'Valencia Orange', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },
  tangerine: { name: 'Tangerine', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },
  lime: { name: 'Key Lime', color: '#65a30d', bg: 'rgba(101, 163, 13, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },

  // RARE — 125 sunshine each
  kumquat: { name: 'Kumquat', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', cost: 125, currency: 'sunshine', rarity: 'rare', weight: 0.12 },
  meyer: { name: 'Meyer Lemon', color: '#facc15', bg: 'rgba(250, 204, 21, 0.1)', cost: 125, currency: 'sunshine', rarity: 'rare', weight: 0.12 },
  bergamot: { name: 'Bergamot', color: '#4d7c0f', bg: 'rgba(77, 124, 15, 0.1)', cost: 125, currency: 'sunshine', rarity: 'rare', weight: 0.12 },

  // TRUE RARE — 625 sunshine each
  finger_lime: { name: 'Finger Lime', color: '#166534', bg: 'rgba(22, 101, 52, 0.1)', cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03 },
  buddha: { name: 'Buddhas Hand', color: '#fef08a', bg: 'rgba(254, 240, 138, 0.1)', cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03 },
  blood_lemon: { name: 'Blood Lemon', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', cost: 625, currency: 'sunshine', rarity: 'true rare', weight: 0.03 },

  // PREMIUM — 15 gems each
  starfruit: { name: 'Starfruit', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', cost: 15, currency: 'gems', rarity: 'premium', weight: 0.01 },
  dragonfruit: { name: 'Dragonfruit', color: '#db2777', bg: 'rgba(219, 39, 119, 0.1)', cost: 15, currency: 'gems', rarity: 'premium', weight: 0.01 },
  ghost: { name: 'Ghost Orange', color: '#f3f4f6', bg: 'rgba(243, 244, 246, 0.1)', cost: 15, currency: 'gems', rarity: 'premium', weight: 0.01 },

  // CHROMA — 40 gems each
  rainbow: { name: 'Rainbow Lime', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', cost: 40, currency: 'gems', rarity: 'chroma', weight: 0.003 },
  neon: { name: 'Neon Clementine', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', cost: 40, currency: 'gems', rarity: 'chroma', weight: 0.003 },
  gold_kumquat: { name: 'Golden Kumquat', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)', cost: 40, currency: 'gems', rarity: 'chroma', weight: 0.003 },

  // EXTINCT — 100 gems each
  elderberry: { name: 'Elderberry', color: '#4c1d95', bg: 'rgba(76, 29, 149, 0.1)', cost: 100, currency: 'gems', rarity: 'extinct', weight: 0.001 },
  prehistoric: { name: 'Pomelo', color: '#bedaf7', bg: 'rgba(190, 218, 247, 0.1)', cost: 100, currency: 'gems', rarity: 'extinct', weight: 0.001 },
  void: { name: 'Void Lemon', color: '#000000', bg: 'rgba(0, 0, 0, 0.2)', cost: 100, currency: 'gems', rarity: 'extinct', weight: 0.001 },

  spoiled: { name: 'Spoiled Grove', color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', cost: 0, currency: 'sunshine', rarity: 'common', weight: 0 }
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
