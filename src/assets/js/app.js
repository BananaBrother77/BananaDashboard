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

const versionEl = document.getElementById('appVersion');

const mctoolkit = {
  webview: document.getElementById('mctoolkitWebview'),
};

if (mctoolkit.webview) {
  mctoolkit.webview.addEventListener('dom-ready', () => {
    mctoolkit.webview.insertCSS(
      '*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
    );
  });
}

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
      mctoolkit: 'Using MCToolkit',
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
  if (mctoolkit.webview) {
    mctoolkit.webview.style.display = tabName === 'mctoolkit' ? '' : 'none';
  }
}

function getTabFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'overview';
}

nav.btns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.action-card[data-tab]').forEach((card) => {
  card.addEventListener('click', () => switchTab(card.dataset.tab));
});

document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key);
  if (num >= 1 && num <= nav.btns.length) {
    switchTab(nav.btns[num - 1].dataset.tab);
  }
});

switchTab(getTabFromURL());

document
  .querySelector('.icon-btn[title="Refresh"]')
  .addEventListener('click', () => {
    const active = document.querySelector('.tab-content.active');
    const tab = active
      ? active.id.replace(/^tab/, '').toLowerCase()
      : 'overview';
    if (tab === 'overview') loadSystemInfo();
    if (tab === 'resources' && resources.interval) resources.fetchAndUpdate();
    if (tab === 'mctoolkit' && mctoolkit.webview) mctoolkit.webview.reload();
  });

// Theme switching
function setTheme(theme) {
  const body = document.body;
  body.className = body.className.replace(/theme-\w+/g, '').trim();
  if (theme !== 'purple') body.classList.add('theme-' + theme);
  localStorage.setItem('banana-theme', theme);
  document.querySelectorAll('.theme-card').forEach((c) => {
    c.classList.toggle('active', c.dataset.theme === theme);
  });
  if (typeof resources !== 'undefined' && resources.applyTheme) {
    resources.applyTheme();
  }
}

document.querySelectorAll('.theme-card').forEach((card) => {
  card.addEventListener('click', () => setTheme(card.dataset.theme));
});

const saved = localStorage.getItem('banana-theme');
if (saved) setTheme(saved);

document
  .getElementById('langSwitchBtn')
  ?.addEventListener('click', toggleLanguage);

// Custom dropdown
(function () {
  const container = document.getElementById('refreshSelect');
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
const detailToggle = document.getElementById('detailToggle');
const detailGrid = document.getElementById('detailGrid');
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

if (detailToggle && detailGrid) {
  detailToggle.addEventListener('click', async () => {
    const isOpen = detailToggle.classList.toggle('open');
    detailGrid.style.display = isOpen ? 'grid' : 'none';

    if (isOpen && !detailToggle.dataset.loaded) {
      detailToggle.dataset.loaded = 'true';
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

const loader = document.getElementById('loaderOverlay');
Promise.all([
  loadSystemInfo(),
  versionEl
    ? window.dashboardAPI.getAppVersion().then((v) => {
        versionEl.textContent = 'v' + v;
      })
    : Promise.resolve(),
  new Promise((r) => setTimeout(r, 1000)),
]).then(() => {
  if (loader) {
    loaderHidden = true;
    loader.classList.add('hidden');
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && window.resetReveal) resetReveal(activeTab);
  }
});
