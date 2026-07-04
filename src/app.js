// Elements

const nav = {
  pageTitle: document.querySelector('.page-title'),
  btns: document.querySelectorAll('.nav-item[data-tab]'),
  contents: document.querySelectorAll('.tab-content'),
};

const overview = {
  osVersion: document.getElementById('osVersionCard'),
  kernelVersion: document.getElementById('kernelVersionCard'),
  cpu: document.getElementById('cpuCard'),
  cpuCores: document.getElementById('cpuCoresCard'),
  ram: document.getElementById('ramCard'),
};

function switchTab(tabName) {
  nav.btns.forEach((b) => b.classList.remove('active'));
  nav.contents.forEach((t) => t.classList.remove('active'));

  const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  const content = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  if (btn) nav.pageTitle.textContent = btn.textContent.trim();
  history.replaceState(null, '', '?tab=' + tabName);

  if (tabName === 'resources' && typeof resources !== 'undefined') {
    if (!resources.interval) resources.init();
  } else if (typeof resources !== 'undefined') {
    resources.destroy();
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

document.querySelector('.icon-btn[title="Refresh"]').addEventListener('click', () => {
  const active = document.querySelector('.tab-content.active');
  const tab = active ? active.id.replace('tab-', '') : 'overview';
  if (tab === 'overview') loadSystemInfo();
  if (tab === 'resources' && resources.interval) resources.fetchAndUpdate();
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
}

document.querySelectorAll('.theme-card').forEach((card) => {
  card.addEventListener('click', () => setTheme(card.dataset.theme));
});

const saved = localStorage.getItem('banana-theme');
if (saved) setTheme(saved);

async function loadSystemInfo() {
  const info = await window.dashboardAPI.getSystemInfo();
  overview.osVersion.textContent = info.distro;
  overview.kernelVersion.textContent = info.release;
  overview.cpu.textContent = info.cpuModel;
  overview.cpuCores.textContent = `${info.cpuCores} cores`;
  overview.ram.textContent = `${(info.totalMem / 1024 ** 3).toFixed(2)} GB`;
}

loadSystemInfo();
