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

  'nav.layout': 'Düzen & Bölgeler',
  'nav.display': 'Ekran',
  'nav.startup': 'Başlatma',
  'nav.appearance': 'Görünüm',

  'page.layout.desc': 'Ekranı nasıl böleceğinizi seçin ve her bölgeye bir web adresi verin.',
  'page.display.desc': 'Oynatıcının hangi ekranda ve nasıl görüneceğini ayarlayın.',
  'page.startup.desc': 'Uygulamanın Windows ile birlikte nasıl açılacağını belirleyin.',
  'page.appearance.desc': 'Ayar penceresinin tema, renk ve dil tercihleri.',

  'status.running': 'Oynatılıyor',
  'status.stopped': 'Durduruldu',
  'status.unsaved': 'Kaydedilmemiş değişiklikler',

  'btn.save': 'Kaydet',
  'btn.reload': 'Yenile',
  'btn.stop': 'Durdur',
  'btn.restart': 'Yeniden Başlat',
  'btn.start': 'Oynatıcıyı Başlat',

  'section.preview': 'Önizleme',
  'section.layouts': 'Düzenler',
  'section.zones': 'Bölgeler',
  'section.autostart': 'Otomatik Başlatma',
  'section.shortcuts': 'Kısayollar',

  'zones.hint': 'Önizlemede bir bölgeye tıklayarak ilgili alana gidin.',
  'zone.title': 'Bölge {n}',
  'zone.url': 'Bölge {n} URL',
  'zone.urlPlaceholder': 'https://ornek.com/menu',
  'zone.refresh': 'Otomatik yenileme (sn, 0 = kapalı)',
  'zone.refreshShort': 'Yenileme (sn)',
  'zone.zoom': 'Yakınlaştırma (%)',
  'zone.muted': 'Sesi kapat',
  'zone.noUrl': 'URL yok',
  'zone.empty': 'Boş',
  'zone.filled': 'Hazır',

  'display.target': 'Hedef ekran',
  'display.targetDesc': 'Oynatıcı tam ekran olarak bu ekranda açılır.',
  'display.refresh': 'Ekranları yenile',
  'display.primary': 'Birincil ekran',
  'display.primaryTag': 'Birincil',
  'display.auto': 'Otomatik',
  'display.autoDesc': 'Birincil ekran kullanılır',
  'display.gap': 'Bölge arası boşluk',
  'display.gapDesc': 'Bölgeler arasındaki boşluk, piksel',
  'display.background': 'Arka plan rengi',
  'display.backgroundDesc': 'Boşluklarda ve sayfa yüklenirken görünür',
  'display.hideCursor': 'Fare imlecini gizle',
  'display.hideCursorDesc': 'Oynatıcı açıkken imleç görünmez',

  'autostart.windows': 'Windows açılışında başlat',
  'autostart.windowsDesc': 'Oturum açıldığında uygulama arka planda çalışır',
  'autostart.autoplay': 'Doğrudan oynatıcıyı aç',
  'autostart.autoplayDesc': 'Uygulama açılınca ayar penceresi yerine oynatıcı başlar',
  'autostart.devWarn':
    'Geliştirme modundasınız: Windows başlangıcına electron.exe kaydedilir. Kurulum paketi (npm run dist) ile kullanmanız önerilir.',

  'keys.settings': 'Ayarları aç',
  'keys.stop': 'Oynatıcıyı durdur',
  'keys.reload': 'Bölgeleri yenile',
  'keys.quit': 'Uygulamadan çık',

  'appearance.theme': 'Tema',
  'appearance.themeDesc': 'Ayar penceresinin renk düzeni',
  'theme.system': 'Sistem',
  'theme.light': 'Açık',
  'theme.dark': 'Koyu',
  'appearance.accent': 'Vurgu rengi',
  'appearance.accentDesc': 'Düğmeler ve seçili öğeler için',
  'accent.blue': 'Mavi',
  'accent.violet': 'Mor',
  'accent.emerald': 'Yeşil',
  'accent.orange': 'Turuncu',
  'accent.rose': 'Pembe',
  'accent.teal': 'Turkuaz',
  'appearance.language': 'Dil',
  'appearance.languageDesc': 'Arayüz ve tray menüsü dili',

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

  'nav.layout': 'Layout & Zones',
  'nav.display': 'Display',
  'nav.startup': 'Startup',
  'nav.appearance': 'Appearance',

  'page.layout.desc': 'Choose how to split the screen and give each zone a web address.',
  'page.display.desc': 'Pick the display the player runs on and how it looks.',
  'page.startup.desc': 'Decide how the app launches together with Windows.',
  'page.appearance.desc': 'Theme, color and language preferences for the settings window.',

  'status.running': 'Playing',
  'status.stopped': 'Stopped',
  'status.unsaved': 'Unsaved changes',

  'btn.save': 'Save',
  'btn.reload': 'Reload',
  'btn.stop': 'Stop',
  'btn.restart': 'Restart',
  'btn.start': 'Start Player',

  'section.preview': 'Preview',
  'section.layouts': 'Layouts',
  'section.zones': 'Zones',
  'section.autostart': 'Auto Start',
  'section.shortcuts': 'Shortcuts',

  'zones.hint': 'Click a zone in the preview to jump to its settings.',
  'zone.title': 'Zone {n}',
  'zone.url': 'Zone {n} URL',
  'zone.urlPlaceholder': 'https://example.com/menu',
  'zone.refresh': 'Auto refresh (sec, 0 = off)',
  'zone.refreshShort': 'Refresh (sec)',
  'zone.zoom': 'Zoom (%)',
  'zone.muted': 'Mute audio',
  'zone.noUrl': 'No URL',
  'zone.empty': 'Empty',
  'zone.filled': 'Ready',

  'display.target': 'Target display',
  'display.targetDesc': 'The player opens full screen on this display.',
  'display.refresh': 'Refresh displays',
  'display.primary': 'Primary display',
  'display.primaryTag': 'Primary',
  'display.auto': 'Automatic',
  'display.autoDesc': 'Uses the primary display',
  'display.gap': 'Gap between zones',
  'display.gapDesc': 'Space between zones, in pixels',
  'display.background': 'Background color',
  'display.backgroundDesc': 'Visible in gaps and while pages load',
  'display.hideCursor': 'Hide mouse cursor',
  'display.hideCursorDesc': 'The cursor is invisible while the player runs',

  'autostart.windows': 'Launch at Windows login',
  'autostart.windowsDesc': 'The app runs in the background after sign-in',
  'autostart.autoplay': 'Open the player directly',
  'autostart.autoplayDesc': 'Start the player instead of the settings window',
  'autostart.devWarn':
    'Development mode: electron.exe will be registered for startup. Use the installer build (npm run dist) instead.',

  'keys.settings': 'Open settings',
  'keys.stop': 'Stop player',
  'keys.reload': 'Reload zones',
  'keys.quit': 'Quit app',

  'appearance.theme': 'Theme',
  'appearance.themeDesc': 'Color scheme of the settings window',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'appearance.accent': 'Accent color',
  'appearance.accentDesc': 'Used for buttons and selected items',
  'accent.blue': 'Blue',
  'accent.violet': 'Violet',
  'accent.emerald': 'Green',
  'accent.orange': 'Orange',
  'accent.rose': 'Rose',
  'accent.teal': 'Teal',
  'appearance.language': 'Language',
  'appearance.languageDesc': 'Interface and tray menu language',

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

  'nav.layout': 'Layout & Bereiche',
  'nav.display': 'Bildschirm',
  'nav.startup': 'Start',
  'nav.appearance': 'Darstellung',

  'page.layout.desc': 'Wählen Sie die Aufteilung und geben Sie jedem Bereich eine Webadresse.',
  'page.display.desc': 'Legen Sie fest, auf welchem Bildschirm der Player läuft und wie er aussieht.',
  'page.startup.desc': 'Bestimmen Sie, wie die App zusammen mit Windows startet.',
  'page.appearance.desc': 'Thema, Farbe und Sprache des Einstellungsfensters.',

  'status.running': 'Läuft',
  'status.stopped': 'Gestoppt',
  'status.unsaved': 'Ungespeicherte Änderungen',

  'btn.save': 'Speichern',
  'btn.reload': 'Neu laden',
  'btn.stop': 'Stopp',
  'btn.restart': 'Neu starten',
  'btn.start': 'Player starten',

  'section.preview': 'Vorschau',
  'section.layouts': 'Layouts',
  'section.zones': 'Bereiche',
  'section.autostart': 'Autostart',
  'section.shortcuts': 'Tastenkürzel',

  'zones.hint': 'Klicken Sie in der Vorschau auf einen Bereich, um zu seinen Einstellungen zu springen.',
  'zone.title': 'Bereich {n}',
  'zone.url': 'Bereich {n} URL',
  'zone.urlPlaceholder': 'https://beispiel.de/menu',
  'zone.refresh': 'Auto-Aktualisierung (Sek., 0 = aus)',
  'zone.refreshShort': 'Aktualisierung (Sek.)',
  'zone.zoom': 'Zoom (%)',
  'zone.muted': 'Ton aus',
  'zone.noUrl': 'Keine URL',
  'zone.empty': 'Leer',
  'zone.filled': 'Bereit',

  'display.target': 'Zielbildschirm',
  'display.targetDesc': 'Der Player öffnet sich im Vollbild auf diesem Bildschirm.',
  'display.refresh': 'Bildschirme aktualisieren',
  'display.primary': 'Hauptbildschirm',
  'display.primaryTag': 'Primär',
  'display.auto': 'Automatisch',
  'display.autoDesc': 'Verwendet den Hauptbildschirm',
  'display.gap': 'Abstand zwischen Bereichen',
  'display.gapDesc': 'Abstand zwischen den Bereichen in Pixeln',
  'display.background': 'Hintergrundfarbe',
  'display.backgroundDesc': 'Sichtbar in Abständen und beim Laden',
  'display.hideCursor': 'Mauszeiger ausblenden',
  'display.hideCursorDesc': 'Der Zeiger ist unsichtbar, solange der Player läuft',

  'autostart.windows': 'Bei Windows-Anmeldung starten',
  'autostart.windowsDesc': 'Die App läuft nach der Anmeldung im Hintergrund',
  'autostart.autoplay': 'Player direkt öffnen',
  'autostart.autoplayDesc': 'Startet den Player statt des Einstellungsfensters',
  'autostart.devWarn':
    'Entwicklungsmodus: electron.exe wird für den Autostart registriert. Bitte das Installationspaket (npm run dist) verwenden.',

  'keys.settings': 'Einstellungen öffnen',
  'keys.stop': 'Player stoppen',
  'keys.reload': 'Bereiche neu laden',
  'keys.quit': 'App beenden',

  'appearance.theme': 'Thema',
  'appearance.themeDesc': 'Farbschema des Einstellungsfensters',
  'theme.system': 'System',
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
  'appearance.accent': 'Akzentfarbe',
  'appearance.accentDesc': 'Für Schaltflächen und ausgewählte Elemente',
  'accent.blue': 'Blau',
  'accent.violet': 'Violett',
  'accent.emerald': 'Grün',
  'accent.orange': 'Orange',
  'accent.rose': 'Rosé',
  'accent.teal': 'Türkis',
  'appearance.language': 'Sprache',
  'appearance.languageDesc': 'Sprache der Oberfläche und des Tray-Menüs',

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
