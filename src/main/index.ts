import { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { loadConfig, saveConfig, getConfigPath } from './config'
import { LAYOUTS } from '../shared/layouts'
import { Player } from './player'
import { t, type Lang } from '../shared/i18n'
import type { AppConfig, DisplayInfo, PlayerStatus } from '../shared/types'

const lang = (): Lang => loadConfig().language

const AUTOSTART_FLAG = '--autostart'

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let settingsWin: BrowserWindow | null = null
let tray: Tray | null = null
const player = new Player()

// ---------- Settings window ----------
function openSettings(): void {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show()
    settingsWin.focus()
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
  settingsWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    settingsWin.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWin.loadFile(join(__dirname, '../renderer/index.html'))
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
  updateTray()
  broadcastStatus()
}

function stopPlayer(): void {
  player.stop()
  updateTray()
  broadcastStatus()
}

function status(): PlayerStatus {
  return { running: player.running, displayId: player.displayId }
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

  screen.on('display-added', () => player.refreshDisplay())
  screen.on('display-removed', () => player.refreshDisplay())
  screen.on('display-metrics-changed', () => player.refreshDisplay())

  const cfg = loadConfig()
  const launchedAtLogin = process.argv.includes(AUTOSTART_FLAG)
  const hasContent = cfg.zones.some((z) => z.url.trim())

  if ((cfg.autoplay || launchedAtLogin) && hasContent) {
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
