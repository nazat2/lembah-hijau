/* =========================================================================
   cutscene.js  —  mesin cutscene sinematik (letterbox, kamera zoom/pan, aktor, VFX, partikel,
   cahaya, kartu judul). Dialog memakai sistem Dlg yang sama (suara, efek, pilihan tetap jalan).
   Skrip adalah fungsi async:  Cut.S.nama = async c => { await c.wait(1); await c.dlg('id'); }
   ========================================================================= */
'use strict';
const Cut = {
  on: false, skipped: false, paused: false, spd: 1, prev: 'world', bg: null, hideHero: false, T: 0,
  cam: { x: 240, y: 135, z: 1 }, crop: { x: 0, y: 0, z: 1 }, bars: 0,
  fade: { a: 0, c: '0,0,0' }, flash: { a: 0, c: '255,255,255' }, grade: { a: 0, c: '0,0,0' }, shk: { m: 0, t: 0 }, gem: { x: 240, y: 158, vis: 1 },
  actors: [], fxs: [], glows: [], parts: [], pk: null, tw: [], S: {}, off: null,

  /* ---------- siklus ---------- */
  play(name, after) {
    const fn = this.S[name]; if (!fn || this.on) { if (after) after(); return; }
    this.begin();
    Promise.resolve().then(() => fn(this)).catch(e => Game.fail(e)).then(() => this.finish(after));
  },
  begin() {
    this.on = true; this.skipped = false; this.paused = false; this.spd = 1; this.syncBar(); this.prev = G.mode === 'cut' || G.mode === 'dialog' ? 'world' : G.mode; G.mode = 'cut'; Input.clear();
    document.body.classList.add('cutting'); $('cut').classList.remove('hide');
    this.bg = null; this.actors = []; this.fxs = []; this.glows = []; this.parts = []; this.pk = null; this.tw = []; this.T = 0; this.bars = 0;
    this.fade = { a: 0, c: '0,0,0' }; this.flash = { a: 0, c: '255,255,255' }; this.grade = { a: 0, c: '0,0,0' }; this.shk = { m: 0, t: 0 }; this.gem = { x: 240, y: 158, vis: 1 };
    this.hideHero = false; const p = W.player; this.cam = { x: p.x, y: p.y - 8, z: 1 };
    if (!this.off) { this.off = document.createElement('canvas'); this.off.width = 960; this.off.height = 540; }
  },
  finish(after) {
    this.on = false; this.paused = false; this.spd = 1; W.ents = W.ents.filter(e => e.kind !== 'cut'); document.body.classList.remove('cutting'); $('cut').classList.add('hide'); $('cutTitle').className = '';
    this.hideHero = false; this.tw = []; const p = W.player; W.cam.x = p.x - VW / 2; W.cam.y = p.y - VH / 2; W.clampCam();
    if (Dlg.active) { Dlg.q = []; Dlg.end(); }
    G.mode = this.prev; Input.clear(); if (after) after();
  },
  syncBar() { const s = (id, on) => { const e = $(id); if (e) e.classList.toggle('on', !!on); }; s('cutPause', this.paused); s('cutFF', this.spd > 1); s('cutAuto', Dlg.auto); const p = $('cutPause'); if (p) p.textContent = this.paused ? 'Lanjut' : 'Jeda'; },
  togglePause() { if (!this.on) return; this.paused = !this.paused; this.syncBar(); },
  toggleFF() { if (!this.on) return; this.spd = this.spd > 1 ? 1 : 2.5; this.syncBar(); },
  doSkip() { if (!this.on || this.skipped) return; this.skipped = true; Audio8.sfx('select'); },

  /* ---------- tween & tunggu ---------- */
  tween(o, k, to, dur, ease = true) {
    if (this.skipped || dur <= 0) { o[k] = to; return Promise.resolve(); }
    return new Promise(res => this.tw.push({ o, k, from: o[k], to, dur, t: 0, res, ease }));
  },
  wait(s) { return this.tween({ v: 0 }, 'v', 1, s, false); },
  camTo(x, y, z, dur) { return Promise.all([this.tween(this.cam, 'x', x, dur), this.tween(this.cam, 'y', y, dur), this.tween(this.cam, 'z', z, dur)]); },
  barsTo(v, dur = .7) { return this.tween(this, 'bars', v, dur); },
  fadeTo(a, dur = 1, c) { if (c) this.fade.c = c; return this.tween(this.fade, 'a', a, dur); },
  gradeTo(c, a, dur = 1.5) { this.grade.c = c; return this.tween(this.grade, 'a', a, dur); },
  flashNow(c = '255,255,255', a = .9, dur = .5) { this.flash.c = c; this.flash.a = a; return this.tween(this.flash, 'a', 0, dur, false); },
  shake(m, dur) { this.shk.m = m; this.shk.t = dur; },
  setBg(n) { this.bg = n; if (n) { W.ents = W.ents.filter(e => e.kind !== 'cut'); } },
  dlg(id) { return new Promise(res => Dlg.play(id, { after: () => res() })); },
  title(big, small, dur = 4) { const t = $('cutTitle'); t.innerHTML = `<small>${esc(small || '')}</small><b>${esc(big)}</b><i></i>`; t.className = 'show'; return this.wait(dur).then(() => { t.className = ''; }); },
  sfx(n) { Audio8.sfx(n); },

  /* ---------- aktor / vfx / partikel ---------- */
  actor(id, o) {
    const a = Object.assign({ id, kind: 'cut', x: 0, y: 0, face: 1, alpha: 1, t: 0, anim: 'idle', spr: 'hero', sc: 1, flash: 0, moving: false }, o); this.actors.push(a); if (!this.bg) W.ents.push(a); return a;
  },
  drop(a) { this.actors = this.actors.filter(x => x !== a); W.ents = W.ents.filter(x => x !== a); },
  async move(a, x, y, dur, anim = 'walk') {
    a.face = x >= a.x ? 1 : -1; a.anim = anim; a.moving = true; await Promise.all([this.tween(a, 'x', x, dur, false), this.tween(a, 'y', y, dur, false)]); a.moving = false; a.anim = 'idle';
  },
  fx(name, x, y, sc = 1) { this.fxs.push({ n: name, x, y, t: 0, sc }); },
  parts_(kind, n = 80) {
    this.pk = kind; this.parts = []; if (!kind) return;
    for (let i = 0; i < n; i++) this.parts.push({ x: rnd(0, VW), y: rnd(0, VH), v: rnd(.6, 1.4), s: rnd(.5, 1.6), p: rnd(0, 6.3) });
  },
  glow(x, y, r, c, a = .6) { const g = { x, y, r, c, a, pulse: 1 }; this.glows.push(g); return g; },
  /* world -> koordinat pra-zoom */
  px(wx, wy) { return this.bg ? [wx, wy] : [wx - W.cam.x, wy - W.cam.y]; },
  toScr(px, py) { return [(px - this.crop.x) * this.crop.z, (py - this.crop.y) * this.crop.z]; },

  /* ---------- update ---------- */
  update(dt) {
    if (this.paused && !this.skipped) return;
    dt *= this.spd; this.T += dt;
    if (this.skipped) {
      for (const t of this.tw) { t.o[t.k] = t.to; t.res(); } this.tw = [];
      if (Dlg.active) { if (!Dlg.choosing) Dlg.next(); VOICE.stop(); }
    }
    for (const t of this.tw) { t.t += dt; const u = Math.min(1, t.t / t.dur), e = t.ease ? u * u * (3 - 2 * u) : u; t.o[t.k] = t.from + (t.to - t.from) * e; if (u >= 1) { t.o[t.k] = t.to; t.res(); } }
    this.tw = this.tw.filter(t => t.t < t.dur);
    if (W.ents) for (const e of W.ents) if (typeof e.t === 'number') e.t += dt;
    for (const a of this.actors) { if (a.flash > 0) a.flash -= dt; if (!W.ents.includes(a)) a.t += dt; }
    for (const f of this.fxs) f.t += dt; this.fxs = this.fxs.filter(f => { const d = FXD[f.n]; return f.t * d[4] < d[3]; });
    if (this.shk.t > 0) this.shk.t -= dt; else this.shk.m = 0;
    for (const g of this.glows) g.pulse = .85 + Math.sin(this.T * 3 + g.x) * .15;
    const k = this.pk; if (k) for (const p of this.parts) {
      if (k === 'rain') { p.y += 300 * dt * p.v; p.x -= 70 * dt * p.v; } else if (k === 'snow') { p.y += 22 * dt * p.v; p.x += Math.sin(this.T + p.p) * 10 * dt; }
      else if (k === 'petals') { p.y += 16 * dt * p.v; p.x += Math.sin(this.T * 1.3 + p.p) * 22 * dt + 6 * dt; } else { p.y -= 24 * dt * p.v; p.x += Math.sin(this.T * 1.7 + p.p) * 12 * dt; }
      if (p.y > VH + 6) p.y = -6; if (p.y < -6) p.y = VH + 6; if (p.x < -6) p.x = VW + 6; if (p.x > VW + 6) p.x = -6;
    }
  },

  /* ---------- gambar ---------- */
  draw() {
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
    const z = Math.max(1, this.cam.z), shk = this.shk.m > 0 ? [rnd(-1, 1) * this.shk.m, rnd(-1, 1) * this.shk.m] : [0, 0];
    if (this.bg) { this.bgDraw(); } else { W.cam.x = this.cam.x - VW / 2; W.cam.y = this.cam.y - VH / 2; W.draw(); }
    const sw = VW / z, sh = VH / z; let sx = 0, sy = 0;
    if (z > 1.001) { if (this.bg) { sx = clamp(this.cam.x - sw / 2, 0, VW - sw); sy = clamp(this.cam.y - sh / 2, 0, VH - sh); } else { sx = (VW - sw) / 2; sy = (VH - sh) / 2; } }
    this.crop = { x: sx, y: sy, z };
    if (z > 1.001 || shk[0] || shk[1]) {
      const o = this.off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(cv, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 960, 540);
      ctx.drawImage(this.off, sx * 2, sy * 2, sw * 2, sh * 2, shk[0] * 2, shk[1] * 2, 960, 540); ctx.setTransform(2, 0, 0, 2, 0, 0);
    }
    if (this.grade.a > 0) { ctx.fillStyle = `rgba(${this.grade.c},${this.grade.a})`; ctx.fillRect(0, 0, VW, VH); }
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.glows) { const [x, y] = this.toScr(...this.px(g.x, g.y)), r = g.r * z * g.pulse, gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${g.c},${g.a})`); gr.addColorStop(1, `rgba(${g.c},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    ctx.globalCompositeOperation = 'source-over';
    for (const f of this.fxs) {
      const d = FXD[f.n], fr = Math.min(d[3] - 1, Math.floor(f.t * d[4])), [x, y] = this.toScr(...this.px(f.x, f.y)), s = f.sc * z;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (d[7]) ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(IMG[d[0]], fr * d[1], 0, d[1], d[2], -d[1] * d[5], -d[2] * d[6], d[1], d[2]); ctx.restore();
    }
    this.partsDraw();
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * .35, VW / 2, VH / 2, VW * .62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    if (this.flash.a > 0) { ctx.fillStyle = `rgba(${this.flash.c},${this.flash.a})`; ctx.fillRect(0, 0, VW, VH); }
    if (this.bars > 0) { const h = Math.round(34 * this.bars); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, h); ctx.fillRect(0, VH - h, VW, h); }
    if (this.fade.a > 0) { ctx.fillStyle = `rgba(${this.fade.c},${this.fade.a})`; ctx.fillRect(0, 0, VW, VH); }
  },
  partsDraw() {
    const k = this.pk; if (!k) return;
    for (const p of this.parts) {
      if (k === 'rain') { ctx.strokeStyle = 'rgba(170,195,255,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 2.4, p.y - 8 * p.v); ctx.stroke(); }
      else if (k === 'snow') { ctx.fillStyle = 'rgba(235,248,255,.85)'; ctx.fillRect(p.x, p.y, p.s + .5, p.s + .5); }
      else if (k === 'petals') { ctx.fillStyle = p.s > 1.1 ? 'rgba(255,225,130,.9)' : 'rgba(255,190,210,.9)'; ctx.fillRect(p.x, p.y, p.s + 1, p.s); }
      else if (k === 'wisp') { ctx.fillStyle = `rgba(140,255,190,${.4 + Math.sin(this.T * 4 + p.p) * .3})`; ctx.fillRect(p.x, p.y, p.s + .6, p.s + .6); }
      else { ctx.fillStyle = `rgba(255,${100 + (p.p * 20 | 0)},60,${.5 + Math.sin(this.T * 5 + p.p) * .3})`; ctx.fillRect(p.x, p.y, p.s + .4, p.s + .4); }
    }
  },
  drawActor(e) {
    if (e.alpha <= 0) return; ctx.save(); ctx.globalAlpha = clamp(e.alpha, 0, 1); shadow(e.x, e.y, 6 * (e.sc || 1)); const fl = e.flash > 0;
    if (e.spr === 'hero') { const nm = ANIMS.soldier[e.anim] ? e.anim : 'idle', A = ANIMS.soldier[nm]; drawChar('soldier', nm, frameOf(A, e.t, nm === 'idle' || nm === 'walk'), e.x, e.y, e.face, e.sc, null, fl, null); }
    else if (e.spr === 'orc') { const sh = ANIMS.orc, nm = sh[e.anim] ? e.anim : 'idle'; drawChar('orc', nm, frameOf(sh[nm], e.t, nm === 'idle' || nm === 'walk'), e.x, e.y, e.face, e.sc, e.tint || null, fl, null); if (e.carry) { ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x + 9 * e.face, e.y - 20 * e.sc, 0, e.x + 9 * e.face, e.y - 20 * e.sc, 16); gr.addColorStop(0, 'rgba(120,255,160,.9)'); gr.addColorStop(1, 'rgba(120,255,160,0)'); ctx.fillStyle = gr; ctx.fillRect(e.x - 10, e.y - 46, 40, 40); } }
    else if (e.spr === 'nyx') { W.drawSpr(e.moving ? NPCSPR.nyxW : e.cast ? NPCSPR.nyx : NPCSPR.nyxI, e.x, e.y, e.face, e.t, e.sc); }
    else if (NPCSPR[e.spr]) W.drawSpr(NPCSPR[e.spr], e.x, e.y, e.face, e.t, e.sc);
    ctx.restore();
  },

  /* ---------- latar prosedural: altar di malam badai ---------- */
  bgDraw() {
    const T = this.T, g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#04051a'); g.addColorStop(.6, '#1b1446'); g.addColorStop(1, '#3a2a5c'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 70; i++) { const x = hash('sx', i) * VW, y = hash('sy', i) * 120, a = .35 + .5 * Math.abs(Math.sin(T * (.6 + hash('st', i)) + i)); ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.fillRect(x | 0, y | 0, 1, 1); }
    const mg = ctx.createRadialGradient(380, 48, 6, 380, 48, 50); mg.addColorStop(0, 'rgba(255,248,210,.55)'); mg.addColorStop(1, 'rgba(255,248,210,0)'); ctx.fillStyle = mg; ctx.fillRect(320, 0, 120, 110);
    ctx.fillStyle = '#f4ecc8'; ctx.beginPath(); ctx.arc(380, 48, 15, 0, 6.3); ctx.fill(); ctx.fillStyle = '#d8cca0'; ctx.fillRect(374, 44, 4, 3); ctx.fillRect(385, 52, 3, 3);
    ctx.fillStyle = 'rgba(10,8,34,.7)'; for (let i = 0; i < 4; i++) { const x = ((T * 6 + i * 150) % 640) - 80; ctx.beginPath(); ctx.ellipse(x, 30 + i * 22, 70, 8, 0, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#17143e'; ctx.beginPath(); ctx.moveTo(0, 150); for (let x = 0; x <= VW; x += 24) ctx.lineTo(x, 112 + Math.sin(x * .021) * 22 + Math.cos(x * .05) * 8); ctx.lineTo(VW, 190); ctx.lineTo(0, 190); ctx.fill();
    ctx.fillStyle = '#0d0c2a'; ctx.beginPath(); ctx.moveTo(0, 170); for (let x = 0; x <= VW; x += 20) ctx.lineTo(x, 138 + Math.sin(x * .03 + 2) * 16); ctx.lineTo(VW, 200); ctx.lineTo(0, 200); ctx.fill();
    for (let i = 0; i < 16; i++) { const x = i * 31 - 8, h = 30 + hash('tr', i) * 26; ctx.fillStyle = '#080a1c'; ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x + 13, 190 - h); ctx.lineTo(x + 26, 190); ctx.fill(); }
    ctx.fillStyle = '#0a1220'; ctx.fillRect(0, 188, VW, 90); ctx.fillStyle = '#101a2c'; ctx.fillRect(0, 188, VW, 2);
    // altar
    ctx.fillStyle = '#2a2c46'; ctx.fillRect(196, 214, 88, 8); ctx.fillStyle = '#34375a'; ctx.fillRect(206, 206, 68, 8); ctx.fillStyle = '#3e4268'; ctx.fillRect(218, 198, 44, 8);
    ctx.fillStyle = '#4a4e78'; ctx.fillRect(228, 176, 24, 22); ctx.fillStyle = '#5a5f8c'; ctx.fillRect(224, 172, 32, 6);
    const pul = .5 + Math.sin(T * 2.4) * .5, vis = this.gem.vis;
    ctx.fillStyle = `rgba(110,255,170,${.25 + .35 * pul * vis})`; for (let i = 0; i < 6; i++) { ctx.fillRect(200 + i * 14, 224, 8, 2); }
    if (vis > 0) {
      ctx.globalCompositeOperation = 'lighter'; const gx = this.gem.x, gy = this.gem.y, r = 46 + pul * 12, gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); gr.addColorStop(0, `rgba(110,255,170,${.75 * vis})`); gr.addColorStop(1, 'rgba(110,255,170,0)'); ctx.fillStyle = gr; ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
      ctx.fillStyle = `rgba(120,255,180,${.12 * vis})`; ctx.beginPath(); ctx.moveTo(gx - 8, gy); ctx.lineTo(gx - 40, 0); ctx.lineTo(gx + 40, 0); ctx.lineTo(gx + 8, gy); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      const by = gy + Math.sin(T * 2) * 2; ctx.fillStyle = '#2fbf72'; ctx.beginPath(); ctx.moveTo(gx, by - 10); ctx.lineTo(gx + 7, by); ctx.lineTo(gx, by + 10); ctx.lineTo(gx - 7, by); ctx.fill(); ctx.fillStyle = '#9dffc4'; ctx.beginPath(); ctx.moveTo(gx, by - 10); ctx.lineTo(gx + 3, by - 2); ctx.lineTo(gx - 1, by - 1); ctx.fill();
    }
    const list = this.actors.slice().sort((a, b) => a.y - b.y); for (const a of list) this.drawActor(a);
  },
};
$('cutPause').addEventListener('click', e => { e.stopPropagation(); Cut.togglePause(); });
$('cutFF').addEventListener('click', e => { e.stopPropagation(); Cut.toggleFF(); });
$('cutAuto').addEventListener('click', e => { e.stopPropagation(); Dlg.setAuto(!Dlg.auto); Cut.syncBar(); });
$('dlgAuto').addEventListener('click', e => { e.stopPropagation(); Dlg.setAuto(!Dlg.auto); $('dlgAuto').classList.toggle('on', Dlg.auto); });
$('cutSkip').addEventListener('click', e => { e.stopPropagation(); Cut.doSkip(); });

/* =========================== SKRIP CUTSCENE =========================== */
/* --- Prolog: malam permata lenyap (latar prosedural + siluet orc + petir) --- */
Cut.S.prolog = async c => {
  c.hideHero = true; c.setBg('night'); c.barsTo(1, 0); c.fade.a = 1; c.cam.x = 240; c.cam.y = 200; Audio8.music('malam');
  c.fadeTo(0, 2.2); c.camTo(240, 200, 1.3, 11);
  await c.wait(1.4); await c.dlg('prolog.1');
  c.parts_('rain', 110); Audio8.sfx('warn'); c.flashNow('200,210,255', .8, .6); c.fx('thunderStrike', 110, 140, 2.6); c.shake(2, .4); await c.wait(1.2);
  const mk = (x, tint) => c.actor('o' + x, { spr: 'orc', x, y: 197, face: -1, sc: 1.15, anim: 'walk', tint: ['#000000', 1] });
  const o1 = mk(560), o2 = mk(610), o3 = mk(660);
  c.camTo(250, 200, 1.2, 3);
  await Promise.all([c.move(o1, 262, 198, 4.2), c.move(o2, 306, 203, 4.6), c.move(o3, 212, 203, 4.6)]);
  o1.anim = 'idle'; o2.anim = 'idle'; o3.anim = 'idle'; Audio8.sfx('thunder'); c.flashNow('200,210,255', .9, .5); c.fx('thunderStrike', 190, 150, 2.4); await c.wait(.9);
  c.gem.vis = 0; o1.carry = 1; Audio8.sfx('levelup'); c.flashNow('120,255,170', .85, .9); c.shake(3, .6); await c.wait(.8);
  o1.face = 1; o2.face = 1; o3.face = 1; await Promise.all([c.move(o1, 560, 198, 3.4), c.move(o2, 600, 203, 3.4), c.move(o3, 520, 203, 3.4)]);
  c.parts_('rain', 40); await c.camTo(240, 200, 1.3, 1.6);
  await c.dlg('prolog.2'); c.parts_(null);
  c.glow(240, 170, 30, '110,255,170', .25); await c.wait(.8);
  await c.dlg('prolog.3');
  await c.fadeTo(1, 1.3); c.glows = []; c.setBg(null); c.hideHero = false; c.actors = [];
  const p = W.player; c.cam.x = p.x; c.cam.y = p.y - 8; c.cam.z = 1;
  await c.title('LEGENDA LEMBAH HIJAU', 'BAB I · PULANG', 4.2);
  c.fadeTo(0, 1.6); await c.barsTo(0, 1.2);
};

/* --- Nyx muncul setelah Kapten Orc tumbang --- */
Cut.S.nyx = async c => {
  setF('nyxMet'); const p = W.player; await c.barsTo(1, .7); c.camTo(p.x + 22, p.y - 10, 1.5, 1.4); await c.wait(.8);
  const nx = p.x + 52, ny = p.y; Audio8.sfx('magic'); Audio8.sfx('smoke'); c.flashNow('170,235,255', .7, .6); c.fx('warp3', nx, ny - 10, 1.1); c.fx('wst1', nx, ny + 4, 2.4); c.fx('o_rune', nx, ny + 2, 1.2); c.fx('iceActive', nx, ny - 12, 3.2); c.fx('iceHit', nx - 14, ny - 18, 2.6); c.fx('iceHit', nx + 14, ny - 10, 2.2); c.shake(2, .5); c.parts_('snow', 60);
  const a = c.actor('nx', { spr: 'nyx', x: nx, y: ny, face: -1, alpha: 0, cast: 1 }); await c.tween(a, 'alpha', 1, .9); await c.wait(.5);
  await c.dlg('nyx.meet');
  c.flashNow('170,235,255', .7, .5); FN.joinNyx(); c.drop(a); await c.wait(.4); c.parts_(null);
  await c.camTo(p.x, p.y - 8, 1, 1); await c.barsTo(0, .6);
};

/* --- Grumak: kartu bos --- */
Cut.S.grumak = async c => {
  const p = W.player; await c.barsTo(1, .6); c.gradeTo('60,0,40', .3, 1.2); c.camTo(p.x, p.y - 20, 1.35, 2); Audio8.sfx('warn'); c.shake(2, 1);
  c.parts_('embers', 60); await c.wait(1);
  const g = c.actor('g', { spr: 'orc', x: p.x, y: p.y - 60, face: 1, sc: 1.7, anim: 'idle', tint: ['#40004a', .42], alpha: 0 });
  c.flashNow('255,70,60', .8, .7); c.fx('thunderSplash', g.x, g.y - 14, 2.6); c.fx('boom2', g.x, g.y, 1.4); c.fx('o_rune', g.x, g.y + 14, 2); c.fx('smkskull', g.x, g.y, 1.6); Audio8.sfx('ult'); await c.tween(g, 'alpha', 1, .6);
  c.shake(3, .8); await c.title('PANGLIMA GRUMAK', 'PENGUASA BENTENG ORC', 3.4);
  c.fadeTo(0, .1); await c.wait(.3); c.drop(g); c.parts_(null); await c.gradeTo('0,0,0', 0, .4); await c.camTo(p.x, p.y - 8, 1, .8); await c.barsTo(0, .5);
};

/* --- Epilog: tiga akhir --- */
const endScene = (name, fn) => { Cut.S[name] = async c => { const p = W.player; await c.barsTo(1, .8); c.camTo(p.x, p.y - 14, 1.45, 7); await fn(c, p); await c.fadeTo(1, 1.2); }; };
endScene('endA', async (c, p) => {
  Audio8.music('desa'); c.gradeTo('255,200,90', .2, 2); c.parts_('petals', 90); c.glow(p.x, p.y - 20, 90, '255,230,140', .5); Audio8.sfx('levelup'); c.fx('o_pillar', p.x, p.y, 1.6); c.fx('fw2', p.x - 40, p.y - 50, 1.3); c.fx('fw1', p.x + 40, p.y - 56, 1.3); await c.wait(3);
  if (F('motherSeal')) await c.dlg('end.mother_a');
  await c.title('SANG PAHLAWAN', 'AKHIR', 4);
});
endScene('endB', async (c, p) => {
  Audio8.music('desa'); c.gradeTo('60,220,170', .16, 2); c.parts_('wisp', 90); c.glow(p.x, p.y - 20, 110, '110,255,190', .55); Audio8.sfx('heal'); c.fx('o_leaf', p.x, p.y, 1.8); c.fx('heart', p.x, p.y - 20, 1);
  const ox = [-78, -62, 70, 88]; ox.forEach((dx, i) => c.actor('o' + i, { spr: 'orc', x: p.x + dx, y: p.y + (i % 2 ? 8 : -6), face: dx < 0 ? 1 : -1, sc: 1.05, anim: 'idle', alpha: 0 }).alpha = 1);
  await c.wait(3);
  if (F('motherSeal')) await c.dlg('end.mother_b');
  await c.title('PEMULIH LEMBAH', 'AKHIR', 4);
});
endScene('endC', async (c, p) => {
  Audio8.music('boss'); c.gradeTo('70,0,90', .38, 2); c.parts_('embers', 80); c.glow(p.x, p.y - 20, 80, '200,90,255', .6); c.shake(1.6, 3); c.flashNow('190,80,255', .7, 1.2); Audio8.sfx('warn'); await c.wait(3);
  if (F('motherSeal')) await c.dlg('end.mother_c');
  await c.title('SANG PENGUASA', 'AKHIR', 4);
});
