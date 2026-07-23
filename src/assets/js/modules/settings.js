// Theme switching
function setTheme(name) {
  const body = document.body;
  body.className = body.className.replace(/theme-\w+/g, '').trim();

  if (name !== 'purple') body.classList.add('theme-' + name);
  localStorage.setItem('banana-theme', name);

  theme.cards.forEach((c) => {
    c.classList.toggle('active', c.dataset.theme === name);
  });

  if (typeof resources !== 'undefined' && resources.applyTheme) {
    resources.applyTheme();
  }
}

theme.cards.forEach((card) => {
  card.addEventListener('click', () => setTheme(card.dataset.theme));
});

const saved = localStorage.getItem('banana-theme');
if (saved) setTheme(saved);

lang.switchBtn?.addEventListener('click', toggleLanguage);

// Reset buttons
document.querySelectorAll('.reset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.reset;

    if (type === 'names' || type === 'all')
      localStorage.removeItem('renamedTabs');
    if (type === 'hidden-tabs' || type === 'all')
      localStorage.removeItem('hiddenTabs');
    if (type === 'hidden-modules' || type === 'all')
      localStorage.removeItem('hiddenElements');
    if (type === 'all') {
      localStorage.removeItem('renamedSections');
      localStorage.removeItem('hiddenElements');
    }
    location.reload();
  });
});

// Custom dropdown
(function () {
  const container = settings.refreshSelect;
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

// Settings category nav + search
(function () {
  function switchCategory(catId) {
    settings.navItems.forEach((b) =>
      b.classList.toggle('active', b.dataset.settingCat === catId),
    );

    if (catId === 'all') {
      settings.categories.forEach((c) => {
        c.classList.add('active');
        animateReveal(c);
      });
    } else {
      settings.categories.forEach((c) => {
        const show = c.dataset.category === catId;
        c.classList.toggle('active', show);
        if (show) animateReveal(c);
      });
    }
  }

  window.switchSettingsCategory = switchCategory;

  function animateReveal(el) {
    if (!el.classList.contains('reveal')) return;

    el.classList.remove('visible');
    el.style.transitionDelay = '0s';
    observer.unobserve(el);
    observer.observe(el);
  }

  settings.navItems.forEach((btn) => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.settingCat));
  });

  if (settings.search) {
    settings.search.addEventListener('input', () => {
      const q = settings.search.value.toLowerCase().trim();
      const activeCat = document.querySelector('.settings-nav-item.active')
        ?.dataset.settingCat;

      settings.categories.forEach((cat) => {
        const textMatch = q === '' || cat.textContent.toLowerCase().includes(q);
        const catMatch =
          q === ''
            ? activeCat === 'all' || cat.dataset.category === activeCat
            : textMatch;
        cat.classList.toggle('active', catMatch);
      });

      settings.navItems.forEach((btn) => {
        const cat = document.querySelector(
          `.settings-category[data-category="${btn.dataset.settingCat}"]`,
        );
        btn.style.display =
          !cat || q === '' || cat.textContent.toLowerCase().includes(q)
            ? ''
            : 'none';
      });
    });
  }
})();
