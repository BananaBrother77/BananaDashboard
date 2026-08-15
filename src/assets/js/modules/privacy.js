(function () {
  const privacyEnabled = () => localStorage.getItem('banana-privacy') !== 'off';

  const toggle = settings.privacyToggle;
  const sensitiveEls = document.querySelectorAll('.sensitive');

  function applyMode() {
    const enabled = privacyEnabled();
    document.body.classList.toggle('privacy-mode', enabled);

    if (toggle) {
      toggle.classList.toggle('is-on', enabled);
      toggle.setAttribute('aria-checked', String(enabled));
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
