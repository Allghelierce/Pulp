const TREE_TYPES = {
  navel: { name: 'Navel Orange', color: '#b85e22', rarity: 'common' },
  blood: { name: 'Blood Orange', color: '#800000', rarity: 'common' },
  clementine: { name: 'Clementine', color: '#ff8c00', rarity: 'common' },
  daisy: { name: 'Daisy', color: '#fbbf24', rarity: 'common' },
  fern: { name: 'Fern', color: '#16a34a', rarity: 'common' },
  tangerine: { name: 'Tangerine', color: '#ea580c', rarity: 'uncommon' },
  lime: { name: 'Key Lime', color: '#65a30d', rarity: 'uncommon' },
  lavender: { name: 'Lavender', color: '#a78bfa', rarity: 'uncommon' },
  birch: { name: 'Birch', color: '#a3e635', rarity: 'uncommon' },
  kumquat: { name: 'Kumquat', color: '#fbbf24', rarity: 'rare' },
  meyer: { name: 'Meyer Lemon', color: '#facc15', rarity: 'rare' },
  bergamot: { name: 'Bergamot', color: '#4d7c0f', rarity: 'rare' },
  cherry_blossom: { name: 'Cherry Blossom', color: '#f9a8d4', rarity: 'rare' },
  finger_lime: { name: 'Finger Lime', color: '#166534', rarity: 'true rare' },
  buddha: { name: 'Buddhas Hand', color: '#fef08a', rarity: 'true rare' },
  wisteria: { name: 'Wisteria', color: '#c084fc', rarity: 'true rare' },
  starfruit: { name: 'Starfruit', color: '#eab308', rarity: 'premium' },
  dragonfruit: { name: 'Dragonfruit', color: '#db2777', rarity: 'premium' },
  ghost: { name: 'Ghost Oak', color: '#f3f4f6', rarity: 'premium' },
  bonsai: { name: 'Bonsai', color: '#15803d', rarity: 'premium' },
  rainbow: { name: 'Rainbow Willow', color: '#c084fc', rarity: 'chroma' },
  neon: { name: 'Neon Fern', color: '#22c55e', rarity: 'chroma' },
  gold_kumquat: { name: 'Golden Kumquat', color: '#fbbf24', rarity: 'chroma' },
  elderberry: { name: 'Elderberry', color: '#4c1d95', rarity: 'extinct' },
  prehistoric: { name: 'Ancient Pine', color: '#bedaf7', rarity: 'extinct' },
  void: { name: 'Void Tree', color: '#000000', rarity: 'extinct' },
  spoiled: { name: 'Spoiled', color: '#71717a', rarity: 'common' }
}

const XP_LEVELS = [
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

function getLevel(xp) {
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

function getRarityClass(rarity) {
  if (rarity === 'uncommon') return 'rarity-uncommon'
  if (rarity === 'rare' || rarity === 'true rare') return 'rarity-rare'
  if (rarity === 'premium') return 'rarity-premium'
  if (rarity === 'chroma') return 'rarity-chroma'
  if (rarity === 'extinct') return 'rarity-extinct'
  return 'rarity-common'
}

function render(data) {
  const app = document.getElementById('app')
  const grove = data.groveData?.grove || []
  const sunshine = data.groveData?.sunshine ?? 0
  const gems = data.groveData?.gems ?? 0
  const lastCharCount = data.groveData?.lastCharCount ?? 0
  const focusMode = data.focusMode || false
  const blockedSites = data.blockedSites || []

  const xp = Math.floor(lastCharCount / 5)
  const lvl = getLevel(xp)

  const filledPlots = grove.filter(t => t !== null).length
  const grownPlots = grove.filter(t => t && t.stage >= 4).length

  const hasData = grove.length > 0 || sunshine > 0 || gems > 0

  let html = ''

  // Header
  html += `
    <div class="header">
      <div class="logo-row">
        <svg class="logo-icon" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" fill="#B8661A"/>
          <circle cx="14" cy="14" r="11" fill="#F5A030"/>
          <line x1="14" y1="3" x2="14" y2="25" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
          <line x1="8.5" y1="23.5" x2="19.5" y2="4.5" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
          <line x1="19.5" y1="23.5" x2="8.5" y2="4.5" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
          <circle cx="14" cy="14" r="1.8" fill="#B8661A" fill-opacity="0.75"/>
        </svg>
        <span class="logo-text">The Garden</span>
      </div>
      <div class="level-badge">
        <span class="level-num">Lv.${lvl.level}</span>
        <span class="level-name">${lvl.name}</span>
      </div>
    </div>`

  if (!hasData) {
    html += `
      <div class="empty-state">
        <p>Open Pulp to sync your garden data.</p>
        <p class="hint">Your grove, currencies, and focus settings will appear here once synced.</p>
      </div>`
  } else {
    // Currencies
    html += `
      <div class="currencies">
        <div class="currency sun">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></svg>
          ${sunshine}
        </div>
        <div class="currency gem">💎 ${gems}</div>
      </div>`

    // XP Bar
    html += `
      <div class="xp-section">
        <div class="xp-labels">
          <span class="xp-label">Progress to ${lvl.level < XP_LEVELS.length ? getLevel(xp + lvl.nextXp - lvl.currentXp).name : 'Max'}</span>
          <span class="xp-label">${xp.toLocaleString()} XP</span>
        </div>
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width:${Math.max(2, lvl.progress * 100)}%"></div>
        </div>
        <div class="xp-sub">
          <span>${lvl.currentXp}/${lvl.nextXp} XP</span>
          <span>${Math.round(lvl.progress * 100)}%</span>
        </div>
      </div>`

    // Grove Grid
    html += `
      <div class="grove-section">
        <div class="grove-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>Your Grove</span>
          <span style="font-size:9px;font-weight:500;color:#52525b;letter-spacing:0.05em">${filledPlots}/9 planted${grownPlots > 0 ? ` · ${grownPlots} grown` : ''}</span>
        </div>
        <div class="grove-grid">`

    for (let i = 0; i < 9; i++) {
      const tree = grove[i]
      if (!tree) {
        html += `<div class="plot"><span class="plot-empty">+</span></div>`
      } else {
        const info = TREE_TYPES[tree.type] || { name: tree.type, color: '#888', rarity: 'common' }
        const rarityClass = getRarityClass(info.rarity)
        const progress = tree.progress || 0
        const isGrown = tree.stage >= 4

        html += `
          <div class="plot filled">
            <div class="plant-circle ${rarityClass}" style="background:${info.color}"></div>
            <span class="plant-name">${info.name.split(' ')[0]}</span>
            ${isGrown
              ? `<span class="grown-badge">✓ Grown</span>`
              : `<div class="plant-bar-bg"><div class="plant-bar-fill" style="width:${Math.min(100, progress)}%"></div></div>`
            }
          </div>`
      }
    }

    html += `</div></div>`
  }

  // Focus Mode status
  html += `
    <div class="focus-section">
      <div class="focus-title">Focus Mode</div>
      <div class="focus-status">
        <div class="focus-dot ${focusMode ? 'on' : 'off'}"></div>
        <span class="focus-label">${focusMode ? 'Active — blocking distractions' : 'Off'}</span>
        ${blockedSites.length > 0 ? `<span class="blocked-count">${blockedSites.length} site${blockedSites.length === 1 ? '' : 's'}</span>` : ''}
      </div>
    </div>`

  // Footer
  html += `
    <div class="footer">
      <p>"An orchard is grown with patience and nurtured by persistence."</p>
    </div>`

  app.innerHTML = html
}

chrome.storage.local.get(["groveData", "focusMode", "blockedSites"], (data) => {
  render(data)
})

chrome.storage.onChanged.addListener(() => {
  chrome.storage.local.get(["groveData", "focusMode", "blockedSites"], (data) => {
    render(data)
  })
})
