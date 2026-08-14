(function () {
  const fullscreenEnabled = () =>
    localStorage.getItem('banana-fullscreen') !== 'off';

  const toggle = settings.fullscreenToggle;
  const label = toggle?.querySelector('.lang-name') || toggle;

  function applyMode() {
    const enabled = fullscreenEnabled();

    if (toggle) toggle.classList.toggle('is-on', enabled);

    if (label && window.getTranslation) {
      const key = enabled
        ? 'settings_fullscreen_enabled'
        : 'settings_fullscreen_disabled';
      label.dataset.i18n = key;
      label.textContent = getTranslation(key);
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
