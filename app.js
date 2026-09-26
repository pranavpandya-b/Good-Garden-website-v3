/* ==========================================================
   Good Garden — interactions
   No framework. GSAP + ScrollTrigger + Lenis (vendored locally).
   ========================================================== */
(() => {
  'use strict';

  const { gsap, ScrollTrigger } = window;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const remap = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const backOut = t => { const c1 = 1.9, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const f2 = n => Math.round(n * 100) / 100;
  // Draw a stroked path to fraction q. Hidden at 0 so round caps don't leave dots.
  const draw = (el, len, q) => { el.style.strokeDashoffset = f2(len * (1 - q)); el.style.visibility = q > .002 ? 'visible' : 'hidden'; };

  let menuOpen = false, drawerOpen = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqMobile = matchMedia('(max-width: 900px)');
  let isMobile = mqMobile.matches;

  if (!gsap || !ScrollTrigger) { document.documentElement.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const headerH = () => $('#header').offsetHeight;
  function scrollToY(y, duration = 1.4) {
    if (lenis) lenis.scrollTo(y, { duration, easing: easeInOut });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  function scrollToEl(el) {
    const y = el.getBoundingClientRect().top + window.scrollY - (el.id === 'top' ? 0 : headerH() - 1);
    scrollToY(Math.max(0, y));
  }
  const lockScroll = on => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };

  /* ==========================================================
     STAGE DATA
     ========================================================== */
  const STAGES = [
    { key: 'intro' },
    { key: 'root', label: 'Roots', name: 'Root Nourish', color: '#9A5B1C', title: 'Start beneath the soil.', body: 'Strong roots drink better. Root Nourish builds the foundation every new leaf depends on — ideal for cuttings, repotting and slow starters.', cta: 'Add Root Nourish · ₹119', img: './assets/root-nourish.webp' },
    { key: 'growth', label: 'Growth', name: 'Growth Booster', color: '#5E9A0A', title: 'More leaf. More life.', body: 'When your plant is ready to reach, Growth Booster fuels fresh shoots and fuller, greener leaves.', cta: 'Add Growth Booster · ₹119', img: './assets/growth-booster.webp' },
    { key: 'branch', label: 'Branches', name: 'Branch Activator', color: '#B98600', title: 'Make room for more.', body: 'Branch Activator encourages stronger stems and bushier side shoots, so your plant fills out instead of stretching thin.', cta: 'Add Branch Activator · ₹119', img: './assets/branch-activator.webp' },
    { key: 'protect', label: 'Protect', name: 'Plant Protect', color: '#187890', title: 'Keep the good growth safe.', body: 'The quiet defensive step. Plant Protect helps tender new growth stay resilient through heat, pests and everyday stress.', cta: 'Launching soon · Notify me', img: './assets/plant-protect.webp' },
    { key: 'bloom', label: 'Bloom', name: 'Flower Enhancer', color: '#D9506A', title: 'Let care come into flower.', body: 'Flower Enhancer supports more buds and brighter blooms — for roses, hibiscus, mogra and every terrace favourite.', cta: 'Add Flower Enhancer · ₹119', img: './assets/flower-enhancer.webp' },
  ];
  // Scroll progress (0–1) where each stage begins
  const STARTS = [0, .1, .28, .46, .64, .82];
  const stageAt = p => { let i = 0; for (let k = 1; k < STARTS.length; k++) if (p >= STARTS[k]) i = k; return i; };
  const WHATSAPP = 'https://wa.me/919518557729?text=';

  /* ==========================================================
     THE PLANT SCENE
     ========================================================== */
  const scene = $('#scene');
  const pin = $('.grow-pin');
  const R = rng(7);

  // --- defs ---
  const defs = svgEl('defs', {}, scene);
  const grad = (id, type, stops, attrs = {}) => { const g = svgEl(type, { id, ...attrs }, defs); stops.forEach(([o, c, a = 1]) => svgEl('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); return g; };
  grad('gSun', 'radialGradient', [[0, '#FFF7DA', .95], [.35, '#FBEFC4', .55], [1, '#F6E7B0', 0]]);
  grad('gCloud', 'radialGradient', [[0, '#FFFFFF', .75], [1, '#FFFFFF', 0]]);
  grad('gSoil', 'linearGradient', [[0, '#3E2C1F'], [.35, '#2C2017'], [1, '#150F0B']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad('gLeaf', 'linearGradient', [[0, '#AFCB82'], [1, '#5A8849']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  grad('gLeaf2', 'linearGradient', [[0, '#98BC6E'], [1, '#4C7A3F']], { x1: 0, y1: 1, x2: 1, y2: 0 });
  grad('gStem', 'linearGradient', [[0, '#7FA75A'], [.5, '#A3C579'], [1, '#6D984E']], { x1: 0, y1: 0, x2: 1, y2: 0 });
  grad('gRoot', 'linearGradient', [[0, '#F4ECDC', .95], [1, '#E9DDC6', .25]], { x1: 0, y1: 0, x2: 0, y2: 260, gradientUnits: 'userSpaceOnUse' });
  grad('gPetal', 'linearGradient', [[0, '#D8487A'], [1, '#F1A6C0']], { x1: 0, y1: 1, x2: 0, y2: 0 });
  grad('gShield', 'radialGradient', [[.6, '#3AA0B5', 0], [.95, '#3AA0B5', .12], [1, '#3AA0B5', 0]]);
  grad('gWing', 'linearGradient', [[0, '#F2B83B'], [1, '#E97F5F']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  grad('gShadow', 'radialGradient', [[0, '#0B1A12', .35], [1, '#0B1A12', 0]]);

  // --- layers ---
  const L = {};
  ['bg', 'grassBack', 'soilG', 'soilDetail', 'plantG', 'fx', 'pollen', 'grassFront'].forEach(id => { L[id] = svgEl('g', { id: 'l-' + id }, scene); });
  const sunG = svgEl('g', {}, L.bg);
  svgEl('circle', { r: 260, fill: 'url(#gSun)' }, sunG);
  svgEl('circle', { r: 46, fill: '#FFF4CF', opacity: .9 }, sunG);
  const clouds = [0, 1, 2, 3].map(i => { const g = svgEl('g', {}, L.bg); svgEl('ellipse', { rx: 180 + i * 30, ry: 38 + i * 6, fill: 'url(#gCloud)' }, g); svgEl('ellipse', { cx: 70, cy: -18, rx: 110, ry: 34, fill: 'url(#gCloud)' }, g); return { g, x: (R() - .5) * 1600, y: -560 + i * 70 + R() * 40, s: 6 + R() * 10 }; });
  const hillFar = svgEl('path', { fill: '#D3DEC4' }, L.bg);
  const hillNear = svgEl('path', { fill: '#C4D3B0' }, L.bg);
  const soil = svgEl('path', { fill: 'url(#gSoil)' }, L.soilG);
  const soilEdge = svgEl('path', { fill: 'none', stroke: 'rgba(255,240,220,.08)', 'stroke-width': 2 }, L.soilG);

  // pebbles & specks (fixed around origin, spread wide)
  for (let i = 0; i < 70; i++) {
    const x = (R() - .5) * 2800, y = 40 + R() * 300, rx = 3 + R() * 9;
    svgEl('ellipse', { cx: f2(x), cy: f2(y), rx: f2(rx), ry: f2(rx * (.5 + R() * .3)), fill: R() > .5 ? '#4A3727' : '#241A12', opacity: f2(.5 + R() * .5) }, L.soilDetail);
  }
  // earthworm
  const worm = svgEl('path', { fill: 'none', stroke: '#B8806C', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, L.soilDetail);

  // grass tufts (CSS-animated sway)
  const tufts = [];
  function makeTuft(parent, scale, color) {
    const outer = svgEl('g', {}, parent);
    const g = svgEl('g', { class: 'tuft' }, outer);
    const n = 3 + Math.floor(R() * 3);
    for (let b = 0; b < n; b++) {
      const h = (18 + R() * 26) * scale, lean = (R() - .5) * 18 * scale, x0 = (b - n / 2) * 3 * scale;
      svgEl('path', { d: `M${f2(x0)} 2 Q${f2(x0 + lean * .3)} ${f2(-h * .6)} ${f2(x0 + lean)} ${f2(-h)} Q${f2(x0 + lean * .3 + 2.4)} ${f2(-h * .5)} ${f2(x0 + 3)} 2Z`, fill: color }, g);
    }
    g.style.animationDelay = (-R() * 4).toFixed(2) + 's';
    return outer;
  }
  for (let i = 0; i < 60; i++) { const x = (i / 60 - .5) * 2800 + (R() - .5) * 30; if (Math.abs(x) < 70) continue; tufts.push({ g: makeTuft(L.grassBack, .8 + R() * .5, R() > .5 ? '#8DAE6C' : '#7C9F5E'), x }); }
  const frontTufts = [];
  for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1; const x = side * (260 + R() * 900); frontTufts.push({ g: makeTuft(L.grassFront, 1.5 + R() * .8, '#5F8A47'), x }); }
  const tuftStyle = document.createElement('style');
  tuftStyle.textContent = `.tuft{transform-box:fill-box;transform-origin:50% 100%;animation:tuft 4.2s ease-in-out infinite}@keyframes tuft{0%,100%{rotate:-4deg}50%{rotate:5deg}}@media (prefers-reduced-motion:reduce){.tuft{animation:none}}`;
  document.head.appendChild(tuftStyle);

  // --- plant ---
  const plantG = L.plantG;
  svgEl('ellipse', { cx: 0, cy: 6, rx: 90, ry: 14, fill: 'url(#gShadow)' }, plantG);

  // roots
  function makeRoots(parent, { count, len, spread, width, seed, color = 'url(#gRoot)', startY = 4 }) {
    const r = rng(seed); const out = [];
    const mains = [];
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0 : i / (count - 1) * 2 - 1;
      const ang = (90 + u * spread + (r() - .5) * 10) * Math.PI / 180;
      const l = len * (.65 + r() * .45) * (1 - Math.abs(u) * .22);
      const ex = Math.cos(ang) * l, ey = Math.sin(ang) * l + startY;
      const c1x = u * 8, c1y = l * .32;
      const c2x = ex * .55 + (r() - .5) * 40, c2y = ey * .62;
      const d = `M0 ${startY} C${f2(c1x)} ${f2(c1y)} ${f2(c2x)} ${f2(c2y)} ${f2(ex)} ${f2(ey)}`;
      const p = svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': f2(width * (.75 + r() * .5)), 'stroke-linecap': 'round' }, parent);
      const total = p.getTotalLength();
      p.style.strokeDasharray = total; p.style.strokeDashoffset = total;
      const m = { el: p, len: total, delay: r() * .2, ang };
      mains.push(m); out.push(m);
    }
    mains.forEach(m => {
      const kids = 1 + Math.floor(r() * 2.4);
      for (let k = 0; k < kids; k++) {
        const t = .3 + r() * .5; const pt = m.el.getPointAtLength(m.len * t);
        const a = m.ang + (r() > .5 ? 1 : -1) * (.4 + r() * .5);
        const l = len * (.14 + r() * .18);
        const ex = pt.x + Math.cos(a) * l, ey = pt.y + Math.sin(a) * l;
        const d = `M${f2(pt.x)} ${f2(pt.y)} Q${f2((pt.x + ex) / 2 + (r() - .5) * 14)} ${f2((pt.y + ey) / 2)} ${f2(ex)} ${f2(ey)}`;
        const p = svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': f2(width * .45), 'stroke-linecap': 'round', opacity: .8 }, parent);
        const total = p.getTotalLength();
        p.style.strokeDasharray = total; p.style.strokeDashoffset = total;
        out.push({ el: p, len: total, delay: Math.min(.4, m.delay + t * .3) });
      }
    });
    return out;
  }
  const rootsG = svgEl('g', {}, plantG);
  const roots = makeRoots(rootsG, { count: 15, len: 250, spread: 64, width: 3, seed: 11 });

  // seed shell
  const seedG = svgEl('g', { transform: 'translate(4 10) rotate(-18)' }, plantG);
  svgEl('ellipse', { rx: 13, ry: 8, fill: '#8B5E3C' }, seedG);
  svgEl('path', { d: 'M-12 -1 Q0 -7 12 -1', fill: 'none', stroke: '#6A4428', 'stroke-width': 1.5 }, seedG);

  const swayG = svgEl('g', {}, plantG);
  const branchesG = svgEl('g', {}, swayG);
  const STEM_D = 'M0 2 C 5 -150, -9 -300, 2 -430 S -5 -560, 0 -612';
  const stem = svgEl('path', { d: STEM_D, fill: 'none', stroke: 'url(#gStem)', 'stroke-width': 8, 'stroke-linecap': 'round' }, swayG);
  const stemHi = svgEl('path', { d: STEM_D, fill: 'none', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1.6, 'stroke-linecap': 'round', transform: 'translate(-1.6 0)' }, swayG);
  const STEM_LEN = stem.getTotalLength();
  [stem, stemHi].forEach(s => { s.style.strokeDasharray = STEM_LEN; s.style.strokeDashoffset = STEM_LEN; });
  const tipGlow = svgEl('circle', { r: 6, fill: '#D8EDB0', opacity: 0 }, swayG);
  const nodesG = svgEl('g', {}, swayG);

  const LEAF_D = 'M0 0 C 8 -24 40 -38 70 -30 C 86 -25 96 -12 100 0 C 92 14 74 30 48 30 C 22 30 6 16 0 0 Z';
  const RIB_D = 'M5 0 Q 50 -3 93 0';
  const leaves = []; // every leaf: {g, x, y, a, size, grow, rot, vel, wx, wy}
  function makeLeaf(parent, x, y, angle, size, gradId = 'gLeaf') {
    const g = svgEl('g', { class: 'leaf-hit', 'data-cursor': 'Touch' }, parent);
    svgEl('path', { d: LEAF_D, fill: `url(#${gradId})` }, g);
    svgEl('path', { d: RIB_D, fill: 'none', stroke: 'rgba(255,255,255,.38)', 'stroke-width': 1.3 }, g);
    const leaf = { g, x, y, a: angle, size, grow: 0, rot: 0, vel: 0, wx: 0, wy: 0, seed: R() * 6.28 };
    g.setAttribute('transform', 'scale(0)');
    leaves.push(leaf);
    return leaf;
  }

  // Nodes along the stem: [t along stem, side, big leaf size, has branch]
  const NODE_DEF = [[.17, -1, 118, 0], [.29, 1, 132, 1], [.41, -1, 136, 1], [.53, 1, 124, 0], [.65, -1, 110, 1], [.76, 1, 92, 0], [.87, -1, 64, 0]];
  const nodes = NODE_DEF.map(([t, s, big, br], i) => {
    const pt = stem.getPointAtLength(STEM_LEN * t);
    const g = svgEl('g', { transform: `translate(${f2(pt.x)} ${f2(pt.y)})` }, nodesG);
    const curl = svgEl('path', { d: `M0 3 C ${-s * 2} 16, ${-s * 20} 20, ${-s * 24} 9 C ${-s * 26} 3, ${-s * 20} 0, ${-s * 17} 5`, fill: 'none', stroke: '#86AE62', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    const curlLen = curl.getTotalLength(); curl.style.strokeDasharray = curlLen; curl.style.strokeDashoffset = curlLen;
    const bigA = s > 0 ? -22 - i * 1.5 : 202 + i * 1.5;
    const bigLeaf = makeLeaf(g, s * 5, -3, bigA, big);
    const midLeaf = makeLeaf(g, s * 3, 2, s > 0 ? 34 : 146, big * .42, 'gLeaf2');
    const smallLeaf = br ? null : makeLeaf(g, -s * 4, -4, s > 0 ? 222 : -42, big * .38, 'gLeaf2');
    [bigLeaf, midLeaf, smallLeaf].forEach(l => l && (l.nx = pt.x, l.ny = pt.y));
    return { t, s, pt, g, curl, curlLen, bigLeaf, midLeaf, smallLeaf, br };
  });
  // Cotyledons (the first seed leaves)
  const cotPt = stem.getPointAtLength(STEM_LEN * .045);
  const cotG = svgEl('g', { transform: `translate(${f2(cotPt.x)} ${f2(cotPt.y)})` }, nodesG);
  const cots = [makeLeaf(cotG, 1, 0, -38, 30, 'gLeaf'), makeLeaf(cotG, -1, 0, 218, 30, 'gLeaf')];
  cots.forEach(l => { l.nx = cotPt.x; l.ny = cotPt.y; });

  // Branch shoots (Branch Activator stage) — grow on the side opposite the big leaf
  const branches = nodes.filter(n => n.br).map((n, k) => {
    const s = -n.s;
    const g = svgEl('g', { transform: `translate(${f2(n.pt.x)} ${f2(n.pt.y)})` }, branchesG);
    const ex = s * 70, ey = -92;
    const path = svgEl('path', { d: `M0 0 C ${s * 18} -8, ${s * 50} -34, ${ex} ${ey}`, fill: 'none', stroke: '#8DB365', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
    const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    const lf = [makeLeaf(g, ex, ey, s > 0 ? -58 : 238, 58, 'gLeaf'), makeLeaf(g, ex, ey, s > 0 ? 8 : 172, 44, 'gLeaf2'), makeLeaf(g, s * 38, -40, s > 0 ? -150 : -30, 36, 'gLeaf2')];
    lf.forEach(l => { l.nx = n.pt.x; l.ny = n.pt.y; });
    const bud = svgEl('circle', { cx: ex, cy: ey, r: 5, fill: '#B9D48E', opacity: 0 }, g);
    return { g, path, len, leaves: lf, bud, k };
  });

  // Dew drops (protection stage)
  const dewG = svgEl('g', {}, swayG);
  const dews = nodes.slice(0, 6).map((n, i) => {
    const g = svgEl('g', { opacity: 0 }, dewG);
    svgEl('circle', { r: 3.6, fill: 'rgba(230,246,255,.9)', stroke: 'rgba(255,255,255,.95)', 'stroke-width': .8 }, g);
    svgEl('circle', { cx: -1.1, cy: -1.2, r: 1, fill: '#fff' }, g);
    return { g, leaf: n.bigLeaf, along: .45 + (i % 3) * .12, off: (i % 2 ? -6 : 7) };
  });

  // Flower
  const flowerG = svgEl('g', {}, swayG);
  const budG = svgEl('g', {}, flowerG);
  svgEl('path', { d: 'M0 4 C -16 -6 -14 -34 0 -46 C 14 -34 16 -6 0 4 Z', fill: '#6E9A4E' }, budG);
  svgEl('path', { d: 'M0 4 C -10 -6 -8 -28 0 -38', fill: 'none', stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1.4 }, budG);
  const budPink = svgEl('path', { d: 'M0 -14 C -7 -22 -5 -38 0 -44 C 5 -38 7 -22 0 -14 Z', fill: '#E27CA0', opacity: 0 }, budG);
  const PETAL_D = 'M0 0 C -24 -14 -32 -58 -11 -78 C -4 -84 4 -84 11 -78 C 32 -58 24 -14 0 0 Z';
  const petalRing = (n, len, offset, opacity, delay) => Array.from({ length: n }, (_, i) => {
    const el = svgEl('path', { d: PETAL_D, fill: 'url(#gPetal)', opacity, style: 'mix-blend-mode:multiply' }, flowerG);
    el.setAttribute('transform', 'scale(0)');
    return { el, a: offset + i * 360 / n, len, delay: delay + i * .025 };
  });
  const petals = [...petalRing(8, 84, 0, .72, 0), ...petalRing(8, 70, 22.5, .66, .12), ...petalRing(6, 44, 10, .6, .26)];
  const centerG = svgEl('g', { class: 'leaf-hit', 'data-cursor': 'Touch' }, flowerG);
  svgEl('circle', { r: 17, fill: '#F2B83B' }, centerG);
  svgEl('circle', { r: 10, fill: '#F6C95A' }, centerG);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; svgEl('circle', { cx: f2(Math.cos(a) * 13), cy: f2(Math.sin(a) * 13), r: 1.6, fill: '#C98A1C' }, centerG); }
  centerG.setAttribute('transform', 'scale(0)');

  // Protection shield & pests
  const shieldG = svgEl('g', { opacity: 0 }, plantG);
  svgEl('ellipse', { cx: 0, cy: -320, rx: 300, ry: 390, fill: 'url(#gShield)' }, shieldG);
  const shieldRing = svgEl('ellipse', { cx: 0, cy: -320, rx: 300, ry: 390, fill: 'none', stroke: '#3AA0B5', 'stroke-width': 1.6, 'stroke-dasharray': '2 11', 'stroke-linecap': 'round' }, shieldG);
  const bugsG = svgEl('g', {}, plantG);
  const bugs = [nodes[1].bigLeaf, nodes[2].bigLeaf, nodes[3].bigLeaf, nodes[4].bigLeaf, nodes[2].midLeaf, nodes[5].bigLeaf].map((leaf, i) => {
    const g = svgEl('g', { opacity: 0 }, bugsG);
    const body = svgEl('g', {}, g);
    [-3, 0, 3].forEach(y => { svgEl('path', { d: `M-2 ${y} L-7 ${y + 2} M2 ${y} L7 ${y + 2}`, stroke: '#3A3326', 'stroke-width': 1, 'stroke-linecap': 'round' }, body); });
    svgEl('ellipse', { rx: 4.6, ry: 6.4, fill: '#56613A' }, body);
    svgEl('circle', { cy: -6.5, r: 2.8, fill: '#3A3326' }, body);
    const ang = (R() - .5) * 2.4 - Math.PI / 2 + (leaf.a > 90 || leaf.a < -90 ? -.8 : .8);
    return { g, body, leaf, along: .55 + R() * .2, dir: { x: Math.cos(ang), y: Math.sin(ang) }, spin: R() * 360 };
  });

  // Visitors: butterfly + bee
  const creaturesG = svgEl('g', {}, plantG);
  const butterfly = svgEl('g', { opacity: 0 }, creaturesG);
  const bWingL = svgEl('g', {}, butterfly), bWingR = svgEl('g', {}, butterfly);
  svgEl('path', { d: 'M0 0 C -20 -30 -46 -26 -40 -4 C -36 8 -14 6 0 0 Z', fill: 'url(#gWing)' }, bWingL);
  svgEl('path', { d: 'M0 2 C -14 8 -30 26 -18 30 C -8 32 -2 16 0 2 Z', fill: '#E97F5F' }, bWingL);
  svgEl('path', { d: 'M0 0 C 20 -30 46 -26 40 -4 C 36 8 14 6 0 0 Z', fill: 'url(#gWing)' }, bWingR);
  svgEl('path', { d: 'M0 2 C 14 8 30 26 18 30 C 8 32 2 16 0 2 Z', fill: '#E97F5F' }, bWingR);
  svgEl('ellipse', { rx: 3, ry: 14, cy: 4, fill: '#2F2A22' }, butterfly);
  svgEl('path', { d: 'M-1 -9 Q -6 -20 -10 -22 M1 -9 Q 6 -20 10 -22', fill: 'none', stroke: '#2F2A22', 'stroke-width': 1.2 }, butterfly);
  const bee = svgEl('g', { opacity: 0 }, creaturesG);
  const beeWings = svgEl('g', { opacity: .75 }, bee);
  svgEl('ellipse', { cx: -4, cy: -9, rx: 6, ry: 9, fill: '#FFFFFF', transform: 'rotate(-25)' }, beeWings);
  svgEl('ellipse', { cx: 5, cy: -9, rx: 6, ry: 9, fill: '#F4FAFF', transform: 'rotate(25)' }, beeWings);
  svgEl('ellipse', { rx: 11, ry: 8, fill: '#F2B83B' }, bee);
  svgEl('path', { d: 'M-3 -7.5 V 7.5 M3 -7 V 7', stroke: '#2F2A22', 'stroke-width': 2.6 }, bee);
  svgEl('circle', { cx: 11, cy: -1, r: 5, fill: '#2F2A22' }, bee);

  // Pollen / seeds drifting
  const pollen = Array.from({ length: 26 }, () => ({ el: svgEl('circle', { r: f2(1.2 + R() * 2.2), fill: '#F3D97E' }, L.pollen), x: (R() - .5) * 1800, y: -R() * 800, sp: 8 + R() * 18, ph: R() * 6.28, a: .25 + R() * .5 }));

  // Drop FX
  const fxDrop = svgEl('path', { d: 'M0 -12 C 6 -4 8 2 0 8 C -8 2 -6 -4 0 -12 Z', fill: '#9CCB5B', opacity: 0 }, L.fx);
  const ripples = [0, 1].map(() => svgEl('ellipse', { cx: 0, cy: 0, rx: 10, ry: 3, fill: 'none', stroke: 'rgba(241,235,221,.7)', 'stroke-width': 1.5, opacity: 0 }, L.fx));

  /* ---------- Layout / viewBox ---------- */
  const view = { x: 0, y: 0, w: 1000, h: 1000, px: 0 };
  function tallestCard() {
    const c = $('#stageCard'), t = $('#stageTitle'), b = $('#stageBody');
    const keep = [t.textContent, b.textContent]; let max = c.offsetHeight;
    STAGES.slice(1).forEach(s => { t.textContent = s.title; b.textContent = s.body; max = Math.max(max, c.offsetHeight); });
    t.textContent = keep[0]; b.textContent = keep[1];
    return max;
  }
  const soilY = x => 11 * Math.sin((x - view.px) / 150) + 5 * Math.sin((x - view.px) / 61);
  function layout() {
    isMobile = mqMobile.matches;
    const vw = pin.clientWidth, vh = pin.clientHeight;
    const card = $('#stageCard');
    let topFrac, groundFrac;
    if (isMobile) {
      const cardBottom = card.offsetTop + tallestCard();
      topFrac = clamp((cardBottom + 14) / vh, .25, .56);
      groundFrac = .8;
    } else { topFrac = clamp((headerH() + 36) / vh, .08, .2); groundFrac = .79; }
    let h = 720 / (groundFrac - topFrac);
    let w = h * vw / vh;
    if (w < 640) { h *= 640 / w; w = 640; }
    view.h = h; view.w = w; view.y = -720 - topFrac * h - (isMobile ? 0 : 0); view.x = -w / 2;
    view.px = 0;
    scene.setAttribute('viewBox', `${f2(view.x)} ${f2(view.y)} ${f2(w)} ${f2(h)}`);
    plantG.setAttribute('transform', `translate(${f2(view.px)} 0)`);
    // soil + hills
    const x0 = view.x - 200, x1 = view.x + w + 200; let d = `M${f2(x0)} ${f2(soilY(x0))}`, e = d;
    for (let x = x0 + 20; x <= x1; x += 20) { const s = `L${f2(x)} ${f2(soilY(x))}`; d += s; e += s; }
    soil.setAttribute('d', d + `L${f2(x1)} ${f2(view.y + h + 50)} L${f2(x0)} ${f2(view.y + h + 50)}Z`);
    soilEdge.setAttribute('d', e);
    const hill = (amp, base, freq, ph) => { let p = `M${f2(x0)} 40`; for (let x = x0; x <= x1; x += 30) p += `L${f2(x)} ${f2(base - amp * (.55 + .45 * Math.sin(x / freq + ph)) - amp * .3 * Math.sin(x / (freq * .37) + ph * 2))}`; return p + `L${f2(x1)} 40Z`; };
    hillFar.setAttribute('d', hill(95, -18, 260, 1.2));
    hillNear.setAttribute('d', hill(52, -4, 190, 3.1));
    tufts.forEach(t => t.g.setAttribute('transform', `translate(${f2(t.x)} ${f2(soilY(t.x) + 3)})`));
    frontTufts.forEach(t => t.g.setAttribute('transform', `translate(${f2(t.x)} ${f2(soilY(t.x) + 6)})`));
    pollen.forEach(p => { p.x = view.x + R() * w; });
  }

  /* ---------- Interaction state ---------- */
  const st = { p: 0, target: 0, intro: 0, time: 0, stage: -1, pointer: { x: 9999, y: 9999, vx: 0, vy: 0, px: 0, py: 0, inside: false }, par: { x: 0, y: 0 }, flowerSpin: 0, burst: 0, visible: true };
  function toSvg(cx, cy) { const m = scene.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const pt = scene.createSVGPoint(); pt.x = cx; pt.y = cy; const r = pt.matrixTransform(m.inverse()); return { x: r.x, y: r.y }; }
  scene.addEventListener('pointermove', e => {
    const q = toSvg(e.clientX, e.clientY); const P = st.pointer;
    P.vx = q.x - P.x; P.vy = q.y - P.y; P.x = q.x; P.y = q.y; P.inside = true;
    if (finePointer) { st.par.x = (e.clientX / innerWidth - .5) * 2; st.par.y = (e.clientY / innerHeight - .5) * 2; }
  }, { passive: true });
  scene.addEventListener('pointerleave', () => { st.pointer.inside = false; st.pointer.x = 9999; });
  // Tap a leaf: it rustles. Tap the flower: pollen bursts.
  scene.addEventListener('pointerdown', e => {
    const hit = e.target.closest('.leaf-hit');
    if (!hit) return;
    if (hit === centerG) { st.burst = 1; st.flowerSpin += 40; sparkle(e.clientX, e.clientY, '#F2B83B'); return; }
    const leaf = leaves.find(l => l.g === hit);
    if (leaf) { leaf.vel += (R() > .5 ? 1 : -1) * 9; sparkle(e.clientX, e.clientY, '#9CCB5B'); }
  });

  /* ---------- Render ---------- */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; st.time += dt;
    if (st.visible) {
      const k = reduced ? 1 : 1 - Math.pow(1 - .09, dt * 60);
      st.p += (st.target - st.p) * k;
      if (Math.abs(st.target - st.p) < .00005) st.p = st.target;
      render(dt);
    }
    requestAnimationFrame(frame);
  }

  function leafTransform(l, s, extra = 0) {
    l.grow = s;
    const sc = f2(Math.max(0, s) * l.size / 100);
    l.g.setAttribute('transform', `translate(${f2(l.x)} ${f2(l.y)}) rotate(${f2(l.a + l.rot + extra)}) scale(${sc})`);
    // world position of leaf middle (for interaction)
    const a = (l.a + l.rot) * Math.PI / 180, r = l.size * .5 * Math.max(s, .01);
    l.wx = view.px + l.nx + l.x + Math.cos(a) * r; l.wy = l.ny + l.y + Math.sin(a) * r;
  }

  function render(dt) {
    const p = st.p, t = st.time, intro = st.intro;
    const rootP = remap(p, .06, .3);
    const stemP = Math.max(.07 * intro, easeInOut(remap(p, .22, .62)));
    const branchP = remap(p, .46, .66);
    const thick = remap(p, .46, .64);
    const protectP = remap(p, .62, .82);
    const budP = remap(p, .74, .86);
    const bloomP = remap(p, .83, .97);
    const visitP = remap(p, .9, 1);

    // Background parallax: the "camera" rises as the plant grows
    const px = st.par.x, py = st.par.y;
    sunG.setAttribute('transform', `translate(${f2(view.x + view.w * .78 - px * 14)} ${f2(-470 - p * 160 - py * 10)})`);
    hillFar.setAttribute('transform', `translate(${f2(-px * 8)} ${f2(p * 46 - py * 4)})`);
    hillNear.setAttribute('transform', `translate(${f2(-px * 4)} ${f2(p * 22 - py * 2)})`);
    clouds.forEach((c, i) => { let x = c.x + t * c.s; const span = view.w + 800; x = ((x - view.x + 400) % span + span) % span + view.x - 400; c.g.setAttribute('transform', `translate(${f2(x - px * (10 + i * 3))} ${f2(c.y + p * (70 + i * 15))})`); });
    L.grassFront.setAttribute('transform', `translate(${f2(px * 10)} 0)`);

    // Roots
    roots.forEach(r => draw(r.el, r.len, easeOut(clamp((rootP - r.delay) / .6))));
    seedG.setAttribute('opacity', f2(1 - remap(p, .12, .26)));
    // Worm peeks through the soil
    const wa = remap(p, .1, .2) * (1 - remap(p, .5, .6));
    if (wa > 0) {
      const wx = view.px - 230 + Math.sin(t * .3) * 20; let d = '';
      for (let i = 0; i <= 8; i++) { const x = wx + i * 6, y = 120 + Math.sin(t * 3 + i * .9) * 4; d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y); }
      worm.setAttribute('d', d); worm.setAttribute('opacity', f2(wa * .9));
    } else worm.setAttribute('opacity', 0);

    // Stem
    const off = f2(STEM_LEN * (1 - stemP));
    stem.style.strokeDashoffset = off; stemHi.style.strokeDashoffset = off;
    stem.setAttribute('stroke-width', f2(7 + thick * 3.4));
    const tip = stem.getPointAtLength(STEM_LEN * stemP);
    tipGlow.setAttribute('cx', f2(tip.x)); tipGlow.setAttribute('cy', f2(tip.y));
    tipGlow.setAttribute('opacity', f2(stemP < .995 && stemP > .08 ? .55 + Math.sin(t * 5) * .3 : 0));
    const wind = reduced ? 0 : Math.sin(t * .7) * .6 + Math.sin(t * 1.9) * .25;
    swayG.setAttribute('transform', `rotate(${f2(wind * (.4 + stemP * .6))})`);

    // Leaf physics: pointer rustle + springs
    const P = st.pointer; const pv = Math.hypot(P.vx, P.vy);
    leaves.forEach((l, i) => {
      if (P.inside && l.grow > .2 && pv > .5) {
        const dx = P.x - l.wx, dy = P.y - l.wy, d = Math.hypot(dx, dy);
        if (d < 80) l.vel += (P.vy * .25 - P.vx * .12) * (1 - d / 80);
      }
      l.vel += -l.rot * 60 * dt - l.vel * 6 * dt;
      l.rot += l.vel * dt * 10;
      l.rot = clamp(l.rot, -28, 28);
    });
    P.vx *= .6; P.vy *= .6;

    cots.forEach((l, i) => leafTransform(l, backOut(intro) * (1 - remap(p, .7, .85) * .25), reduced ? 0 : Math.sin(t * 1.4 + i) * 3));
    nodes.forEach((n, i) => {
      const g1 = clamp((stemP - n.t) / .14), g2 = clamp((stemP - n.t - .03) / .14), g3 = clamp((stemP - n.t - .06) / .16);
      const idle = reduced ? 0 : Math.sin(t * 1.3 + i * .9) * (1.5 + i * .35);
      leafTransform(n.bigLeaf, backOut(g1), idle);
      leafTransform(n.midLeaf, backOut(g2), idle * .6);
      if (n.smallLeaf) leafTransform(n.smallLeaf, backOut(g3), -idle * .7);
      draw(n.curl, n.curlLen, easeOut(g2));
    });
    branches.forEach(b => {
      const q = clamp((branchP - b.k * .18) / .55);
      draw(b.path, b.len, easeOut(q));
      b.leaves.forEach((l, j) => leafTransform(l, backOut(clamp((q - .45 - j * .1) / .4)), reduced ? 0 : Math.sin(t * 1.6 + j + b.k) * 3));
      b.bud.setAttribute('opacity', f2(clamp((q - .8) / .2)));
    });

    // Protection: pests show up, the shield arrives, they leave. Dew stays.
    bugs.forEach((b, i) => {
      const l = b.leaf, a = (l.a + l.rot) * Math.PI / 180, r = l.size * b.along * l.grow;
      const bx = l.nx + l.x + Math.cos(a) * r, by = l.ny + l.y + Math.sin(a) * r;
      const show = remap(p, .56 + i * .01, .62), flee = easeOut(remap(p, .66 + i * .015, .76 + i * .015));
      const crawl = reduced ? 0 : Math.sin(t * 2 + i) * 2;
      const x = bx + b.dir.x * flee * 520 + crawl, y = by + b.dir.y * flee * 520;
      const rot = flee > 0 ? Math.atan2(b.dir.y, b.dir.x) * 180 / Math.PI + 90 : b.spin + Math.sin(t + i) * 20;
      b.g.setAttribute('transform', `translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(1 + flee * .2)})`);
      b.g.setAttribute('opacity', f2(show * (1 - flee)));
    });
    const bell = Math.sin(Math.PI * protectP);
    shieldG.setAttribute('opacity', f2(bell * .95));
    shieldG.setAttribute('transform', `translate(0 -320) scale(${f2(lerp(.82, 1, easeOut(remap(p, .62, .72))))}) translate(0 320)`);
    shieldRing.setAttribute('stroke-dashoffset', f2(-t * 18));
    dews.forEach((d, i) => {
      const l = d.leaf, a = (l.a + l.rot) * Math.PI / 180, r = l.size * d.along * l.grow;
      const x = l.nx + l.x + Math.cos(a) * r + Math.cos(a + 1.57) * d.off, y = l.ny + l.y + Math.sin(a) * r + Math.sin(a + 1.57) * d.off;
      const s = backOut(remap(p, .68 + i * .012, .76 + i * .012));
      d.g.setAttribute('transform', `translate(${f2(x)} ${f2(y)}) scale(${f2(s)})`);
      d.g.setAttribute('opacity', f2(clamp(s) * (.8 + Math.sin(t * 2 + i) * .2)));
    });

    // Flower
    const top = stem.getPointAtLength(STEM_LEN);
    st.flowerSpin *= Math.pow(.02, dt);
    const spin = (reduced ? 0 : t * 4) + st.flowerSpin;
    flowerG.setAttribute('transform', `translate(${f2(top.x)} ${f2(top.y)})`);
    const budS = backOut(budP) * (1 - easeOut(bloomP) * .75);
    budG.setAttribute('transform', `scale(${f2(budS)})`);
    budPink.setAttribute('opacity', f2(remap(p, .8, .86)));
    petals.forEach(pe => {
      const q = clamp((bloomP - pe.delay) / .6), s = backOut(q);
      const burst = st.burst * Math.sin(pe.a) * 6;
      pe.el.setAttribute('transform', `rotate(${f2(pe.a + spin + (1 - q) * 55 + burst)}) scale(${f2(Math.max(0, s) * pe.len / 84 * (1 + st.burst * .06))}, ${f2(Math.max(0, s) * pe.len / 84)})`);
    });
    const cS = backOut(remap(bloomP, .45, .85)) * (1 + st.burst * .25);
    centerG.setAttribute('transform', `scale(${f2(cS)})`);
    st.burst *= Math.pow(.015, dt);

    // Visitors
    const fx = top.x, fy = top.y;
    if (visitP > 0) {
      const q = easeInOut(visitP);
      const sx = view.x + view.w + 60 - view.px, sy = -520;
      const tx = fx + 64, ty = fy - 86;
      const hover = reduced ? 0 : Math.sin(t * 1.6) * 6;
      const bx = lerp(sx, tx, q), by = lerp(sy, ty, q) + Math.sin(q * Math.PI * 3) * 50 * (1 - q) + hover;
      const flap = reduced ? 1 : (q < 1 ? .3 + .7 * Math.abs(Math.sin(t * 14)) : .55 + .45 * Math.abs(Math.sin(t * 2.6)));
      butterfly.setAttribute('transform', `translate(${f2(bx)} ${f2(by)}) rotate(${f2(-18 + (1 - q) * -12)}) scale(.9)`);
      bWingL.setAttribute('transform', `scale(${f2(flap)} 1)`); bWingR.setAttribute('transform', `scale(${f2(flap)} 1)`);
      butterfly.setAttribute('opacity', f2(remap(visitP, 0, .15)));
      const ang = t * 1.4, bs = easeOut(remap(p, .88, .96));
      const ex = fx + Math.cos(ang) * 150 * bs + (1 - bs) * -300, ey = fy + 30 + Math.sin(ang * 2) * 36;
      bee.setAttribute('transform', `translate(${f2(ex)} ${f2(ey)}) scale(${f2(Math.cos(ang) < 0 ? -1 : 1)} 1) rotate(${f2(Math.sin(t * 6) * 6)})`);
      beeWings.setAttribute('transform', `scale(1 ${f2(reduced ? 1 : .4 + .6 * Math.abs(Math.sin(t * 40)))})`);
      bee.setAttribute('opacity', f2(bs));
    } else { butterfly.setAttribute('opacity', 0); bee.setAttribute('opacity', 0); }

    // Pollen drifts up; more of it once the flower opens
    const bloomBoost = bloomP;
    pollen.forEach((q, i) => {
      if (!reduced) { q.y -= q.sp * dt * (1 + bloomBoost); q.ph += dt; }
      if (q.y < view.y - 20) { q.y = -10 - Math.random() * 60; q.x = view.x + Math.random() * view.w; }
      q.el.setAttribute('transform', `translate(${f2(q.x + Math.sin(q.ph) * 14 + px * 16)} ${f2(q.y)})`);
      q.el.setAttribute('opacity', f2(q.a * (.35 + bloomBoost * .9) * (i % 3 === 0 ? 1 : .7)));
    });

    updateOverlay(p);
  }

  /* ---------- Overlay copy, rail, bottle ---------- */
  const intro = $('#intro'), card = $('#stageCard'), bottle = $('#stageBottle'), rail = $('#rail'), hint = $('#scrollHint');
  const railFill = document.createElement('span'); railFill.className = 'rail-fill'; rail.appendChild(railFill);
  const railBtns = STAGES.slice(1).map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.style.setProperty('--c', s.color); b.innerHTML = `<span>${s.label}</span><i></i>`;
    b.setAttribute('aria-label', `Jump to stage ${i + 1}: ${s.label}`);
    b.dataset.cursor = s.label;
    b.addEventListener('click', () => jumpToStage(i + 1));
    rail.appendChild(b); return b;
  });
  function jumpToStage(i) {
    const grow = $('#grow');
    const target = i >= 5 ? .97 : STARTS[i] + .1;
    const y = grow.offsetTop + target * (grow.offsetHeight - window.innerHeight);
    scrollToY(y, 1.2 + Math.abs(i - st.stage) * .25);
  }
  $$('[data-jump-stage]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); jumpToStage(+a.dataset.jumpStage); }));

  const cache = new Map();
  const put = (el, prop, val) => { const k = el.id + prop; if (cache.get(k) !== val) { cache.set(k, val); el.style[prop] = val; } };
  function updateOverlay(p) {
    const introOut = remap(p, .03, .09);
    put(intro, 'opacity', f2(1 - introOut) + '');
    put(intro, 'transform', `translate(-50%, ${f2(-introOut * 70)}px)`);
    put(intro, 'visibility', introOut >= 1 ? 'hidden' : 'visible');
    put(hint, 'opacity', f2(1 - remap(p, 0, .03)) + '');
    const cardIn = remap(p, .085, .11);
    put(card, 'opacity', f2(cardIn) + '');
    put(card, 'visibility', cardIn > 0 ? 'visible' : 'hidden');
    put(card, 'translate', `0 ${f2((1 - cardIn) * 24)}px`);
    put(bottle, 'opacity', f2(cardIn) + '');
    put(rail, 'opacity', isMobile ? f2(remap(p, .06, .1)) + '' : '1');
    put(railFill, 'transform', `scaleY(${f2(remap(p, .1, .97))})`);
    const s = stageAt(p);
    if (s !== st.stage) setStage(s, st.stage);
  }

  const cardEls = ['#stageNum', '#stageName', '#stageTitle', '#stageBody', '.stage-foot'].map(s => $(s, card));
  function setStage(i, prev) {
    st.stage = i;
    const s = STAGES[Math.max(1, i)];
    document.documentElement.style.setProperty('--stage', s.color);
    card.style.setProperty('--stage', s.color);
    rail.style.setProperty('--stage-c', s.color);
    railBtns.forEach((b, k) => { b.classList.toggle('is-active', k + 1 === i); b.classList.toggle('is-done', k + 1 < i); b.setAttribute('aria-current', k + 1 === i ? 'step' : 'false'); });
    const apply = () => {
      $('#stageNum').textContent = `${Math.max(1, i)} of 5`;
      $('#stageName').textContent = s.name;
      $('#stageTitle').textContent = s.title;
      $('#stageBody').textContent = s.body;
      $('#stageCta span').textContent = s.cta;
      $('#stageCta').dataset.cursor = s.key === 'protect' ? 'Notify' : 'Add';
      $('#stageThumb').src = s.img;
    };
    if (prev < 1 || reduced) { apply(); swapBottle(s, 0); return; }
    const dir = i > prev ? 1 : -1;
    gsap.killTweensOf(cardEls);
    gsap.timeline()
      .to(cardEls, { y: -10 * dir, opacity: 0, duration: .16, stagger: .02, ease: 'power2.in' })
      .add(apply)
      .fromTo(cardEls, { y: 14 * dir }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: 'power3.out' });
    swapBottle(s, dir);
    if (dir > 0 && i >= 1) dropFeed(s.color);
  }
  const bottleImg = $('img', bottle);
  function swapBottle(s, dir) {
    if (!dir) { bottleImg.src = s.img; return; }
    gsap.killTweensOf(bottleImg);
    gsap.timeline()
      .to(bottleImg, { y: -30 * dir, rotate: 8 * dir, opacity: 0, duration: .22, ease: 'power2.in' })
      .add(() => { bottleImg.src = s.img; })
      .fromTo(bottleImg, { y: 40 * dir, rotate: -10 * dir, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: .8, ease: 'elastic.out(1,.6)' });
  }
  // A drop falls into the soil each time a new formula is introduced
  function dropFeed(color) {
    if (reduced) return;
    let sx = view.px + 40, sy = view.y + 40;
    if (!isMobile) { const r = bottleImg.getBoundingClientRect(); if (r.width) { const q = toSvg(r.left + r.width * .5, r.top + 6); sx = q.x; sy = q.y; } }
    const ex = view.px + (sx > view.px ? 22 : -22), ey = soilY(ex) + 2;
    fxDrop.setAttribute('fill', color);
    const o = { x: sx, y: sy, s: .2 };
    gsap.killTweensOf(o);
    gsap.timeline()
      .set(fxDrop, { attr: { opacity: 1 } })
      .to(o, { s: 1, duration: .25, ease: 'back.out(3)', onUpdate: () => fxDrop.setAttribute('transform', `translate(${f2(o.x)} ${f2(o.y)}) scale(${f2(o.s)})`) })
      .to(o, { x: ex, y: ey, duration: .7, ease: 'power2.in', onUpdate: () => fxDrop.setAttribute('transform', `translate(${f2(o.x)} ${f2(o.y)}) scale(${f2(o.s)}, ${f2(o.s * 1.15)})`) })
      .set(fxDrop, { attr: { opacity: 0 } })
      .add(() => ripples.forEach((r, i) => {
        gsap.fromTo(r, { attr: { cx: ex, cy: ey, rx: 6, ry: 2, opacity: .9 } }, { attr: { rx: 46 + i * 24, ry: 7 + i * 3, opacity: 0 }, duration: .9 + i * .2, delay: i * .12, ease: 'power2.out' });
      }));
  }

  // progress from scroll
  ScrollTrigger.create({ trigger: '#grow', start: 'top top', end: 'bottom bottom', onUpdate: s => { st.target = s.progress; } });
  new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; }, { rootMargin: '100px' }).observe($('#grow'));

  /* ---------- Intro sequence (the one orchestrated moment) ---------- */
  function playIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (reduced) { st.intro = 1; return; }
    gsap.set('.intro-title .line span', { yPercent: 110 });
    gsap.set(['.intro-dek', '.intro-actions .btn', '.scroll-hint > *'], { opacity: 0, y: 16 });
    if (!isMobile) gsap.set('.rail button', { x: 24, opacity: 0 });
    tl.to(st, { intro: 1, duration: 1.4, ease: 'elastic.out(1,.55)' }, .1)
      .to('.intro-title .line span', { yPercent: 0, duration: 1.1, stagger: .12 }, .25)
      .to('.intro-dek', { opacity: 1, y: 0, duration: .8 }, .75)
      .to('.intro-actions .btn', { opacity: 1, y: 0, duration: .7, stagger: .08 }, .9)
      .to('.scroll-hint > *', { opacity: 1, y: 0, duration: .8, stagger: .1 }, 1.3);
    if (!isMobile) tl.to('.rail button', { x: 0, opacity: 1, duration: .8, stagger: .07 }, 1);
  }

  layout();
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); playIntro(); }); else playIntro();

  /* ==========================================================
     HEADER, PROGRESS, MENU, ANCHORS
     ========================================================== */
  const header = $('#header');
  const progressBar = $('#progressBar'), progressLeaf = $('#progressLeaf');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    const pr = max > 0 ? y / max : 0;
    progressBar.style.transform = `scaleX(${f2(pr)})`;
    progressLeaf.style.transform = `translateX(${f2(pr * innerWidth - 5)}px) rotate(${f2(-45 + pr * 360)}deg)`;
    const growEnd = $('#grow').offsetTop + $('#grow').offsetHeight - innerHeight;
    header.classList.toggle('is-solid', y > growEnd + 10);
    const hide = y > growEnd + 200 && y > lastY + 4 && !menuOpen && !drawerOpen;
    if (hide) header.classList.add('is-hidden'); else if (y < lastY - 4 || y < growEnd) header.classList.remove('is-hidden');
    lastY = y;
    buybar.classList.toggle('is-visible', y > growEnd + 100 && !closingInView && !drawerOpen);
  }
  const buybar = $('#buybar');
  let closingInView = false;
  ScrollTrigger.create({ trigger: '#closing', start: 'top 70%', end: 'bottom top', onToggle: s => { closingInView = s.isActive; onScroll(); } });
  ScrollTrigger.create({ trigger: '#closing', start: () => `top ${headerH()}`, end: 'bottom top', onToggle: s => header.classList.toggle('is-dark', s.isActive) });
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Current section in nav
  const navLinks = $$('.nav a');
  navLinks.forEach(a => {
    const sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 40%', end: 'bottom 40%', onToggle: s => a.classList.toggle('is-current', s.isActive) });
  });

  // Mobile menu
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  function setMenu(open) {
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    gsap.killTweensOf([menu, '.menu nav a', '.menu-help']);
    if (open) {
      menu.hidden = false; lockScroll(true);
      gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 40px) 36px)' }, { clipPath: 'circle(150% at calc(100% - 40px) 36px)', duration: reduced ? 0 : .8, ease: 'power3.inOut' });
      gsap.fromTo('.menu nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .7, delay: reduced ? 0 : .25, ease: 'power3.out' });
      gsap.fromTo('.menu-help', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: reduced ? 0 : .55 });
      setTimeout(() => $('.menu nav a').focus({ preventScroll: true }), 100);
    } else {
      lockScroll(false);
      gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 40px) 36px)', duration: reduced ? 0 : .6, ease: 'power3.inOut', onComplete: () => { menu.hidden = true; } });
    }
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  mqMobile.addEventListener('change', () => { if (!mqMobile.matches && menuOpen) setMenu(false); });

  // Anchor links: smooth, header-aware, close menu first
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-jump-stage')) return;
    const id = a.getAttribute('href'); if (id === '#') return;
    const target = $(id); if (!target) return;
    e.preventDefault();
    const go = () => (id === '#top' ? scrollToY(0) : id === '#grow' ? jumpToStage(1) : scrollToEl(target));
    if (menuOpen) { setMenu(false); setTimeout(go, 350); }
    else if (drawerOpen && a.hasAttribute('data-close-drawer')) { setDrawer(false); setTimeout(go, 300); }
    else go();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (drawerOpen) setDrawer(false); else if (menuOpen) { setMenu(false); menuBtn.focus(); }
  });

  /* ==========================================================
     CURSOR, MAGNETIC, BUTTON RIPPLE
     ========================================================== */
  if (finePointer && !reduced) {
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    const m = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: m.x, y: m.y };
    addEventListener('pointermove', e => { m.x = e.clientX; m.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      r.x += (m.x - r.x) * .2; r.y += (m.y - r.y) * .2;
      dot.style.transform = `translate(${m.x}px,${m.y}px)`;
      ring.style.transform = `translate(${f2(r.x)}px,${f2(r.y)}px)`;
    });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, summary, .chip, .strip');
      cur.classList.toggle('on-dark', !!e.target.closest('.closing, .kit, .rail'));
      if (t) { const l = t.dataset.cursor || (t.classList.contains('strip') ? 'Drag' : ''); label.textContent = l; cur.classList.toggle('is-hover', !!l); if (!l) ring.style.scale = '1.3'; }
      else { cur.classList.remove('is-hover'); ring.style.scale = ''; }
    });
    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
    document.documentElement.style.cursor = 'none';
    const s = document.createElement('style'); s.textContent = 'a,button,summary,.chip,.strip,[data-cursor]{cursor:none!important}input,textarea{cursor:text}'; document.head.appendChild(s);

    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => { const b = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * .22, y: (e.clientY - b.top - b.height / 2) * .3, duration: .4, ease: 'power3.out' }); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.35)' }));
    });
  }
  // Ripple fill starts where the pointer enters
  document.addEventListener('pointerover', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px');
    b.style.setProperty('--fs', Math.ceil(Math.hypot(r.width, r.height) / 5 + 2));
  });

  // Little sparkle burst on taps
  function sparkle(x, y, color) {
    if (reduced) return;
    for (let i = 0; i < 8; i++) {
      const d = document.createElement('i');
      d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:6px;height:6px;margin:-3px;border-radius:50%;background:${color};pointer-events:none;z-index:2400`;
      document.body.appendChild(d);
      const a = i / 8 * Math.PI * 2 + Math.random() * .4, dist = 26 + Math.random() * 26;
      gsap.to(d, { x: Math.cos(a) * dist, y: Math.sin(a) * dist, scale: 0, duration: .7, ease: 'power3.out', onComplete: () => d.remove() });
    }
  }

  /* ==========================================================
     FORMULA — words light up as you read; parallax leaves
     ========================================================== */
  $$('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('.w', el);
    if (reduced) { spans.forEach(s => (s.style.opacity = 1)); return; }
    ScrollTrigger.create({ trigger: el, start: 'top 85%', end: 'bottom 45%', onUpdate: s => { const n = s.progress * spans.length * 1.1; spans.forEach((sp, i) => { sp.style.opacity = f2(lerp(.16, 1, clamp(n - i))); }); } });
  });

  if (!reduced) {
    $$('[data-speed]').forEach(el => {
      const sp = parseFloat(el.dataset.speed) || .1;
      const trig = el.closest('section') || el;
      if (el.tagName === 'IMG') gsap.fromTo(el, { yPercent: sp * -60 }, { yPercent: sp * 60, ease: 'none', scrollTrigger: { trigger: trig, start: 'top bottom', end: 'bottom top', scrub: true } });
      else gsap.to(el, { y: () => sp * innerHeight, rotation: `+=${sp * 90}`, ease: 'none', scrollTrigger: { trigger: trig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.strip').forEach(strip => gsap.fromTo(strip, { x: 60 }, { x: -20, ease: 'none', scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  // Marquee drifts, and speeds up with your scroll
  const track = $('.marquee-track');
  if (track && !reduced) {
    let mx = 0, dir = 1, half = 0;
    const measure = () => { half = track.scrollWidth / 2; };
    measure(); addEventListener('resize', measure);
    gsap.ticker.add((_, dtMs) => {
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > .5) dir = v > 0 ? 1 : -1;
      mx -= (40 + Math.min(600, Math.abs(v) * 30)) * dir * (dtMs / 1000);
      if (half) { if (mx <= -half) mx += half; if (mx > 0) mx -= half; }
      track.style.transform = `translate3d(${f2(mx)}px,0,0)`;
    });
  }

  /* ==========================================================
     CART
     ========================================================== */
  const productData = el => ({ id: el.dataset.id, name: el.dataset.name, price: +el.dataset.price, variant: el.dataset.variant || '', url: el.dataset.url || '', img: el.dataset.img });
  const PRODUCTS = {}; $$('[data-id]').forEach(el => { PRODUCTS[el.dataset.id] = productData(el); });
  const onShopify = /goodgarden\.store$/.test(location.hostname);
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('gg-cart') || '{}') || {}; } catch (_) { cart = {}; }
  const saveCart = () => { try { localStorage.setItem('gg-cart', JSON.stringify(cart)); } catch (_) {} };
  const cartCount = () => Object.values(cart).reduce((n, i) => n + i.qty, 0);
  const rupee = n => '₹' + n.toLocaleString('en-IN');

  async function addToCart(id, sourceEl, btn) {
    const p = PRODUCTS[id]; if (!p) return;
    if (!p.variant && !p.url) { window.open(WHATSAPP + encodeURIComponent(`Hi! Please notify me when ${p.name} launches.`), '_blank', 'noopener'); return; }
    if (onShopify && p.variant) {
      try { const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id: +p.variant, quantity: 1 }] }) }); if (!r.ok) throw new Error(); }
      catch (_) { toast(`${p.name} couldn't be added. Check your connection and try again.`, 'Retry', () => addToCart(id, sourceEl, btn), true); return; }
    }
    cart[id] = cart[id] ? { ...cart[id], qty: cart[id].qty + 1 } : { ...p, qty: 1 };
    saveCart();
    flyToCart(sourceEl, p.img);
    if (btn) markAdded(btn);
    toast(`${p.name} added to your cart`, 'View cart', () => setDrawer(true));
  }
  function markAdded(btn) {
    const span = $('span', btn); const icon = $('use', btn);
    const oldText = span.textContent, oldIcon = icon && icon.getAttribute('href');
    btn.classList.add('is-added'); span.textContent = 'Added'; if (icon) icon.setAttribute('href', '#i-check');
    if (!btn.querySelector('svg') && !reduced) gsap.fromTo(span, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .35 });
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('is-added'); span.textContent = oldText; if (icon) icon.setAttribute('href', oldIcon); }, 1800);
  }
  function flyToCart(sourceEl, img) {
    updateCartBadge(true);
    if (reduced || !sourceEl) return;
    const s = sourceEl.getBoundingClientRect(), c = $('#cartBtn').getBoundingClientRect();
    if (!s.width) return;
    const f = document.createElement('img'); f.src = img; f.className = 'fly'; f.alt = '';
    document.body.appendChild(f);
    const sx = s.left + s.width / 2 - 30, sy = s.top + s.height / 2 - 40, ex = c.left + c.width / 2 - 30, ey = c.top + c.height / 2 - 40;
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: .85, ease: 'power2.inOut', onUpdate: () => { const t = o.t; const x = lerp(sx, ex, t), y = lerp(sy, ey, t) - Math.sin(t * Math.PI) * 140; f.style.transform = `translate(${x}px,${y}px) scale(${lerp(1.2, .25, t)}) rotate(${t * 30}deg)`; f.style.opacity = t > .9 ? (1 - t) * 10 : 1; }, onComplete: () => { f.remove(); gsap.fromTo('#cartBtn', { scale: .8 }, { scale: 1, duration: .6, ease: 'elastic.out(1,.4)' }); } });
  }
  function updateCartBadge(bump) {
    const n = cartCount(), el = $('#cartCount');
    el.textContent = n; el.classList.toggle('has-items', n > 0);
    $('#cartBtn').setAttribute('aria-label', `Open cart, ${n} item${n === 1 ? '' : 's'}`);
    if (bump && !reduced) gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: .6, delay: .7, ease: 'elastic.out(1,.4)', clearProps: 'scale' });
  }

  // Drawer
  const drawer = $('#drawer'), scrim = $('#scrim');
  let lastFocus = null;
  function renderDrawer() {
    const items = Object.values(cart).filter(i => i.qty > 0);
    drawer.classList.toggle('is-empty', !items.length);
    $('#drawerList').innerHTML = items.map(i => `
      <li data-line="${i.id}">
        <img src="${i.img}" alt="" />
        <div><h3>${i.name}</h3><p class="meta">${rupee(i.price)}${i.variant ? '' : ` · <a href="${i.url}" target="_blank" rel="noopener">Complete on its product page ↗</a>`}</p></div>
        <div class="qty" role="group" aria-label="Quantity for ${i.name}">
          <button data-q="-1" aria-label="Remove one ${i.name}"><svg><use href="#i-minus"/></svg></button><span>${i.qty}</span><button data-q="1" aria-label="Add one more ${i.name}"><svg><use href="#i-plus"/></svg></button>
        </div>
      </li>`).join('');
    $('#subtotal').textContent = rupee(items.reduce((n, i) => n + i.qty * i.price, 0));
    const withV = items.filter(i => i.variant);
    const co = $('#checkoutBtn');
    if (withV.length) { co.href = `https://goodgarden.store/cart/${withV.map(i => `${i.variant}:${i.qty}`).join(',')}`; $('span', co).textContent = 'Check out on goodgarden.store'; }
    else if (items.length) { co.href = items[0].url; $('span', co).textContent = `Continue to the ${items[0].name.toLowerCase()} page`; }
    updateCartBadge(false);
  }
  $('#drawerList').addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const li = b.closest('li'), id = li.dataset.line, d = +b.dataset.q;
    cart[id].qty += d;
    if (cart[id].qty <= 0) {
      delete cart[id]; saveCart();
      gsap.to(li, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: reduced ? 0 : .35, ease: 'power2.inOut', onComplete: renderDrawer });
      updateCartBadge(false);
      return;
    }
    saveCart(); $('span', b.parentElement).textContent = cart[id].qty;
    if (!reduced) gsap.fromTo($('span', b.parentElement), { y: d * -8, opacity: 0 }, { y: 0, opacity: 1, duration: .3 });
    $('#subtotal').textContent = rupee(Object.values(cart).reduce((n, i) => n + i.qty * i.price, 0));
    updateCartBadge(true);
  });
  function setDrawer(open) {
    drawerOpen = open;
    if (open) {
      renderDrawer(); lastFocus = document.activeElement;
      scrim.hidden = false; gsap.set(drawer, { x: 0, y: 0 }); drawer.style.visibility = 'visible'; drawer.setAttribute('aria-hidden', 'false'); lockScroll(true);
      gsap.to(scrim, { opacity: 1, duration: .4 });
      gsap.fromTo(drawer, isMobile ? { yPercent: 105, xPercent: 0 } : { xPercent: 105, yPercent: 0 }, { xPercent: 0, yPercent: 0, duration: reduced ? 0 : .7, ease: 'power4.out' });
      gsap.fromTo('#drawerList li', { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: .05, duration: .5, delay: .15 });
      setTimeout(() => $('#drawerClose').focus(), 50);
    } else {
      lockScroll(false);
      gsap.to(scrim, { opacity: 0, duration: .3, onComplete: () => { scrim.hidden = true; } });
      gsap.to(drawer, { ...(isMobile ? { yPercent: 105 } : { xPercent: 105 }), duration: reduced ? 0 : .5, ease: 'power3.in', onComplete: () => { drawer.style.visibility = 'hidden'; drawer.setAttribute('aria-hidden', 'true'); } });
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    onScroll();
  }
  $('#cartBtn').addEventListener('click', () => setDrawer(true));
  $('#drawerClose').addEventListener('click', () => setDrawer(false));
  scrim.addEventListener('click', () => setDrawer(false));
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button', drawer).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  // Swipe down to close the bottom sheet on phones
  (() => {
    let y0 = null, dy = 0;
    const head = $('.drawer-head');
    head.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    head.addEventListener('touchmove', e => { if (y0 === null || !isMobile) return; dy = Math.max(0, e.touches[0].clientY - y0); gsap.set(drawer, { y: dy }); }, { passive: true });
    head.addEventListener('touchend', () => { if (y0 === null) return; if (dy > 90) setDrawer(false); else gsap.to(drawer, { y: 0, duration: .4, ease: 'back.out(2)' }); y0 = null; });
  })();

  // Add buttons
  $$('.add-btn').forEach(btn => btn.addEventListener('click', () => {
    const host = btn.closest('[data-id]');
    addToCart(host.dataset.id, $('img', host), btn);
  }));
  $('#buybarBtn').addEventListener('click', e => addToCart('kit', $('#buybarBtn'), e.currentTarget));
  $('#stageCta').addEventListener('click', e => {
    const s = STAGES[Math.max(1, st.stage)];
    addToCart(s.key, isMobile ? $('#stageThumb') : bottleImg, s.key === 'protect' ? null : e.currentTarget);
  });

  // Toast
  const toastEl = $('#toast'); let toastTl = null, toastAction = null;
  function toast(text, actionLabel, action) {
    $('#toastText').textContent = text;
    const b = $('#toastAction'); b.textContent = actionLabel || ''; b.hidden = !actionLabel; toastAction = action;
    if (toastTl) toastTl.kill();
    toastTl = gsap.timeline()
      .set(toastEl, { visibility: 'visible' })
      .fromTo(toastEl, { y: 80, opacity: 0, scale: .92 }, { y: 0, opacity: 1, scale: 1, duration: .55, ease: 'back.out(1.6)' })
      .to(toastEl, { y: 80, opacity: 0, duration: .4, ease: 'power2.in', delay: 3.2 })
      .set(toastEl, { visibility: 'hidden' });
  }
  $('#toastAction').addEventListener('click', () => { if (toastTl) toastTl.progress(1); toastAction && toastAction(); });

  /* ==========================================================
     PLANT FINDER
     ========================================================== */
  const PICKS = {
    root: { kicker: 'Start with', why: 'New roots need a strong start. Pour Root Nourish at the soil once a week while your plant settles in.', cta: 'Add Root Nourish · ₹119', color: '#9A5B1C' },
    growth: { kicker: 'Start with', why: "Pale leaves and slow growth usually mean your plant is ready to grow but short on fuel. Spray Growth Booster on the leaves once a week.", cta: 'Add Growth Booster · ₹119', color: '#5E9A0A' },
    branch: { kicker: 'Start with', why: "Stretching with few branches means your plant is reaching, not filling out. Branch Activator encourages stronger stems and side shoots.", cta: 'Add Branch Activator · ₹119', color: '#B98600' },
    protect: { kicker: 'Launching soon', why: "Plant Protect helps tender growth stay resilient. We'll message you on WhatsApp the day it's ready. Until then, wipe leaves gently and trim any badly spotted ones.", cta: 'Notify me on WhatsApp', color: '#187890' },
    bloom: { kicker: 'Start with', why: "A healthy plant that won't flower is often missing the right cue. Flower Enhancer supports more buds and brighter blooms.", cta: 'Add Flower Enhancer · ₹119', color: '#D9506A' },
    kit: { kicker: 'You need', why: 'Different plants, different stages. The kit has all four formulas, so the right one is always on hand — and it saves you ₹150.', cta: 'Add the kit · ₹449', color: '#0B3A2E' },
  };
  const chips = $$('.chip');
  let pick = null;
  function choose(chip, focus) {
    chips.forEach(c => { c.setAttribute('aria-checked', String(c === chip)); c.tabIndex = c === chip ? 0 : -1; });
    if (focus) chip.focus();
    const key = chip.dataset.pick; if (key === pick) return; pick = key;
    const info = PICKS[key], prod = PRODUCTS[key];
    const res = $('#finderResult'), empty = $('#resultEmpty'), cardR = $('#resultCard');
    res.style.setProperty('--rc', info.color);
    const fill = () => {
      $('#resultKicker').textContent = info.kicker;
      $('#resultName').textContent = prod.name === 'Complete 4-stage kit' ? 'The complete kit' : prod.name;
      $('#resultWhy').textContent = info.why;
      $('#resultCta span').textContent = info.cta;
      $('#resultCta').dataset.cursor = key === 'protect' ? 'Notify' : 'Add';
      $('#resultImg').src = prod.img; $('#resultImg').alt = prod.name;
      $('#resultAlt').hidden = key === 'kit';
    };
    const parts = ['.result-kicker', '#resultName', '#resultWhy', '.result-actions'];
    if (!empty.hidden) {
      gsap.to(empty, { scale: .9, opacity: 0, duration: reduced ? 0 : .25, onComplete: () => {
        empty.hidden = true; fill(); cardR.hidden = false;
        gsap.fromTo('#resultImg', { y: 80, rotate: -12, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: .9, ease: 'elastic.out(1,.6)' });
        gsap.fromTo(parts, { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .5, ease: 'power3.out' });
      } });
    } else {
      gsap.timeline()
        .to(['#resultImg', ...parts], { y: -10, opacity: 0, duration: .18, stagger: .02 })
        .add(fill)
        .fromTo('#resultImg', { y: 60, rotate: 10, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: .8, ease: 'elastic.out(1,.6)' })
        .fromTo(parts, { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .45 }, '<');
    }
    if (isMobile) { const r = res.getBoundingClientRect(); if (r.top > innerHeight * .75) setTimeout(() => scrollToEl(res), 200); }
  }
  chips.forEach((c, i) => {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener('click', () => choose(c));
    c.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!k) return;
      e.preventDefault(); choose(chips[(i + k + chips.length) % chips.length], true);
    });
  });
  $('#resultCta').addEventListener('click', e => { if (pick) addToCart(pick, $('#resultImg'), pick === 'protect' ? null : e.currentTarget); });

  /* ==========================================================
     RITUAL — tap to mix
     ========================================================== */
  const mixer = $('#mixer'), dropper = $('#dropper'), water = $('#water'), statusEl = $('#mixerStatus');
  let drops = 0;
  const MIX_MSG = ['Tap the bottle to add a drop.', 'One drop in. Keep going.', 'Two down, one to go.', 'Mixed. Pour it at the soil and you’re done.'];
  function setMix(n) {
    drops = n; mixer.className = 'mixer' + (n ? ' is-' + n : '');
    $$('.mix-meter i', mixer).forEach((m, i) => m.classList.toggle('on', i < n));
    statusEl.innerHTML = MIX_MSG[n] + (n === 3 ? ' <button type="button" id="mixAgain">Mix again</button>' : '');
    if (n === 3) $('#mixAgain').addEventListener('click', () => setMix(0));
  }
  dropper.addEventListener('click', () => {
    if (drops >= 3) {
      statusEl.textContent = 'That’s the right dose. More isn’t better for plants.';
      if (!reduced) gsap.fromTo(dropper.querySelector('img'), { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' });
      clearTimeout(dropper._t); dropper._t = setTimeout(() => setMix(3), 2400);
      return;
    }
    dropper.classList.add('is-squeeze'); setTimeout(() => dropper.classList.remove('is-squeeze'), 180);
    const mb = mixer.getBoundingClientRect(), db = dropper.getBoundingClientRect(), wb = water.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'drop'; mixer.appendChild(d);
    const x = db.left + db.width * .5 - mb.left - 6, y0 = db.bottom - mb.top - 6, y1 = wb.top - mb.top - 8;
    const n = drops + 1;
    const done = () => {
      d.remove();
      const s = document.createElement('div'); s.className = 'splash'; mixer.appendChild(s);
      gsap.fromTo(s, { left: x - 4, top: y1 + 4, width: 20, opacity: 1 }, { left: x - 26, width: 64, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => s.remove() });
      setMix(n);
      if (!reduced) gsap.fromTo(water, { scaleY: .97, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .8, ease: 'elastic.out(1,.3)' });
    };
    if (reduced) { done(); return; }
    gsap.fromTo(d, { left: x, top: y0, scale: .3 }, { top: y1, scale: 1, duration: .55, ease: 'power2.in', onComplete: done });
  });

  /* ==========================================================
     GALLERY — tabs + drag to scroll
     ========================================================== */
  const strip = $('#strip'), tabs = $$('.tabs [role="tab"]'), pill = $('.tab-pill');
  const SET_LABEL = { 'root-nourish': 'Root Nourish', 'growth-booster': 'Growth Booster', 'branch-activator': 'Branch Activator', 'flower-enhancer': 'Flower Enhancer' };
  function movePill(tab) { pill.style.width = tab.offsetWidth + 'px'; pill.style.transform = `translateX(${tab.offsetLeft}px)`; }
  function showSet(set, animate) {
    const html = [1, 2, 3, 4].map(i => `<figure><img src="./assets/${set}-C${i}.webp" alt="${SET_LABEL[set]}, stage artwork ${i} of 4" loading="lazy" draggable="false" width="960" height="960" /></figure>`).join('');
    if (!animate || reduced) { strip.innerHTML = html; return; }
    gsap.to($$('figure', strip), { y: 20, opacity: 0, duration: .2, stagger: .04, onComplete: () => {
      strip.innerHTML = html; strip.scrollTo({ left: 0 });
      gsap.fromTo($$('figure', strip), { y: 30, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: .7, stagger: .07, ease: 'power3.out' });
    } });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { tabs.forEach(x => { x.setAttribute('aria-selected', String(x === t)); x.tabIndex = x === t ? 0 : -1; }); movePill(t); showSet(t.dataset.set, true); });
    t.addEventListener('keydown', e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return; const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); n.click(); });
    t.tabIndex = i === 0 ? 0 : -1;
  });
  showSet('root-nourish', false);
  requestAnimationFrame(() => movePill(tabs[0]));
  addEventListener('resize', () => movePill(tabs.find(t => t.getAttribute('aria-selected') === 'true')));
  if (finePointer) {
    let down = false, sx = 0, sl = 0, v = 0, lx = 0, raf;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = lx = e.clientX; sl = strip.scrollLeft; v = 0; cancelAnimationFrame(raf); strip.setPointerCapture(e.pointerId); });
    strip.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) strip.classList.add('is-dragging'); strip.scrollLeft = sl - dx; v = e.clientX - lx; lx = e.clientX; });
    const up = () => { if (!down) return; down = false; const glide = () => { v *= .94; strip.scrollLeft -= v; if (Math.abs(v) > .4) raf = requestAnimationFrame(glide); else strip.classList.remove('is-dragging'); }; glide(); };
    strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);
  }

  /* ==========================================================
     REVIEWS
     ========================================================== */
  const reviews = $$('.review'), dotsWrap = $('#revDots');
  let rev = 0, revTween = null, revPaused = false, revInView = false;
  const dots = reviews.map((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Show review ${i + 1}`); b.innerHTML = '<span></span>'; b.addEventListener('click', () => goReview(i)); dotsWrap.appendChild(b); return b; });
  function goReview(i, dir) {
    i = (i + reviews.length) % reviews.length;
    const from = reviews[rev], to = reviews[i]; dir = dir || (i > rev ? 1 : -1);
    if (i !== rev) {
      if (reduced) { from.classList.remove('is-active'); to.classList.add('is-active'); }
      else {
        gsap.to(from, { x: -40 * dir, opacity: 0, duration: .35, ease: 'power2.in', onComplete: () => { from.classList.remove('is-active'); from.style.visibility = ''; } });
        to.classList.add('is-active');
        gsap.fromTo(to, { x: 50 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .7, delay: .2, ease: 'power3.out' });
      }
    }
    rev = i;
    dots.forEach((d, k) => { d.classList.toggle('is-past', k < i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); gsap.set($('span', d), { scaleX: k < i ? 1 : 0 }); });
    if (revTween) revTween.kill();
    if (!reduced) {
      revTween = gsap.fromTo($('span', dots[i]), { scaleX: 0 }, { scaleX: 1, duration: 6.5, ease: 'none', onComplete: () => goReview(rev + 1, 1) });
      if (revPaused || !revInView) revTween.pause();
    }
  }
  $('#revPrev').addEventListener('click', () => goReview(rev - 1, -1));
  $('#revNext').addEventListener('click', () => goReview(rev + 1, 1));
  const rs = $('#reviewStage');
  const pauseRev = v => { revPaused = v; if (revTween) v || !revInView ? revTween.pause() : revTween.resume(); };
  rs.addEventListener('pointerenter', () => pauseRev(true)); rs.addEventListener('pointerleave', () => pauseRev(false));
  $('#reviews').addEventListener('focusin', () => pauseRev(true)); $('#reviews').addEventListener('focusout', () => pauseRev(false));
  new IntersectionObserver(([e]) => { revInView = e.isIntersecting; if (revTween) revInView && !revPaused ? revTween.resume() : revTween.pause(); }, { threshold: .3 }).observe(rs);
  (() => { let x0 = null; rs.addEventListener('pointerdown', e => { x0 = e.clientX; }); rs.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 40) goReview(rev + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); x0 = null; }); })();
  goReview(0);

  /* ==========================================================
     FAQ — smooth open/close
     ========================================================== */
  $$('.faq-list details').forEach(d => {
    const sum = $('summary', d), body = $('div', d);
    sum.addEventListener('click', e => {
      e.preventDefault();
      if (reduced) { d.open = !d.open; return; }
      if (d.open) { gsap.to(body, { height: 0, opacity: 0, duration: .4, ease: 'power2.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } }); }
      else { d.open = true; gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .5, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() }); }
    });
  });

  /* ==========================================================
     CLOSING — roots spread underground as you arrive
     ========================================================== */
  const cr = $('#closingRoots');
  const cRoots = makeRoots(cr, { count: 21, len: 620, spread: 78, width: 2.4, seed: 3, color: 'rgba(241,235,221,.4)', startY: 0 });
  cRoots.forEach(r => draw(r.el, r.len, reduced ? 1 : 0));
  if (!reduced) ScrollTrigger.create({ trigger: '#closing', start: 'top 85%', end: 'center 40%', scrub: 1, onUpdate: s => cRoots.forEach(r => draw(r.el, r.len, easeOut(clamp((s.progress - r.delay * .8) / .7)))) });

  /* ---------- Init & resize ---------- */
  renderDrawer();
  gsap.set(drawer, isMobile ? { yPercent: 105 } : { xPercent: 105 });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); cache.clear(); ScrollTrigger.refresh(); }, 150); });
  mqMobile.addEventListener('change', () => { layout(); ScrollTrigger.refresh(); });
  addEventListener('load', () => { layout(); ScrollTrigger.refresh(); });
})();
