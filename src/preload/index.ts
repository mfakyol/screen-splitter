import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, DisplayInfo, Layout, PlayerStatus } from '../shared/types'

export interface AppInfo {
  version: string
  configPath: string
  packaged: boolean
  platform: NodeJS.Platform
}

export interface ExportResult {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export interface ImportResult {
  ok: boolean
  config?: AppConfig
  canceled?: boolean
  error?: string
  /** The file format is newer than this app version */
  unsupported?: { file: number; supported: number }
}

const api = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg: AppConfig): Promise<AppConfig> => ipcRenderer.invoke('config:save', cfg),
  exportConfig: (cfg: AppConfig): Promise<ExportResult> => ipcRenderer.invoke('config:export', cfg),
  importConfig: (): Promise<ImportResult> => ipcRenderer.invoke('config:import'),
  getLayouts: (): Promise<Layout[]> => ipcRenderer.invoke('layouts:get'),
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('displays:get'),
  /** Opens only those screens when screenIds is given; all of them otherwise */
  startPlayer: (cfg: AppConfig, screenIds?: string[]): Promise<PlayerStatus> =>
    ipcRenderer.invoke('player:start', cfg, screenIds),
  stopPlayer: (): Promise<PlayerStatus> => ipcRenderer.invoke('player:stop'),
  reloadPlayer: (): Promise<void> => ipcRenderer.invoke('player:reload'),
  getStatus: (): Promise<PlayerStatus> => ipcRenderer.invoke('player:status'),
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:info'),
  onStatus: (cb: (s: PlayerStatus) => void): (() => void) => {
    const handler = (_e: unknown, s: PlayerStatus): void => cb(s)
    ipcRenderer.on('player:status', handler)
    return () => {
      ipcRenderer.removeListener('player:status', handler)
    }
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
