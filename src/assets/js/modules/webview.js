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
injectNoBlur(webviews.stats);

// Webview fullscreen
function isWebviewTab(tabName) {
  return ['mcServerHost', 'mcshTools', 'mcshStatus', 'mcToolkit', 'stats'].some(
    (name) => name.toLowerCase() === tabName,
  );
}

function showWebviewFullscreenBtn(show) {
  if (webviews.fullscreenBtn)
    webviews.fullscreenBtn.classList.toggle('hidden', !show);
}

function updateFullscreenBtnIcon() {
  if (!webviews.fullscreenBtn) return;

  const btn = webviews.fullscreenBtn;
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

app.refreshBtn.addEventListener('click', () => {
  const active = document.querySelector('.tab-content.active');
  const tab = active ? active.id.replace(/^tab/, '').toLowerCase() : 'overview';

  if (tab === 'overview') loadSystemInfo();
  if (tab === 'resources' && resources.interval) resources.fetchAndUpdate();
  if (tab === 'mctoolkit' && webviews.mcToolkit) webviews.mcToolkit.reload();
  if (tab === 'mcserverhost' && webviews.mcServerHost)
    webviews.mcServerHost.reload();
  if (tab === 'mcshtools' && webviews.mcshTools) webviews.mcshTools.reload();
  if (tab === 'mcshstatus' && webviews.mcshStatus) webviews.mcshStatus.reload();
  if (tab === 'stats' && webviews.stats) webviews.stats.reload();
});

// Webview fullscreen listeners
if (webviews.fullscreenBtn) {
  webviews.fullscreenBtn.addEventListener('click', () => {
    document.body.classList.toggle('webview-fullscreen');
    updateFullscreenBtnIcon();
  });
}
webviews.exitBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    document.body.classList.remove('webview-fullscreen');
    updateFullscreenBtnIcon();
  });
});
