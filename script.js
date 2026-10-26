(() => {
  // ===== CONFIG =====
  const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/J46K5M6HKV';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Header: hide on scroll down, show on scroll up =====
  const header = $('#header');
  let lastY = window.scrollY;
  // ===== Burger =====
  const burger = $('#burger');
  const nav = $('#nav');
  const closeNav = () => {
    burger?.classList.remove('is-open');
    nav?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
  };
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  // ===== Smooth anchor scroll =====
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ===== Hero intro =====
  const hero = $('#hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero?.classList.add('is-loaded')));
  // .is-loaded живёт на секции, стили ждут его на предке заголовка
  const stage = $('.hero__stage');

  // ===== Reveal with stagger =====
  const revealEls = $$('[data-reveal]');
  const groups = new Map();
  revealEls.forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i, 6) * 80 + 'ms');
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach(el => io.observe(el));

  // ===== Pointer parallax for hero orbs =====
  if (fine && !reduce && stage) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', e => {
      tx = e.clientX / window.innerWidth - .5;
      ty = e.clientY / window.innerHeight - .5;
    }, { passive: true });
    const loop = () => {
      cx = lerp(cx, tx, .06); cy = lerp(cy, ty, .06);
      stage.style.setProperty('--mx', cx.toFixed(4));
      stage.style.setProperty('--my', cy.toFixed(4));
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ===== Marquee: base drift + scroll velocity =====
  const track = $('#bandTrack');
  let bandX = 0, vel = 0, prevY = window.scrollY, third = 0;
  const measure = () => { third = track ? track.scrollWidth / 4 : 0; };
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  // ===== Scrubbed statement: words light up with scroll =====
  const painText = $('#painText');
  let units = [];
  if (painText && !reduce) {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'pw'; s.textContent = part; frag.append(s);
          });
          n.replaceWith(frag);
        }
      });
    };
    wrap(painText);
    units = [...painText.childNodes].filter(n => n.nodeType === 1);
    units.forEach(u => { u.style.opacity = '.16'; });
  }
  const paintStatement = () => {
    if (!units.length) return;
    const r = painText.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * .82 - r.top) / (r.height + vh * .32));
    const n = units.length;
    units.forEach((u, i) => {
      const k = clamp(p * (n + 6) - i - 2, 0, 1);
      u.style.opacity = (.16 + .84 * k).toFixed(3);
    });
  };

  // ===== Formats: index with preview + live figures =====
  const fmts = $$('.fmt');
  const picBox = $('.fpanel__pic');
  const picA = $('#fpicA'), picB = $('#fpicB');
  let showA = true, current = 0;
  const setFormat = i => {
    if (i === current) return;
    current = i;
    const li = fmts[i];
    fmts.forEach((f, k) => {
      const on = k === i;
      f.classList.toggle('is-active', on);
      f.querySelector('button').setAttribute('aria-pressed', String(on));
    });
    const front = showA ? picB : picA;
    const back = showA ? picA : picB;
    front.src = li.dataset.img; front.alt = li.dataset.alt;
    back.alt = ''; back.setAttribute('aria-hidden', 'true'); front.removeAttribute('aria-hidden');
    picBox.classList.toggle('swap', showA);
    showA = !showA;
    [['#fMeet', li.dataset.meet], ['#fSum', li.dataset.sum], ['#fRhythm', li.dataset.rhythm]].forEach(([sel, txt]) => {
      const el = $(sel);
      el.textContent = txt;
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    });
    const sel = $('#fFormat');
    if (sel) {
      const name = li.querySelector('.fmt__name').textContent.trim();
      [...sel.options].forEach(o => { if (o.textContent.trim() === name) sel.value = o.value || o.textContent; });
    }
  };
  fmts.forEach((li, i) => {
    const btn = li.querySelector('button');
    if (fine) li.addEventListener('pointerenter', () => setFormat(i));
    btn.addEventListener('click', () => setFormat(i));
    btn.addEventListener('focus', () => setFormat(i));
  });

  // ===== How: dots travel from chaos to order =====
  const svg = $('#howSvg');
  const dots = [];
  let vertical = false, W = 1200, H = 270;
  const NS = 'http://www.w3.org/2000/svg';
  const build = () => {
    if (!svg) return;
    vertical = window.innerWidth <= 900;
    W = vertical ? 360 : 1200; H = vertical ? 520 : 270;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    dots.length = 0;
    // детерминированный генератор, чтобы схема не прыгала при ресайзе
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const N = vertical ? 96 : 150;
    const r = vertical ? 8 : 9;
    const A = vertical ? H / 3 : W / 3;
    for (let i = 0; i < N; i++) {
      const zone = Math.floor(i / (N / 3)); // 0 хаос, 1 лента, 2 порядок
      const j = i % (N / 3);
      const per = N / 3;
      let tx, ty, fill, op = 1;
      if (zone === 0) {
        // остаётся разбросанной
        tx = vertical ? rnd() * (W - 2 * r) + r : rnd() * (A - 2 * r) + r;
        ty = vertical ? rnd() * (A - 2 * r) + r : rnd() * (H - 2 * r) + r;
        fill = 'var(--ink)'; op = i % 2 ? .22 : .45;
      } else if (zone === 1) {
        const cols = Math.ceil(per / 3);
        const c = Math.floor(j / 3), row = j % 3;
        if (vertical) { tx = W / 2 - (3 * r * 2.4) / 2 + row * r * 2.4 + r; ty = A + (c + .5) * ((A - 2 * r) / cols); }
        else { tx = A + (c + .5) * ((A - 2 * r) / cols); ty = H / 2 - (3 * r * 2.4) / 2 + row * r * 2.4 + r; }
        fill = 'var(--ink)';
      } else {
        const rows = 5, cols = Math.ceil(per / rows);
        const c = j % cols, row = Math.floor(j / cols);
        if (vertical) { tx = (W - cols * r * 2.5) / 2 + c * r * 2.5 + r; ty = 2 * A + 16 + row * r * 2.9 + r; }
        else { tx = 2 * A + 24 + c * ((A - 48) / cols); ty = (H - rows * r * 2.9) / 2 + row * r * 2.9 + r; }
        fill = 'var(--bg)';
      }
      // старт: случайное место по всей схеме
      const sx = rnd() * (W - 2 * r) + r, sy = rnd() * (H - 2 * r) + r;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', r);
      c.setAttribute('fill', fill);
      c.setAttribute('opacity', op);
      svg.appendChild(c);
      dots.push({ el: c, sx, sy, tx, ty, d: rnd() * .35, fixed: zone === 0 });
    }
    paintDots(1);
  };
  const paintDots = p => {
    dots.forEach(d => {
      const t = d.fixed ? 1 : ease(clamp((p - d.d) / (1 - d.d)));
      d.el.setAttribute('cx', lerp(d.sx, d.tx, t).toFixed(1));
      d.el.setAttribute('cy', lerp(d.sy, d.ty, t).toFixed(1));
    });
  };
  build();
  let rw = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth !== rw) { rw = window.innerWidth; build(); } });
  const viz = $('#howViz');
  const paintViz = () => {
    if (!viz || reduce) return;
    const r = viz.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * .9 - r.top) / (vh * .75));
    paintDots(easeIO(p));
  };

  // ===== Price counter =====
  const num = $('#priceNum');
  if (num && !reduce) {
    num.textContent = '0';
    const cio = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const target = +num.dataset.target, start = performance.now(), dur = 1500;
        const tick = t => {
          const p = clamp((t - start) / dur);
          num.textContent = Math.round(target * ease(p)).toLocaleString('ru-RU').replace(/ /g, ' ');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(num);
      });
    }, { threshold: .5 });
    cio.observe(num);
  }

  // ===== Magnetic buttons =====
  if (fine && !reduce) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${x * 12}px, ${y * 10}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // ===== One frame loop for everything scroll-linked =====
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const dy = y - lastY;
    header?.classList.toggle('is-hidden', y > 240 && dy > 6 && !nav?.classList.contains('is-open'));
    if (dy < -4 || y < 240) header?.classList.remove('is-hidden');
    lastY = y;
    if (stage && !reduce) {
      const hp = clamp(y / (hero.offsetHeight * .9));
      stage.style.setProperty('--p', hp.toFixed(4));
    }
    paintStatement();
    paintViz();
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  if (track && !reduce) {
    const run = () => {
      const y = window.scrollY;
      vel = lerp(vel, y - prevY, .12);
      prevY = y;
      bandX -= 1.1 + Math.min(Math.abs(vel) * .35, 14);
      if (third && bandX <= -third) bandX += third;
      track.style.transform = `translate3d(${bandX.toFixed(1)}px,0,0)`;
      requestAnimationFrame(run);
    };
    run();
  }

  // ===== Form -> Cloudflare Worker -> Telegram =====
  const form = $('#leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span');
    const orig = label.textContent;
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.contact) {
      label.textContent = 'Заполните имя и контакт';
      setTimeout(() => { label.textContent = orig; }, 2400);
      return;
    }
    const send = {
      name: payload.name,
      phone: payload.contact,
      format: payload.format,
      comment: payload.comment || ''
    };
    btn.disabled = true;
    label.textContent = 'Отправляем…';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(send)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена, я напишу вам';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
