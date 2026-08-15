(function () {
  const animationsEnabled = () =>
    localStorage.getItem('banana-animations') !== 'off';

  const toggle = settings.animationToggle;

  function applyMode() {
    const animationsOn = animationsEnabled();
    document.body.classList.toggle('animations-off', !animationsOn);

    const featureOn = !animationsOn;
    if (toggle) {
      toggle.classList.toggle('is-on', featureOn);
      toggle.setAttribute('aria-checked', String(featureOn));
    }
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      localStorage.setItem(
        'banana-animations',
        animationsEnabled() ? 'off' : 'on',
      );
      applyMode();
    });
  }

  applyMode();
})();
