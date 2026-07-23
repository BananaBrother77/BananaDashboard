// Double-click to rename section labels
document.querySelectorAll('.nav-section-label').forEach((el) => {
  el.addEventListener('dblclick', () => {
    const original = el.textContent;
    const key = el.dataset.section;
    el.contentEditable = true;
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finish(restore) {
      el.contentEditable = false;

      if (!restore) {
        const renames = JSON.parse(
          localStorage.getItem('renamedSections') || '{}',
        );

        renames[key] = el.textContent;
        localStorage.setItem('renamedSections', JSON.stringify(renames));
      }
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keydown', onKey);
    }

    function onBlur() {
      finish(false);
    }

    function onKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur();
      }
      if (e.key === 'Escape') {
        finish(true);
      }
    }

    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKey);
  });
});

// Sidebar toggle
function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  localStorage.setItem(
    'sidebarCollapsed',
    document.body.classList.contains('sidebar-collapsed'),
  );
}

if (app.sidebarEdge) {
  app.sidebarEdge.addEventListener('click', toggleSidebar);
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleSidebar();
  }
});

// Restore sidebar state
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  document.body.classList.add('sidebar-collapsed');
}

// Restore renamed section labels
const sectionRenames = JSON.parse(
  localStorage.getItem('renamedSections') || '{}',
);
document.querySelectorAll('.nav-section-label').forEach((el) => {
  const orig = el.textContent;
  el.dataset.section = orig;

  if (sectionRenames[orig]) el.textContent = sectionRenames[orig];
});
