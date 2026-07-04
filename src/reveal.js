let loaderHidden = false;

const observer = new IntersectionObserver(
  (entries) => {
    if (!loaderHidden) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.1}s`;
  observer.observe(el);
});

window.resetReveal = function (container) {
  const els = container.querySelectorAll('.reveal');
  els.forEach((el, i) => {
    el.classList.remove('visible');
    el.style.transitionDelay = `${i * 0.1}s`;
    observer.unobserve(el);
    observer.observe(el);
  });
};
