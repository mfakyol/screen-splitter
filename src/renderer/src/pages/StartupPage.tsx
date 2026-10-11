import type React from 'react'
import type { PageProps } from '../pageProps'
import { Card } from '../components/Card'
import Switch from '../components/Switch'
import { IconDownload, IconUpload } from '../components/Icons'

interface Props extends PageProps {
  packaged: boolean
  onExport: () => void
  onImport: () => void
}

const SHORTCUTS: { keys: string[]; label: 'keys.settings' | 'keys.stop' | 'keys.reload' | 'keys.quit' }[] = [
  { keys: ['Ctrl', 'Shift', 'S'], label: 'keys.settings' },
  { keys: ['Ctrl', 'Shift', 'X'], label: 'keys.stop' },
  { keys: ['Ctrl', 'Shift', 'R'], label: 'keys.reload' },
  { keys: ['Ctrl', 'Shift', 'Q'], label: 'keys.quit' }
]

export default function StartupPage({ config, t, update, packaged, onExport, onImport }: Props): React.JSX.Element {
  return (
    <div className="page-stack narrow">
      <Card title={t('section.autostart')}>
        <div className="setting-row">
          <Switch
            label={t('autostart.windows')}
            description={t('autostart.windowsDesc')}
            checked={config.autostart}
            onChange={(autostart) => update({ autostart })}
          />
        </div>
        <div className="setting-row">
          <Switch
            label={t('autostart.autoplay')}
            description={t('autostart.autoplayDesc')}
            checked={config.autoplay}
            onChange={(autoplay) => update({ autoplay })}
          />
        </div>
        {!packaged && config.autostart && <p className="notice warn">{t('autostart.devWarn')}</p>}
      </Card>

      <Card title={t('section.player')}>
        <div className="setting-row">
          <Switch
            label={t('display.hideCursor')}
            description={t('display.hideCursorDesc')}
            checked={config.hideCursor}
            onChange={(hideCursor) => update({ hideCursor })}
          />
        </div>
      </Card>

      <Card title={t('section.backup')} description={t('backup.desc')}>
        <div className="backup-row">
          <button type="button" className="btn" onClick={onExport}>
            <IconDownload /> {t('backup.export')}
          </button>
          <button type="button" className="btn" onClick={onImport}>
            <IconUpload /> {t('backup.import')}
          </button>
        </div>
      </Card>

      <Card title={t('section.shortcuts')}>
        <ul className="shortcut-list">
          {SHORTCUTS.map((s) => (
            <li key={s.label}>
              <span>{t(s.label)}</span>
              <span className="keys">
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
