/* "The real chart": METR time horizons on a linear scale. Each step pulls the camera back
   (the y axis grows), so earlier points sink to the floor. Driven by the .step.on count. */
(() => {
  const slide = document.querySelector('.slide.tower');
  if (!slide) return;
  const cv = slide.querySelector('canvas'), cap = slide.querySelector('.tw-cap'), ctx = cv.getContext('2d');
  const steps = [...slide.querySelectorAll('.step')];
  const cap0 = cap.innerHTML;
  // x = year (decimal), h = hours a task takes a human; AI completes it half the time
  const P = [
    { x: 2023.20, h: 0.08, n: 'GPT-4', v: '5 min', s: 0 },
    { x: 2025.14, h: 1.0, n: 'Claude 3.7 Sonnet', v: '1 h', s: 0 },
    { x: 2025.60, h: 2.3, n: 'GPT-5', v: '2.3 h', s: 0 },
    { x: 2025.89, h: 4.8, n: 'Claude Opus 4.5', v: '4.8 h', s: 0 },
    { x: 2026.27, h: 16, n: 'Claude Mythos Preview', v: '16 h+', s: 1 },
    { x: 2026.89, h: 40, n: 'GPT-6 Astra', v: '40 h', s: 1 },
  ];
  const END = { x: 2027.54, h: 200 };
  const X0 = 2023, X1 = 2027.75;
  const STAGE = [{ ymax: 5.6, xr: 2025.89 }, { ymax: 47, xr: 2026.89 }, { ymax: 222, xr: 2027.54 }, { ymax: 222, xr: 2027.54 }];
  const GREEN = '#3CC07E', RED = '#E5484D', INK = '#F6F7F8', DIM = '#8794A1';
  let cur = { ymax: STAGE[0].ymax, xr: X0 }, from = null, to = null, t0 = 0, stage = 0, raf = 0, W = 0, H = 0;

  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = slide.clientWidth; H = slide.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const hAt = x => {                      // the line: straight between measurements, exponential after the last one
    if (x <= P[0].x) return P[0].h;
    for (let i = 1; i < P.length; i++) if (x <= P[i].x) { const a = P[i - 1], b = P[i]; return a.h + (b.h - a.h) * (x - a.x) / (b.x - a.x); }
    const a = P[P.length - 1]; return a.h * Math.pow(END.h / a.h, (x - a.x) / (END.x - a.x));
  };
  function draw() {
    const L = W * .09, R = W * .9, T = H * .3, B = H * .84;
    const px = x => L + (x - X0) / (X1 - X0) * (R - L), py = h => B - h / cur.ymax * (B - T);
    ctx.clearRect(0, 0, W, H);
    const f = Math.max(12, Math.min(W, H * 1.6) * .0135);
    // horizontal grid
    const raw = cur.ymax / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), tick = [1, 2, 5, 10].map(m => m * mag).find(m => m >= raw);
    ctx.font = `${f}px Optima, Candara, sans-serif`; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
    for (let h = 0; h <= cur.ymax; h += tick) {
      ctx.strokeStyle = h ? 'rgba(246,247,248,.09)' : 'rgba(246,247,248,.35)'; ctx.beginPath(); ctx.moveTo(L, py(h)); ctx.lineTo(R, py(h)); ctx.stroke();
      ctx.fillStyle = DIM; ctx.textAlign = 'right'; ctx.fillText(h ? `${+h.toFixed(1)} h` : '0', L - f * .7, py(h));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let y = 2023; y <= 2027; y++) ctx.fillText(y, px(y + .5), B + f * .8);
    // the line, solid over measurements and dashed over the trend
    const seg = (a, b, dash, col) => {
      if (b <= a) return;
      ctx.beginPath(); for (let i = 0; i <= 80; i++) { const x = a + (b - a) * i / 80; i ? ctx.lineTo(px(x), py(hAt(x))) : ctx.moveTo(px(x), py(hAt(x))); }
      ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, f * .28); ctx.lineJoin = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
    };
    const last = P[P.length - 1].x;
    seg(P[0].x, Math.min(cur.xr, last), [], GREEN);
    seg(last, cur.xr, [f * .7, f * .6], RED);
    // points and labels; labels of an earlier stage fade once the camera has pulled back
    ctx.textBaseline = 'middle';
    P.forEach((p, i) => {
      if (p.x > cur.xr + .001) return;
      const x = px(p.x), y = py(p.h);
      ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(x, y, f * .42, 0, 7); ctx.fill();
      const a = stage === 0 ? (p.s === 0 ? 1 : 0) : stage === 1 ? (p.s === 1 ? 1 : i === 3 ? .75 : 0) : (i === P.length - 1 ? 1 : 0);
      if (!a) return;
      const first = i === 0, lx = first ? x + f * .2 : x - f, dy = first ? -f * 1.5 : 0;
      ctx.globalAlpha = a * Math.max(0, Math.min(1, (cur.xr - p.x + .12) * 8)); ctx.textAlign = first ? 'left' : 'right';
      ctx.font = `600 ${f * 1.25}px Optima, Candara, sans-serif`; ctx.fillStyle = INK; ctx.fillText(p.v, lx, y - f * 1.5 + dy);
      ctx.font = `${f}px Optima, Candara, sans-serif`; ctx.fillStyle = DIM; ctx.fillText(p.n, lx, y - f * .2 + dy);
      ctx.globalAlpha = 1;
    });
    if (cur.xr >= END.x - .01) {
      const x = px(END.x), y = py(END.h);
      ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, f * .5, 0, 7); ctx.stroke();
      ctx.textAlign = 'right'; ctx.font = `600 ${f * 1.6}px Optima, Candara, sans-serif`; ctx.fillStyle = RED; ctx.fillText('200 h', x - f, y - f * .4);
      ctx.font = `${f}px Optima, Candara, sans-serif`; ctx.fillStyle = DIM; ctx.fillText('July 2027 · trend', x - f, y + f * 1.1);
    }
  }
  function frame(now) {
    const k = Math.min(1, (now - t0) / 2600), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    cur.ymax = Math.exp(Math.log(from.ymax) + (Math.log(to.ymax) - Math.log(from.ymax)) * e);   // zoom out at a constant ratio
    cur.xr = from.xr + (to.xr - from.xr) * e;
    draw();
    if (k < 1) raf = requestAnimationFrame(frame);
  }
  function setStage(n, jump) {
    stage = n; to = STAGE[n]; cancelAnimationFrame(raf);
    const s = steps[n - 1]; cap.innerHTML = s ? s.dataset.cap : cap0;
    if (jump) { cur = { ...to }; draw(); return; }
    from = { ...cur }; t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (!slide.classList.contains('on')) { cancelAnimationFrame(raf); return; }
    const n = steps.filter(s => s.classList.contains('on')).length;
    if (!W) { size(); cur = { ymax: STAGE[0].ymax, xr: X0 }; }
    if (n !== stage || !to) setStage(n, false);
  }
  const mo = new MutationObserver(m => {
    if (m.some(r => r.target === slide) && slide.classList.contains('on') && !steps.some(s => s.classList.contains('on'))) { size(); cur = { ymax: STAGE[0].ymax, xr: X0 }; to = null; }
    sync();
  });
  mo.observe(slide, { attributes: true, attributeFilter: ['class'], subtree: true });
  addEventListener('resize', () => { if (slide.classList.contains('on')) { size(); draw(); } });
  sync();
})();
