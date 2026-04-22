// Content script — runs on the Pulp domain.
// Listens for config events from the app and syncs to chrome.storage.

window.addEventListener("pulp-focus-config", (e) => {
  const { blockedSites, focusMode } = e.detail
  chrome.storage.local.set({ blockedSites, focusMode }, () => {
    chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" })
  })
})
