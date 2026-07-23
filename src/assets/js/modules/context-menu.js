// Auto-generate stable hide IDs for all hideable elements
document.querySelectorAll('[data-hideable]').forEach((el) => {
  if (el.dataset.hideId) return;

  const tab = el.closest('.tab-content');
  const tabId = tab ? tab.id.replace(/^tab/, '').toLowerCase() : 'global';
  const heading = el.querySelector(
    '.section-header, .welcome-heading, .placeholder-title, .chart-header, [data-i18n]',
  );
  const label = heading
    ? heading.textContent.trim().toLowerCase().replace(/\s+/g, '-')
    : 'item';
  el.dataset.hideId = tabId + '-' + label;
});

// Right click menu-dropdown
window.addEventListener('contextmenu', (e) => {
  const navItem = e.target.closest('.nav-item');
  const hideable = e.target.closest('[data-hideable]');

  menu.navActions.hidden = true;
  menu.panelActions.hidden = true;

  if (navItem) {
    e.preventDefault();

    menu.ctx.style.left =
      Math.min(e.clientX, window.innerWidth - menu.ctx.offsetWidth) + 'px';
    menu.ctx.style.top =
      Math.min(e.clientY, window.innerHeight - menu.ctx.offsetHeight) + 'px';

    menu.ctx.hidden = false;
    menu.ctx.dataset.tab = navItem.dataset.tab;
    menu.navActions.hidden = false;
  } else if (hideable && !hideable.dataset.hideId.startsWith('settings-')) {
    e.preventDefault();

    menu.ctx.style.left =
      Math.min(e.clientX, window.innerWidth - menu.ctx.offsetWidth) + 'px';
    menu.ctx.style.top =
      Math.min(e.clientY, window.innerHeight - menu.ctx.offsetHeight) + 'px';

    menu.ctx.hidden = false;
    menu.ctx.dataset.hideId = hideable.dataset.hideId;
    menu.panelActions.hidden = false;
  }
});

document.addEventListener('click', (e) => {
  if (!menu.ctx.contains(e.target)) {
    menu.ctx.hidden = true;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') menu.ctx.hidden = true;
});

menu.ctx.addEventListener('click', (e) => {
  const item = e.target.closest('.context-item');
  if (!item) return;

  const action = item.dataset.action;
  menu.ctx.hidden = true;

  if (action === 'hide-panel') {
    const id = menu.ctx.dataset.hideId;
    if (!id) return;

    const el = document.querySelector(`[data-hide-id="${id}"]`);
    if (!el) return;

    el.classList.add('is-hidden');
    const hidden = JSON.parse(localStorage.getItem('hiddenElements') || '{}');
    hidden[id] = true;

    localStorage.setItem('hiddenElements', JSON.stringify(hidden));
    populateHiddenElements();

    return;
  }

  const tabName = menu.ctx.dataset.tab;
  const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);

  if (!navBtn) return;

  if (action === 'rename') {
    const labelEl = navBtn.querySelector('[data-i18n]');
    if (!labelEl) return;

    const original = labelEl.textContent;
    labelEl.contentEditable = true;
    labelEl.focus();

    const range = document.createRange();
    range.selectNodeContents(labelEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finish(restore) {
      labelEl.contentEditable = false;

      if (restore) {
        labelEl.textContent = original;
      } else {
        const renames = JSON.parse(localStorage.getItem('renamedTabs') || '{}');
        renames[tabName] = labelEl.textContent;

        localStorage.setItem('renamedTabs', JSON.stringify(renames));
      }

      labelEl.removeEventListener('blur', onBlur);
      labelEl.removeEventListener('keydown', onKey);
    }

    function onBlur() {
      finish(false);
    }

    function onKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        labelEl.blur();
      }
      if (e.key === 'Escape') {
        finish(true);
      }
    }

    labelEl.addEventListener('blur', onBlur);
    labelEl.addEventListener('keydown', onKey);
  } else if (action === 'hide') {
    navBtn.classList.add('is-hidden');

    const hidden = JSON.parse(localStorage.getItem('hiddenTabs') || '[]');

    if (!hidden.includes(tabName)) {
      hidden.push(tabName);
      localStorage.setItem('hiddenTabs', JSON.stringify(hidden));
    }

    if (navBtn.classList.contains('active')) {
      const other = document.querySelector('.nav-item:not(.is-hidden)');
      if (other) switchTab(other.dataset.tab);
    }

    populateHiddenTabs();
  }
});

function populateHiddenTabs() {
  const hidden = JSON.parse(localStorage.getItem('hiddenTabs') || '[]');

  if (!settings.hiddenTabsList) return;

  if (hidden.length === 0) {
    settings.hiddenTabsList.innerHTML =
      '<div class="hidden-tabs-empty" data-i18n="settings_hidden_tabs_empty">' +
      getTranslation('settings_hidden_tabs_empty') +
      '</div>';

    return;
  }

  settings.hiddenTabsList.innerHTML = hidden
    .map((tabName) => {
      const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
      if (!navBtn) return '';

      const icon =
        navBtn.querySelector('.banana-nav-icon') ||
        navBtn.querySelector('[data-lucide]');

      const label =
        navBtn.querySelector('[data-i18n]')?.textContent ||
        navBtn.textContent.trim();
      const iconHTML = icon ? icon.outerHTML : '';

      return `
        <div class="hidden-tab-item">
          ${iconHTML}
          <span>${label}</span>
          <button class="hidden-tab-show" data-tab="${tabName}">
            <i data-lucide="eye" width="16" height="16"></i>
          </button>
        </div>
      `;
    })
    .join('');

  settings.hiddenTabsList
    .querySelectorAll('.hidden-tab-show')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        const hidden = JSON.parse(localStorage.getItem('hiddenTabs') || '[]');
        const idx = hidden.indexOf(tabName);

        if (idx !== -1) {
          hidden.splice(idx, 1);
          localStorage.setItem('hiddenTabs', JSON.stringify(hidden));
        }

        const navBtn = document.querySelector(
          `.nav-item[data-tab="${tabName}"]`,
        );

        if (navBtn) navBtn.classList.remove('is-hidden');
        populateHiddenTabs();
      });
    });

  lucide.createIcons({ parent: settings.hiddenTabsList });
}

function populateHiddenElements() {
  const hidden = JSON.parse(localStorage.getItem('hiddenElements') || '{}');

  const ids = Object.keys(hidden);
  if (!settings.hiddenElementsList) return;

  if (ids.length === 0) {
    settings.hiddenElementsList.innerHTML =
      '<div class="hidden-tabs-empty">' +
      getTranslation('settings_hidden_elements_empty') +
      '</div>';

    return;
  }

  settings.hiddenElementsList.innerHTML = ids
    .map((id) => {
      const el = document.querySelector(`[data-hide-id="${id}"]`);
      if (!el) return '';

      const header = el.querySelector(
        '.section-header, .welcome-heading, .placeholder-title',
      );
      const icon = el.querySelector('[data-lucide]');
      const label = header ? header.textContent.trim() : id.replace(/-/g, ' ');
      const iconHTML = icon ? icon.outerHTML : '';

      return `
        <div class="hidden-tab-item">
          ${iconHTML}
          <span>${label}</span>
          <button class="hidden-tab-show" data-hide-id="${id}">
            <i data-lucide="eye" width="16" height="16"></i>
          </button>
        </div>
      `;
    })
    .join('');

  settings.hiddenElementsList
    .querySelectorAll('.hidden-tab-show')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.hideId;
        const el = document.querySelector(`[data-hide-id="${id}"]`);

        if (el) el.classList.remove('is-hidden');
        const hidden = JSON.parse(
          localStorage.getItem('hiddenElements') || '{}',
        );

        delete hidden[id];
        localStorage.setItem('hiddenElements', JSON.stringify(hidden));

        populateHiddenElements();
      });
    });

  lucide.createIcons({ parent: settings.hiddenElementsList });
}

// Restore hidden tabs on load
const storedHidden = JSON.parse(localStorage.getItem('hiddenTabs') || '[]');

storedHidden.forEach((tabName) => {
  const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);

  if (navBtn) {
    navBtn.classList.add('is-hidden');
    
    if (navBtn.classList.contains('active')) {
      const other = document.querySelector('.nav-item:not(.is-hidden)');
      if (other) switchTab(other.dataset.tab);
    }
  }
});

populateHiddenTabs();

// Restore renamed tabs on load
const renames = JSON.parse(localStorage.getItem('renamedTabs') || '{}');

Object.entries(renames).forEach(([tabName, label]) => {
  const labelEl = document.querySelector(
    `.nav-item[data-tab="${tabName}"] [data-i18n]`,
  );

  if (labelEl) labelEl.textContent = label;
});

// Restore hidden elements on load
const hiddenEls = JSON.parse(localStorage.getItem('hiddenElements') || '{}');

Object.keys(hiddenEls).forEach((id) => {
  const el = document.querySelector(`[data-hide-id="${id}"]`);
  if (el) el.classList.add('is-hidden');
});

populateHiddenElements();
