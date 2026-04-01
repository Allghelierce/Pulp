const { app, BrowserWindow, Menu, ipcMain, session } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const isDev = require('electron-is-dev')

let mainWindow
let blockerInterval = null
let blockedSites = []
let blockedApps = []
let isBlockerActive = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'hiddenInset', // Better for macOS focus look
    icon: path.join(__dirname, 'icon.png')
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    stopBlocker()
  })
}

/**
 * Stop the background monitoring
 */
function stopBlocker() {
  if (blockerInterval) {
    clearInterval(blockerInterval)
    blockerInterval = null
  }
  isBlockerActive = false
  console.log("Focus Blocker Deactivated.")
}

/**
 * Background loop to monitor apps and browser tabs (macOS focus)
 */
function startBlocker() {
  if (blockerInterval) clearInterval(blockerInterval)
  
  isBlockerActive = true
  console.log("Focus Blocker Activated:", { sites: blockedSites, apps: blockedApps })

  blockerInterval = setInterval(() => {
    if (!isBlockerActive) return

    // 1. Monitor Browser Tabs (macOS AppleScript)
    if (blockedSites.length > 0 && process.platform === 'darwin') {
      const appleScript = `
        set blocked_sites to {${blockedSites.map(s => `"${s}"`).join(',')}}
        
        -- Check Safari
        if application "Safari" is running then
          tell application "Safari"
            repeat with t in tabs of windows
              repeat with s in blocked_sites
                if (URL of t) contains s then
                  set (URL of t) to "http://localhost:3000/blocked" -- Redirect to app's focus page
                end if
              end repeat
            end repeat
          end tell
        end if

        -- Check Chrome
        if application "Google Chrome" is running then
          tell application "Google Chrome"
            repeat with w in windows
              repeat with t in tabs of w
                repeat with s in blocked_sites
                  if (URL of t) contains s then
                    set (URL of t) to "http://localhost:3000/blocked"
                  end if
                end repeat
              end repeat
            end repeat
          end tell
        end if
      `
      exec(`osascript -e '${appleScript}'`, (err) => {
        if (err) console.error("AppleScript Error:", err)
      })
    }

    // 2. Monitor Prohibited Apps (all platforms)
    if (blockedApps.length > 0) {
      const cmd = process.platform === 'win32' ? 'tasklist' : 'ps -ax -o comm'
      exec(cmd, (err, stdout) => {
        if (err) return
        blockedApps.forEach(appName => {
          if (stdout.toLowerCase().includes(appName.toLowerCase())) {
            // Find specific process to kill
            const killCmd = process.platform === 'win32' ? `taskkill /F /IM ${appName}.exe` : `pkill -x "${appName}"`
            exec(killCmd)
            if (mainWindow) {
               mainWindow.webContents.send('blocker-notification', { type: 'app', name: appName })
            }
          }
        })
      })
    }
  }, 3000) // Poll every 3 seconds for efficiency
}

// IPC Handlers
ipcMain.on('set-blocker', (event, { active, sites, apps }) => {
  blockedSites = sites || []
  blockedApps = apps || []
  if (active) startBlocker()
  else stopBlocker()
})

ipcMain.handle('request-blocker-permissions', async () => {
    // On macOS, AppleScript usually prompts for permission once or requires Automation permission
    // For now, return success; actual permission check is handled by OS when osascript runs.
    return true
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Menu definition (unchanged)
const template = [
  {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  },
  {
     label: 'View',
     submenu: [
       { role: 'reload' },
       { role: 'forceReload' },
       { role: 'toggleDevTools' },
       { type: 'separator' },
       { role: 'togglefullscreen' }
     ]
  }
]
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
