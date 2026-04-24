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
      const focus = sites.length > 0
      chrome.storage.local.set({
        blockedSites: sites,
        focusMode: focus
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn("[Pulp Focus] Storage set failed:", chrome.runtime.lastError.message)
          return
        }
        try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
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

// Listen for direct updates from the Pulp app via postMessage
window.addEventListener("message", (e) => {
  if (!isExtensionValid()) return
  if (e.data && e.data.type === "pulp-focus-config") {
    const sites = e.data.blockedSites || []
    chrome.storage.local.set({ blockedSites: sites, focusMode: sites.length > 0 }, () => {
      if (chrome.runtime.lastError) return
      try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
    })
  }
})
