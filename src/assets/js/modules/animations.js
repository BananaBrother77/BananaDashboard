(function () {
  const animationsEnabled = () =>
    localStorage.getItem('banana-animations') !== 'off';

  const toggle = settings.animationToggle;
  const label = toggle?.querySelector('.lang-name') || toggle;

  function applyMode() {
    const animationsOn = animationsEnabled();
    document.body.classList.toggle('animations-off', !animationsOn);

    const featureOn = !animationsOn;
    if (toggle) toggle.classList.toggle('is-on', featureOn);

    if (label) {
      const key = featureOn
        ? 'settings_animation_disable_enabled'
        : 'settings_animation_disable_disabled';
      label.dataset.i18n = key;
      label.textContent = getTranslation(key);
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
