// Background service worker — manages declarativeNetRequest rules.

const BLOCKED_REDIRECT = chrome.runtime.getURL("blocked.html")

async function updateRules() {
  const { blockedSites = [], focusMode = false } = await chrome.storage.local.get(["blockedSites", "focusMode"])

  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeIds = existing.map(r => r.id)

  const addRules = []

  if (focusMode && blockedSites.length > 0) {
    blockedSites.forEach((site, i) => {
      let domain = site
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim()
        .toLowerCase()
      if (!domain) return

      addRules.push({
        id: i + 1,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: BLOCKED_REDIRECT + "?site=" + encodeURIComponent(domain) }
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

  console.log("[Pulp Focus] Rules updated:", addRules.length, "active blocks")
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CONFIG_UPDATED") updateRules()
})

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites || changes.focusMode) {
    updateRules()
  }
})

chrome.runtime.onInstalled.addListener(updateRules)
chrome.runtime.onStartup.addListener(updateRules)
