// Elements

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

const toast = {
  el: document.getElementById('updateToast'),
  close: document.getElementById('toastClose'),
  title: document.getElementById('toastTitle'),
  desc: document.getElementById('toastDesc'),
};

const app = {
  version: document.getElementById('appVersion'),
  loader: document.getElementById('loaderOverlay'),
  sidebarEdge: document.getElementById('sidebarEdge'),
  refreshBtn: document.querySelector('.icon-btn[title="Refresh"]'),
};

const webviews = {
  mcToolkit: document.getElementById('mcToolkitWebview'),
  mcServerHost: document.getElementById('mcServerHostWebview'),
  mcshTools: document.getElementById('mcshToolsWebview'),
  mcshStatus: document.getElementById('mcshStatusWebview'),
  stats: document.getElementById('statsWebview'),
  fullscreenBtn: document.getElementById('webviewFullscreenBtn'),
  exitBtns: document.querySelectorAll('.webview-exit-btn'),
};

const theme = {
  cards: document.querySelectorAll('.theme-card'),
};

const lang = {
  switchBtn: document.getElementById('langSwitchBtn'),
};

const settings = {
  navItems: document.querySelectorAll('.settings-nav-item'),
  categories: document.querySelectorAll('.settings-category'),
  search: document.getElementById('settingsSearch'),
  refreshSelect: document.getElementById('refreshSelect'),
  hiddenTabsList: document.getElementById('hiddenTabsList'),
  hiddenElementsList: document.getElementById('hiddenElementsList'),
};

const nav = {
  pageTitle: document.querySelector('.page-title'),
  btns: document.querySelectorAll('.nav-item[data-tab]'),
  contents: document.querySelectorAll('.tab-content'),
  actionCards: document.querySelectorAll('.action-card[data-tab]'),
};

const detail = {
  toggle: document.getElementById('detailToggle'),
  grid: document.getElementById('detailGrid'),
};

const menu = {
  ctx: document.getElementById('contextMenu'),
  navActions: document.getElementById('contextNavActions'),
  panelActions: document.getElementById('contextPanelActions'),
};

// Toast
function showToast(title, desc) {
  toast.title.textContent = title;
  toast.desc.textContent = desc;
  toast.el.hidden = false;
  toast.el.onclick = () => {
    toast.el.hidden = true;
    switchTab('settings');
    if (window.switchSettingsCategory) switchSettingsCategory('updates');
  };

  if (toast.close) {
    toast.close.onclick = (e) => {
      e.stopPropagation();
      toast.el.hidden = true;
    };
  }

  setTimeout(() => {
    toast.el.hidden = true;
  }, 8000);
}

// Tab switching
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

  const activeWebviews = [
    'mcToolkit',
    'mcServerHost',
    'mcshTools',
    'mcshStatus',
    'stats',
  ];
  activeWebviews.forEach((name) => {
    const wv = webviews[name];
    if (wv) wv.style.display = tabName === name.toLowerCase() ? '' : 'none';
  });
}

function getTabFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'overview';
}

nav.btns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

nav.actionCards.forEach((card) => {
  card.addEventListener('click', () => switchTab(card.dataset.tab));
});

document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key);
  if (num >= 1 && num <= nav.btns.length) {
    switchTab(nav.btns[num - 1].dataset.tab);
  }
});

// Ctrl+Shift+T toast test
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    showToast(
      getTranslation('update_available') || 'Update available',
      'v0.0.0',
    );
  }
});
