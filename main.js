// ============================================================
// HUDI site — shared behaviour (no backend, everything client-side)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

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

  /* Testimonial slider */
  const slides = document.querySelectorAll('.testimonial-slide');
  if (slides.length) {
    let current = 0;
    const show = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    };
    document.querySelector('[data-slide="prev"]')?.addEventListener('click', () => {
      current = (current - 1 + slides.length) % slides.length;
      show(current);
    });
    document.querySelector('[data-slide="next"]')?.addEventListener('click', () => {
      current = (current + 1) % slides.length;
      show(current);
    });
    setInterval(() => {
      current = (current + 1) % slides.length;
      show(current);
    }, 6000);
  }

  /* Gallery filter */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        galleryItems.forEach(item => {
          const show = cat === 'all' || item.dataset.category === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* Contact / newsletter forms — no backend yet, just confirm receipt */
  document.querySelectorAll('form[data-local-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (note) {
        note.textContent = 'Thanks — this site has no backend connected yet, so nothing was actually sent. Once a database is connected, messages will reach the HUDI team directly.';
        note.classList.add('show');
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
