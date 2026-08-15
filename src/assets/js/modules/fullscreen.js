(function () {
  const fullscreenEnabled = () =>
    localStorage.getItem('banana-fullscreen') !== 'off';

  const toggle = settings.fullscreenToggle;

  function applyMode() {
    const enabled = fullscreenEnabled();

    if (toggle) {
      toggle.classList.toggle('is-on', enabled);
      toggle.setAttribute('aria-checked', String(enabled));
    }
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const enabled = fullscreenEnabled();

      localStorage.setItem('banana-fullscreen', enabled ? 'off' : 'on');
      applyMode();

      window.dashboardAPI.setStartFullscreen(!enabled);
    });
  }

  if (fullscreenEnabled() && window.dashboardAPI?.setStartFullscreen) {
    window.dashboardAPI.setStartFullscreen(true);
  }

  applyMode();
})();
