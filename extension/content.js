// Content script — runs on the Pulp domain.
// Syncs focus config AND grove/gamification data to chrome.storage.

function syncAll() {
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
  } catch {}
}

syncAll()
setInterval(syncAll, 3000)

// Listen for direct updates from the Pulp app via postMessage
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "pulp-focus-config") {
    const sites = e.data.blockedSites || []
    chrome.storage.local.set({ blockedSites: sites, focusMode: sites.length > 0 }, () => {
      try { chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" }) } catch {}
    })
  }
})
