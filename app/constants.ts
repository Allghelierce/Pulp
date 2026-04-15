export const TREE_TYPES: Record<string, any> = {
  // COMMON (50% cumulative weight)
  navel: { name: 'Navel Orange', color: '#b85e22', bg: 'rgba(184, 94, 34, 0.1)', cost: 10, currency: 'sunshine', rarity: 'common', weight: 0.5 },
  blood: { name: 'Blood Orange', color: '#800000', bg: 'rgba(128, 0, 0, 0.1)', cost: 10, currency: 'sunshine', rarity: 'common', weight: 0.5 },
  clementine: { name: 'Clementine', color: '#ff8c00', bg: 'rgba(255, 140, 0, 0.1)', cost: 10, currency: 'sunshine', rarity: 'common', weight: 0.5 },
  
  // UNCOMMON (30% cumulative weight)
  valencia: { name: 'Valencia Orange', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },
  tangerine: { name: 'Tangerine', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },
  lime: { name: 'Key Lime', color: '#65a30d', bg: 'rgba(101, 163, 13, 0.1)', cost: 25, currency: 'sunshine', rarity: 'uncommon', weight: 0.3 },
  
  // RARE (12% cumulative weight)
  kumquat: { name: 'Kumquat', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', cost: 40, currency: 'sunshine', rarity: 'rare', weight: 0.12 },
  meyer: { name: 'Meyer Lemon', color: '#facc15', bg: 'rgba(250, 204, 21, 0.1)', cost: 40, currency: 'sunshine', rarity: 'rare', weight: 0.12 },
  bergamot: { name: 'Bergamot', color: '#4d7c0f', bg: 'rgba(77, 124, 15, 0.1)', cost: 40, currency: 'sunshine', rarity: 'rare', weight: 0.12 },
  
  // TRUE RARE (3% cumulative weight)
  finger_lime: { name: 'Finger Lime', color: '#166534', bg: 'rgba(22, 101, 52, 0.1)', cost: 30, currency: 'gems', rarity: 'true rare', weight: 0.03 },
  buddha: { name: 'Buddhas Hand', color: '#fef08a', bg: 'rgba(254, 240, 138, 0.1)', cost: 30, currency: 'gems', rarity: 'true rare', weight: 0.03 },
  blood_lemon: { name: 'Blood Lemon', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', cost: 30, currency: 'gems', rarity: 'true rare', weight: 0.03 },
  
  // PREMIUM (1% cumulative weight)
  starfruit: { name: 'Starfruit', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', cost: 100, currency: 'gems', rarity: 'premium', weight: 0.01 },
  dragonfruit: { name: 'Dragonfruit', color: '#db2777', bg: 'rgba(219, 39, 119, 0.1)', cost: 100, currency: 'gems', rarity: 'premium', weight: 0.01 },
  ghost: { name: 'Ghost Orange', color: '#f3f4f6', bg: 'rgba(243, 244, 246, 0.1)', cost: 100, currency: 'gems', rarity: 'premium', weight: 0.01 },
  
  // CHROMA (0.3% cumulative weight)
  rainbow: { name: 'Rainbow Lime', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', cost: 500, currency: 'gems', rarity: 'chroma', weight: 0.003 },
  neon: { name: 'Neon Clementine', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', cost: 500, currency: 'gems', rarity: 'chroma', weight: 0.003 },
  gold_kumquat: { name: 'Golden Kumquat', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)', cost: 500, currency: 'gems', rarity: 'chroma', weight: 0.003 },
  
  // EXTINCT (0.1% cumulative weight)
  elderberry: { name: 'Elderberry', color: '#4c1d95', bg: 'rgba(76, 29, 149, 0.1)', cost: 2000, currency: 'gems', rarity: 'extinct', weight: 0.001 },
  prehistoric: { name: 'Pomelo', color: '#bedaf7', bg: 'rgba(190, 218, 247, 0.1)', cost: 2000, currency: 'gems', rarity: 'extinct', weight: 0.001 },
  void: { name: 'Void Lemon', color: '#000000', bg: 'rgba(0, 0, 0, 0.2)', cost: 2000, currency: 'gems', rarity: 'extinct', weight: 0.001 },
  
  spoiled: { name: 'Spoiled Grove', color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', cost: 0, currency: 'sunshine', rarity: 'common', weight: 0 }
}
