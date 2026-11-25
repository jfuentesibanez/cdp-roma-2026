/* "The real chart": METR time horizons on a linear scale, as a tower you fly up.
   World units: x = 2 per year from 2023, y = hours (true linear scale), z = depth.
   Everything is line work projected by hand onto a 2D canvas; no library needed.
   Driven by how many .step elements of the slide are .on. */
(() => {
  const slide = document.querySelector('.slide.tower');
  if (!slide) return;
  const cv = slide.querySelector('canvas'), cap = slide.querySelector('.tw-cap'), ctx = cv.getContext('2d');
  const steps = [...slide.querySelectorAll('.step')];
  const cap0 = cap.innerHTML;

  const P = [
    { x: 2023.20, h: 0.08, n: 'GPT-4', v: '5 min', s: 0 },
    { x: 2025.14, h: 1.0, n: 'Claude 3.7 Sonnet', v: '1 h', s: 0 },
    { x: 2025.60, h: 2.3, n: 'GPT-5', v: '2.3 h', s: 0 },
    { x: 2025.89, h: 4.8, n: 'Claude Opus 4.5', v: '4.8 h', s: 0 },
    { x: 2026.27, h: 16, n: 'Claude Mythos Preview', v: '16 h+', s: 1 },
    { x: 2026.89, h: 40, n: 'GPT-6 Astra', v: '40 h', s: 1 },
  ];
  const END = { x: 2027.54, h: 200 }, LAST = P[P.length - 1].x, FIRST = P[0].x;
  const wx = year => (year - 2023) * 2;
  const hAt = x => {                      // straight between measurements, exponential trend after the last one
    if (x <= FIRST) return P[0].h;
    for (let i = 1; i < P.length; i++) if (x <= P[i].x) { const a = P[i - 1], b = P[i]; return a.h + (b.h - a.h) * (x - a.x) / (b.x - a.x); }
    const a = P[P.length - 1]; return a.h * Math.pow(END.h / a.h, (x - a.x) / (END.x - a.x));
  };

  // camera stops: where it sits (C) and what it looks at (T) once each stage has settled
  const START = { C: [-1.5, 0.9, 6.5], T: [1.2, 0.4, 0] };
  const KEY = [
    { C: [3.2, 3.6, 13.5], T: [2.6, 3.5, 0], xr: 2025.89, ms: 3200 },
    { C: [8, 50, 66], T: [-5, 25, 0], xr: LAST, ms: 4400 },
    { C: [40, 240, 205], T: [-26, 128, 0], xr: END.x, ms: 7000 },
    { C: [26, 236, 44], T: [0, 0, 0], xr: END.x, ms: 3800 },
  ];
  const GREEN = '#3CC07E', RED = '#E5484D', INK = '#F6F7F8', DIM = '#93A0AD';
  let cam = { C: [...START.C], T: [...START.T] }, xr = FIRST, from = null, stage = 0, t0 = 0, raf = 0, W = 0, H = 0, F = 1, started = false;
  let R = [1, 0, 0], U = [0, 1, 0], Fw = [0, 0, -1];

  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  const STARS = Array.from({ length: 320 }, () => { const a = rnd() * 6.283, e = rnd() * 1.45 - .25, r = rnd(); return [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), .4 + r * .6]; });

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = slide.clientWidth; H = slide.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); F = (H / 2) / Math.tan(21 * Math.PI / 180); };
  const view = p => { const d = sub(p, cam.C); return [dot(d, R), dot(d, U), dot(d, Fw)]; };
  const scr = v => [W / 2 + v[0] / v[2] * F, H / 2 - v[1] / v[2] * F];
  const NEAR = .3;
  function line(a, b) {                   // a, b in world space; clipped against the near plane
    let va = view(a), vb = view(b);
    if (va[2] < NEAR && vb[2] < NEAR) return;
    if (va[2] < NEAR) { const t = (NEAR - va[2]) / (vb[2] - va[2]); va = [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t), NEAR]; }
    if (vb[2] < NEAR) { const t = (NEAR - vb[2]) / (va[2] - vb[2]); vb = [lerp(vb[0], va[0], t), lerp(vb[1], va[1], t), NEAR]; }
    const A = scr(va), B = scr(vb); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
  }
  function text(str, p, px, col, alpha, align = 'left', dx = 0, dy = 0, weight = '') {
    const v = view(p); if (v[2] < NEAR || alpha <= .01) return;
    const s = scr(v); ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.font = `${weight} ${px}px Optima, Candara, sans-serif`; ctx.fillText(str, s[0] + dx, s[1] + dy); ctx.globalAlpha = 1;
  }
  const stroke = (col, alpha, w = 1) => { ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.stroke(); ctx.globalAlpha = 1; };

  function draw() {
    Fw = norm(sub(cam.T, cam.C)); R = norm(cross(Fw, [0, 1, 0])); U = cross(R, Fw);
    const cy = cam.C[1], f = Math.max(12, Math.min(W, H * 1.6) * .0135), headY = hAt(xr);
    // sky: slate near the ground, almost black high up
    const k = clamp(cy / 190), mix = (a, b) => Math.round(lerp(a, b, k));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgb(${mix(34, 6)},${mix(45, 9)},${mix(56, 14)})`); g.addColorStop(1, `rgb(${mix(52, 14)},${mix(66, 22)},${mix(80, 31)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // stars
    const sa = clamp((cy - 25) / 110);
    if (sa > 0) { ctx.fillStyle = '#DCE6F0'; for (const s of STARS) { const v = [dot(s, R), dot(s, U), dot(s, Fw)]; if (v[2] <= .05) continue; const q = scr(v); ctx.globalAlpha = sa * s[3] * .8; ctx.fillRect(q[0], q[1], 1.6, 1.6); } ctx.globalAlpha = 1; }
    // ground: a fine grid near the base and a coarse one that survives from high up
    const fine = clamp(1 - cy / 70);
    if (fine > 0) { ctx.beginPath(); for (let i = -40; i <= 52; i += 2) { line([i, 0, -60], [i, 0, 30]); } for (let z = -60; z <= 30; z += 2) line([-40, 0, z], [52, 0, z]); stroke(GREEN, .13 * fine); }
    ctx.beginPath(); for (let i = -400; i <= 400; i += 20) { line([i, 0, -400], [i, 0, 400]); line([-400, 0, i], [400, 0, i]); } stroke(GREEN, .10 + .10 * k);
    // the tower: corner poles and one floor every ten hours, built as the line climbs
    const X0 = -1.2, X1 = 10.6, Z0 = -3, Z1 = 3, top = headY + 4;
    const floor = y => { line([X0, y, Z0], [X1, y, Z0]); line([X1, y, Z0], [X1, y, Z1]); line([X1, y, Z1], [X0, y, Z1]); line([X0, y, Z1], [X0, y, Z0]); };
    ctx.beginPath(); for (const [x, z] of [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]]) line([x, 0, z], [x, top, z]); stroke(INK, .16);
    ctx.beginPath(); for (let y = 1; y < 10 && y <= top; y++) floor(y); stroke(INK, .10 * clamp(1 - cy / 40));
    for (let y = 10; y <= 200 && y <= top; y += 10) {
      const a = clamp((top - y) / 4); ctx.beginPath(); floor(y); stroke(INK, .22 * a);
      text(`${y} h`, [X0, y, Z1], f * .95, DIM, a * .9, 'right', -f * .5);
    }
    for (const y of [2, 4]) text(`${y} h`, [X0, y, Z1], f * .95, DIM, .9 * clamp(1 - cy / 30) * clamp((top - y) / 2), 'right', -f * .5);
    for (let y = 2023; y <= 2027; y++) text(y, [wx(y + .5), 0, Z1 + .4], f, DIM, clamp(1 - cy / 14), 'center', 0, f);
    // the line itself: solid for measurements, dashed for the trend
    const path = (a, b, n) => { ctx.beginPath(); let pen = false; for (let i = 0; i <= n; i++) { const x = lerp(a, b, i / n), v = view([wx(x), hAt(x), 0]); if (v[2] < NEAR) { pen = false; continue; } const q = scr(v); pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; } };
    const glow = (col, dash) => { ctx.setLineDash(dash); ctx.lineJoin = ctx.lineCap = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 18; stroke(col, 1, Math.max(3.5, f * .3)); ctx.shadowBlur = 0; ctx.setLineDash([]); };
    if (xr > FIRST) { path(FIRST, Math.min(xr, LAST), 160); glow(GREEN, []); }
    if (xr > LAST) { path(LAST, xr, 200); glow(RED, [f * .75, f * .7]); }
    // measurements and their labels
    P.forEach((p, i) => {
      if (p.x > xr + .001) return;
      const w = [wx(p.x), p.h, 0], v = view(w); if (v[2] < NEAR) return;
      const q = scr(v); ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(q[0], q[1], f * .42, 0, 7); ctx.fill();
      const a = stage === 0 ? (p.s === 0 ? 1 : 0) : stage === 1 ? (p.s === 1 ? 1 : i === 3 ? .7 : 0) : stage === 2 ? (i === P.length - 1 ? 1 : 0) : 0;
      const fade = a * clamp((xr - p.x + .12) * 8), first = i === 0;
      text(p.v, w, f * 1.25, INK, fade, first ? 'left' : 'right', first ? f * .3 : -f, first ? -f * 3 : -f * 1.5, '600');
      text(p.n, w, f, DIM, fade, first ? 'left' : 'right', first ? f * .3 : -f, first ? -f * 1.7 : -f * .2);
    });
    if (xr >= END.x - .005) {
      const w = [wx(END.x), END.h, 0], v = view(w);
      if (v[2] > NEAR) { const q = scr(v); ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], f * .55, 0, 7); ctx.stroke(); }
      text('200 h', w, f * 1.7, RED, 1, 'right', -f, -f * .5, '600');
      text('July 2027 · trend', w, f, DIM, 1, 'right', -f, f * 1.1);
      if (stage === 3) text('2023 – 2025', [wx(2024.5), 0, 0], f * 1.1, INK, .9, 'left', f * 1.2, 0);
    }
  }

  function frame(now) {
    const key = KEY[stage], k = clamp((now - t0) / key.ms), e = ease(k);
    xr = lerp(from.xr, key.xr, e);
    const logmix = (a, b) => Math.exp(lerp(Math.log(a), Math.log(b), e));   // pull back at a constant ratio, so the climb feels steady
    cam.C = [lerp(from.C[0], key.C[0], e), logmix(from.C[1], key.C[1]), logmix(from.C[2], key.C[2])];
    const head = [wx(xr), hAt(xr), 0], w = (stage === 3 ? 0 : .6) * Math.sin(Math.PI * k);   // mid-flight, keep an eye on the tip of the line
    cam.T = [0, 1, 2].map(i => lerp(lerp(from.T[i], key.T[i], e), head[i], w));
    draw();
    if (k < 1) raf = requestAnimationFrame(frame);
  }
  function setStage(n) {
    stage = n; cancelAnimationFrame(raf);
    const s = steps[n - 1]; cap.innerHTML = s ? s.dataset.cap : cap0;
    from = { C: [...cam.C], T: [...cam.T], xr }; t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  function sync(entered) {
    if (!slide.classList.contains('on')) { cancelAnimationFrame(raf); started = false; return; }
    const n = steps.filter(s => s.classList.contains('on')).length;
    if (entered || !started) {
      size(); started = true;
      if (n === 0) { cam = { C: [...START.C], T: [...START.T] }; xr = FIRST; }
      else { cam = { C: [...KEY[n].C], T: [...KEY[n].T] }; xr = KEY[n].xr; stage = n; cap.innerHTML = steps[n - 1].dataset.cap; draw(); return; }
      setStage(0); return;
    }
    if (n !== stage) setStage(n);
  }
  new MutationObserver(m => sync(m.some(r => r.target === slide && !r.oldValue?.split(' ').includes('on')) && slide.classList.contains('on')))
    .observe(slide, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  addEventListener('resize', () => { if (slide.classList.contains('on')) { size(); draw(); } });
  sync(true);
})();
