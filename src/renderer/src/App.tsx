import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppConfig, DisplayInfo, Layout, PlayerStatus, ScreenConfig } from '../../shared/types'
import { t as translate, type Lang, type TKey } from '../../shared/i18n'
import type { TFn } from './pageProps'
import { useTheme } from './useTheme'
import ScreensPage from './pages/ScreensPage'
import StartupPage from './pages/StartupPage'
import AppearancePage from './pages/AppearancePage'
import ScreenTabs, { screenLabel } from './components/ScreenTabs'
import ConfirmDialog from './components/ConfirmDialog'
import {
  IconMonitor,
  IconPower,
  IconPalette,
  IconPlay,
  IconStop,
  IconRefresh,
  IconSave,
  IconExternal,
  Logo
} from './components/Icons'

type PageId = 'screens' | 'startup' | 'appearance'

const NAV: { id: PageId; label: TKey; desc: TKey; icon: React.ReactNode }[] = [
  { id: 'screens', label: 'nav.screens', desc: 'page.screens.desc', icon: <IconMonitor /> },
  { id: 'startup', label: 'nav.startup', desc: 'page.startup.desc', icon: <IconPower /> },
  { id: 'appearance', label: 'nav.appearance', desc: 'page.appearance.desc', icon: <IconPalette /> }
]

type Toast = { kind: 'ok' | 'err'; text: string } | null

interface AppInfo {
  version: string
  configPath: string
  packaged: boolean
}

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'scr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const hasContent = (cfg: AppConfig): boolean => cfg.screens.some((s) => s.zones.some((z) => z.url.trim()))

export default function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [status, setStatus] = useState<PlayerStatus>({ running: false, windows: 0, skipped: [] })
  const [page, setPage] = useState<PageId>('screens')
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [info, setInfo] = useState<AppInfo | null>(null)
  /** Screen ids saved to disk; used for the delete confirmation */
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<ScreenConfig | null>(null)

  const markSaved = (cfg: AppConfig): void => setSavedIds(new Set(cfg.screens.map((s) => s.id)))

  const lang: Lang = config?.language ?? 'en'
  const t: TFn = useCallback((key, params) => translate(lang, key, params), [lang])

  useTheme(config?.theme ?? 'system', config?.accent ?? 'blue')

  useEffect(() => {
    Promise.all([
      window.api.getConfig(),
      window.api.getLayouts(),
      window.api.getDisplays(),
      window.api.getStatus(),
      window.api.getAppInfo()
    ]).then(([cfg, lays, disps, st, inf]) => {
      setConfig(cfg)
      markSaved(cfg)
      setLayouts(lays)
      setDisplays(disps)
      setStatus(st)
      setInfo(inf)
    })
    return window.api.onStatus(setStatus)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.settingsTitle')
  }, [lang])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const activeScreen: ScreenConfig | undefined = useMemo(
    () => config?.screens.find((s) => s.id === activeScreenId) ?? config?.screens[0],
    [config?.screens, activeScreenId]
  )

  const layout = useMemo(
    () => layouts.find((l) => l.id === activeScreen?.layoutId) ?? layouts[0],
    [layouts, activeScreen?.layoutId]
  )

  const update = useCallback((patch: Partial<AppConfig>) => {
    setConfig((c) => (c ? { ...c, ...patch } : c))
    setDirty(true)
  }, [])

  const updateScreen = useCallback((id: string, patch: Partial<ScreenConfig>) => {
    setConfig((c) => (c ? { ...c, screens: c.screens.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : c))
    setDirty(true)
  }, [])

  const addScreen = (): void => {
    if (!config) return
    const usedDisplays = new Set(config.screens.map((s) => s.displayId))
    const free = displays.find((d) => !usedDisplays.has(d.id) && !(d.primary && usedDisplays.has(null)))
    const scr: ScreenConfig = {
      id: newId(),
      name: '',
      displayId: free ? free.id : null,
      layoutId: 'single',
      zones: [{ url: '', refreshSec: 0, zoom: 1, muted: true }],
      gap: 0,
      background: '#000000'
    }
    update({ screens: [...config.screens, scr] })
    setActiveScreenId(scr.id)
  }

  const removeScreen = (id: string): void => {
    if (!config || config.screens.length <= 1) return
    const idx = config.screens.findIndex((s) => s.id === id)
    const rest = config.screens.filter((s) => s.id !== id)
    update({ screens: rest })
    setActiveScreenId(rest[Math.max(0, idx - 1)].id)
    setPendingDelete(null)
  }

  /** Asks for confirmation for a saved screen; deletes an unsaved one directly */
  const requestDelete = (id: string): void => {
    if (!config || config.screens.length <= 1) return
    const scr = config.screens.find((s) => s.id === id)
    if (!scr) return
    if (savedIds.has(id)) setPendingDelete(scr)
    else removeScreen(id)
  }

  /** Preferences like theme/language apply and save immediately; pending changes are kept. */
  const applyNow = useCallback((patch: Partial<AppConfig>) => {
    setConfig((c) => {
      if (!c) return c
      const next = { ...c, ...patch }
      window.api
        .saveConfig(next)
        .then(() => markSaved(next))
        .catch(() => setDirty(true))
      return next
    })
  }, [])

  const save = async (): Promise<void> => {
    if (!config) return
    try {
      const saved = await window.api.saveConfig(config)
      setConfig(saved)
      markSaved(saved)
      setDirty(false)
      setToast({ kind: 'ok', text: t('toast.saved') })
    } catch (e) {
      setToast({ kind: 'err', text: t('toast.saveFailed', { err: String(e) }) })
    }
  }

  const start = async (): Promise<void> => {
    if (!config) return
    if (!hasContent(config)) {
      setToast({ kind: 'err', text: t('toast.needUrl') })
      setPage('screens')
      return
    }
    const st = await window.api.startPlayer(config)
    markSaved(config)
    setDirty(false)
    setStatus(st)
    if (st.skipped.length > 0) setToast({ kind: 'err', text: t('toast.skipped', { n: st.skipped.length }) })
    else setToast({ kind: 'ok', text: t('toast.started') })
  }

  const stop = async (): Promise<void> => setStatus(await window.api.stopPlayer())
  const refreshDisplays = async (): Promise<void> => setDisplays(await window.api.getDisplays())

  if (!config || !layout || !activeScreen) {
    return (
      <div className="loading">
        <span className="spinner" aria-hidden />
        {translate('en', 'app.loading')}
      </div>
    )
  }

  const current = NAV.find((n) => n.id === page) ?? NAV[0]
  const pageProps = { config, t, update, applyNow }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          <div>
            <strong>{t('app.title')}</strong>
            <small>{t('app.subtitle')}</small>
          </div>
        </div>

        <nav className="nav" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={'nav-item' + (n.id === page ? ' active' : '')}
              aria-current={n.id === page ? 'page' : undefined}
              onClick={() => setPage(n.id)}
            >
              {n.icon}
              <span>{t(n.label)}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className={'status-pill ' + (status.running ? 'on' : 'off')}>
            <span className="dot" />
            {status.running ? t('status.running') : t('status.stopped')}
            {status.running && status.windows > 1 && (
              <span className="status-sub">{t('status.windows', { n: status.windows })}</span>
            )}
          </div>
          {info && (
            <button type="button" className="link" onClick={() => window.api.revealConfig()}>
              v{info.version} · config.json <IconExternal width={12} height={12} />
            </button>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="page-head">
          <div className="page-title">
            <h1>{t(current.label)}</h1>
            <p>{t(current.desc)}</p>
          </div>
          <div className="head-actions">
            {dirty && <span className="unsaved">{t('status.unsaved')}</span>}
            <button type="button" className="btn ghost" onClick={save} disabled={!dirty}>
              <IconSave /> {t('btn.save')}
            </button>
            {status.running ? (
              <>
                <button type="button" className="btn ghost" onClick={() => window.api.reloadPlayer()}>
                  <IconRefresh /> {t('btn.reload')}
                </button>
                <button type="button" className="btn danger" onClick={stop}>
                  <IconStop /> {t('btn.stop')}
                </button>
                <button type="button" className="btn primary" onClick={start}>
                  <IconPlay /> {t('btn.restart')}
                </button>
              </>
            ) : (
              <button type="button" className="btn primary" onClick={start}>
                <IconPlay /> {t('btn.start')}
              </button>
            )}
          </div>
        </header>

        {page === 'screens' && (
          <div className="screen-tabs-bar">
            <ScreenTabs
              screens={config.screens}
              displays={displays}
              activeId={activeScreen.id}
              onSelect={setActiveScreenId}
              onAdd={addScreen}
              onDelete={() => requestDelete(activeScreen.id)}
              t={t}
            />
          </div>
        )}

        <div className="page-body">
          {page === 'screens' && (
            <ScreensPage
              {...pageProps}
              screen={activeScreen}
              updateScreen={(patch) => updateScreen(activeScreen.id, patch)}
              layouts={layouts}
              layout={layout}
              displays={displays}
              onRefreshDisplays={refreshDisplays}
            />
          )}
          {page === 'startup' && <StartupPage {...pageProps} packaged={info?.packaged ?? true} />}
          {page === 'appearance' && <AppearancePage {...pageProps} />}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={t('confirm.deleteTitle')}
          message={t('confirm.deleteBody', { name: screenLabel(t, config.screens, pendingDelete) })}
          confirmLabel={t('btn.delete')}
          cancelLabel={t('btn.cancel')}
          danger
          onConfirm={() => removeScreen(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {toast && (
        <div className={'toast ' + toast.kind} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
