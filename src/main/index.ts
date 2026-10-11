import { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { loadConfig, saveConfig, getConfigPath, hasContent } from './config'
import { LAYOUTS } from '../shared/layouts'
import { Player } from './player'
import { t, type Lang } from '../shared/i18n'
import type { AppConfig, DisplayInfo, PlayerStatus } from '../shared/types'

const AUTOSTART_FLAG = '--autostart'

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let settingsWin: BrowserWindow | null = null
let tray: Tray | null = null
const player = new Player()

const lang = (): Lang => loadConfig().language

// ---------- Settings window ----------
function openSettings(): void {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show()
    settingsWin.focus()
    keepSettingsVisible(true)
    return
  }
  settingsWin = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: t(lang(), 'app.settingsTitle'),
    autoHideMenuBar: true,
    icon: iconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })
  settingsWin.on('closed', () => (settingsWin = null))
  // A settings window raised by the shortcut drops behind the kiosk on focus loss
  settingsWin.on('blur', () => keepSettingsVisible(false))
  settingsWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    settingsWin.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWin.loadFile(join(__dirname, '../renderer/index.html'))
  }
  keepSettingsVisible(true)
}

/**
 * Sets the settings window's layer relative to the kiosk windows.
 * - When the player starts (raise=false): settings stay put; on the same monitor
 *   the kiosk window covers it, on another monitor it stays visible.
 * - When opened explicitly via shortcut/tray (raise=true): raised above the
 *   kiosk layer; on focus loss the blur listener drops it back behind.
 */
function keepSettingsVisible(raise = false): void {
  if (!settingsWin || settingsWin.isDestroyed()) return
  if (raise && player.running) {
    // kiosk windows sit at the 'floating' level; settings go one level above temporarily
    settingsWin.setAlwaysOnTop(true, 'screen-saver')
    settingsWin.moveTop()
  } else {
    settingsWin.setAlwaysOnTop(false)
  }
}

function iconPath(): string | undefined {
  const candidates = [
    join(process.resourcesPath ?? '', 'icon.png'),
    join(app.getAppPath(), 'resources', 'icon.png'),
    join(__dirname, '../../resources/icon.png')
  ]
  return candidates.find((p) => existsSync(p))
}

// ---------- Player ----------
function startPlayer(cfg?: AppConfig): void {
  const config = cfg ?? loadConfig()
  player.start(config)
  keepSettingsVisible()
  updateTray()
  broadcastStatus()
}

function stopPlayer(): void {
  player.stop()
  keepSettingsVisible()
  updateTray()
  broadcastStatus()
}

function status(): PlayerStatus {
  return { running: player.running, windows: player.windowCount, skipped: player.skipped }
}

function broadcastStatus(): void {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.webContents.send('player:status', status())
  }
}

// ---------- Autostart (Windows login) ----------
function applyAutostart(enabled: boolean): void {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: enabled, args: [AUTOSTART_FLAG] })
  } else {
    // Development: electron.exe + project path
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: [app.getAppPath(), AUTOSTART_FLAG]
    })
  }
}

// ---------- Tray ----------
function updateTray(): void {
  if (!tray) return
  const L = lang()
  const menu = Menu.buildFromTemplate([
    { label: t(L, 'tray.settings'), click: () => openSettings() },
    { type: 'separator' },
    player.running
      ? { label: t(L, 'tray.stop'), click: () => stopPlayer() }
      : { label: t(L, 'tray.start'), click: () => startPlayer() },
    { label: t(L, 'tray.reload'), enabled: player.running, click: () => player.reload() },
    { type: 'separator' },
    { label: t(L, 'tray.config'), click: () => shell.showItemInFolder(getConfigPath()) },
    { type: 'separator' },
    { label: t(L, 'tray.quit'), click: () => app.quit() }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip(t(L, player.running ? 'tray.tooltipRunning' : 'tray.tooltip'))
}

function createTray(): void {
  const p = iconPath()
  const img = p ? nativeImage.createFromPath(p).resize({ width: 16, height: 16 }) : nativeImage.createEmpty()
  tray = new Tray(img)
  tray.on('double-click', () => openSettings())
  updateTray()
}

// ---------- Shortcuts ----------
function registerShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+S', () => openSettings())
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit())
  globalShortcut.register('CommandOrControl+Shift+R', () => player.reload())
  globalShortcut.register('CommandOrControl+Shift+X', () => stopPlayer())
}

// ---------- IPC ----------
function registerIpc(): void {
  ipcMain.handle('config:get', () => loadConfig())
  ipcMain.handle('config:save', (_e, cfg: AppConfig) => {
    const saved = saveConfig(cfg)
    applyAutostart(saved.autostart)
    updateTray()
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.setTitle(t(saved.language, 'app.settingsTitle'))
    return saved
  })
  ipcMain.handle('layouts:get', () => LAYOUTS)
  ipcMain.handle('displays:get', (): DisplayInfo[] => {
    const primary = screen.getPrimaryDisplay()
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: d.label || 'Display ' + (i + 1),
      bounds: d.bounds,
      scaleFactor: d.scaleFactor,
      primary: d.id === primary.id
    }))
  })
  ipcMain.handle('player:start', (_e, cfg: AppConfig) => {
    const saved = saveConfig(cfg)
    applyAutostart(saved.autostart)
    startPlayer(saved)
    return status()
  })
  ipcMain.handle('player:stop', () => {
    stopPlayer()
    return status()
  })
  ipcMain.handle('player:reload', () => player.reload())
  ipcMain.handle('player:status', () => status())
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    configPath: getConfigPath(),
    packaged: app.isPackaged
  }))
  ipcMain.handle('config:reveal', () => shell.showItemInFolder(getConfigPath()))
}

// ---------- Lifecycle ----------
app.on('second-instance', () => openSettings())

app.whenReady().then(() => {
  registerIpc()
  registerShortcuts()
  createTray()

  // Batch monitor changes and apply them once
  let displayTimer: NodeJS.Timeout | null = null
  const onDisplayChange = (): void => {
    if (displayTimer) clearTimeout(displayTimer)
    displayTimer = setTimeout(() => {
      player.refreshDisplays()
      keepSettingsVisible()
      broadcastStatus()
    }, 800)
  }
  screen.on('display-added', onDisplayChange)
  screen.on('display-removed', onDisplayChange)
  screen.on('display-metrics-changed', onDisplayChange)

  const cfg = loadConfig()
  const launchedAtLogin = process.argv.includes(AUTOSTART_FLAG)

  if ((cfg.autoplay || launchedAtLogin) && hasContent(cfg)) {
    startPlayer(cfg)
  } else {
    openSettings()
  }
})

// The tray keeps the app alive even when every window is closed
app.on('window-all-closed', () => {
  /* no-op */
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  player.stop()
})
