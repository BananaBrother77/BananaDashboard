// Elements

const nav = {
  pageTitle: document.querySelector('.page-title'),
  btns: document.querySelectorAll('.nav-item[data-tab]'),
  contents: document.querySelectorAll('.tab-content'),
};

const overview = {
  osVersion: document.getElementById('osVersionCard'),
  welcome: document.getElementById('welcomeHeading'),
  userName: document.getElementById('userName'),
  hostname: document.getElementById('hostnameCard'),
  kernelVersion: document.getElementById('kernelVersionCard'),
  cpu: document.getElementById('cpuCard'),
  cpuCores: document.getElementById('cpuCoresCard'),
  ram: document.getElementById('ramCard'),
  gpu: document.getElementById('gpuCard'),
};

const rpc = {
  bar: document.getElementById('rpcStatusBar'),
  dot: document.getElementById('rpcDot'),
  text: document.getElementById('rpcStatusText'),
  reconnect: document.getElementById('rpcReconnectBtn'),
  toggle: document.getElementById('rpcToggleBtn'),
};

const update = {
  bar: document.getElementById('updateStatusBar'),
  text: document.getElementById('updateStatusText'),
  progress: document.getElementById('updateProgressBar'),
  progressFill: document.getElementById('updateProgressFill'),
  checkBtn: document.getElementById('updateCheckBtn'),
  installBtn: document.getElementById('updateInstallBtn'),
};

const updateToast = document.getElementById('updateToast');
const toastClose = document.getElementById('toastClose');

function showToast(title, desc) {
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastDesc').textContent = desc;
  updateToast.hidden = false;
  updateToast.onclick = () => {
    updateToast.hidden = true;
    switchTab('settings');
    if (window.switchSettingsCategory) switchSettingsCategory('updates');
  };
  if (toastClose) {
    toastClose.onclick = (e) => {
      e.stopPropagation();
      updateToast.hidden = true;
    };
  }
  setTimeout(() => { updateToast.hidden = true; }, 8000);
}

const versionEl = document.getElementById('appVersion');

const webviews = {
  mcToolkit: document.getElementById('mcToolkitWebview'),
  mcServerHost: document.getElementById('mcServerHostWebview'),
  mcshTools: document.getElementById('mcshToolsWebview'),
  mcshStatus: document.getElementById('mcshStatusWebview'),
};

const actionCards = document.querySelectorAll('.action-card[data-tab]');
const webviewFullscreenBtn = document.getElementById('webviewFullscreenBtn');
const refreshBtn = document.querySelector('.icon-btn[title="Refresh"]');
const themeCards = document.querySelectorAll('.theme-card');
const langSwitchBtn = document.getElementById('langSwitchBtn');
const refreshSelect = document.getElementById('refreshSelect');
const detail = {
  toggle: document.getElementById('detailToggle'),
  grid: document.getElementById('detailGrid'),
};
const sidebarEdge = document.getElementById('sidebarEdge');
const loaderOverlay = document.getElementById('loaderOverlay');
const settingsNavItems = document.querySelectorAll('.settings-nav-item');
const settingsCategories = document.querySelectorAll('.settings-category');
const settingsSearch = document.getElementById('settingsSearch');
const webviewExitBtns = document.querySelectorAll('.webview-exit-btn');

function injectNoBlur(webview) {
  if (!webview) return;
  webview.addEventListener('dom-ready', () => {
    webview.insertCSS(
      '*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
    );
  });
}

injectNoBlur(webviews.mcToolkit);
injectNoBlur(webviews.mcshStatus);

function switchTab(tabName) {
  nav.btns.forEach((b) => b.classList.remove('active'));
  nav.contents.forEach((t) => t.classList.remove('active'));

  const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  const content = document.getElementById(
    'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1),
  );
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  if (btn) {
    const label = btn.querySelector('[data-i18n]');
    const text = label ? label.textContent : btn.textContent.trim();
    nav.pageTitle.textContent = text;
    document.title = text + ' - BananaDashboard | BananaBrother77';
    const rpcTexts = {
      overview: 'Viewing System Information',
      resources: 'Monitoring Live Resources',
      network: 'Checking Network Status',
      battery: 'Viewing Battery Status',
      processes: 'Managing Processes',
      startup: 'Managing Startup Apps',
      files: 'Browsing Files',
      mcServerHost: 'Viewing MCServerHost',
      mcshTools: 'Using MCSH Tools',
      mcshStatus: 'Viewing MCSH Status',
      mcToolkit: 'Using MCToolkit',
      stats: 'Viewing Website Statistics',
      settings: 'Tweaking Settings',
    };
    window.dashboardAPI.setTab(rpcTexts[tabName] || text);
  }
  history.replaceState(null, '', '?tab=' + tabName);

  if (tabName === 'resources' && typeof resources !== 'undefined') {
    setTimeout(() => resources.init(), 500);
  } else if (typeof resources !== 'undefined') {
    resources.destroy();
  }

  if (content && window.resetReveal) resetReveal(content);

  // Webview visibility — native layer ignores parent display:none
  const activeWebviews = ['mcToolkit', 'mcServerHost', 'mcshTools', 'mcshStatus'];
  activeWebviews.forEach((name) => {
    const wv = webviews[name];
    if (wv) wv.style.display = tabName === name ? '' : 'none';
  });
}

function getTabFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'overview';
}

nav.btns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

actionCards.forEach((card) => {
  card.addEventListener('click', () => switchTab(card.dataset.tab));
});

document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key);
  if (num >= 1 && num <= nav.btns.length) {
    switchTab(nav.btns[num - 1].dataset.tab);
  }
});

// Webview fullscreen
function isWebviewTab(tabName) {
  return ['mcServerHost', 'mcshTools', 'mcshStatus', 'mcToolkit'].includes(tabName);
}
function showWebviewFullscreenBtn(show) {
  if (webviewFullscreenBtn)
    webviewFullscreenBtn.classList.toggle('hidden', !show);
}
function updateFullscreenBtnIcon() {
  if (!webviewFullscreenBtn) return;
  const btn = webviewFullscreenBtn;
  const icon = btn.querySelector('[data-lucide]');
  if (icon) {
    icon.setAttribute(
      'data-lucide',
      document.body.classList.contains('webview-fullscreen')
        ? 'minimize-2'
        : 'maximize',
    );
  }
  if (window.lucide) lucide.createIcons();
}

const _origSwitchTab = switchTab;
switchTab = function (tabName) {
  _origSwitchTab(tabName);
  showWebviewFullscreenBtn(isWebviewTab(tabName));
  if (
    !isWebviewTab(tabName) &&
    document.body.classList.contains('webview-fullscreen')
  ) {
    document.body.classList.remove('webview-fullscreen');
    updateFullscreenBtnIcon();
  }
};

switchTab(getTabFromURL());

refreshBtn.addEventListener('click', () => {
  const active = document.querySelector('.tab-content.active');
  const tab = active ? active.id.replace(/^tab/, '').toLowerCase() : 'overview';
  if (tab === 'overview') loadSystemInfo();
  if (tab === 'resources' && resources.interval) resources.fetchAndUpdate();
  if (tab === 'mctoolkit' && webviews.mcToolkit) webviews.mcToolkit.reload();
  if (tab === 'mcserverhost' && webviews.mcServerHost) webviews.mcServerHost.reload();
  if (tab === 'mcshtools' && webviews.mcshTools) webviews.mcshTools.reload();
  if (tab === 'mcshstatus' && webviews.mcshStatus) webviews.mcshStatus.reload();
});

// Theme switching
function setTheme(theme) {
  const body = document.body;
  body.className = body.className.replace(/theme-\w+/g, '').trim();
  if (theme !== 'purple') body.classList.add('theme-' + theme);
  localStorage.setItem('banana-theme', theme);
  themeCards.forEach((c) => {
    c.classList.toggle('active', c.dataset.theme === theme);
  });
  if (typeof resources !== 'undefined' && resources.applyTheme) {
    resources.applyTheme();
  }
}

themeCards.forEach((card) => {
  card.addEventListener('click', () => setTheme(card.dataset.theme));
});

const saved = localStorage.getItem('banana-theme');
if (saved) setTheme(saved);

langSwitchBtn?.addEventListener('click', toggleLanguage);

// Custom dropdown
(function () {
  const container = refreshSelect;
  if (!container) return;
  const trigger = container.querySelector('.select-trigger');
  const valueEl = container.querySelector('.select-value');
  const options = container.querySelectorAll('.select-option');

  function selectValue(opt) {
    options.forEach((o) => o.classList.remove('selected'));
    opt.classList.add('selected');
    valueEl.textContent = opt.textContent;
    container.classList.remove('open');
    const ms = parseInt(opt.dataset.value);
    localStorage.setItem('banana-refresh', ms);
    if (typeof resources !== 'undefined') resources.setRefreshRate(ms);
  }

  const savedRate = localStorage.getItem('banana-refresh');
  if (savedRate) {
    const match = Array.from(options).find(
      (o) => o.dataset.value === savedRate,
    );
    if (match) selectValue(match);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  options.forEach((opt) => {
    opt.addEventListener('click', () => selectValue(opt));
  });

  document.addEventListener('click', () => container.classList.remove('open'));
})();

async function loadSystemInfo() {
  const info = await window.dashboardAPI.getSystemInfo();
  overview.osVersion.textContent = info.distro;
  if (overview.userName) overview.userName.textContent = info.user;
  overview.kernelVersion.textContent = info.release;
  overview.cpu.textContent = info.cpuModel;
  overview.cpuCores.textContent = `${info.cpuCores} cores`;
  overview.ram.textContent = `${(info.totalMem / 1024 ** 3).toFixed(2)} GB`;
  if (overview.gpu) overview.gpu.textContent = info.gpu;
  if (overview.hostname)
    overview.hostname.textContent = info.deviceName || info.hostname;
}

// More Info toggle
const detailFields = [
  'uptime',
  'shell',
  'de',
  'terminal',
  'packages',
  'localIp',
  'battery',
  'swap',
];

if (detail.toggle && detail.grid) {
  detail.toggle.addEventListener('click', async () => {
    const isOpen = detail.toggle.classList.toggle('open');
    detail.grid.style.display = isOpen ? 'grid' : 'none';

    if (isOpen && !detail.toggle.dataset.loaded) {
      detail.toggle.dataset.loaded = 'true';
      try {
        const info = await window.dashboardAPI.getDetailedSysinfo();
        for (const field of detailFields) {
          const el = document.getElementById(
            'detail' + field.charAt(0).toUpperCase() + field.slice(1),
          );
          if (el) el.textContent = info[field] || '\u2014';
        }
      } catch {}
    }
  });
}

// Discord RPC status UI
if (rpc.bar) {
  const rpcStates = {
    connected: { cls: 'connected', key: 'rpc_connected' },
    disconnected: { cls: 'disconnected', key: 'rpc_disconnected' },
    disabled: { cls: 'disabled', key: 'rpc_disabled' },
    connecting: { cls: 'connecting', key: 'rpc_connecting' },
  };

  function updateRpcUI(status) {
    let state;
    if (!status.enabled) {
      state = rpcStates.disabled;
    } else if (status.connected) {
      state = rpcStates.connected;
    } else {
      state = rpcStates.disconnected;
    }

    rpc.bar.className = 'rpc-status ' + state.cls;
    rpc.dot.className = 'rpc-dot ' + state.cls;

    const text = getTranslation(state.key) || state.key;
    rpc.text.textContent = text;

    const isEnabled = status.enabled;
    const toggleSpan = rpc.toggle.querySelector('span');
    const toggleIcon = rpc.toggle.querySelector('i');
    if (toggleSpan) {
      toggleSpan.textContent = getTranslation(
        isEnabled ? 'rpc_disable' : 'rpc_enable',
      );
    }
    if (toggleIcon) {
      toggleIcon.setAttribute('data-lucide', isEnabled ? 'power' : 'power-off');
    }
    if (window.lucide) lucide.createIcons();
  }

  window.dashboardAPI.onRpcStatus(updateRpcUI);

  rpc.reconnect.addEventListener('click', () => {
    window.dashboardAPI.reconnectRpc();
  });

  rpc.toggle.addEventListener('click', () => {
    window.dashboardAPI.getRpcStatus().then((s) => {
      window.dashboardAPI.setRpcEnabled(!s.enabled);
    });
  });
}

// Auto-updater UI
if (update.bar) {
  let updateReady = false;

  window.dashboardAPI.onUpdateStatus((data) => {
    switch (data.status) {
      case 'checking':
        update.text.textContent =
          getTranslation('update_checking') || 'Checking for updates...';
        update.bar.className = 'update-status';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');
        break;
      case 'available':
        const ver = data.info ? data.info.version : '';
        update.text.textContent =
          getTranslation('update_available') + ' (v' + ver + ')';
        update.bar.className = 'update-status available';
        updateReady = false;
        update.installBtn.classList.remove('hidden');
        update.installBtn.querySelector('span').textContent =
          getTranslation('update_download_btn') || 'Download';
        showToast(
          getTranslation('update_available') || 'Update available',
          'v' + ver
        );
        break;
      case 'not-available':
        update.text.textContent =
          getTranslation('update_current') || 'You are up to date';
        update.bar.className = 'update-status current';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');
        break;
      case 'downloading':
        update.bar.className = 'update-status downloading';
        update.text.textContent =
          (getTranslation('update_downloading') || 'Downloading') +
          ' ' +
          Math.round(data.progress.percent) +
          '%';
        update.progress.classList.remove('hidden');
        update.progressFill.style.width = data.progress.percent + '%';
        update.installBtn.classList.add('hidden');
        break;
      case 'downloaded':
        update.bar.className = 'update-status downloaded';
        update.text.textContent =
          getTranslation('update_downloaded') || 'Update ready to install';
        update.progress.classList.add('hidden');
        updateReady = true;
        update.installBtn.classList.remove('hidden');
        update.installBtn.querySelector('span').textContent =
          getTranslation('update_install_btn') || 'Restart & Install';
        break;
      case 'error':
        update.bar.className = 'update-status error';
        update.text.textContent =
          getTranslation('update_error') || 'Could not check for updates';
        update.progress.classList.add('hidden');
        update.installBtn.classList.add('hidden');
        break;
    }
  });

  update.checkBtn.addEventListener('click', () => {
    window.dashboardAPI.checkForUpdates();
  });

  update.installBtn.addEventListener('click', () => {
    if (updateReady) {
      window.dashboardAPI.quitAndInstall();
    } else {
      update.installBtn.classList.add('hidden');
      window.dashboardAPI.downloadUpdate();
    }
  });
}

// Sidebar toggle
function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  localStorage.setItem(
    'sidebarCollapsed',
    document.body.classList.contains('sidebar-collapsed'),
  );
}

if (sidebarEdge) {
  sidebarEdge.addEventListener('click', toggleSidebar);
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleSidebar();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    showToast(
      getTranslation('update_available') || 'Update available',
      'v0.0.0'
    );
  }
});

// Restore sidebar state
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  document.body.classList.add('sidebar-collapsed');
}

Promise.all([
  loadSystemInfo(),
  versionEl
    ? window.dashboardAPI.getAppVersion().then((v) => {
        versionEl.textContent = 'v' + v;
      })
    : Promise.resolve(),
  new Promise((r) => setTimeout(r, 1000)),
]).then(() => {
  if (loaderOverlay) {
    loaderHidden = true;
    loaderOverlay.classList.add('hidden');
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && window.resetReveal) resetReveal(activeTab);
  }
});

// Settings category nav + search
(function () {
  function switchCategory(catId) {
    settingsNavItems.forEach((b) =>
      b.classList.toggle('active', b.dataset.settingCat === catId),
    );
    if (catId === 'all') {
      settingsCategories.forEach((c) => {
        c.classList.add('active');
        animateReveal(c);
      });
    } else {
      settingsCategories.forEach((c) => {
        const show = c.dataset.category === catId;
        c.classList.toggle('active', show);
        if (show) animateReveal(c);
      });
    }
  }

  window.switchSettingsCategory = switchCategory;

  function animateReveal(el) {
    if (!el.classList.contains('reveal')) return;
    el.classList.remove('visible');
    el.style.transitionDelay = '0s';
    observer.unobserve(el);
    observer.observe(el);
  }

  settingsNavItems.forEach((btn) => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.settingCat));
  });

  if (settingsSearch) {
    settingsSearch.addEventListener('input', () => {
      const q = settingsSearch.value.toLowerCase().trim();
      const activeCat = document.querySelector('.settings-nav-item.active')
        ?.dataset.settingCat;
      settingsCategories.forEach((cat) => {
        const textMatch = q === '' || cat.textContent.toLowerCase().includes(q);
        const catMatch =
          q === ''
            ? activeCat === 'all' || cat.dataset.category === activeCat
            : textMatch;
        cat.classList.toggle('active', catMatch);
      });
      settingsNavItems.forEach((btn) => {
        const cat = document.querySelector(
          `.settings-category[data-category="${btn.dataset.settingCat}"]`,
        );
        btn.style.display =
          !cat || q === '' || cat.textContent.toLowerCase().includes(q)
            ? ''
            : 'none';
      });
    });
  }
})();

// Webview fullscreen listeners
if (webviewFullscreenBtn) {
  webviewFullscreenBtn.addEventListener('click', () => {
    document.body.classList.toggle('webview-fullscreen');
    updateFullscreenBtnIcon();
  });
}
webviewExitBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    document.body.classList.remove('webview-fullscreen');
    updateFullscreenBtnIcon();
  });
});
