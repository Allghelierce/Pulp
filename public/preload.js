const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Activate or deactivate the system-wide (or app-wide) focus blocker.
   * @param {Object} config { active: boolean, sites: string[], apps: string[] }
   */
  setBlocker: (config) => ipcRenderer.send('set-blocker', config),
  
  /**
   * Request system permissions for blocking (macOS specific)
   */
  requestPermissions: () => ipcRenderer.invoke('request-blocker-permissions')
})
