(function () {
  const privacyEnabled = () => localStorage.getItem('banana-privacy') !== 'off';

  const toggle = document.getElementById('privacyToggle');
  const sensitiveEls = document.querySelectorAll('.sensitive');
  const label = toggle?.querySelector('.lang-name') || toggle;

  function applyMode() {
    const enabled = privacyEnabled();
    document.body.classList.toggle('privacy-mode', enabled);

    if (toggle) toggle.classList.toggle('is-on', enabled);
    if (label) {
      const key = enabled
        ? 'settings_privacy_enabled'
        : 'settings_privacy_disabled';
      label.dataset.i18n = key;
      label.textContent = getTranslation(key);
    }

    sensitiveEls.forEach((el) => el.classList.remove('revealed'));
  }

  sensitiveEls.forEach((el) => {
    el.addEventListener('click', () => el.classList.toggle('revealed'));
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      localStorage.setItem('banana-privacy', privacyEnabled() ? 'off' : 'on');
      applyMode();
    });
  }

  applyMode();
})();
