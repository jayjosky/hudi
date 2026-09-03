// ============================================================
// HUDI site — shared behaviour (no backend, everything client-side)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* Dark / light mode toggle. The initial theme is already applied by the
     small inline script in <head> (before CSS loads) to avoid a flash of
     the wrong theme; this just wires up the button and keeps preference
     in localStorage. */
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    const applyLabel = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.setAttribute('aria-pressed', String(isDark));
    };
    applyLabel();
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('hudi-theme', next); } catch (err) { /* ignore */ }
      applyLabel();
    });
  }

  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const expanded = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  /* Animated stat counters */
  const counters = document.querySelectorAll('.stat-card .num[data-target]');
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + '+';
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + '+';
      };
      requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => observer.observe(c));
  }

  /* Growth tracker (impact page) — reads DEMO DATA from the #growth-data
     JSON block in impact.html and draws a simple bar chart. Replace the
     numbers in that JSON block with real figures whenever they're ready;
     no changes needed here. */
  const growthChart = document.getElementById('growth-chart');
  const growthDataEl = document.getElementById('growth-data');
  if (growthChart && growthDataEl) {
    let growthData = [];
    try { growthData = JSON.parse(growthDataEl.textContent); } catch (err) { growthData = []; }

    const renderGrowthChart = () => {
      const max = Math.max(...growthData.map(d => d.value || 0), 1);
      growthChart.innerHTML = '';
      growthChart.setAttribute('aria-label', "Bar chart of HUDI's 2026 founding-year totals");
      growthData.forEach(d => {
        const value = d.value || 0;
        const pct = Math.max((value / max) * 100, 4);
        const bar = document.createElement('div');
        bar.className = 'growth-bar';
        bar.innerHTML = `
          <span class="bar-value">${value.toLocaleString()}</span>
          <div class="bar-fill" style="height:0%" data-final-height="${pct}"></div>
          <span class="bar-year">${d.label}</span>
        `;
        bar.setAttribute('aria-label', `${d.label}: ${value.toLocaleString()}`);
        growthChart.appendChild(bar);
      });
      requestAnimationFrame(() => {
        growthChart.querySelectorAll('.bar-fill').forEach(fill => {
          fill.style.height = fill.dataset.finalHeight + '%';
        });
      });
    };

    if (growthData.length) renderGrowthChart();
  }

  /* Live email sending via EmailJS — used by any <form data-emailjs>.
     Requires the EmailJS browser SDK <script> tag to be loaded on the page
     before main.js. Config below is safe to keep client-side: the public
     key is meant to be publishable (it authorises sending, it doesn't grant
     account access). */
  const EMAILJS_PUBLIC_KEY = 'QJSJUtHrG4sd5Vpm2';
  const EMAILJS_SERVICE_ID = 'service_o1qdmj3';
  const EMAILJS_TEMPLATE_ID = 'template_o6r6avh';

  if (window.emailjs && typeof emailjs.init === 'function') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  document.querySelectorAll('form[data-emailjs]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.textContent : '';

      const showNote = (text, isError) => {
        if (!note) return;
        note.textContent = text;
        note.classList.remove('error');
        if (isError) note.classList.add('error');
        note.classList.add('show');
        note.setAttribute('tabindex', '-1');
        note.focus({ preventScroll: false });
        note.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      if (!window.emailjs) {
        showNote("Something went wrong loading the email service. Please email us directly at info@hudi.org or call +254 700 000 000.", true);
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
        .then(() => {
          showNote(form.dataset.successMessage || "Thanks — your message has been sent to the HUDI team. We'll get back to you soon.", false);
          form.reset();
        })
        .catch((err) => {
          console.error('EmailJS error:', err);
          showNote("Sorry, something went wrong sending your message. Please try again, or email us directly at info@hudi.org.", true);
        })
        .finally(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        });
    });
  });

  /* Contact / application / newsletter forms — no backend yet, just confirm receipt.
     Add data-success-message="..." on any <form data-local-form> to show a custom
     confirmation instead of the generic fallback below. Forms marked
     data-emailjs (handled above) are skipped here so they aren't double-bound. */
  document.querySelectorAll('form[data-local-form]:not([data-emailjs])').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (note) {
        note.textContent = form.dataset.successMessage ||
          'Thanks — this site has no backend connected yet, so nothing was actually sent. Once a database is connected, messages will reach the HUDI team directly.';
        note.classList.add('show');
        note.setAttribute('tabindex', '-1');
        note.focus({ preventScroll: false });
        note.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  });

  /* Active nav link */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

});
