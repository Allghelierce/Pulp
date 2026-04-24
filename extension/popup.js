const TREE_TYPES = {
  heartwood:  { name: 'Heartwood Oak',    color: '#8b6914' },
  thicket:    { name: 'Inkberry Bush',    color: '#2d6a4f' },
  penny:      { name: 'Penny Bloom',      color: '#fbbf24' },
  quill:      { name: 'Quill Fern',       color: '#16a34a' },
  pebble:     { name: 'Pebble Hedge',     color: '#65a30d' },
  ember:      { name: 'Ember Maple',      color: '#991b1b' },
  sentinel:   { name: 'Sentinel Pine',    color: '#064e3b' },
  manuscript: { name: 'Manuscript Birch',  color: '#a3e635' },
  whisper:    { name: 'Whisper Bamboo',    color: '#4d7c0f' },
  dusk:       { name: 'Dusk Lavender',    color: '#a78bfa' },
  parlor:     { name: 'Parlor Topiary',   color: '#166534' },
  goldleaf:   { name: 'Goldleaf Citrus',   color: '#facc15' },
  spine:      { name: 'Spine Cactus',     color: '#22c55e' },
  inkcap:     { name: 'Inkcap Mushroom',  color: '#ef4444' },
  monolith:   { name: 'Monolith Cypress', color: '#0f766e' },
  wisteria:   { name: 'Cascade Wisteria', color: '#c084fc' },
  hanami:     { name: 'Hanami Sakura',    color: '#f9a8d4' },
  odyssey:    { name: 'Odyssey Palm',     color: '#eab308' },
  mythos:     { name: 'Mythos Orchid',    color: '#be185d' },
  patience:   { name: 'Patience Bonsai',  color: '#15803d' },
  thornscript:{ name: 'Thornscript',      color: '#4c1d95' },
  epoch:      { name: 'Epoch Baobab',     color: '#b85e22' },
  fossil:     { name: 'Fossil Pine',      color: '#bedaf7' },
  reverie:    { name: 'Reverie Wisp',     color: '#e0c3fc' },
  prism:      { name: 'Prism Shard',      color: '#67e8f9' },
  abyss:      { name: 'Abyss Maw',        color: '#000000' },
  spoiled:    { name: 'Spoiled',           color: '#71717a' },
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

function render(data) {
  const app = document.getElementById('app')
  const focusMode = data.focusMode || false
  const blockedSites = data.blockedSites || []
  const timer = data.timerData || null

  let html = ''

  // Header
  html += `
    <div class="header">
      <svg class="logo-icon" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" fill="#B8661A"/>
        <circle cx="14" cy="14" r="11" fill="#F5A030"/>
        <line x1="14" y1="3" x2="14" y2="25" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
        <line x1="8.5" y1="23.5" x2="19.5" y2="4.5" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
        <line x1="19.5" y1="23.5" x2="8.5" y2="4.5" stroke="#B8661A" stroke-width="1.1" stroke-opacity="0.55"/>
        <circle cx="14" cy="14" r="1.8" fill="#B8661A" fill-opacity="0.75"/>
      </svg>
      <span class="logo-text">Pulp<span class="logo-sub">Focus</span></span>
    </div>`

  // Blocker status
  const siteCount = blockedSites.length
  let statusLabel, statusDetail
  if (focusMode) {
    statusLabel = 'Blocker Active'
    statusDetail = siteCount > 0 ? `Blocking ${siteCount} site${siteCount === 1 ? '' : 's'}` : 'Timer running'
  } else {
    statusLabel = 'Blocker Inactive'
    statusDetail = siteCount > 0 ? `${siteCount} site${siteCount === 1 ? '' : 's'} configured` : 'No sites configured'
  }

  html += `
    <div class="status-section">
      <div class="status-card">
        <div class="status-dot ${focusMode ? 'active' : 'inactive'}"></div>
        <div class="status-info">
          <div class="status-label">${statusLabel}</div>
          <div class="status-detail">${statusDetail}</div>
        </div>
      </div>
    </div>`

  // Timer + tree
  if (timer && timer.running) {
    const elapsedSinceLast = Math.floor((Date.now() - timer.timestamp) / 1000)
    const currentElapsed = Math.min(timer.total, timer.elapsed + elapsedSinceLast)
    const remaining = Math.max(0, timer.total - currentElapsed)
    const progress = timer.total > 0 ? (currentElapsed / timer.total) * 100 : 0
    const seed = timer.selectedSeed
    const treeInfo = seed ? TREE_TYPES[seed] : null

    html += `
      <div class="timer-section">
        <div class="timer-card">
          <div class="timer-time">${formatTime(remaining)}</div>
          <div class="timer-label">remaining</div>
          ${treeInfo ? `
            <div class="tree-preview">
              <div class="tree-circle" style="background: ${treeInfo.color}; border-color: ${treeInfo.color}33;"></div>
              <span class="tree-name">${treeInfo.name}</span>
            </div>
          ` : ''}
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min(100, progress)}%"></div>
          </div>
        </div>
      </div>`
  } else if (timer && timer.done) {
    const seed = timer.selectedSeed
    const treeInfo = seed ? TREE_TYPES[seed] : null

    html += `
      <div class="timer-section">
        <div class="timer-card">
          <div class="timer-time">${formatTime(timer.total)}</div>
          <div class="timer-label">completed</div>
          ${treeInfo ? `
            <div class="tree-preview">
              <div class="tree-circle" style="background: ${treeInfo.color}; border-color: ${treeInfo.color}33;"></div>
              <span class="tree-name">${treeInfo.name}</span>
            </div>
          ` : ''}
          <span class="done-badge">Session Complete</span>
        </div>
      </div>`
  } else {
    html += `
      <div class="idle-section">
        <p class="idle-text">Start a focus session in Pulp to grow a tree.</p>
      </div>`
  }

  app.innerHTML = html
}

chrome.storage.local.get(["focusMode", "blockedSites", "timerData"], (data) => {
  render(data)
})

chrome.storage.onChanged.addListener(() => {
  chrome.storage.local.get(["focusMode", "blockedSites", "timerData"], (data) => {
    render(data)
  })
})
