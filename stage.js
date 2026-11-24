/* Keyboard/click presentation controller (Ferrovial engine, CDP edition).
   Content and reveal order live in index.html. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const root = document.documentElement;
  let index = -1, controlsTimer;

  const nav = document.createElement('nav');
  nav.className = 'deck-controls';
  nav.innerHTML = '<button type="button" data-action="prev" title="Previous · ←">←</button><button type="button" data-action="next" title="Next · →">→</button><button type="button" data-action="chapters" title="Navigator · G">Chapters</button><button type="button" data-action="fullscreen" title="Full screen · F">⛶</button><button type="button" data-action="help" title="Shortcuts · ?">?</button>';
  document.body.append(nav);
  const blackout = document.createElement('div');
  blackout.className = 'blackout'; document.body.append(blackout);

  function title(slide, n) {
    const el = slide.querySelector('.gigante,.statement') || slide.querySelector('.kicker,.num');
    return slide.dataset.title || el?.textContent.trim().replace(/\s+/g, ' ') || `Slide ${n + 1}`;
  }

  function dialog(id, heading) {
    const el = document.createElement('dialog'); el.className = 'deck-dialog'; el.id = id;
    el.innerHTML = `<div class="dialog-head"><h2>${heading}</h2><button type="button" data-close>Close · Esc</button></div>`;
    el.querySelector('[data-close]').addEventListener('click', () => el.close());
    document.body.append(el); return el;
  }
  const chapters = dialog('chapters', 'Find your place');
  const links = document.createElement('div'); links.className = 'chapter-links';
  slides.forEach((slide, n) => {
    if (!slide.dataset.chapter) return;
    const b = document.createElement('button'); b.type = 'button';
    b.textContent = `${String(n + 1).padStart(2, '0')}  /  ${slide.dataset.chapter}`;
    b.addEventListener('click', () => { chapters.close(); go(n); }); links.append(b);
  });
  chapters.append(links);
  const help = dialog('shortcuts', 'Presenter shortcuts');
  help.insertAdjacentHTML('beforeend', '<dl class="shortcuts"><dt>→ / Space</dt><dd>Next reveal or slide</dd><dt>←</dt><dd>Previous reveal or slide</dd><dt>Home / End</dt><dd>First / last slide</dd><dt>G</dt><dd>Chapter navigator</dd><dt>F</dt><dd>Full screen</dd><dt>B / .</dt><dd>Black screen</dd><dt>V</dt><dd>Play / pause the video on screen</dd><dt>T</dt><dd>Start / pause the timer on an exercise slide</dd><dt>R</dt><dd>Reset the timer</dd><dt>Click</dt><dd>Right side: next. Left 20%: previous.</dd></dl>');

  /* ---- countdown timers: <div class="timer" data-minutes="20"></div> ---- */
  const timers = new Map();
  document.querySelectorAll('.timer').forEach(el => {
    const total = Number(el.dataset.minutes || 10) * 60;
    const t = { el, total, left: total, running: false, id: null };
    el.innerHTML = '<span class="t-clock"></span><button type="button" class="t-btn">Start</button>';
    const paint = () => {
      const m = Math.floor(t.left / 60), s = t.left % 60;
      el.querySelector('.t-clock').textContent = `${m}:${String(s).padStart(2, '0')}`;
      el.classList.toggle('low', t.left <= 120 && t.left > 0);
      el.classList.toggle('done', t.left === 0);
      el.querySelector('.t-btn').textContent = t.running ? 'Pause' : (t.left === t.total ? 'Start' : (t.left ? 'Resume' : 'Done'));
    };
    t.toggle = () => {
      if (t.running) { clearInterval(t.id); t.running = false; }
      else if (t.left > 0) { t.running = true; t.id = setInterval(() => { t.left--; if (t.left <= 0) { t.left = 0; clearInterval(t.id); t.running = false; } paint(); }, 1000); }
      paint();
    };
    t.reset = () => { clearInterval(t.id); t.running = false; t.left = t.total; paint(); };
    el.querySelector('.t-btn').addEventListener('click', t.toggle);
    paint(); timers.set(el.closest('.slide'), t);
  });

  /* Time journey: 3D when WebGL is available, a still image otherwise. */
  const travelSlide = slides.find(x => x.classList.contains('viaje'));
  let viaje = null, travelFailed = false;
  function enterTravel() {
    if (travelFailed || !window.THREE || !window.initViaje) { travelSlide.classList.add('fallback'); return; }
    try { if (!viaje) viaje = window.initViaje(travelSlide); travelSlide.classList.remove('fallback'); viaje.enter(); }
    catch (err) { travelFailed = true; travelSlide.classList.add('fallback'); console.warn('Time journey unavailable', err); }
  }
  function go(n, updateHash = true) {
    n = Math.max(0, Math.min(slides.length - 1, Math.floor(n)));
    if (!Number.isFinite(n) || n === index) return;
    if (viaje && slides[index] === travelSlide) viaje.leave();
    if (slides[index]?._a) { slides[index]._a.pause(); slides[index]._a.currentTime = 0; }
    index = n;
    resetFilms?.();
    slides.forEach((s, k) => { s.classList.toggle('on', k === index); s.inert = k !== index; });
    const s = slides[index];
    // Discussions always start with the question, including when revisiting.
    if (s.classList.contains('shift-practice')) s.querySelectorAll('.step').forEach(a => a.classList.remove('on'));
    if (s.classList.contains('zoomtour')) { s.querySelectorAll('.step').forEach(a => a.classList.remove('on')); applyZoom(s); }
    if (s === travelSlide) enterTravel();
    s.querySelectorAll('.typed').forEach(el => {
      clearInterval(el._t); el.textContent = ''; el.classList.remove('done');
      const txt = el.dataset.type; let k = 0;
      el._t = setInterval(() => { el.textContent = txt.slice(0, ++k); if (k >= txt.length) { clearInterval(el._t); el.classList.add('done'); } }, 55);
    });
    if (s.dataset.audio) {  // narration starts with the slide; V pauses or resumes it
      s._a = s._a || new Audio(s.dataset.audio); s._a.currentTime = 0; s._a.play().catch(() => {});
    }
    document.body.classList.toggle('dark-slide', s.matches('.negro,.cover-dark,.chapter,.foto,.zoomtour,.film,.viaje'));
    let act = 0; for (let k = 0; k <= index; k++) if (slides[k].dataset.act) act = Number(slides[k].dataset.act);
    const rail = document.getElementById('rail');
    rail.classList.toggle('on', act > 0 && !s.matches('.zoomtour,.foto,.film'));
    [...rail.children].forEach((el, k) => el.classList.toggle('now', k + 1 === act));
    document.getElementById('barra').style.width = `${(index + 1) / slides.length * 100}%`;
    document.getElementById('pag').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
    if (updateHash && location.hash !== `#${index + 1}`) history.replaceState(null, '', `#${index + 1}`);
  }
  function step(dir) {
    const cur = slides[index];
    if (!cur.classList.contains('steps')) return false;
    const steps = [...cur.querySelectorAll('.step')];
    const target = dir > 0 ? steps.find(s => !s.classList.contains('on')) : steps.reverse().find(s => s.classList.contains('on'));
    if (!target) return false;
    target.classList.toggle('on', dir > 0);
    if (cur.classList.contains('zoomtour')) applyZoom(cur);
    return true;
  }
  /* Zoom tours: each .step.zt carries data-zoom="x y scale" (x, y in % of the image) and data-cap. */
  function applyZoom(slide) {
    const img = slide.querySelector('.zt-img'), cap = slide.querySelector('.zt-cap');
    const last = [...slide.querySelectorAll('.step.zt.on')].pop();
    if (!img) return;
    if (last) {
      const [x, y, k] = last.dataset.zoom.split(/\s+/).map(Number);
      img.style.transform = `scale(${k}) translate(${50 - x}%, ${50 - y}%)`;
      if (cap) cap.innerHTML = last.dataset.cap || '';
    } else if (slide.classList.contains('sheet')) {
      const clip = slide.querySelector('.zt-clip');
      img.style.transform = `scale(${Math.min(1, clip.clientHeight / (img.clientHeight || 1))})`;
      if (cap) cap.innerHTML = cap.dataset.base || '';
    } else {
      img.style.transform = 'none';
      if (cap) cap.innerHTML = cap.dataset.base || '';
    }
    slide.classList.toggle('zoomed', !!last);
  }
  document.querySelectorAll('.zoomtour .zt-cap').forEach(c => { c.dataset.base = c.innerHTML; });
  addEventListener('resize', () => { const s = slides[index]; if (s?.classList.contains('zoomtour')) applyZoom(s); });
  document.querySelectorAll('.zoomtour.sheet .zt-img').forEach(img => img.addEventListener('load', () => { const s = img.closest('.slide'); if (s.classList.contains('on')) applyZoom(s); }));
  /* Films: a local mp4 plays inside the deck, offline. If it is missing, fall back to YouTube. */
  function playFilm(frame) {
    const id = frame.dataset.yt, local = frame.dataset.local;
    const youtube = () => {
      if (location.protocol === 'file:') { open(`https://www.youtube.com/watch?v=${id}`, '_blank'); return; }
      frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Video"></iframe>`;
    };
    if (!local) return youtube();
    const v = document.createElement('video');
    v.src = local; v.controls = true; v.autoplay = true; v.playsInline = true;
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
    v.addEventListener('error', youtube, { once: true });
    frame.innerHTML = ''; frame.append(v);
    frame.closest('.slide').classList.add('playing');
  }
  function filmButton(frame, label) {
    frame.innerHTML = `<button type="button" class="play">${label}</button>`;
    frame.querySelector('.play').addEventListener('click', () => playFilm(frame));
  }
  document.querySelectorAll('.film .frame').forEach(f => f.querySelector('.play').addEventListener('click', () => playFilm(f)));
  const resetFilms = () => document.querySelectorAll('.film .frame').forEach(f => {
    f.closest('.slide').classList.remove('playing');
    if (f.querySelector('iframe,video')) filmButton(f, `▶ Play again · ${f.dataset.duration || ''}`);
  });
  const advance = dir => { if (slides[index] === travelSlide && viaje && !travelFailed && viaje.handle(dir)) return; if (!step(dir)) go(index + dir); };
  function showControls() {
    document.body.classList.add('controls-visible'); clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => document.body.classList.remove('controls-visible'), 2200);
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); } catch {}
  }
  nav.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.action;
    if (a === 'prev') advance(-1);
    if (a === 'next') advance(1);
    if (a === 'chapters') chapters.showModal();
    if (a === 'help') help.showModal();
    if (a === 'fullscreen') fullscreen();
  });
  document.addEventListener('keydown', e => {
    if (chapters.open || help.open || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    if (e.target.closest('button,video') && [' ', 'Enter'].includes(e.key)) return;
    if (document.body.classList.contains('is-blackout')) {
      if (['b', 'B', '.', 'Escape'].includes(e.key)) document.body.classList.remove('is-blackout'); return;
    }
    const k = e.key.toLowerCase();
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); advance(1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); advance(-1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (k === 'f') fullscreen();
    else if (k === 'g') chapters.showModal();
    else if (k === 't') timers.get(slides[index])?.toggle();
    else if (k === 'v' && slides[index].dataset.audio) {
      // Optional narration: drop the file in audio/ and press V to play or pause it.
      const sl = slides[index]; sl._a = sl._a || new Audio(sl.dataset.audio);
      sl._a.paused ? sl._a.play().catch(() => {}) : sl._a.pause();
    }
    else if (k === 'v') { const f = slides[index].querySelector('.film .frame'); if (f) { const v = f.querySelector('video'); if (v) { v.paused ? v.play() : v.pause(); } else playFilm(f); } }
    else if (k === 'r') timers.get(slides[index])?.reset();
    else if (['b', '.'].includes(k)) document.body.classList.add('is-blackout');
    else if (e.key === '?') help.showModal();
  });
  document.addEventListener('click', e => {
    if (e.target.closest('button,a,input,dialog,nav,video') || chapters.open || help.open) return;
    if (document.body.classList.contains('is-blackout')) { document.body.classList.remove('is-blackout'); return; }
    advance(e.clientX < innerWidth * .2 ? -1 : 1);
  });
  document.addEventListener('pointermove', showControls, { passive: true });
  const fromHash = () => { const h = location.hash.slice(1); go(/^\d+$/.test(h) ? Number(h) - 1 : 0); };
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
