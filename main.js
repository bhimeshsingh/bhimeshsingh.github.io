(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // load choreography
  const start = () => document.body.classList.add('loaded');
  document.readyState === 'complete' ? start() : addEventListener('load', start);
  setTimeout(start, 1600);

  // nav state, progress, timeline
  const nav = $('#nav'), bar = $('.progress');
  const tl = $('#timeline'), fill = $('#fill'), rider = $('#rider');
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('stuck', y > 30);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (tl && fill) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      fill.style.height = p * 100 + '%';
      if (rider) {
        rider.style.top = 17 + p * Math.max(0, r.height - 17) + 'px';
        rider.classList.toggle('on', p > 0.004 && p < 0.985);
      }
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  const burger = $('#burger'), links = $('#links');
  const setMenu = open => { links.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('#links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // reveal, headline lines, counters
  const countUp = el => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    const put = v => { el.innerHTML = v + (suf ? `<small>${suf}</small>` : ''); };
    if (reduce) return put(to);
    const t0 = performance.now(), dur = 1500;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      put(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .hl, .t-item').forEach(el => { if (!el.closest('.hero') && !el.closest('.page-head')) io.observe(el); });

  // petition flow: a document rides the line, then it is stamped FILED.
  // Plays when scrolled into view; drag the slider, tap a stage or replay to adjust it.
  const fw = $('#flowWrap');
  if (fw) {
    const lis = $$('.flow li', fw), line = $('.flow', fw);
    const range = $('#flowRange'), out = $('#flowOut'), replayBtn = $('#flowReplay');
    const vert = matchMedia('(max-width: 1020px)'); // the line runs down on tablets and phones
    const names = lis.map(li => $('b', li).textContent);
    let raf = 0, run = 0, cur = 0;
    const size = () => (vert.matches ? line.offsetHeight : line.offsetWidth);
    const posOf = li => (vert.matches ? li.offsetTop : li.offsetLeft);
    const set = p => {
      cur = p;
      fw.style.setProperty('--p', p);
      let n = 0;
      lis.forEach((li, i) => {
        const on = p * size() >= posOf(li) - 1;
        li.classList.toggle('lit', on);
        if (on) n = i;
      });
      const done = p >= 0.999;
      fw.classList.toggle('stamped', done);
      if (range) range.value = Math.round(p * 1000);
      if (out) out.textContent = done ? 'Filed' : names[n];
    };
    const manual = p => {
      run++;
      cancelAnimationFrame(raf);
      fw.style.setProperty('--po', p > 0 && p < 0.999 ? 1 : 0);
      set(p);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      const id = ++run;
      set(0);
      if (reduce) { fw.style.setProperty('--po', 0); set(1); return; }
      fw.style.setProperty('--po', 1);
      const t0 = performance.now(), dur = 1500;
      const tick = t => {
        if (id !== run) return;
        const k = Math.min(1, (t - t0) / dur);
        set(1 - Math.pow(1 - k, 1.6));
        if (k < 1) raf = requestAnimationFrame(tick);
        else {
          fw.style.setProperty('--po', 0);
          fw.classList.add('thunk');
          setTimeout(() => fw.classList.remove('thunk'), 400);
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const reset = () => { manual(0); };
    if (range) range.addEventListener('input', () => manual(range.value / 1000));
    if (replayBtn) replayBtn.addEventListener('click', play);
    lis.forEach(li => li.addEventListener('click', () => manual(Math.min(1, posOf(li) / size()))));
    const relayout = () => set(cur);
    addEventListener('resize', relayout);
    vert.addEventListener('change', relayout);
    let inView = false;
    new IntersectionObserver(es => es.forEach(e => {
      if (!inView && e.intersectionRatio >= 0.35) { inView = true; play(); }
      else if (e.intersectionRatio === 0) { inView = false; reset(); }
    }), { threshold: [0, 0.35] }).observe(fw);
  }

  // practice index: highlight the area in view
  const idx = $$('.index a');
  if (idx.length) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) idx.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.area').forEach(a => so.observe(a));
  }

  // background pops: icons for the practice, a banner plane for the journey
  if (!reduce) {
    const host = $('#pops');
    const I = {
      scales: ['Advocacy', '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.2 3.2 0 0 0 6 0zM19 7l-3 7a3.2 3.2 0 0 0 6 0z"/>'],
      passport: ['Visas', '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8.5 16.5h7"/>'],
      globe: ['Global talent', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
      doc: ['Petitions', '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'],
      evidence: ['Evidence', '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M7.8 12.5l2-2 1.6 1.6 2.3-3"/>'],
      gavel: ['Appeals', '<path d="M14 4l6 6-3 3-6-6zM10 8l6 6M3 21l8-8M12 21h9"/>'],
      brief: ['Employment', '<rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M8.5 7.5V6a1.8 1.8 0 0 1 1.8-1.8h3.4A1.8 1.8 0 0 1 15.5 6v1.5M3 13h18"/>'],
      stamp: ['Filed', '<path d="M9 12V8a3 3 0 1 1 6 0v4l2 4H7z"/><path d="M5 19h14M7 21.5h10"/>']
    };
    const BLOCK = '.pop,h1,h2,h3,h4,p,li,time,.btn,.row,.ledger,.hero-art,.chip,.ticker,.mail,.channel,.foot,.nav,.dark,.band,.quote,.sticky-art,.index,.area,.facts,.edu-item,.notice';
    const keys = Object.keys(I);
    const small = innerWidth < 760;
    const maxLive = small ? 3 : 6;
    let bag = [], last = '';
    const live = new Set();
    const next = () => {
      if (!bag.length) bag = keys.slice().sort(() => Math.random() - 0.5);
      for (let n = 0; n < bag.length; n++) {
        const k = bag[bag.length - 1 - n];
        if (!live.has(k) && k !== last) { bag.splice(bag.length - 1 - n, 1); return (last = k); }
      }
      return null;
    };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spawn = () => {
      if (document.hidden || host.querySelectorAll('.pop').length >= maxLive) return;
      const k = next();
      if (!k) return;
      const sz = Math.round(rnd(small ? 42 : 48, small ? 54 : 66));
      const bw = sz + 40, bh = sz + 24;
      const blockers = $$(BLOCK).map(n => n.getBoundingClientRect()).filter(r => r.bottom > 0 && r.top < innerHeight && r.width && r.height);
      let spot = null;
      for (let n = 0; n < 16 && !spot; n++) {
        const x = rnd(8, innerWidth - bw - 8), y = rnd(70, innerHeight - bh - 8);
        if (!blockers.some(r => x < r.right + 10 && x + bw > r.left - 10 && y < r.bottom + 10 && y + bh > r.top - 10)) spot = [x, y];
      }
      if (!spot) { bag.push(k); return; }
      live.add(k);
      const el = document.createElement('div');
      el.className = 'pop';
      el.style.cssText = `left:${spot[0].toFixed(0)}px;top:${spot[1].toFixed(0)}px;--sz:${sz}px;--life:${rnd(6, 9).toFixed(1)}s`;
      el.innerHTML = `<i><svg viewBox="0 0 24 24">${I[k][1]}</svg></i><b>${I[k][0]}</b>`;
      el.addEventListener('animationend', () => { live.delete(k); el.remove(); });
      host.appendChild(el);
    };
    // U.S. flag: 13 stripes, union with 50 stars (6 and 5 per row, nine rows)
    const flag = () => {
      const W = 100, H = 52.6, sh = H / 13, cw = 40, ch = sh * 7;
      let s = `<svg class="flag" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect width="${W}" height="${H}" fill="#fff"/>`;
      for (let i = 0; i < 13; i += 2) s += `<rect y="${(i * sh).toFixed(2)}" width="${W}" height="${sh.toFixed(2)}" fill="#b22234"/>`;
      s += `<rect width="${cw}" height="${ch.toFixed(2)}" fill="#3c3b6e"/>`;
      for (let r = 0; r < 9; r++) {
        const n = r % 2 ? 5 : 6, off = r % 2 ? cw / 12 : 0;
        for (let c = 0; c < n; c++) s += `<circle cx="${(cw / 12 + off + c * cw / 6).toFixed(2)}" cy="${(ch / 18 + r * ch / 9).toFixed(2)}" r="1.15" fill="#fff"/>`;
      }
      return s + '</svg>';
    };
    let dirN = 0;
    const plane = () => {
      if (document.hidden) return;
      const ltr = dirN++ % 2 === 1; // alternate: right to left, then left to right
      const el = document.createElement('div');
      el.className = 'plane' + (ltr ? ' ltr' : '');
      const w = innerWidth, h = innerHeight;
      const y0 = rnd(h * 0.14, h * 0.7), dy = rnd(-h * 0.22, h * 0.22);
      const x0 = ltr ? -470 : w + 30, x1 = ltr ? w + 30 : -470;
      const t = Math.atan2(dy, Math.abs(x1 - x0)) * 180 / Math.PI;
      const ang = ltr ? t : -t;
      el.style.cssText = `--x0:${x0}px;--x1:${x1}px;--y0:${y0}px;--y1:${y0 + dy}px;--rot:${ang}deg;--life:${rnd(13, 17).toFixed(1)}s`;
      const jet = '<svg class="jet" viewBox="0 0 24 24"><path d="M3 12h16M10 12L6 5h2.5l6 7-6 7H6zM4 12L2.5 9H5l1.8 3-1.8 3H2.5z"/></svg>';
      const ban = '<span class="banner">EB-1A &middot; EB-2 NIW &middot; O-1A</span>';
      const tail = ltr ? ban + flag() : flag() + ban; // one flag, on the end nearest the plane
      el.innerHTML = ltr ? tail + '<span class="rope"></span>' + jet : jet + '<span class="rope"></span>' + tail;
      el.addEventListener('animationend', () => el.remove());
      host.appendChild(el);
    };
    setTimeout(() => { spawn(); setInterval(spawn, small ? 2000 : 1300); }, 1200);
    setTimeout(() => { plane(); setInterval(plane, 12000); }, 4200);
  }

  if (reduce || !fine) return;

  // portrait tilt
  const art = $('.hero-art');
  const hero = $('.hero');
  if (art && hero) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      art.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg) translate3d(${x * 10}px,${y * 8}px,0)`;
    });
    hero.addEventListener('pointerleave', () => { art.style.transform = ''; });
  }

  // magnetic buttons
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // spotlight on rows
  $$('.row, .channel').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--cx', e.clientX - r.left + 'px');
    c.style.setProperty('--cy', e.clientY - r.top + 'px');
  }));
})();
