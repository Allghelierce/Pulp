// Content script — runs on the Pulp domain.
// Syncs focus config AND grove/gamification data to chrome.storage.

function isExtensionValid() {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

function syncAll() {
  if (!isExtensionValid()) return

  try {
    const settings = localStorage.getItem("pulp-settings")
    if (settings) {
      const parsed = JSON.parse(settings)
      const sites = parsed.blockedSites || []
      chrome.storage.local.set({ blockedSites: sites }, () => {
        if (chrome.runtime.lastError) {
          console.warn("[Pulp Focus] Storage set failed:", chrome.runtime.lastError.message)
          return
        }
        try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
      })
    }

    // Sync timer state from sessionStorage
    const timer = sessionStorage.getItem("pulp-timer")
    if (timer) {
      const t = JSON.parse(timer)
      const isRunning = t.running && !t.done
      chrome.storage.local.set({
        focusMode: isRunning,
        timerData: { elapsed: t.elapsed || 0, total: t.total || 0, running: isRunning, done: !!t.done, selectedSeed: t.selectedSeed || null, timestamp: t.timestamp || Date.now() }
      })
    }

    const grove = localStorage.getItem("pulp-grove")
    if (grove) {
      const data = JSON.parse(grove)
      chrome.storage.local.set({
        groveData: {
          sunshine: data.sunshine ?? 0,
          gems: data.gems ?? 0,
          grove: data.grove ?? [],
          inventory: data.inventory ?? [],
          lastCharCount: data.lastCharCount ?? 0
        }
      })
    }
  } catch (err) {
    console.warn("[Pulp Focus] Sync failed:", err)
  }
}

syncAll()
setInterval(() => {
  if (isExtensionValid()) syncAll()
}, 3000)

// Signal to the Pulp app that the extension is installed
function signalPresence() {
  document.documentElement.setAttribute("data-pulp-extension", "true")
  window.dispatchEvent(new CustomEvent("pulp-extension-detected"))
}

if (isExtensionValid()) {
  signalPresence()
}

// Re-signal periodically in case the page loaded late
setInterval(() => {
  if (isExtensionValid()) signalPresence()
}, 2000)

// Respond to pings from the web app
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "pulp-extension-ping" && isExtensionValid()) {
    window.postMessage({ type: "pulp-extension-pong" }, "*")
    signalPresence()
  }
})

// Listen for direct updates from the Pulp app via postMessage
window.addEventListener("message", (e) => {
  if (!isExtensionValid()) return
  if (e.data && e.data.type === "pulp-focus-config") {
    const sites = e.data.blockedSites || []
    chrome.storage.local.set({ blockedSites: sites }, () => {
      if (chrome.runtime.lastError) return
      try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
    })
  }
  if (e.data && e.data.type === "pulp-timer-state") {
    chrome.storage.local.set({ focusMode: !!e.data.timerRunning }, () => {
      if (chrome.runtime.lastError) return
      try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
    })
  }
})
