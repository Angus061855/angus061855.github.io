(() => {
  function init() {
    const menu = document.querySelector('.mobile-menu');
    const toggle = document.querySelector('.mobile-menu-btn');
    if (menu && toggle) {
      const sync = () => {
        const open = menu.classList.contains('open');
        document.body.classList.toggle('menu-open', open);
        document.documentElement.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      const close = () => {
        if (!menu.classList.contains('open')) return;
        toggle.click();
        toggle.focus({ preventScroll: true });
      };
      new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
      menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
      document.addEventListener('keydown', event => {
        if (!menu.classList.contains('open')) return;
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key !== 'Tab') return;
        const items = [toggle, ...menu.querySelectorAll('a[href], button:not(:disabled)')];
        const index = items.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
        else if (!event.shiftKey && (index === items.length - 1 || index < 0)) { event.preventDefault(); toggle.focus(); }
      }, true);
      window.addEventListener('resize', () => { if (getComputedStyle(toggle).display === 'none') close(); });
      sync();
    }

    // Hide only while the existing floating link would cover readable content.
    const floats = [...document.querySelectorAll('.site-line-float, .highlights-float-line, .consult-widget, .float-line')];
    if (!floats.length) return;
    let queued = false;
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const update = () => {
      queued = false;
      const targets = [...document.querySelectorAll('main p, main h1, main h2, main h3, main li, main a, main button, main input, main summary, main img, .income-result, .income-results, .income-card, footer, .section p, .section h2, .section h3, .section button, .section a')];
      for (const floating of floats) {
        if (floating.contains(document.activeElement) || floating.classList.contains('open')) continue;
        const box = floating.getBoundingClientRect();
        const blocked = targets.some(el => {
          if (floating.contains(el) || el.contains(floating) || !el.getClientRects().length) return false;
          return [...el.getClientRects()].some(rect => overlaps(box, rect));
        });
        floating.classList.toggle('float-obscures-content', blocked);
      }
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('click', schedule);
    document.addEventListener('input', schedule);
    new ResizeObserver(schedule).observe(document.body);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
