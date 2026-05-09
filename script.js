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

  /* ----- Quote form (POSTs to /api/contact serverless function) ----- */
  const form = $('#quoteForm');
  const note = $('#formNote');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtn = submitBtn ? submitBtn.innerHTML : '';

    const setStatus = (text, kind) => {
      note.classList.remove('is-success', 'is-error');
      note.textContent = text;
      if (kind) note.classList.add('is-' + kind);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', null);

      const data = Object.fromEntries(new FormData(form).entries());
      data.urgent = !!data.urgent;

      const required = ['name', 'email', 'message'];
      const missing = required.filter(k => !String(data[k] || '').trim());
      if (missing.length) {
        setStatus('Please fill in your name, email, and a brief description.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
        setStatus('That email address doesn’t look right — mind double-checking?', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending…';
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Failed to send');
        }

        setStatus('Thanks — your request is in. We’ll get back to you within one business day.', 'success');
        form.reset();
      } catch (err) {
        setStatus(
          'Something went wrong sending your message. Please try again, or email alphazelectrical@gmail.com directly.',
          'error'
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtn;
        }
      }
    });
  }
})();
