import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, DisplayInfo, Layout, PlayerStatus } from '../shared/types'

export interface AppInfo {
  version: string
  configPath: string
  packaged: boolean
}

const api = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg: AppConfig): Promise<AppConfig> => ipcRenderer.invoke('config:save', cfg),
  revealConfig: (): Promise<void> => ipcRenderer.invoke('config:reveal'),
  getLayouts: (): Promise<Layout[]> => ipcRenderer.invoke('layouts:get'),
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('displays:get'),
  startPlayer: (cfg: AppConfig): Promise<PlayerStatus> => ipcRenderer.invoke('player:start', cfg),
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
