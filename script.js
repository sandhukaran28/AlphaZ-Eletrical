// AlphaZ Electrical — page interactions
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ----- Year in footer ----- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----- Sticky header shadow on scroll ----- */
  const header = $('#siteHeader');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-stuck');
    else header.classList.remove('is-stuck');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----- Mobile nav toggle ----- */
  const nav = $('#primaryNav');
  const navToggle = $('#navToggle');
  if (nav && navToggle) {
    const closeNav = () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    const openNav = () => {
      nav.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeNav() : openNav();
    });
    $$('a', nav).forEach(a => a.addEventListener('click', closeNav));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 920) closeNav();
    });
  }

  /* ----- Reveal-on-scroll ----- */
  const reveals = $$('.reveal-children');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-revealed'));
  }

  /* ----- Animated stat counters ----- */
  const counters = $$('.stat__num[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const formatFor = (el) => {
      const original = el.textContent.trim();
      const suffix = original.replace(/[\d,]/g, '').trim();
      return suffix;
    };
    const animate = (el, target) => {
      const suffix = formatFor(el);
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(target * eased);
        el.textContent = value.toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          if (!isNaN(target)) animate(el, target);
          io2.unobserve(el);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => io2.observe(el));
  }

  /* ----- Quote form (no backend yet — opens mailto with pre-filled body) ----- */
  const form = $('#quoteForm');
  const note = $('#formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      note.classList.remove('is-success', 'is-error');

      const data = Object.fromEntries(new FormData(form).entries());
      const required = ['name', 'email', 'message'];
      const missing = required.filter(k => !String(data[k] || '').trim());
      if (missing.length) {
        note.textContent = 'Please fill in your name, email, and a brief description.';
        note.classList.add('is-error');
        return;
      }

      const subject = encodeURIComponent(
        `[AlphaZ Quote] ${data.type || 'Project'} — ${data.name}${data.urgent ? ' (URGENT)' : ''}`
      );
      const lines = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || '—'}`,
        `City: ${data.city || '—'}`,
        `Project type: ${data.type || '—'}`,
        `Urgent: ${data.urgent ? 'Yes' : 'No'}`,
        '',
        '— Project details —',
        data.message
      ];
      const body = encodeURIComponent(lines.join('\n'));
      const mailto = `mailto:alphazelectrical@gmail.com?subject=${subject}&body=${body}`;

      window.location.href = mailto;
      note.textContent = 'Opening your email app… if nothing happens, email alphazelectrical@gmail.com directly.';
      note.classList.add('is-success');
    });
  }
})();
