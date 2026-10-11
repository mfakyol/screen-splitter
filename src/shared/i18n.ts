export type Lang = 'tr' | 'en' | 'de'

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }
]

export const DEFAULT_LANG: Lang = 'en'

const tr = {
  'app.title': 'Ekran Bölücü',
  'app.subtitle': 'TV / kiosk için URL tabanlı ekran düzeni',
  'app.settingsTitle': 'Ekran Bölücü - Ayarlar',
  'app.loading': 'Yükleniyor…',

  'status.running': 'Oynatılıyor',
  'status.stopped': 'Durduruldu',

  'btn.save': 'Kaydet',
  'btn.reload': 'Yenile',
  'btn.stop': 'Durdur',
  'btn.restart': 'Yeniden Başlat',
  'btn.start': '▶ Oynatıcıyı Başlat',

  'section.layout': 'Düzen',
  'section.zones': 'Bölgeler',
  'section.display': 'Ekran & Başlatma',
  'section.autostart': 'Otomatik Başlatma',
  'section.shortcuts': 'Kısayollar',
  'section.language': 'Dil',

  'zones.hint': 'Düzenlemek için önizlemede bir bölgeye tıklayın.',
  'zone.url': 'Bölge {n} URL',
  'zone.urlPlaceholder': 'https://ornek.com/menu',
  'zone.refresh': 'Otomatik yenileme (sn, 0 = kapalı)',
  'zone.zoom': 'Yakınlaştırma (%)',
  'zone.muted': 'Sesi kapat',
  'zone.noUrl': 'URL yok',

  'display.target': 'Hedef ekran',
  'display.refresh': '(yenile)',
  'display.primary': 'Birincil ekran',
  'display.primaryTag': '(birincil)',
  'display.gap': 'Bölge arası boşluk (px)',
  'display.background': 'Arka plan',
  'display.hideCursor': 'Oynatıcıda fare imlecini gizle',

  'autostart.windows': 'Windows açılışında uygulamayı başlat',
  'autostart.autoplay': 'Uygulama açılınca doğrudan oynatıcıyı başlat (ayar penceresini açma)',
  'autostart.devWarn':
    'Geliştirme modundasınız: Windows başlangıcına electron.exe kaydedilir. Kurulum paketi (npm run dist) ile kullanmanız önerilir.',

  'keys.settings': 'Ayarları aç',
  'keys.stop': 'Oynatıcıyı durdur',
  'keys.reload': 'Bölgeleri yenile',
  'keys.quit': 'Uygulamadan çık',

  'toast.saved': 'Ayarlar kaydedildi',
  'toast.saveFailed': 'Kaydedilemedi: {err}',
  'toast.needUrl': 'En az bir bölgeye URL girin',
  'toast.started': 'Oynatıcı başlatıldı (durdurmak için Ctrl+Shift+X)',

  'tray.settings': 'Ayarlar',
  'tray.start': 'Oynatıcıyı Başlat',
  'tray.stop': 'Oynatıcıyı Durdur',
  'tray.reload': 'Bölgeleri Yenile',
  'tray.config': 'Config dosyasını göster',
  'tray.quit': 'Çıkış',
  'tray.tooltipRunning': 'Ekran Bölücü - Oynatılıyor',
  'tray.tooltip': 'Ekran Bölücü',

  'player.zone': 'Bölge {n}',
  'player.noUrl': 'URL ayarlanmamış',

  'layout.single': 'Tek Ekran',
  'layout.split-h': '2 Yan Yana',
  'layout.split-v': '2 Alt Alta',
  'layout.main-left': 'Büyük Sol + 2 Sağ',
  'layout.main-right': '2 Sol + Büyük Sağ',
  'layout.main-top': 'Büyük Üst + 2 Alt',
  'layout.main-bottom-bar': 'Büyük Üst + Alt Bant',
  'layout.sidebar-right': 'Büyük Sol + Sağ Bant',
  'layout.cols-3': '3 Sütun',
  'layout.grid-2x2': '2x2 Izgara',
  'layout.grid-3x2': '3x2 Izgara',
  'layout.grid-3x3': '3x3 Izgara'
}

export type TKey = keyof typeof tr

/** All translation keys (for dictionary integrity tests) */
export const TKEYS = Object.keys(tr) as TKey[]

const en: Record<TKey, string> = {
  'app.title': 'Screen Splitter',
  'app.subtitle': 'URL-based screen layouts for TVs & kiosks',
  'app.settingsTitle': 'Screen Splitter - Settings',
  'app.loading': 'Loading…',

  'status.running': 'Playing',
  'status.stopped': 'Stopped',

  'btn.save': 'Save',
  'btn.reload': 'Reload',
  'btn.stop': 'Stop',
  'btn.restart': 'Restart',
  'btn.start': '▶ Start Player',

  'section.layout': 'Layout',
  'section.zones': 'Zones',
  'section.display': 'Display & Startup',
  'section.autostart': 'Auto Start',
  'section.shortcuts': 'Shortcuts',
  'section.language': 'Language',

  'zones.hint': 'Click a zone in the preview to edit it.',
  'zone.url': 'Zone {n} URL',
  'zone.urlPlaceholder': 'https://example.com/menu',
  'zone.refresh': 'Auto refresh (sec, 0 = off)',
  'zone.zoom': 'Zoom (%)',
  'zone.muted': 'Mute audio',
  'zone.noUrl': 'No URL',

  'display.target': 'Target display',
  'display.refresh': '(refresh)',
  'display.primary': 'Primary display',
  'display.primaryTag': '(primary)',
  'display.gap': 'Gap between zones (px)',
  'display.background': 'Background',
  'display.hideCursor': 'Hide mouse cursor in player',

  'autostart.windows': 'Launch app at Windows login',
  'autostart.autoplay': 'Start player directly when app opens (skip settings window)',
  'autostart.devWarn':
    'Development mode: electron.exe will be registered for startup. Use the installer build (npm run dist) instead.',

  'keys.settings': 'Open settings',
  'keys.stop': 'Stop player',
  'keys.reload': 'Reload zones',
  'keys.quit': 'Quit app',

  'toast.saved': 'Settings saved',
  'toast.saveFailed': 'Save failed: {err}',
  'toast.needUrl': 'Enter a URL for at least one zone',
  'toast.started': 'Player started (press Ctrl+Shift+X to stop)',

  'tray.settings': 'Settings',
  'tray.start': 'Start Player',
  'tray.stop': 'Stop Player',
  'tray.reload': 'Reload Zones',
  'tray.config': 'Show config file',
  'tray.quit': 'Quit',
  'tray.tooltipRunning': 'Screen Splitter - Playing',
  'tray.tooltip': 'Screen Splitter',

  'player.zone': 'Zone {n}',
  'player.noUrl': 'No URL configured',

  'layout.single': 'Single',
  'layout.split-h': '2 Side by Side',
  'layout.split-v': '2 Stacked',
  'layout.main-left': 'Large Left + 2 Right',
  'layout.main-right': '2 Left + Large Right',
  'layout.main-top': 'Large Top + 2 Bottom',
  'layout.main-bottom-bar': 'Large Top + Bottom Bar',
  'layout.sidebar-right': 'Large Left + Right Bar',
  'layout.cols-3': '3 Columns',
  'layout.grid-2x2': '2x2 Grid',
  'layout.grid-3x2': '3x2 Grid',
  'layout.grid-3x3': '3x3 Grid'
}

const de: Record<TKey, string> = {
  'app.title': 'Bildschirmteiler',
  'app.subtitle': 'URL-basierte Bildschirmlayouts für TVs & Kioske',
  'app.settingsTitle': 'Bildschirmteiler - Einstellungen',
  'app.loading': 'Wird geladen…',

  'status.running': 'Läuft',
  'status.stopped': 'Gestoppt',

  'btn.save': 'Speichern',
  'btn.reload': 'Neu laden',
  'btn.stop': 'Stopp',
  'btn.restart': 'Neu starten',
  'btn.start': '▶ Player starten',

  'section.layout': 'Layout',
  'section.zones': 'Bereiche',
  'section.display': 'Bildschirm & Start',
  'section.autostart': 'Autostart',
  'section.shortcuts': 'Tastenkürzel',
  'section.language': 'Sprache',

  'zones.hint': 'Klicken Sie in der Vorschau auf einen Bereich, um ihn zu bearbeiten.',
  'zone.url': 'Bereich {n} URL',
  'zone.urlPlaceholder': 'https://beispiel.de/menu',
  'zone.refresh': 'Auto-Aktualisierung (Sek., 0 = aus)',
  'zone.zoom': 'Zoom (%)',
  'zone.muted': 'Ton aus',
  'zone.noUrl': 'Keine URL',

  'display.target': 'Zielbildschirm',
  'display.refresh': '(aktualisieren)',
  'display.primary': 'Hauptbildschirm',
  'display.primaryTag': '(primär)',
  'display.gap': 'Abstand zwischen Bereichen (px)',
  'display.background': 'Hintergrund',
  'display.hideCursor': 'Mauszeiger im Player ausblenden',

  'autostart.windows': 'App bei Windows-Anmeldung starten',
  'autostart.autoplay': 'Player beim Öffnen direkt starten (Einstellungen überspringen)',
  'autostart.devWarn':
    'Entwicklungsmodus: electron.exe wird für den Autostart registriert. Bitte das Installationspaket (npm run dist) verwenden.',

  'keys.settings': 'Einstellungen öffnen',
  'keys.stop': 'Player stoppen',
  'keys.reload': 'Bereiche neu laden',
  'keys.quit': 'App beenden',

  'toast.saved': 'Einstellungen gespeichert',
  'toast.saveFailed': 'Speichern fehlgeschlagen: {err}',
  'toast.needUrl': 'Geben Sie für mindestens einen Bereich eine URL ein',
  'toast.started': 'Player gestartet (Ctrl+Shift+X zum Stoppen)',

  'tray.settings': 'Einstellungen',
  'tray.start': 'Player starten',
  'tray.stop': 'Player stoppen',
  'tray.reload': 'Bereiche neu laden',
  'tray.config': 'Konfigurationsdatei anzeigen',
  'tray.quit': 'Beenden',
  'tray.tooltipRunning': 'Bildschirmteiler - Läuft',
  'tray.tooltip': 'Bildschirmteiler',

  'player.zone': 'Bereich {n}',
  'player.noUrl': 'Keine URL konfiguriert',

  'layout.single': 'Einzeln',
  'layout.split-h': '2 nebeneinander',
  'layout.split-v': '2 untereinander',
  'layout.main-left': 'Groß links + 2 rechts',
  'layout.main-right': '2 links + groß rechts',
  'layout.main-top': 'Groß oben + 2 unten',
  'layout.main-bottom-bar': 'Groß oben + Leiste unten',
  'layout.sidebar-right': 'Groß links + Leiste rechts',
  'layout.cols-3': '3 Spalten',
  'layout.grid-2x2': '2x2 Raster',
  'layout.grid-3x2': '3x2 Raster',
  'layout.grid-3x3': '3x3 Raster'
}

const DICTS: Record<Lang, Record<TKey, string>> = { tr, en, de }

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && LANGUAGES.some((l) => l.code === v)
}

/** Picks a supported language from the system locale ('tr-TR', 'en-US', ...). */
export function langFromLocale(locale: string): Lang {
  const code = locale.toLowerCase().split(/[-_]/)[0]
  return isLang(code) ? code : DEFAULT_LANG
}

export function t(lang: Lang, key: TKey, params?: Record<string, string | number>): string {
  const dict = DICTS[lang] ?? DICTS[DEFAULT_LANG]
  let s = dict[key] ?? DICTS[DEFAULT_LANG][key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replace('{' + k + '}', String(v))
  }
  return s
}

export const layoutName = (lang: Lang, layoutId: string): string =>
  t(lang, ('layout.' + layoutId) as TKey)
