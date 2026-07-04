const translations = {
  en: {
    tab_overview: 'System Overview',
    tab_resources: 'Resources',
    tab_network: 'Network',
    tab_battery: 'Battery',
    tab_processes: 'Process Manager',
    tab_startup: 'Startup Apps',
    tab_files: 'File Manager',
    tab_stats: 'Website Statistics',
    tab_settings: 'Settings',
    overview_welcome: 'Welcome back, Banana!',
    action_system: 'System Information',
    action_system_sub: 'View detailed system info',
    action_resources: 'Live Resources',
    action_resources_sub: 'Monitor CPU, RAM, disk',
    action_files: 'File Manager',
    action_files_sub: 'Browse and manage files',
    label_os: 'OS',
    label_kernel: 'Kernel',
    label_cpu: 'CPU',
    label_cores: 'Cores',
    label_ram: 'RAM',
    label_disk: 'Disk',
    chart_cpu: 'CPU Usage',
    chart_ram: 'RAM Usage',
    chart_storage: 'Storage',
    settings_theme: 'Theme',
    settings_desc: 'Choose your accent colour scheme.',
    settings_language: 'Language',
    lang_name: 'English',
    language_switch_target: 'German',
    settings_refresh: 'Resource Refresh',
    settings_refresh_off: 'Off',
    settings_version: 'Version',
    settings_updates: 'Updates',
    loader_sub: 'Loading your Dashboard',
    update_checking: 'Checking for updates...',
    update_available: 'Update available',
    update_current: 'You are up to date',
    update_download_btn: 'Download',
    update_downloading: 'Downloading',
    update_downloaded: 'Update ready to install',
    update_error: 'Update failed',
    update_check_btn: 'Check for Updates',
    update_install_btn: 'Restart & Install',
    settings_rpc: 'Discord Rich Presence',
    rpc_connected: 'Connected',
    rpc_disconnected: 'Disconnected',
    rpc_disabled: 'Disabled',
    rpc_connecting: 'Connecting...',
    rpc_reconnect: 'Reconnect',
    rpc_disable: 'Disable',
    rpc_enable: 'Enable',
    rpc_desc: 'Show your current tab and system info in your Discord status.',
  },
  de: {
    tab_overview: 'Systemübersicht',
    tab_resources: 'Ressourcen',
    tab_network: 'Netzwerk',
    tab_battery: 'Akku',
    tab_processes: 'Prozessmanager',
    tab_startup: 'Autostart',
    tab_files: 'Dateimanager',
    tab_stats: 'Webseitenstatistik',
    tab_settings: 'Einstellungen',
    overview_welcome: 'Willkommen zurück, Banana!',
    action_system: 'Systeminformationen',
    action_system_sub: 'Detaillierte Systeminfo anzeigen',
    action_resources: 'Live-Ressourcen',
    action_resources_sub: 'CPU, RAM, Festplatte überwachen',
    action_files: 'Dateimanager',
    action_files_sub: 'Dateien durchsuchen und verwalten',
    label_os: 'Betriebssystem',
    label_kernel: 'Kernel',
    label_cpu: 'CPU',
    label_cores: 'Kerne',
    label_ram: 'RAM',
    label_disk: 'Festplatte',
    chart_cpu: 'CPU-Auslastung',
    chart_ram: 'RAM-Auslastung',
    chart_storage: 'Speicher',
    settings_theme: 'Erscheinungsbild',
    settings_desc: 'Wähle dein Akzent-Farbschema.',
    settings_language: 'Sprache',
    lang_name: 'Deutsch',
    language_switch_target: 'English',
    settings_refresh: 'Ressourcen-Aktualisierung',
    settings_refresh_off: 'Aus',
    settings_version: 'Version',
    settings_updates: 'Updates',
    loader_sub: 'Lade dein Dashboard',
    update_checking: 'Suche nach Updates...',
    update_available: 'Update verfügbar',
    update_current: 'Du bist auf dem neuesten Stand',
    update_download_btn: 'Herunterladen',
    update_downloading: 'Lade herunter',
    update_downloaded: 'Update bereit zur Installation',
    update_error: 'Update fehlgeschlagen',
    update_check_btn: 'Nach Updates suchen',
    update_install_btn: 'Neustarten & Installieren',
    settings_rpc: 'Discord Rich Presence',
    rpc_connected: 'Verbunden',
    rpc_disconnected: 'Getrennt',
    rpc_disabled: 'Deaktiviert',
    rpc_connecting: 'Verbinde...',
    rpc_reconnect: 'Neu verbinden',
    rpc_disable: 'Deaktivieren',
    rpc_enable: 'Aktivieren',
    rpc_desc: 'Zeige aktuellen Tab und Systeminfo in deinem Discord-Status.',
  },
};

const savedLang = localStorage.getItem('banana-language');
let currentLang = savedLang || 'en';
document.documentElement.lang = currentLang;

function getTranslation(key) {
  return translations[currentLang]?.[key] || translations.en?.[key] || '';
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = getTranslation(key);
    if (value) el.textContent = value;
  });
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'de' : 'en';
  localStorage.setItem('banana-language', currentLang);
  document.documentElement.lang = currentLang;
  applyTranslations();
}

applyTranslations();
