// Background service worker — manages declarativeNetRequest rules.

async function updateRules() {
  try {
    const { blockedSites = [], focusMode = false } = await chrome.storage.local.get(["blockedSites", "focusMode"])

    const existing = await chrome.declarativeNetRequest.getDynamicRules()
    const removeIds = existing.map(r => r.id)

    const addRules = []

    if (focusMode && blockedSites.length > 0) {
      let ruleId = 1
      blockedSites.forEach((site) => {
        let domain = site
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/.*$/, "")
          .replace(/:.*$/, "")
          .trim()
          .toLowerCase()
        if (!domain || domain.includes(" ")) return

        addRules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { extensionPath: "/blocked.html?site=" + encodeURIComponent(domain) }
          },
          condition: {
            requestDomains: [domain],
            resourceTypes: ["main_frame"]
          }
        })
      })
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules
    })

    console.log("[Pulp Focus] Rules updated:", addRules.length, "active blocks", addRules.map(r => r.condition.requestDomains[0]))
  } catch (err) {
    console.error("[Pulp Focus] Failed to update rules:", err)
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CONFIG_UPDATED") updateRules()
})

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites || changes.focusMode) {
    updateRules()
  }
})

// Keep rules in sync on startup, install, and periodically
chrome.runtime.onInstalled.addListener(() => {
  updateRules()
  chrome.alarms.create("pulp-focus-sync", { periodInMinutes: 1 })
})

chrome.runtime.onStartup.addListener(() => {
  updateRules()
  chrome.alarms.create("pulp-focus-sync", { periodInMinutes: 1 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pulp-focus-sync") updateRules()
})
