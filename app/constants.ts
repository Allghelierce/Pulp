export const TREE_TYPES: Record<string, any> = {
  // ═══ FRUIT TREES — produce juice when mature ═══

  // DEFAULT — free, always available
  tangerine:     { name: 'Tangerine',      color: '#d97706', bg: 'rgba(234,88,12,0.1)',   cost: 0,   currency: 'juice', rarity: 'common',    weight: 0,    shape: 'citrus',       category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1608 0%, #24200e 50%, #2e2814 100%)' },

  // COMMON — 5 juice each
  lemon:         { name: 'Lemon',          color: '#facc15', bg: 'rgba(250,204,21,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'lemon',        category: 'fruit', juiceYield: 2,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #1c1c0e 0%, #242412 50%, #2e2e18 100%)' },

  // UNCOMMON — 15 juice each
  apple:         { name: 'Apple',          color: '#4a8c3a', bg: 'rgba(74,140,58,0.1)',    cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'apple',        category: 'fruit', juiceYield: 4,  paperYield: 2, sceneBg: 'linear-gradient(180deg, #0e1c0e 0%, #142814 50%, #1a341a 100%)' },
  plum:          { name: 'Plum',           color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'plum',         category: 'fruit', juiceYield: 4,  paperYield: 2, sceneBg: 'linear-gradient(180deg, #18102a 0%, #1e1634 50%, #241c3e 100%)' },
  blackberry:    { name: 'Blackberry',     color: '#3d7a2e', bg: 'rgba(61,122,46,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'blackberry',   category: 'fruit', juiceYield: 5,  paperYield: 1, sceneBg: 'linear-gradient(180deg, #101e10 0%, #142814 50%, #1a321a 100%)' },

  // RARE — 40 juice each
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


  // ═══ EPIC — 65 juice each ═══

  // FRUIT
  pomegranate:   { name: 'Pomegranate',   color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'pomegranate',  category: 'fruit', juiceYield: 10, paperYield: 4, sceneBg: 'linear-gradient(180deg, #1c0e0e 0%, #281414 50%, #341a1a 100%)' },
  fig:           { name: 'Fig',           color: '#6d28d9', bg: 'rgba(109,40,217,0.1)',  cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'fig',          category: 'fruit', juiceYield: 10, paperYield: 4, sceneBg: 'linear-gradient(180deg, #140e20 0%, #1e1430 50%, #281a40 100%)' },
  // LEGENDARY — 100 juice each
  sakura:        { name: 'Cherry Blossom',         color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'sakura',       category: 'paper', juiceYield: 0,  paperYield: 30, sceneBg: 'linear-gradient(180deg, #05050f 0%, #0a0a1a 50%, #0f0f25 100%)' },

  // ═══ GEM TREES — produce gems, extremely rare ═══

  // LEGENDARY — 100 juice each
  abyss:         { name: 'Abyss Maw',     color: '#000000', bg: 'rgba(0,0,0,0.2)',       cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'void',         category: 'gem',   juiceYield: 0,  paperYield: 5,  gemYield: 1, sceneBg: 'linear-gradient(180deg, #05050f 0%, #0a0a1a 50%, #0f0f25 100%)' },

  // ═══ UNIQUE TREES ═══
  mangrove:      { name: 'Mangrove',       color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'mangrove',     category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #0a1814 0%, #0e241e 50%, #123028 100%)' },
  winterveil:    { name: 'Winterveil',     color: '#8aacca', bg: 'rgba(138,172,202,0.1)', cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'winterveil',   category: 'paper', juiceYield: 0,  paperYield: 20, sceneBg: 'linear-gradient(180deg, #0a1018 0%, #101820 50%, #162028 100%)' },

  // ═══ NEW COMMON — 5 juice each ═══
  coconut:       { name: 'Coconut',        color: '#27ae60', bg: 'rgba(39,174,96,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'palm',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #0e1c14 0%, #142818 50%, #1a341e 100%)' },

  // ═══ NEW UNCOMMON — 15 juice each ═══
  bonsai:        { name: 'Bonsai',         color: '#8d6e63', bg: 'rgba(141,110,99,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'bonsai',       category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #1a1614 0%, #221e1a 50%, #2a2620 100%)' },
  aspen:         { name: 'Aspen',          color: '#b2dfdb', bg: 'rgba(178,223,219,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'aspen',        category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #101a1a 0%, #162424 50%, #1c2e2e 100%)' },

  // ═══ NEW RARE — 40 juice each ═══
  baobab:        { name: 'Baobab',         color: '#795548', bg: 'rgba(121,85,72,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'baobab',       category: 'paper', juiceYield: 0,  paperYield: 20, sceneBg: 'linear-gradient(180deg, #1a1410 0%, #221c16 50%, #2a241c 100%)' },
  banyan:        { name: 'Banyan',         color: '#33691e', bg: 'rgba(51,105,30,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'banyan',       category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #0e1a0c 0%, #142612 50%, #1a3218 100%)' },

  // ═══ NEW EPIC — 65 juice each ═══
  coral:         { name: 'Coral',          color: '#f06292', bg: 'rgba(240,98,146,0.1)',  cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'coral',        category: 'fruit', juiceYield: 11, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #1c0e14 0%, #24141c 50%, #2e1a24 100%)' },

  // ═══ NEW LEGENDARY — 100 juice each ═══
  starweaver:    { name: 'Starweaver',     color: '#1a237e', bg: 'rgba(26,35,126,0.1)',   cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'starweaver',   category: 'gem',   juiceYield: 0,  paperYield: 8,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #04040e 0%, #08081a 50%, #0c0c26 100%)' },
  leviathan:     { name: 'Leviathan',      color: '#006064', bg: 'rgba(0,96,100,0.1)',    cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'leviathan',    category: 'gem',   juiceYield: 0,  paperYield: 5,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #04101a 0%, #081a28 50%, #0c2436 100%)' },
  prismatic:     { name: 'Prismatic',      color: '#ffffff', bg: 'rgba(255,255,255,0.08)',cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'prismatic',    category: 'gem',   juiceYield: 0,  paperYield: 4,  gemYield: 3, sceneBg: 'linear-gradient(180deg, #0e0e14 0%, #14141e 50%, #1a1a28 100%)' },



  sunflower:     { name: 'Sunflower',      color: '#fdd835', bg: 'rgba(253,216,53,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'sunflower',    category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c1a0c 0%, #242210 50%, #2e2a14 100%)' },





  papaya:        { name: 'Papaya',         color: '#ffb74d', bg: 'rgba(255,183,77,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'papaya',       category: 'fruit', juiceYield: 5,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c160a 0%, #24200e 50%, #2e2a12 100%)' },







  snowbell:      { name: 'Snowbell',       color: '#e0e0e0', bg: 'rgba(224,224,224,0.1)', cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'snowbell',     category: 'paper', juiceYield: 0,  paperYield: 16, sceneBg: 'linear-gradient(180deg, #12141a 0%, #1a1c24 50%, #22242e 100%)' },

  grape:         { name: 'Grape',          color: '#6a1b9a', bg: 'rgba(106,27,154,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'grape',        category: 'fruit', juiceYield: 3,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #14081c 0%, #1c1024 50%, #24182c 100%)' },
  pear:          { name: 'Pear',           color: '#c0ca33', bg: 'rgba(192,202,51,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'pear',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #181c0e 0%, #202612 50%, #283016 100%)' },
  melon:         { name: 'Melon',          color: '#558b2f', bg: 'rgba(85,139,47,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'melon',        category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #0e1c10 0%, #142816 50%, #1a341c 100%)' },

  gooseberry:    { name: 'Gooseberry',     color: '#9ccc65', bg: 'rgba(156,204,101,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'gooseberry',   category: 'fruit', juiceYield: 4,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #141c0e 0%, #1c2614 50%, #24301a 100%)' },

  tamarind:      { name: 'Tamarind',       color: '#5d4037', bg: 'rgba(93,64,55,0.1)',    cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'tamarind',     category: 'fruit', juiceYield: 8,  paperYield: 3,  sceneBg: 'linear-gradient(180deg, #18120e 0%, #201a14 50%, #28221a 100%)' },


  // ═══ WAVE 3 — COMMON ═══
  mushroom:      { name: 'Mushroom',       color: '#d84315', bg: 'rgba(216,67,21,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'mushroom',     category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c120c 0%, #241a12 50%, #2e2218 100%)' },
  cactus:        { name: 'Cactus',         color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'cactus',       category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c1a0e 0%, #24220e 50%, #302a10 100%)' },
  ivy:           { name: 'Ivy',            color: '#1b5e20', bg: 'rgba(27,94,32,0.1)',    cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'ivy',          category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0c1a0e 0%, #102612 50%, #143218 100%)' },

  // ═══ WAVE 3 — UNCOMMON ═══

  // ═══ WAVE 3 — RARE ═══

  // ═══ WAVE 3 — EPIC ═══
  whirlpool:     { name: 'Whirlpool',      color: '#0097a7', bg: 'rgba(0,151,167,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'whirlpool',    category: 'fruit', juiceYield: 12, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #061418 0%, #0c1e24 50%, #122830 100%)' },
  bloom:         { name: 'Everbloom',      color: '#e91e63', bg: 'rgba(233,30,99,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'bloom',        category: 'fruit', juiceYield: 13, paperYield: 4,  sceneBg: 'linear-gradient(180deg, #1c0810 0%, #241018 50%, #2e1820 100%)' },

  // ═══ WAVE 4 — COMMON ═══
  willow:        { name: 'Willow',         color: '#66bb6a', bg: 'rgba(102,187,106,0.1)', cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'willow',       category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0e1c12 0%, #142818 50%, #1a341e 100%)' },
  fern:          { name: 'Fern',           color: '#388e3c', bg: 'rgba(56,142,60,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'fern',         category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0c1a0e 0%, #102812 50%, #143618 100%)' },
  tulip:         { name: 'Tulip',          color: '#e53935', bg: 'rgba(229,57,53,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'tulip',        category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c0c0c 0%, #281212 50%, #341818 100%)' },
  daisy:         { name: 'Daisy',          color: '#fdd835', bg: 'rgba(253,216,53,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'daisy',        category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c1a0c 0%, #242210 50%, #2e2a14 100%)' },
  mint:          { name: 'Mint',           color: '#26a69a', bg: 'rgba(38,166,154,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'mint',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #0c1a18 0%, #102420 50%, #142e28 100%)' },
  clover:        { name: 'Clover',         color: '#43a047', bg: 'rgba(67,160,71,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'clover',       category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #0e1c10 0%, #142814 50%, #1a341a 100%)' },
  cattail:       { name: 'Cattail',        color: '#6d4c41', bg: 'rgba(109,76,65,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'cattail',      category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #141210 0%, #1c1a16 50%, #24221c 100%)' },
  mossball:      { name: 'Moss',           color: '#558b2f', bg: 'rgba(85,139,47,0.1)',   cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'mossball',     category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #101c0e 0%, #142812 50%, #1a3418 100%)' },
  aloe:          { name: 'Aloe',           color: '#7cb342', bg: 'rgba(124,179,66,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'aloe',         category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #121c0e 0%, #182812 50%, #1e3418 100%)' },
  lavender:      { name: 'Lavender',       color: '#9575cd', bg: 'rgba(149,117,205,0.1)', cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'lavender',     category: 'fruit', juiceYield: 2,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #14101c 0%, #1c1624 50%, #241c2e 100%)' },
  thistle:       { name: 'Thistle',        color: '#ab47bc', bg: 'rgba(171,71,188,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'thistle',      category: 'paper', juiceYield: 0,  paperYield: 4,  sceneBg: 'linear-gradient(180deg, #180e1c 0%, #201424 50%, #281a2e 100%)' },
  hazel:         { name: 'Hazel',          color: '#8d6e63', bg: 'rgba(141,110,99,0.1)',  cost: 5,   currency: 'juice', rarity: 'common',    weight: 0.5,  shape: 'hazel',        category: 'paper', juiceYield: 0,  paperYield: 5,  sceneBg: 'linear-gradient(180deg, #181410 0%, #201c16 50%, #28241c 100%)' },

  // ═══ WAVE 4 — UNCOMMON ═══
  maple:         { name: 'Maple',          color: '#e65100', bg: 'rgba(230,81,0,0.1)',    cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'maple',        category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #1c120a 0%, #241a10 50%, #2e2216 100%)' },
  olive:         { name: 'Olive',          color: '#827717', bg: 'rgba(130,119,23,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'olive',        category: 'fruit', juiceYield: 4,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #161608 0%, #1e1e0e 50%, #262614 100%)' },
  rosebush:      { name: 'Rose',           color: '#c62828', bg: 'rgba(198,40,40,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'rosebush',     category: 'fruit', juiceYield: 4,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c0c0c 0%, #281212 50%, #341818 100%)' },
  poplar:        { name: 'Poplar',         color: '#aed581', bg: 'rgba(174,213,129,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'poplar',       category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #141c10 0%, #1c2616 50%, #24301c 100%)' },
  ginkgo:        { name: 'Ginkgo',         color: '#ffc107', bg: 'rgba(255,193,7,0.1)',   cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'ginkgo',       category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #1c1a0a 0%, #242210 50%, #2e2a16 100%)' },
  peach:         { name: 'Peach',          color: '#ff8a80', bg: 'rgba(255,138,128,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'peach',        category: 'fruit', juiceYield: 5,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c1010 0%, #241616 50%, #2e1c1c 100%)' },
  persimmon:     { name: 'Persimmon',      color: '#e65100', bg: 'rgba(230,81,0,0.1)',    cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'persimmon',    category: 'fruit', juiceYield: 5,  paperYield: 1,  sceneBg: 'linear-gradient(180deg, #1c140a 0%, #241c10 50%, #2e2416 100%)' },
  sage:          { name: 'Sage',           color: '#78909c', bg: 'rgba(120,144,156,0.1)', cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'sage',         category: 'fruit', juiceYield: 4,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #101416 0%, #161c20 50%, #1c242a 100%)' },
  elm:           { name: 'Elm',            color: '#689f38', bg: 'rgba(104,159,56,0.1)',  cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'elm',          category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #101c0e 0%, #162812 50%, #1c3418 100%)' },
  juniper:       { name: 'Juniper',        color: '#37474f', bg: 'rgba(55,71,79,0.1)',    cost: 15,  currency: 'juice', rarity: 'uncommon',  weight: 0.3,  shape: 'juniper',      category: 'paper', juiceYield: 0,  paperYield: 10, sceneBg: 'linear-gradient(180deg, #0c1014 0%, #12161c 50%, #181c24 100%)' },

  // ═══ WAVE 4 — RARE ═══
  wisteria:      { name: 'Wisteria',       color: '#7e57c2', bg: 'rgba(126,87,194,0.1)',  cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'wisteria',     category: 'fruit', juiceYield: 8,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #140e1c 0%, #1c1428 50%, #241a34 100%)' },
  cedarwood:     { name: 'Cedar',          color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'cedarwood',    category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #0c1a10 0%, #102614 50%, #143218 100%)' },
  acacia:        { name: 'Acacia',         color: '#a1887f', bg: 'rgba(161,136,127,0.1)', cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'acacia',       category: 'paper', juiceYield: 0,  paperYield: 18, sceneBg: 'linear-gradient(180deg, #1a1610 0%, #221e16 50%, #2a261c 100%)' },
  magnolia:      { name: 'Magnolia',       color: '#f8bbd0', bg: 'rgba(248,187,208,0.1)', cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'magnolia',     category: 'fruit', juiceYield: 8,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c1418 0%, #241c22 50%, #2e242c 100%)' },
  chestnut:      { name: 'Chestnut',       color: '#5d4037', bg: 'rgba(93,64,55,0.1)',    cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'chestnut',     category: 'fruit', juiceYield: 7,  paperYield: 3,  sceneBg: 'linear-gradient(180deg, #18120e 0%, #201a14 50%, #28221a 100%)' },
  avocado:       { name: 'Avocado',        color: '#33691e', bg: 'rgba(51,105,30,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'avocado',      category: 'fruit', juiceYield: 8,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #0e1a0c 0%, #142610 50%, #1a3216 100%)' },
  redwood:       { name: 'Redwood',        color: '#bf360c', bg: 'rgba(191,54,12,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'redwood',      category: 'paper', juiceYield: 0,  paperYield: 22, sceneBg: 'linear-gradient(180deg, #1c100a 0%, #241810 50%, #2e2016 100%)' },
  hibiscus:      { name: 'Hibiscus',       color: '#d81b60', bg: 'rgba(216,27,96,0.1)',   cost: 40,  currency: 'juice', rarity: 'rare',      weight: 0.2,  shape: 'hibiscus',     category: 'fruit', juiceYield: 8,  paperYield: 2,  sceneBg: 'linear-gradient(180deg, #1c0a12 0%, #241018 50%, #2e1620 100%)' },

  // ═══ WAVE 4 — EPIC ═══
  lotus:         { name: 'Lotus',          color: '#ec407a', bg: 'rgba(236,64,122,0.1)',  cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'lotus',        category: 'fruit', juiceYield: 12, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #1c0c14 0%, #24121c 50%, #2e1824 100%)' },
  dragonfruit:   { name: 'Dragonfruit',    color: '#e91e63', bg: 'rgba(233,30,99,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'dragonfruit',  category: 'fruit', juiceYield: 11, paperYield: 4,  sceneBg: 'linear-gradient(180deg, #1c080e 0%, #241014 50%, #2e181c 100%)' },
  orchid:        { name: 'Orchid',         color: '#ba68c8', bg: 'rgba(186,104,200,0.1)', cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'orchid',       category: 'fruit', juiceYield: 11, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #16101c 0%, #1e1624 50%, #261c2e 100%)' },
  venus:         { name: 'Venus Trap',     color: '#4caf50', bg: 'rgba(76,175,80,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'venus',        category: 'fruit', juiceYield: 12, paperYield: 3,  sceneBg: 'linear-gradient(180deg, #0e1c0e 0%, #142814 50%, #1a341a 100%)' },
  agave:         { name: 'Agave',          color: '#558b2f', bg: 'rgba(85,139,47,0.1)',   cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'agave',        category: 'paper', juiceYield: 0,  paperYield: 22, sceneBg: 'linear-gradient(180deg, #101c0e 0%, #162812 50%, #1c3418 100%)' },
  yew:           { name: 'Yew',            color: '#1b5e20', bg: 'rgba(27,94,32,0.1)',    cost: 65,  currency: 'juice', rarity: 'epic',      weight: 0.15, shape: 'yew',          category: 'paper', juiceYield: 0,  paperYield: 24, sceneBg: 'linear-gradient(180deg, #0a1a0e 0%, #0e2612 50%, #123218 100%)' },

  // ═══ WAVE 4 — LEGENDARY ═══
  jasmine:       { name: 'Jasmine',        color: '#fff9c4', bg: 'rgba(255,249,196,0.1)', cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'jasmine',      category: 'gem',   juiceYield: 0,  paperYield: 6,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #141410 0%, #1c1c16 50%, #24241c 100%)' },
  lychee:        { name: 'Lychee',         color: '#d32f2f', bg: 'rgba(211,47,47,0.1)',   cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'lychee',       category: 'fruit', juiceYield: 18, paperYield: 4,  sceneBg: 'linear-gradient(180deg, #1c0a0a 0%, #241010 50%, #2e1616 100%)' },
  kiwi:          { name: 'Kiwi',           color: '#689f38', bg: 'rgba(104,159,56,0.1)',  cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'kiwi',         category: 'fruit', juiceYield: 16, paperYield: 5,  sceneBg: 'linear-gradient(180deg, #101c0e 0%, #162812 50%, #1c3418 100%)' },
  walnut:        { name: 'Walnut',         color: '#4e342e', bg: 'rgba(78,52,46,0.1)',    cost: 100, currency: 'juice', rarity: 'legendary', weight: 0.1,  shape: 'walnut',       category: 'gem',   juiceYield: 0,  paperYield: 8,  gemYield: 2, sceneBg: 'linear-gradient(180deg, #140e0c 0%, #1c1612 50%, #241e18 100%)' },

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
