/* =========================================================================
   audio.js  —  efek suara & musik chiptune (dibuat dengan WebAudio, tanpa file)
   ========================================================================= */
const Audio8 = (() => {
  let vol = 1, ctx = null, master = null, muted = false, theme = null, timer = null, step = 0, nextT = 0;
  try { muted = localStorage.getItem('llh2_muted') === '1'; } catch (e) {}

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5 * vol; master.connect(ctx.destination);
      loadSamples();
      if (theme) startMusic(theme === 'judul' ? 'desa' : theme, true);
    } catch (e) { ctx = null; }
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(f, dur, type = 'square', vol = 0.15, slide = 0, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.2, when = 0) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(master); s.start(ctx.currentTime + when);
  }

  const SFX = {
    slash:  () => { noise(0.12, 0.12); tone(400, 0.1, 'sawtooth', 0.06, -250); },
    hit:    () => { noise(0.1, 0.22); tone(160, 0.12, 'square', 0.14, -90); },
    bow:    () => { tone(700, 0.12, 'triangle', 0.12, -450); noise(0.05, 0.05); },
    hurt:   () => { tone(300, 0.25, 'sawtooth', 0.16, -220); noise(0.12, 0.15); },
    coin:   () => { tone(988, 0.07, 'square', 0.09); tone(1319, 0.14, 'square', 0.09, 0, 0.07); },
    pickup: () => { tone(660, 0.08, 'triangle', 0.13); tone(880, 0.08, 'triangle', 0.13, 0, 0.08); tone(1175, 0.14, 'triangle', 0.13, 0, 0.16); },
    chest:  () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.1, 0, i * 0.09)); },
    blip:   () => tone(520 + Math.random() * 80, 0.04, 'square', 0.04),
    select: () => tone(740, 0.06, 'square', 0.08),
    back:   () => tone(400, 0.08, 'square', 0.08, -100),
    dash:   () => { noise(0.14, 0.09); tone(250, 0.14, 'triangle', 0.07, 200); },
    die:    () => { [400, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.14, -30, i * 0.2)); },
    ekill:  () => { tone(220, 0.2, 'square', 0.12, -150); noise(0.15, 0.15); },
    crystal:() => { tone(880, 0.3, 'sine', 0.2); tone(1320, 0.4, 'sine', 0.12, 0, 0.05); },
    wrong:  () => { tone(150, 0.3, 'sawtooth', 0.15, -60); tone(120, 0.3, 'sawtooth', 0.15, -40, 0.12); },
    gate:   () => { noise(0.8, 0.18); tone(70, 0.8, 'sawtooth', 0.12, 20); },
    heal:   () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.12, 'sine', 0.14, 0, i * 0.06)); },
    boom:   () => { noise(0.5, 0.35); tone(80, 0.5, 'sawtooth', 0.2, -50); },
    roar:   () => { tone(110, 0.8, 'sawtooth', 0.2, -40); noise(0.6, 0.2); },
    warp:   () => { tone(300, 0.25, 'triangle', 0.1, 300); },
    win:    () => { [523, 523, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.12, 0, i * 0.14)); },
    warn:   () => { tone(200, 0.1, 'square', 0.06); },
    magic:  () => { [660, 880, 1175, 1568].forEach((f, i) => tone(f, 0.18, 'sine', 0.1, 120, i * 0.05)); },
    crit:   () => { noise(0.15, 0.3); tone(900, 0.15, 'square', 0.14, -500); tone(1200, 0.2, 'square', 0.1, -600, 0.08); },
    brk:    () => { noise(0.35, 0.3); tone(180, 0.35, 'sawtooth', 0.16, -120); tone(90, 0.4, 'square', 0.14, -40, 0.1); },
    levelup:() => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, 0, i * 0.08)); },
    error:  () => { tone(140, 0.18, 'square', 0.1); },
    buy:    () => { tone(1047, 0.06, 'square', 0.08); tone(1397, 0.1, 'square', 0.08, 0, 0.06); },
    sleep:  () => { [392, 330, 262].forEach((f, i) => tone(f, 0.4, 'sine', 0.12, 0, i * 0.3)); },
    ult:    () => { noise(0.5, 0.2); [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.09, 60, i * 0.07)); },
  };

  /* --- Musik: tiap tema = tempo (ms/langkah) + melodi + bass (nada MIDI, 0 = diam) --- */
  const THEMES = {
    desa:   { ms: 230, lead: 'triangle', bassW: 'sine',
      mel: [72,0,76,0,79,0,76,0, 74,0,77,0,81,0,77,0, 72,0,76,0,79,81,79,76, 74,0,71,0,67,0,0,0],
      bas: [48,0,0,0,55,0,0,0, 50,0,0,0,57,0,0,0, 48,0,0,0,55,0,0,0, 43,0,0,0,50,0,0,0] },
    hutan:  { ms: 280, lead: 'sine', bassW: 'triangle',
      mel: [64,0,0,67,0,0,71,0, 69,0,0,67,0,0,64,0, 62,0,0,65,0,0,69,0, 67,0,0,64,0,0,0,0],
      bas: [40,0,0,0,0,0,0,0, 45,0,0,0,0,0,0,0, 38,0,0,0,0,0,0,0, 43,0,0,0,0,0,0,0] },
    gua:    { ms: 340, lead: 'sine', bassW: 'sawtooth',
      mel: [60,0,0,0,63,0,0,0, 58,0,0,0,62,0,0,0, 60,0,0,0,67,0,0,0, 65,0,0,0,0,0,0,0],
      bas: [36,0,0,0,0,0,0,0, 34,0,0,0,0,0,0,0, 36,0,0,0,0,0,0,0, 31,0,0,0,0,0,0,0] },
    benteng:{ ms: 220, lead: 'square', bassW: 'sawtooth',
      mel: [57,0,60,0,64,0,60,0, 56,0,59,0,64,0,59,0, 57,0,60,0,64,69,67,64, 62,0,59,0,56,0,0,0],
      bas: [33,0,33,0,33,0,33,0, 32,0,32,0,32,0,32,0, 33,0,33,0,33,0,33,0, 31,0,31,0,31,0,31,0] },
    boss:   { ms: 150, lead: 'sawtooth', bassW: 'square',
      mel: [69,0,72,69,0,72,76,0, 68,0,71,68,0,71,75,0, 69,0,72,69,0,72,76,79, 77,76,72,71,69,0,0,0],
      bas: [33,33,0,33,33,0,33,0, 32,32,0,32,32,0,32,0, 33,33,0,33,33,0,33,0, 31,31,0,31,31,0,31,0] },
    battle: { ms: 160, lead: 'square', bassW: 'sawtooth',
      mel: [64,0,67,64,0,67,71,0, 69,0,72,69,0,72,76,0, 64,0,67,64,0,67,71,74, 72,71,67,64,0,0,0,0],
      bas: [40,0,40,0,40,0,40,0, 45,0,45,0,45,0,45,0, 40,0,40,0,40,0,40,0, 43,0,43,0,43,0,43,0] },
    malam:  { ms: 400, lead: 'sine', bassW: 'sine',
      mel: [69,0,0,0,72,0,0,0, 67,0,0,0,71,0,0,0, 69,0,0,0,76,0,0,0, 74,0,0,0,0,0,0,0],
      bas: [45,0,0,0,0,0,0,0, 43,0,0,0,0,0,0,0, 45,0,0,0,0,0,0,0, 40,0,0,0,0,0,0,0] },
    menang: { ms: 260, lead: 'triangle', bassW: 'sine',
      mel: [72,0,76,79,0,84,0,0, 83,0,79,76,0,79,0,0, 77,0,81,84,0,89,0,0, 88,0,84,79,0,76,72,0],
      bas: [48,0,0,0,52,0,0,0, 53,0,0,0,57,0,0,0, 55,0,0,0,59,0,0,0, 48,0,0,0,0,0,0,0] },
  };

  function startMusic(name, force) {
    if (theme === name && !force && timer) return;
    theme = name;
    if (timer) { clearInterval(timer); timer = null; }
    if (!name || !ctx) return;
    step = 0; nextT = ctx.currentTime + 0.05;
    timer = setInterval(() => {
      const th = THEMES[theme]; if (!th || !ctx) return;
      while (nextT < ctx.currentTime + 0.3) {
        const s = th.ms / 1000, i = step % th.mel.length;
        const m = th.mel[i], b = th.bas[i];
        if (m && !muted) playAt(mtof(m), s * 1.6, th.lead, 0.05, nextT);
        if (b && !muted) playAt(mtof(b), s * 3, th.bassW, 0.07, nextT);
        nextT += s; step++;
      }
    }, 100);
  }
  function playAt(f, dur, type, vol, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  /* --- Sampel (mp3 di Audio/sfx dan Audio/music; fallback ke suara sintetis bila belum termuat / gagal) --- */
  const SM = { buf: {}, started: false, bgm: null, bgmN: '', amb: null, walk: null, want: undefined, ambWant: false, walkOn: false };
  const SNAMES = ['uiopen', 'uiclose', 'slash', 'levelup', 'roar', 'ekill', 'brk', 'brk2', 'ult', 'heal', 'dash', 'smoke', 'combo', 'voiceA', 'voiceB', 'step1', 'step3', 'step4', 'amb', 'bgm_desa', 'bgm_judul'];
  const SMAP = { slash: ['slash'], levelup: ['levelup'], roar: ['roar'], ekill: ['ekill'], brk: ['brk', 'brk2'], heal: ['heal'], dash: ['dash'], smoke: ['smoke'], uiopen: ['uiopen'], uiclose: ['uiclose'], combo: ['combo'], voice: ['voiceA', 'voiceB'] };
  const SLAYER = { ult: 'ult' };   // sampel + suara sintetis sekaligus
  const MUSMAP = { desa: 'bgm_desa', judul: 'bgm_judul' };
  function loadSamples() {
    if (SM.started || !ctx) return; SM.started = true;
    (async () => {
      for (const n of SNAMES) {
        try {
          const u = (window.SFX_DATA && window.SFX_DATA[n]) || (/^(amb|bgm_)/.test(n) ? 'Audio/music/' : 'Audio/sfx/') + n + '.mp3';
          const ab = await (await fetch(u)).arrayBuffer();
          SM.buf[n] = await new Promise((ok, no) => { const q = ctx.decodeAudioData(ab, ok, no); if (q && q.catch) q.catch(no); });
          if (n === MUSMAP[SM.want]) applyMusic(); if (n === 'amb') applyAmb();
        } catch (e) {}
      }
    })();
  }
  function playS(n, v = 1, rate = 1) {
    const b = SM.buf[n]; if (!ctx || !b) return false;
    const o = ctx.createBufferSource(), g = ctx.createGain(); o.buffer = b; o.playbackRate.value = rate; g.gain.value = v;
    o.connect(g); g.connect(master); o.start(); return true;
  }
  function loopS(n, v, fade = .6) {
    const b = SM.buf[n]; if (!ctx || !b) return null;
    const o = ctx.createBufferSource(), g = ctx.createGain(); o.buffer = b; o.loop = true;
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(v, ctx.currentTime + fade);
    o.connect(g); g.connect(master); o.start(); return { o, g, n };
  }
  function stopL(h, fade = .4) {
    if (!h) return; try { h.g.gain.cancelScheduledValues(ctx.currentTime); h.g.gain.setValueAtTime(h.g.gain.value, ctx.currentTime); h.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade); h.o.stop(ctx.currentTime + fade + .05); } catch (e) {}
  }
  function applyMusic() {
    const n = SM.want, f = MUSMAP[n];
    if (f && SM.buf[f]) { if (SM.bgm && SM.bgm.n === f) return; startMusic(null); stopL(SM.bgm, .5); SM.bgm = loopS(f, .55, 1.2); theme = n; }
    else if (!f) { stopL(SM.bgm, .5); SM.bgm = null; }
  }
  function applyAmb() {
    if (SM.ambWant && SM.buf.amb) { if (!SM.amb) SM.amb = loopS('amb', .22, 1.5); }
    else if (SM.amb) { stopL(SM.amb, 1); SM.amb = null; }
  }
  function walkSet(on, kind) {
    if (!ctx) return; const n = SM.buf[kind] ? kind : 'step1';
    if (on && SM.buf[n]) { if (SM.walk && SM.walk.n !== n) { stopL(SM.walk, .1); SM.walk = null; } if (!SM.walk) SM.walk = loopS(n, .5, .08); }
    else if (SM.walk) { stopL(SM.walk, .12); SM.walk = null; }
  }

  return {
    init,
    sfx: n => {
      try {
        if (n === 'voice') { playS(Math.random() < .5 ? 'voiceA' : 'voiceB', .7, .92 + Math.random() * .16); return; }
        const L = SMAP[n];
        if (L && SM.buf[L[0]]) { playS(L[Math.floor(Math.random() * L.length)], n === 'slash' ? .8 : 1, n === 'slash' ? .92 + Math.random() * .16 : 1); return; }
        if (SLAYER[n]) playS(SLAYER[n], .9);
        SFX[n] && SFX[n]();
      } catch (e) {}
    },
    music: n => {
      try {
        SM.want = n; const f = MUSMAP[n];
        if (n === 'desa' || n === 'hutan' || n === 'judul') { SM.ambWant = n !== 'judul'; applyAmb(); } else { SM.ambWant = false; applyAmb(); }
        if (f && SM.buf[f]) { applyMusic(); return; }
        if (f && !SM.buf[f] && ctx) { SM.bgmN = f; startMusic(n === 'judul' ? 'desa' : n); return; }   // sampel belum siap: sintetis dulu
        stopL(SM.bgm, .4); SM.bgm = null; startMusic(n);
      } catch (e) {}
    },
    loaded: () => Object.keys(SM.buf).length + '/' + SNAMES.length + (SM.bgm ? ' bgm:' + SM.bgm.n : '') + (SM.amb ? ' amb' : '') + (SM.walk ? ' walk:' + SM.walk.n : ''),
    walk: (on, kind) => { try { if (SM.walkOn === on && (!on || (SM.walk && SM.walk.n === kind))) return; SM.walkOn = on; walkSet(on, kind || 'step1'); } catch (e) {} },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('llh2_muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.5 * vol;
      return muted;
    },
    setVol(v) { vol = v; if (master && !muted) master.gain.value = 0.5 * v; },
    suspend() { try { ctx && ctx.suspend(); } catch (e) {} },
    resume() { try { ctx && ctx.resume(); } catch (e) {} },
    get muted() { return muted; },
  };
})();
