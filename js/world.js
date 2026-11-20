/* =========================================================================
   world.js  —  dunia jelajah: peta, pemain, NPC berjadwal, musuh di peta, interaksi, kamera, gambar
   ========================================================================= */
'use strict';

/* posisi NPC menurut jadwal/jam (null = tidak ada di mana pun) */
function NPCPOS(id) {
  const N = NPCS[id]; if (!N) return null;
  if (id === 'rudi' && !F('rudiSaved')) return { map: 'gua', tx: 17, ty: 39, act: 'Terkurung' };
  if (id === 'darma' && !F('darmaJoined')) return { map: 'hutan', tx: 47, ty: 34, act: 'Ditawan' };
  if (S.npcState[id] === 'party') return null;
  if (NPC_PRESENT[id] && !NPC_PRESENT[id]()) return null;
  const h = hour(), seg = N.sched.find(s => h >= s[0] && h < s[1]); if (!seg || !seg[2]) return null;
  return { map: seg[2], tx: seg[3], ty: seg[4], act: seg[5] || '' };
}
/* kapan NPC muncul lagi: {h: jam muncul, left: jam lagi, map} atau null */
function NPCNext(id) {
  const N = NPCS[id]; if (!N || !N.sched) return null; if (NPC_PRESENT[id] && !NPC_PRESENT[id]()) return null; if (S.npcState[id] === 'party') return null;
  const now = hour();
  for (let k = 1; k <= 24; k++) { const h2 = (Math.floor(now) + k) % 24, seg = N.sched.find(s => h2 >= s[0] && h2 < s[1]); if (seg && seg[2]) return { h: h2, left: Math.max(1, Math.round(((h2 - now) + 24) % 24)), map: seg[2] }; }
  return null;
}
const spikeState = d => { const c = (G.t + (d.ph || 0)) % 3.2; return c < 1.6 ? 0 : c < 2.0 ? 1 : (c < 2.6 ? 2 : 3); };

const W = {
  map: null, id: '', ents: [], cols: [], blocks: [], warps: [], trigs: [], player: null, followers: [], hist: [], cam: { x: 0, y: 0 }, ground: null,
  warpCD: 0, safe: 0, target: null, puz: [], arenaOn: false, fade: { a: 0, to: 0, cb: null }, floats: [], lastHour: -1, lastMin: -1, reqMsgT: 0, lc: null, busy: false,

  /* ---------------- memuat peta ---------------- */
  load(id, tx, ty, o = {}) {
    const m = MAPS[id](); this.map = m; this.id = id; S.map = id; S.discovered[id] = 1;
    this.ents = []; this.cols = []; this.floats = []; this.puz = []; this.arenaOn = false; this.hist = [];
    this.warps = m.warps.slice(); this.trigs = m.triggers.slice();
    this.blocks = m.blocks.map(b => ({ ...b, on: this.blockOn(b) }));
    for (const p of m.props) if (p.col) this.cols.push({ x: p.x + p.col[0], y: p.y + p.col[1], w: p.col[2], h: p.col[3] });
    for (const d of m.decos) { if (d.col) this.cols.push({ x: d.x - 6, y: d.y - 9, w: 12, h: 9 }); if (d.kind === 'fountain') this.cols.push({ x: d.x - 8, y: d.y - 12, w: 16, h: 12 }); if (d.kind === 'bench') this.cols.push({ x: d.x - 12, y: d.y - 10, w: 24, h: 10 }); }
    for (const c of m.crystals) this.cols.push({ x: c.x - 5, y: c.y - 5, w: 10, h: 10 });
    this.ground = buildGround(m);
    for (const p of m.props) this.ents.push({ kind: 'prop', x: p.x, y: p.flat ? p.y - 8 : p.y, spr: p.spr, flat: p.flat });
    for (const d of m.decos) { if (d.kind === 'rug' || d.kind === 'wall') continue; const flat = d.kind === 'pedestal' || d.kind === 'spikes'; this.ents.push({ kind: 'deco', d, x: d.x, y: flat ? d.y - 12 : d.y, flat }); }
    for (const s of m.signs) this.ents.push({ kind: 'sign', x: s.x, y: s.y, lines: s.lines });
    for (const a of m.animals) { if (S.dead[a.id]) continue; this.ents.push({ kind: 'animal', a, x: a.tx * TS + 8, y: a.ty * TS + 14, hw: a.kind === 'cow' ? 8 : 4, hh: a.kind === 'cow' ? 5 : 3, blocker: a.kind === 'cow', face: Math.random() < .5 ? 1 : -1, t: Math.random() * 5, home: { x: a.tx * TS + 8, y: a.ty * TS + 14 }, wt: 0, wd: { x: 0, y: 0 }, row: 0 }); }
    for (const c of m.chests) this.ents.push({ kind: 'chest', c, x: c.x, y: c.y, hw: 7, hh: 5, blocker: true, open: !!S.chests[c.id], openT: S.chests[c.id] ? 9 : -1 });
    for (const c of m.crystals) this.ents.push({ kind: 'crystal', c, x: c.x, y: c.y + 6, lit: !!F('gateOpen'), t: Math.random() * 6, flash: 0 });
    m.nodes.forEach(n => this.ents.push({ kind: 'node', n, x: n.x, y: n.y }));
    m.plots.forEach((p, i) => this.ents.push({ kind: 'plot', i, x: p.x, y: p.y, flat: true }));
    this.onEnter(id); this.spawnEncs(); this.syncNpcs(true);
    // pemain
    const p = { kind: 'player', x: tx * TS + 8, y: ty * TS + 12, hw: 5, hh: 5, face: 1, moving: false, t: 0, dir: { x: 0, y: 1 }, inv: 0 };
    if (o.dir === 'left') p.face = -1; this.player = p; this.ents.push(p);
    this.followers = S.party.filter(c => c !== 'arga').map((c, i) => ({ kind: 'follower', id: c, x: p.x, y: p.y, hw: 4, hh: 4, face: 1, moving: false, t: Math.random(), i }));
    this.followers.forEach(f => this.ents.push(f));
    this.spawnSpecials();
    this.cam.x = p.x - VW / 2; this.cam.y = p.y - VH / 2; this.clampCam();
    this.warpCD = .6; this.safe = o.safe || 1.2;
    this.musicFor();
    UI.banner(m.name);
    if (G.mode === 'world' && Game.ready && !o.nosave) saveGame();   // checkpoint tiap pindah area
  },
  blockOn(b) {
    if (b.id === 'gate') return !F('gateOpen'); if (b.id === 'log') return !F('darmaJoined');
    if (b.id === 'arena') return this.arenaOn; if (b.id === 'seal') return !!this.sealOn; return b.on;
  },
  refreshBlocks() { this.blocks.forEach(b => b.on = this.blockOn(b)); },
  musicFor() {
    const m = this.map; let th = m.music;
    if (m.kind !== 'indoor' && m.theme === 'grass' && isNight()) th = 'malam';
    Audio8.music(th);
  },
  onEnter(id) {
    if (id === 'hutan') { setF('inForest'); if (!F('budiLost') && F('metWira')) setF('budiLost'); }
    if (id === 'gua') setF('inCave'); if (id === 'benteng') setF('inFort');
    if (id === 'desa' && S.stats.steps === 0) S.stats.steps = 1;
  },
  /* NPC & objek khusus yang bergantung status */
  spawnSpecials() {
    const id = this.id;
    if (id === 'hutan' && F('captainDown') && !has('kunci') && !F('keyTaken')) this.ents.push({ kind: 'pick', type: 'key', x: 61 * TS + 8, y: 11 * TS + 8, t: 0 });
    if (id === 'benteng' && F('grumakDone') && !F('gemTaken')) this.ents.push({ kind: 'pick', type: 'gem', x: 22 * TS + 8, y: 8 * TS + 8, t: 0 });
    if (id === 'benteng' && F('gemTaken')) this.addPortal();
    if (id === 'hutan' && F('budiLost') && !F('budiHome') && !F('budiEscort')) this.ents.push({ kind: 'npc', id: 'budi', def: { id: 'budi', ...NPCS.budi, wander: 0 }, name: 'Budi', home: { x: 14 * TS + 8, y: 24 * TS + 14 }, wt: 0, wd: { x: 0, y: 0 }, x: 14 * TS + 8, y: 24 * TS + 14, hw: 5, hh: 4, blocker: true, face: 1, sc: .82, t: 0, moving: false, alpha: 1, act: 'Tersesat', lost: 1 });
    if (id === 'hutan' && F('budiEscort') && !F('budiHome')) { /* Budi ikut sebagai pengikut */ const p = this.player; const b = { kind: 'follower', id: 'budi', npc: 1, x: p.x - 10, y: p.y, hw: 4, hh: 4, face: 1, moving: false, t: 0, i: this.followers.length }; this.followers.push(b); this.ents.push(b); }
    if (id === 'benteng' && F('gemTaken') === undefined) { /* tidak ada */ }
  },
  addPortal() {
    if (this.warps.some(w => w.portal)) return;
    this.warps.push({ x: 20 * TS, y: 4 * TS, w: 5 * TS, h: 2 * TS, to: 'desa', tx: 24, ty: 20, portal: true, dir: 'down' });
    this.ents.push({ kind: 'deco', d: { kind: 'portal', x: 22 * TS + 8, y: 6 * TS }, x: 22 * TS + 8, y: 6 * TS - 30 });
  },
  spawnKey() { if (this.id === 'hutan' && !this.ents.some(e => e.kind === 'pick' && e.type === 'key')) this.ents.push({ kind: 'pick', type: 'key', x: 61 * TS + 8, y: 11 * TS + 8, t: 0 }); },
  spawnGem() { if (this.id === 'benteng' && !this.ents.some(e => e.kind === 'pick' && e.type === 'gem')) this.ents.push({ kind: 'pick', type: 'gem', x: 22 * TS + 8, y: 8 * TS + 8, t: 0 }); this.sealOn = false; this.refreshBlocks(); },

  /* ---------------- musuh di peta ---------------- */
  spawnEncs() {
    for (const d of this.map.encs) {
      const f = FORMS[d.form]; if (!f) continue;
      const dd = S.dead[d.id]; if (dd !== undefined) { if (f.once || (S.clock - dd) < 360) continue; delete S.dead[d.id]; }
      const E0 = ENEMIES[f.vis || f.en[0]];
      this.ents.push({ kind: 'enc', d, f, E0, x: d.x, y: d.y, hw: 6, hh: 5, home: { x: d.x, y: d.y }, face: Math.random() < .5 ? 1 : -1, t: Math.random() * 4, st: 'idle', wt: rnd(0, 2), wd: { x: 0, y: 0 }, stun: 0, moving: false });
    }
  },

  /* ---------------- NPC berjadwal ---------------- */
  syncNpcs(initial) {
    for (const id in NPCS) {
      if (NPCS[id].party && S.npcState[id] === 'party') { this.removeNpc(id); continue; }
      const pos = NPCPOS(id); let e = this.ents.find(x => x.kind === 'npc' && x.id === id && !x.lost);
      if (!pos || pos.map !== this.id) { if (e) { if (initial) this.removeNpc(id); else { e.leaving = true; } } continue; }
      const N = NPCS[id], gx = pos.tx * TS + 8, gy = pos.ty * TS + 14;
      if (!e) {
        e = { kind: 'npc', id, def: { id, ...N }, name: N.n, x: gx, y: gy, hw: 5, hh: 4, blocker: true, face: N.sched && N.sched[0] ? 1 : 1, sc: N.small ? .82 : 1, t: Math.random() * 5, moving: false, alpha: initial ? 1 : 0, home: { x: gx, y: gy }, wt: 0, wd: { x: 0, y: 0 } };
        this.ents.push(e);
      }
      e.leaving = false; e.act = pos.act; e.goal = { x: gx, y: gy }; e.def.wander = !!N.wander && pos.act === 'Bermain';
      if (initial) { e.x = gx; e.y = gy; e.home = { x: gx, y: gy }; }
    }
  },
  removeNpc(id) { this.ents = this.ents.filter(e => !(e.kind === 'npc' && e.id === id && !e.lost)); },
  npcEnt(id) { return this.ents.find(e => e.kind === 'npc' && e.id === id); },

  /* ---------------- tumbukan ---------------- */
  tileSolid(tx, ty) { return SOLID_T.has(this.map.get(tx, ty)); },
  hitsTiles(x, y, w, h) {
    const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - .01) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - .01) / TS);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (SOLID_T.has(this.map.get(i, j))) return true; return false;
  },
  collides(x, y, w, h, self) {
    if (this.hitsTiles(x, y, w, h)) return true; const r = { x, y, w, h };
    for (const c of this.cols) if (overlap(r, c)) return true; for (const b of this.blocks) if (b.on && overlap(r, b)) return true;
    for (const e of this.ents) if (e !== self && e.blocker && !e.gone && overlap(r, { x: e.x - e.hw, y: e.y - e.hh, w: e.hw * 2, h: e.hh })) return true;
    return false;
  },
  move(e, dx, dy) {
    let ok = false;
    if (dx) { const nx = e.x + dx; if (!this.collides(nx - e.hw, e.y - e.hh, e.hw * 2, e.hh, e)) { e.x = nx; ok = true; } }
    if (dy) { const ny = e.y + dy; if (!this.collides(e.x - e.hw, ny - e.hh, e.hw * 2, e.hh, e)) { e.y = ny; ok = true; } }
    return ok;
  },
  lineClear(a, b) {
    const n = Math.ceil(dist(a, b) / 8);
    for (let i = 1; i < n; i++) { const x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n; if (this.hitsTiles(x - 1, y - 1, 2, 2)) return false; for (const c of this.cols) if (overlap({ x: x - 1, y: y - 1, w: 2, h: 2 }, c)) return false; }
    return true;
  },
  clampCam() { const m = this.map; this.cam.x = m.w * TS <= VW ? (m.w * TS - VW) / 2 : clamp(this.cam.x, 0, m.w * TS - VW); this.cam.y = m.h * TS <= VH ? (m.h * TS - VH) / 2 : clamp(this.cam.y, 0, m.h * TS - VH); },

  /* ---------------- update ---------------- */
  update(dt) {
    G.t += dt; const P = this.player;
    this.updateClock(dt);
    if (this.safe > 0) this.safe -= dt;
    if (this.warpCD > 0) this.warpCD -= dt;
    // gerak pemain
    const v = Input.vec(); P.t += dt;
    P.moving = !!(v.x || v.y);
    if (P.moving) {
      const sp = 66; if (v.x) P.face = sgn(v.x); P.dir = { x: v.x, y: v.y };
      const m1 = this.move(P, v.x * sp * dt, 0), m2 = this.move(P, 0, v.y * sp * dt);
      if (m1 || m2) { S.stats.steps++; const last = this.hist[0]; if (!last || Math.hypot(last.x - P.x, last.y - P.y) > 3) { this.hist.unshift({ x: P.x, y: P.y, f: P.face }); if (this.hist.length > 80) this.hist.pop(); } }
    }
    for (const f of this.followers) {
      const h = this.hist[Math.min(this.hist.length - 1, 5 + f.i * 5)]; f.t += dt;
      if (h && Math.hypot(f.x - h.x, f.y - h.y) > 1.5) { const dx = h.x - f.x, dy = h.y - f.y, l = Math.hypot(dx, dy), s = Math.min(l, 78 * dt); f.x += dx / l * s; f.y += dy / l * s; f.face = Math.abs(dx) > .5 ? sgn(dx) : f.face; f.moving = true; } else f.moving = false;
    }
    for (const e of this.ents) {
      if (e.kind === 'npc') this.updateNpc(e, dt); else if (e.kind === 'animal') this.updateAnimal(e, dt);
      else if (e.kind === 'enc') this.updateEnc(e, dt); else if (e.kind === 'crystal') { e.t += dt; e.flash = Math.max(0, e.flash - dt); }
      else if (e.kind === 'chest' && e.openT >= 0 && e.open) e.openT += dt; else if (e.kind === 'pick') e.t += dt;
    }
    this.ents = this.ents.filter(e => !e.gone);
    // jebakan duri
    for (const e of this.ents) if (e.kind === 'deco' && e.d.kind === 'spikes' && spikeState(e.d) >= 2 && P.inv <= 0 && Math.abs(P.x - e.d.x) < 9 && Math.abs(P.y - 3 - (e.d.y - 8)) < 8) this.hurtSpikes();
    if (P.inv > 0) P.inv -= dt;
    // pemicu & portal
    this.checkTriggers(); this.checkWarps(); this.checkPicks();
    // kamera
    const tx = P.x - VW / 2, ty = P.y - VH / 2 - 8; this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 7); this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 7); this.clampCam();
    this.target = this.findTarget(); UI.setPrompt(this.target);
    // efek melayang
    for (const f of this.floats) f.t += dt; this.floats = this.floats.filter(f => f.t < f.life);
    if (this.fade.a !== this.fade.to) { const d = Math.sign(this.fade.to - this.fade.a) * dt * 3.2; this.fade.a = clamp(this.fade.a + d, 0, 1); if (Math.abs(this.fade.a - this.fade.to) < .02) { this.fade.a = this.fade.to; const cb = this.fade.cb; this.fade.cb = null; if (cb) cb(); } }
  },
  updateClock(dt) {
    S.clock += dt * 2; S.stats.played += dt;
    const h = Math.floor(hour()), m = Math.floor(S.clock);
    if (m !== this.lastMin) { this.lastMin = m; if (m % 5 === 0) FARM.tick(); }
    if (h !== this.lastHour) {
      const first = this.lastHour < 0; this.lastHour = h; ECO.newDay(); this.syncNpcs(false); this.respawnCheck();
      if (!first) { if (h === 19) { toast('Hari mulai malam.'); this.musicFor(); } if (h === 5) { toast('Fajar menyingsing.'); this.musicFor(); } if (h === 7) toast('Pagi. Pasar dibuka.'); }
      Q.check();
    }
  },
  respawnCheck() { for (const d of this.map.encs) { const dd = S.dead[d.id], f = FORMS[d.form]; if (dd !== undefined && !f.once && S.clock - dd >= 360 && !this.ents.some(e => e.kind === 'enc' && e.d === d)) { this.spawnEncs(); break; } } },
  hurtSpikes() {
    this.player.inv = 1.2; Audio8.sfx('hurt'); buzz(40);
    for (const c of S.party) { const st = statsOf(c), ch = S.chars[c]; ch.hp = Math.max(1, ch.hp - Math.round(st.maxhp * .06)); }
    this.float(this.player.x, this.player.y - 24, 'Duri!', '#ff6a6a'); UI.hud();
  },
  floatText: null,
  float(x, y, txt, col = '#fff') { this.floats.push({ x, y, txt, col, t: 0, life: 1 }); },
  updateNpc(e, dt) {
    e.t += dt; if (e.alpha < 1) e.alpha = Math.min(1, e.alpha + dt * 1.5);
    if (e.leaving) { e.alpha -= dt * 3; if (e.alpha <= 0) e.gone = true; return; }
    if (e.goal && !e.lost) {
      const dx = e.goal.x - e.x, dy = e.goal.y - e.y, l = Math.hypot(dx, dy);
      if (l > 2) { const s = Math.min(l, 40 * dt); const a = this.move(e, dx / l * s, 0), b = this.move(e, 0, dy / l * s); e.moving = a || b; if (Math.abs(dx) > 1) e.face = sgn(dx); e.stuck = (e.stuck || 0) + (e.moving ? 0 : dt); if (e.stuck > 2.5) { e.x = e.goal.x; e.y = e.goal.y; e.stuck = 0; } e.home = { x: e.goal.x, y: e.goal.y }; return; }
      e.moving = false; e.stuck = 0;
    }
    if (!e.def.wander) return;
    e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1.5, 4); const a = rnd(0, 6.28); e.wd = Math.random() < .45 ? { x: 0, y: 0 } : { x: Math.cos(a), y: Math.sin(a) }; }
    e.moving = !!(e.wd.x || e.wd.y);
    if (e.moving) { const h = e.home || { x: e.x, y: e.y }; if (Math.hypot(e.x + e.wd.x * 10 - h.x, e.y + e.wd.y * 10 - h.y) > 40) { const l = Math.hypot(h.x - e.x, h.y - e.y) || 1; e.wd = { x: (h.x - e.x) / l, y: (h.y - e.y) / l }; } this.move(e, e.wd.x * 22 * dt, 0); this.move(e, 0, e.wd.y * 22 * dt); if (e.wd.x) e.face = sgn(e.wd.x); }
  },
  updateAnimal(e, dt) {
    e.t += dt; e.wt -= dt; const cow = e.a.kind === 'cow', sp = cow ? 9 : e.a.kind === 'chick' ? 16 : 14;
    if (e.wt <= 0) { e.wt = rnd(1.2, 4); const a = rnd(0, 6.28); e.wd = Math.random() < .5 ? { x: 0, y: 0 } : { x: Math.cos(a), y: Math.sin(a) }; }
    e.moving = !!(e.wd.x || e.wd.y);
    if (e.moving) {
      if (Math.hypot(e.x + e.wd.x * 10 - e.home.x, e.y + e.wd.y * 10 - e.home.y) > 36) { const l = Math.hypot(e.home.x - e.x, e.home.y - e.y) || 1; e.wd = { x: (e.home.x - e.x) / l, y: (e.home.y - e.y) / l }; }
      this.move(e, e.wd.x * sp * dt, 0); this.move(e, 0, e.wd.y * sp * dt); if (e.wd.x) e.face = sgn(e.wd.x);
      e.row = cow ? (Math.abs(e.wd.y) > Math.abs(e.wd.x) * 1.3 ? (e.wd.y < 0 ? 2 : 1) : 0) : 0;
    } else e.row = cow ? 0 : 1;
  },
  updateEnc(e, dt) {
    e.t += dt; if (e.stun > 0) { e.stun -= dt; e.moving = false; return; }
    const P = this.player, d = dist(P, e), boss = e.f.boss, aggro = boss ? 0 : e.f.once ? 55 : 70;
    if (!boss && aggro && d < aggro && this.safe <= 0 && this.lineClear(e, P)) {
      e.st = 'chase'; const dx = P.x - e.x, dy = P.y - e.y, l = Math.hypot(dx, dy) || 1, s = (e.f.once ? 26 : 38) * dt;
      this.move(e, dx / l * s, 0); this.move(e, 0, dy / l * s); e.face = sgn(dx) || e.face; e.moving = true;
    } else {
      e.st = 'idle'; e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1.5, 4); const a = rnd(0, 6.28); e.wd = Math.random() < .5 ? { x: 0, y: 0 } : { x: Math.cos(a), y: Math.sin(a) }; }
      e.moving = !boss && !!(e.wd.x || e.wd.y);
      if (e.moving) { if (Math.hypot(e.x + e.wd.x * 10 - e.home.x, e.y + e.wd.y * 10 - e.home.y) > 28) { const l = Math.hypot(e.home.x - e.x, e.home.y - e.y) || 1; e.wd = { x: (e.home.x - e.x) / l, y: (e.home.y - e.y) / l }; } this.move(e, e.wd.x * 14 * dt, 0); this.move(e, 0, e.wd.y * 14 * dt); if (e.wd.x) e.face = sgn(e.wd.x); }
    }
    if (this.safe <= 0 && d < (boss ? 22 : 13) && G.mode === 'world' && !this.busy) this.startEncounter(e);
  },
  checkTriggers() {
    const P = this.player;
    for (const t of this.trigs) {
      const key = 'trg_' + t.id; if (t.once && F(key)) continue;
      if (P.x > t.x && P.x < t.x + t.w && P.y > t.y && P.y < t.y + t.h) { if (t.once) { if (t.id.endsWith(':arena') || t.id.endsWith(':boss')) { /* diset saat sukses */ } else setF(key); } FN[t.fn] && FN[t.fn](); if (G.mode !== 'world') return; }
    }
  },
  checkWarps() {
    if (this.warpCD > 0 || this.busy) return; const P = this.player;
    for (const w of this.warps) {
      if (!(P.x > w.x && P.x < w.x + w.w && P.y > w.y && P.y < w.y + w.h)) continue;
      if (w.req && !w.req()) { if (G.t - this.reqMsgT > 2.5) { this.reqMsgT = G.t; toast(w.msg || 'Terkunci.'); Audio8.sfx('error'); } if (w.dir) { const d = { up: [0, 3], down: [0, -3], left: [3, 0], right: [-3, 0] }[w.dir] || [0, 0]; P.x += d[0]; P.y += d[1]; } return; }
      if (w.onOpen && FN[w.onOpen]) FN[w.onOpen]();
      this.go(w.to, w.tx, w.ty, w.dir); return;
    }
  },
  go(to, tx, ty, dir) {
    if (this.busy) return; this.busy = true; Audio8.sfx('warp'); this.fade.to = 1;
    this.fade.cb = () => {
      this.busy = false;
      if (F('budiEscort') && !F('budiHome') && to === 'desa') { setF('budiHome'); S.fr.budi = S.fr.budi || {}; Q.check(); this.load(to, tx, ty, { dir }); this.fade.to = 0; saveGame(); Dlg.play('budi.home'); return; }
      this.load(to, tx, ty, { dir }); this.fade.to = 0; saveGame();
    };
  },
  checkPicks() {
    const P = this.player;
    for (const e of this.ents) if (e.kind === 'pick' && dist(P, e) < 14) {
      e.gone = true;
      if (e.type === 'key') { addItem('kunci', 1); setF('keyTaken'); toast('Kunci Gua didapat!', 4); }
      if (e.type === 'gem') { addItem('permata', 1); setF('gemTaken'); Audio8.sfx('win'); toast('Permata Hijau didapat! Kembali ke desa lewat portal.', 5); this.addPortal(); }
    }
  },

  /* ---------------- interaksi ---------------- */
  findTarget() {
    if (G.mode !== 'world' || this.busy) return null; const P = this.player; let best = null, bd = 1e9;
    const consider = (kind, ref, d, label, lim) => { if (d < lim && d < bd) { bd = d; best = { kind, ref, label }; } };
    for (const e of this.ents) {
      switch (e.kind) {
        case 'npc': if (!e.leaving && e.alpha > .5) consider('npc', e, dist(P, e), 'Bicara: ' + e.name, 26); break;
        case 'chest': if (!e.open && !(e.c.needFlag && !F(e.c.needFlag))) consider('chest', e, dist(P, e), 'Buka peti', 24); break;
        case 'crystal': consider('crystal', e, dist(P, { x: e.x, y: e.y - 8 }), 'Sentuh kristal', 24); break;
        case 'node': { const a = this.nodeAvail(e.n); if (a) consider('node', e, dist(P, e), 'Kumpulkan ' + NODE[e.n.kind].n, 20); break; }
        case 'plot': if (FARM.openCount() > 0) consider('plot', e, dist(P, e), 'Ladang', 20); break;
        case 'animal': if (e.a.quest && F('ayamStart') && !S.dead[e.a.id]) consider('chicken', e, dist(P, e), 'Tangkap ayam', 20); break;
        case 'sign': consider('sign', e, dist(P, e), 'Baca papan', 22); break;
      }
    }
    for (const it of this.map.inters) { if (it.need && !F(it.need)) continue; if (it.kind === 'liontin' && has('liontin')) continue; consider('inter', it, dist(P, it), it.label || 'Periksa', it.r); }
    return best;
  },
  nodeAvail(n) { if (S.nodes[n.id] === day()) return false; if (n.kind === 'bulan' && !isNight()) return false; return true; },
  interact() {
    const t = this.target; if (!t || G.mode !== 'world') return;
    switch (t.kind) {
      case 'npc': UI.npcMenu(t.ref.id); break;
      case 'chest': this.openChest(t.ref); break;
      case 'crystal': this.crystal(t.ref); break;
      case 'node': this.gather(t.ref); break;
      case 'plot': UI.farm(); break;
      case 'chicken': { const e = t.ref; S.dead[e.a.id] = 1; e.gone = true; S.stats.chickens++; Audio8.sfx('pickup'); toast(`Ayam tertangkap (${S.stats.chickens}/3)`); Q.check(); break; }
      case 'sign': Dlg.run(t.ref.lines.map(l => ['narrator', l]), { noVoice: true }); break;
      case 'cage': if (!F('campCleared')) { toast('Kerangkeng terkunci. Kalahkan penjaga kamp dulu.'); Audio8.sfx('error'); } else Dlg.play('darma.rescue'); break;
      case 'inter': this.interInter(t.ref); break;
    }
  },
  interInter(it) {
    switch (it.kind) {
      case 'board': UI.board(); break;
      case 'bench': UI.craft(); break;
      case 'bed': UI.sleep(); break;
      case 'inscription': Dlg.play('inscription', { after: () => Q.check() }); break;
      case 'liontin': addItem('liontin', 1); toast('Liontin Tua ditemukan.', 4); break;
    }
  },
  openChest(e) {
    e.open = true; e.openT = 0; S.chests[e.c.id] = 1; Audio8.sfx('chest');
    const L = e.c.loot, parts = []; if (L.gold) { addGold(L.gold, true); parts.push(`${L.gold} Gold`); }
    for (const k in L.items) { addItem(k, L.items[k], true); parts.push(`${L.items[k]}× ${ITEMS[k].n}`); }
    if (e.c.secret) { S.stats.secrets++; toast(`Peti rahasia! (${S.stats.secrets}/3)`, 4); }
    toast('Peti: ' + (parts.join(', ') || 'kosong')); Q.check();
  },
  gather(e) {
    const K0 = NODE[e.n.kind]; S.nodes[e.n.id] = day(); Audio8.sfx('pickup');
    const n = rint(K0.n1, K0.n2); addItem(K0.item, n, true); toast(`+${n} ${ITEMS[K0.item].n}`);
    if (K0.bonus && Math.random() < K0.bonus[1]) { addItem(K0.bonus[0], 1, true); toast(`Bonus: ${ITEMS[K0.bonus[0]].n}!`); }
  },
  crystal(e) {
    if (F('gateOpen')) { toast('Kristal sudah menyala.'); return; }
    const order = ['R', 'B', 'K']; e.flash = .5; Audio8.sfx('crystal');
    if (this.puz.includes(e.c.id)) { toast('Kristal ini sudah menyala.'); return; }
    if (order[this.puz.length] === e.c.id) {
      this.puz.push(e.c.id); e.lit = true;
      if (this.puz.length === 3) { setF('gateOpen'); this.refreshBlocks(); Audio8.sfx('gate'); Dlg.play('crystal.done'); this.ents.forEach(x => { if (x.kind === 'crystal') x.lit = true; }); }
      else toast(`Kristal menyala (${this.puz.length}/3).`);
    } else {
      this.puz = []; this.ents.forEach(x => { if (x.kind === 'crystal') { x.lit = false; x.flash = .4; } }); Audio8.sfx('wrong'); toast('Urutan salah. Kristal padam. Baca prasasti di dekat pintu masuk.', 4);
    }
  },

  /* ---------------- pertarungan ---------------- */
  startEncounter(e) {
    this.busy = true; const f = e.f;
    const run = () => Battle.start({ form: e.d.form, enemies: f.en, lv: f.lv, boss: f.boss, bg: f.bg, bossId: f.boss ? (f.q === 'captain' ? 'captain' : null) : null, guest: null }, res => { this.busy = false; this.afterBattle(res, e); });
    if (f.q === 'captain') Dlg.play('captain.intro', { after: run }); else run();
  },
  afterBattle(res, e) {
    this.safe = 2.5; Input.clear();
    if (res === 'win') {
      S.dead[e.d.id] = S.clock; e.gone = true; const f = e.f; S.stats.kills[f.q || e.d.form] = (S.stats.kills[f.q || e.d.form] || 0) + 1;
      for (const k of f.en) S.stats.kills[k] = (S.stats.kills[k] || 0) + 1;
      if (f.q === 'camp') { setF('campCleared'); toast('Kamp orc dikuasai! Bebaskan Pak Darma.', 4); }
      if (f.q === 'captain') Dlg.play('captain.dead');
      if (f.q === 'raider' && !(F('janaStart'))) { /* hitung tetap */ }
      Q.check(); saveGame();
    } else if (res === 'flee') { e.stun = 5; const dx = e.x - this.player.x, dy = e.y - this.player.y, l = Math.hypot(dx, dy) || 1; e.x += dx / l * 24; e.y += dy / l * 24; }
    else if (res === 'lose') this.defeat();
  },
  defeat() {
    // kembali ke desa, pulih penuh, kehilangan sebagian emas
    const loss = Math.round(S.gold * .1); S.gold -= loss; for (const c of S.party) { const st = statsOf(c); S.chars[c].hp = st.maxhp; S.chars[c].mp = st.maxmp; }
    this.arenaOn = false; this.sealOn = false; this.busy = false; delete S.flags['trg_' + 'gua:arena']; delete S.flags['trg_' + 'benteng:boss'];
    this.fade.to = 1; this.fade.cb = () => { this.load('desa', 24, 20); this.fade.to = 0; toast(`Kalah. Kamu terbangun di desa (−${loss} Gold).`, 4); saveGame(); };
  },
  arena() {
    if (F('arenaClear')) return; this.arenaOn = true; this.refreshBlocks(); S.flags['trg_gua:arena'] = 1;
    this.busy = true;
    Dlg.play('arena.start', { after: () => {
      const waves = ['arena1', 'arena2', 'arena3'];
      const next = i => {
        if (i >= waves.length) { this.arenaOn = false; this.refreshBlocks(); this.busy = false; setF('arenaClear'); Dlg.play('arena.done'); saveGame(); return; }
        toast(`Arena: gelombang ${i + 1}/3`, 3);
        Battle.start({ form: waves[i], enemies: FORMS[waves[i]].en, lv: FORMS[waves[i]].lv, boss: false, bg: 'gua' }, res => {
          if (res !== 'win') { this.arenaOn = false; this.refreshBlocks(); this.busy = false; delete S.flags['trg_gua:arena']; if (res === 'lose') this.defeat(); else { this.player.y += 20; } return; }
          for (const c of S.party) { const st = statsOf(c), ch = S.chars[c]; ch.hp = Math.min(st.maxhp, ch.hp + Math.round(st.maxhp * .2)); ch.mp = Math.min(st.maxmp, ch.mp + 8); }
          next(i + 1);
        });
      };
      next(0);
    } });
  },
  bossGrumak() {
    if (F('grumakDone')) return; this.sealOn = true; this.refreshBlocks(); S.flags['trg_benteng:boss'] = 1; this.busy = true; Audio8.music('boss');
    Dlg.play('benteng.seal', { after: () => Cut.play('grumak', () => Dlg.play('grumak.intro', { after: () => {
      Battle.start({ form: 'boss_grumak', enemies: ['grumak'], lv: 10, boss: true, bossId: 'grumak', bg: 'benteng' }, res => {
        this.busy = false;
        if (res === 'win') { Dlg.play('grumak.dead'); }
        else if (res === 'peace') { /* sudah diurus di battle */ }
        else { this.sealOn = false; this.refreshBlocks(); delete S.flags['trg_benteng:boss']; if (res === 'lose') this.defeat(); this.musicFor(); }
      });
    } })) });
  },
  ambush() {
    this.busy = true;
    Dlg.play('budi.ambush', { after: () => {
      Battle.start({ form: 'ambush', enemies: FORMS.ambush.en, lv: FORMS.ambush.lv, boss: false, bg: 'hutan', guest: 'budi' }, res => {
        this.busy = false;
        if (res === 'win') { toast('Budi selamat! Lanjutkan ke gerbang barat.', 4); Q.check(); saveGame(); }
        else if (res === 'guestdead') { toast('Budi terluka! Coba lagi dari awal.', 4); setF('budiAmbushed', 0); S.flags.budiAmbushed = 0; this.player.x = 14 * TS + 8; this.player.y = 24 * TS + 8; this.hist = []; }
        else if (res === 'lose') { setF('budiAmbushed', 0); S.flags.budiAmbushed = 0; this.defeat(); }
        else { setF('budiAmbushed', 0); S.flags.budiAmbushed = 0; }
      });
    } });
  },
  addFollower(id) {
    if (!this.player || this.followers.some(f => f.id === id)) return; const p = this.player, f = { kind: 'follower', id, x: p.x - 10, y: p.y, hw: 4, hh: 4, face: 1, moving: false, t: 0, i: this.followers.length };
    this.followers.push(f); this.ents.push(f); this.removeNpc(id);
  },
  budiFollow() {
    const e = this.npcEnt('budi'); if (e) e.gone = true;
    const p = this.player, b = { kind: 'follower', id: 'budi', npc: 1, x: p.x - 10, y: p.y, hw: 4, hh: 4, face: 1, moving: false, t: 0, i: this.followers.length }; this.followers.push(b); this.ents.push(b);
  },

  /* ---------------- gambar ---------------- */
  draw() {
    const m = this.map, cam = this.cam, cx = Math.round(cam.x), cy = Math.round(cam.y);
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(-cx, -cy); ctx.drawImage(this.ground, 0, 0);
    // kilau air
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(m.w - 1, Math.floor((cx + VW) / TS)), y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(m.h - 1, Math.floor((cy + VH) / TS));
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m.grid[y][x] === T.WATER) { const ph = (G.t * 1.2 + x * .7 + y * 1.3) % 3; if (ph < 1) ctx.fillRect(x * TS + 3 + (ph * 8 | 0), y * TS + 6 + ((x * 3 + y) % 5), 4, 1); }
    // lahan
    const list = this.ents.filter(e => { if (e.kind === 'prop') return e.x > cx - 60 && e.x < cx + VW + 60 && e.y > cy - 20 && e.y < cy + VH + 90; return true; });
    list.sort((a, b) => (a.flat && !b.flat ? -1 : b.flat && !a.flat ? 1 : a.y - b.y));
    for (const e of list) {
      switch (e.kind) {
        case 'prop': drawSprTo(ctx, e.spr, e.x, e.flat ? e.y + 8 : e.y); break;
        case 'deco': this.drawDeco2(e); break;
        case 'sign': drawDeco({ d: { kind: 'sign', x: e.x, y: e.y } }); break;
        case 'npc': this.drawNpcEnt(e); break;
        case 'animal': drawAnimal(e); break;
        case 'chest': this.drawChest(e); break;
        case 'crystal': drawCrystal(e); break;
        case 'node': this.drawNode(e); break;
        case 'plot': this.drawPlot(e); break;
        case 'pick': this.drawPick(e); break;
        case 'enc': this.drawEnc(e); break;
        case 'follower': this.drawFollower(e); break;
        case 'player': this.drawPlayer(e); break;
        case 'cut': Cut.drawActor(e); break;
      }
    }
    // jeruji/blok
    for (const b of this.blocks) if (b.on && b.vis) { ctx.fillStyle = '#2a2a33'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.fillStyle = '#6b6b78'; for (let i = 2; i < b.w; i += 5) ctx.fillRect(b.x + i, b.y, 2, b.h); }
    // penanda misi di dunia
    this.drawQuestMarker();
    for (const f of this.floats) { const a = 1 - f.t / f.life; ctx.save(); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.globalAlpha = a; ctx.font = 'bold 14px "Courier New",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(f.txt, f.x + 1, f.y - f.t * 14 + 1); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y - f.t * 14); ctx.restore(); }
    ctx.restore();
    Amb.tick(G.dt || .016); Amb.drawBelow();
    this.drawLight(cx, cy);
    this.drawDayNight();
    Amb.drawAbove();
    if (this.fade.a > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade.a})`; ctx.fillRect(0, 0, VW, VH); }
  },
  drawDeco2(e) {
    const d = e.d;
    if (d.kind === 'bench') { const x = Math.round(d.x), y = Math.round(d.y); shadow(x, y - 2, 14); ctx.fillStyle = '#6b4424'; ctx.fillRect(x - 12, y - 12, 24, 10); ctx.fillStyle = '#8f5f36'; ctx.fillRect(x - 12, y - 12, 24, 3); ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - 11, y - 3, 3, 3); ctx.fillRect(x + 8, y - 3, 3, 3); ctx.fillStyle = '#b8b8c8'; ctx.fillRect(x - 6, y - 15, 5, 3); ctx.fillStyle = '#c9a24a'; ctx.fillRect(x + 3, y - 16, 3, 4); return; }
    drawDeco(e);
  },
  drawPlayer(p) {
    if (Cut.on && Cut.hideHero) return;
    shadow(p.x, p.y, 7);
    if (this.safe > 1.8 && Math.floor(p.t * 20) % 2) return;
    const A = ANIMS.soldier[p.moving ? 'walk' : 'idle'];
    drawChar('soldier', p.moving ? 'walk' : 'idle', frameOf(A, p.t, true), p.x, p.y, p.face, 1, null, false, null);
  },
  drawFollower(f) {
    if (Cut.on && Cut.hideHero) return;
    shadow(f.x, f.y, 6);
    if (f.id === 'darma') { const n = f.moving ? 'walk' : 'idle', A = ANIMS.hunter[n]; drawChar('hunter', n, frameOf(A, f.t, true), f.x, f.y, f.face, 1.12, null, false, null); }
    else if (f.id === 'jana') this.drawSpr(NPCSPR.joanna, f.x, f.y, f.face, f.t, 1);
    else if (f.id === 'nyx') this.drawSpr(f.moving ? NPCSPR.nyxW : NPCSPR.nyxI, f.x, f.y, f.face, f.t, 1);
    else if (f.id === 'budi') this.drawFarmer(f.x, f.y, f.face, f.t, f.moving, ['#7ac0ff', .35], .82);
  },
  drawSpr(N, x, y, face, t, sc) {
    const fr = Math.floor(t * N[2]) % N[1], s = N[7] * sc, bob = N[1] === 1 ? Math.round(Math.sin(t * 3) * .6) : 0;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face * s, s); ctx.drawImage(IMG[N[0]], fr * N[3], 0, N[3], N[4], -N[5], -N[6] + bob + 3, N[3], N[4]); ctx.restore();
  },
  drawFarmer(x, y, face, t, moving, tint, sc) {
    const A = ANIMS.farmer, a = moving ? A.walk : A.idle, f = Math.floor(t * a[2]) % a[1]; let img = IMG[a[0]]; if (tint && tint[1] > 0) img = tinted(a[0], tint[0], tint[1]);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(-face * sc, sc); ctx.drawImage(img, f * 32, (moving ? 2 : 0) * 32, 32, 32, -16, -27, 32, 32); ctx.restore();
  },
  drawNpcEnt(e) {
    ctx.save(); ctx.globalAlpha = clamp(e.alpha, 0, 1); shadow(e.x, e.y, 6 * (e.sc || 1));
    const N = NPCS[e.id];
    if (N.spr === 'hunter') { const n = e.moving ? 'walk' : 'idle', A = ANIMS.hunter[n]; drawChar('hunter', n, frameOf(A, e.t, true), e.x, e.y, e.face, 1.12, null, false, null); }
    else if (NPCSPR[N.spr]) this.drawSpr(NPCSPR[N.spr], e.x, e.y, e.face, e.t, e.sc || 1);
    else this.drawFarmer(e.x, e.y, e.face, e.t, e.moving, N.tint, e.sc || 1);
    ctx.restore();
    // nama + penanda quest
    const P = this.player;
    if (dist(P, e) < 52 && G.mode === 'world') { ctx.save(); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.translate(-Math.round(this.cam.x), -Math.round(this.cam.y)); ctx.font = 'bold 11px "Courier New",monospace'; ctx.textAlign = 'center'; const w = ctx.measureText(e.name).width + 6; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - 42), w, 12); ctx.fillStyle = '#ffe9a8'; ctx.fillText(e.name, Math.round(e.x), Math.round(e.y - 32)); if (e.act) { ctx.font = '9px "Courier New",monospace'; ctx.fillStyle = '#c8d8ff'; ctx.fillText('(' + e.act + ')', Math.round(e.x), Math.round(e.y - 22)); } ctx.restore(); }
    if (this.npcHasQuest(e.id)) { const b = Math.sin(G.t * 5) * 1.5; ctx.fillStyle = '#ffd84a'; ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 48 + b), 3, 6); ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 40 + b), 3, 2); }
  },
  npcHasQuest(id) { const t = TALK_HINT[id]; return t ? !!t() : false; },
  drawChest(e) {
    if (e.c.needFlag && !F(e.c.needFlag)) return; shadow(e.x, e.y, 8); const th = this.map.theme;
    if (th === 'cave' || th === 'fort') { const r = e.openT < 0 ? DUN.chestFull[0] : e.openT < .12 ? DUN.chestFull[1] : e.openT < .3 ? DUN.chestFull[2] : DUN.chestEmpty[2]; ctx.drawImage(IMG.dungeon, r[0], r[1], 16, 16, Math.round(e.x - 8), Math.round(e.y - 15), 16, 16); }
    else drawSprTo(ctx, e.open ? 'chestOpen' : 'chestClosed', e.x, e.y + 1);
    if (!e.open && e.c.needFlag) { ctx.fillStyle = `rgba(255,230,120,${.3 + Math.sin(G.t * 4) * .15})`; ctx.beginPath(); ctx.arc(e.x, e.y - 8, 12, 0, 6.3); ctx.fill(); }
  },
  drawNode(e) {
    if (!this.nodeAvail(e.n)) return; const x = Math.round(e.x), y = Math.round(e.y), k = e.n.kind, bob = Math.sin(G.t * 3 + x) * .6;
    shadow(x, y, 5, 2, .18);
    switch (k) {
      case 'herba': ctx.fillStyle = '#2f8f3a'; ctx.fillRect(x - 4, y - 5, 2, 5); ctx.fillRect(x - 1, y - 7, 2, 7); ctx.fillRect(x + 2, y - 4, 2, 4); ctx.fillStyle = '#6bd66b'; ctx.fillRect(x - 3, y - 6, 1, 3); ctx.fillRect(x, y - 8, 1, 3); ctx.fillRect(x + 3, y - 5, 1, 2); break;
      case 'bunga': ctx.fillStyle = '#2f8f3a'; ctx.fillRect(x, y - 6, 1, 6); ctx.fillStyle = '#ff9ac8'; ctx.fillRect(x - 2, y - 9, 5, 3); ctx.fillRect(x - 1, y - 10, 3, 5); ctx.fillStyle = '#ffe25a'; ctx.fillRect(x, y - 8, 1, 1); break;
      case 'kayu': ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 6, y - 4, 12, 4); ctx.fillStyle = '#8f5f36'; ctx.fillRect(x - 6, y - 4, 12, 1); ctx.fillStyle = '#c9a070'; ctx.fillRect(x + 5, y - 3, 1, 2); break;
      case 'bijih': ctx.fillStyle = '#5a5a66'; ctx.fillRect(x - 5, y - 6, 10, 6); ctx.fillStyle = '#8a8a99'; ctx.fillRect(x - 4, y - 7, 6, 2); ctx.fillStyle = '#e0b060'; ctx.fillRect(x - 2, y - 4, 2, 2); ctx.fillRect(x + 2, y - 3, 1, 1); break;
      case 'kristal': ctx.fillStyle = 'rgba(120,220,255,.25)'; ctx.beginPath(); ctx.arc(x, y - 5, 8, 0, 6.3); ctx.fill(); ctx.fillStyle = '#5ad0ff'; ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x, y); ctx.lineTo(x - 4, y - 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c8f0ff'; ctx.fillRect(x - 1, y - 9, 1, 3); break;
      case 'bulan': ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(120,160,255,.35)'; ctx.beginPath(); ctx.arc(x, y - 6 + bob, 10, 0, 6.3); ctx.fill(); ctx.restore(); ctx.fillStyle = '#2f6f8f'; ctx.fillRect(x, y - 6, 1, 6); ctx.fillStyle = '#9cc8ff'; ctx.fillRect(x - 3, y - 9 + bob, 7, 3); ctx.fillRect(x - 1, y - 11 + bob, 3, 7); ctx.fillStyle = '#fff'; ctx.fillRect(x, y - 8 + bob, 1, 1); break;
    }
  },
  drawPlot(e) {
    const i = e.i, open = i < FARM.openCount(), x = Math.round(e.x), y = Math.round(e.y); if (!F('farmOpen')) return;
    ctx.fillStyle = open ? '#4e3017' : '#3a2a20'; ctx.fillRect(x - 7, y - 10, 14, 10); ctx.fillStyle = open ? '#6b4426' : '#4a3a2e'; ctx.fillRect(x - 6, y - 9, 12, 8);
    if (!open) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 6, y - 9, 12, 8); return; }
    const p = S.farm.plots[i]; if (!p.crop) return; const pr = FARM.prog(i);
    if (pr >= 1) drawSprTo(ctx, CROPS[p.crop].spr, x, y);
    else if (pr > .5) { ctx.fillStyle = '#3fa04a'; ctx.fillRect(x - 1, y - 8, 2, 6); ctx.fillRect(x - 4, y - 7, 3, 2); ctx.fillRect(x + 1, y - 7, 3, 2); }
    else { ctx.fillStyle = '#6bd66b'; ctx.fillRect(x - 1, y - 6, 2, 3); }
    if (pr >= 1) { ctx.fillStyle = `rgba(255,230,120,${.45 + Math.sin(G.t * 5) * .2})`; ctx.fillRect(x - 1, y - 14, 3, 3); }
  },
  drawPick(e) {
    const x = Math.round(e.x), y = Math.round(e.y), bob = Math.sin(e.t * 4) * 2; shadow(x, y, 4, 1.4);
    if (e.type === 'key') { ctx.fillStyle = 'rgba(255,230,120,.25)'; ctx.beginPath(); ctx.arc(x, y - 10 + bob, 11, 0, 6.3); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 3, y - 18 + bob, 6, 6); ctx.fillStyle = '#7a5a00'; ctx.fillRect(x - 1, y - 16 + bob, 2, 2); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 1, y - 12 + bob, 2, 8); ctx.fillRect(x, y - 6 + bob, 4, 2); }
    else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(80,255,140,.3)'; ctx.beginPath(); ctx.arc(x, y - 12 + bob, 16 + Math.sin(e.t * 5) * 2, 0, 6.3); ctx.fill(); ctx.restore(); ctx.fillStyle = '#2bd66b'; ctx.beginPath(); ctx.moveTo(x, y - 24 + bob); ctx.lineTo(x + 8, y - 14 + bob); ctx.lineTo(x, y - 3 + bob); ctx.lineTo(x - 8, y - 14 + bob); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b8ffd0'; ctx.beginPath(); ctx.moveTo(x, y - 24 + bob); ctx.lineTo(x + 3, y - 15 + bob); ctx.lineTo(x - 3, y - 14 + bob); ctx.lineTo(x - 8, y - 14 + bob); ctx.closePath(); ctx.fill(); }
  },
  drawEnc(e) {
    const E0 = e.E0, sc = e.f.boss ? 1.3 : (e.f.once ? 1.05 : .85); shadow(e.x, e.y, 6 * sc * (E0.sc || 1) * .8);
    if (E0.skin) { const K0 = SKD[E0.skin], A = e.moving ? K0.run : K0.idle, f = Math.floor(e.t * A[2]) % A[1], fw = A[3], fh = A[4]; ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.scale(e.face * .75 * sc, .75 * sc); ctx.drawImage(IMG[A[0]], f * fw, 0, fw, fh, -fw / 2, -fh + 3, fw, fh); ctx.restore(); }
    else { const n = e.moving ? 'walk' : 'idle', A = ANIMS[E0.sheet][n]; drawChar(E0.sheet, n, frameOf(A, e.t, true), e.x, e.y, e.face, (E0.sc || 1) * sc * .8, E0.tint, false, e.stun > 0 ? .7 : null); }
    // ikon ancaman
    if (e.f.boss || e.f.once) { const b = Math.sin(G.t * 4) * 1; ctx.fillStyle = '#ff5050'; ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 38 + b), 3, 5); ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 31 + b), 3, 2); }
    else if (e.st === 'chase') { ctx.fillStyle = '#ff5050'; ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 28), 2, 4); ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 23), 2, 2); }
  },
  drawQuestMarker() {
    const nav = Q.nav(); if (!nav || !nav.here) return; const b = Math.sin(G.t * 4) * 2;
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(nav.x, nav.y - 24 + b); ctx.lineTo(nav.x - 5, nav.y - 31 + b); ctx.lineTo(nav.x + 5, nav.y - 31 + b); ctx.closePath(); ctx.fill();
  },
  drawLight(cx, cy) {
    const m = this.map; if (!m.dark) return;
    if (!this.lc) { this.lc = document.createElement('canvas'); this.lc.width = VW; this.lc.height = VH; }
    const l = this.lc.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, VW, VH); l.fillStyle = `rgba(6,4,18,${m.dark})`; l.fillRect(0, 0, VW, VH); l.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, a = 1) => { const gr = l.createRadialGradient(x - cx, y - cy, r * .1, x - cx, y - cy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = gr; l.fillRect(x - cx - r, y - cy - r, r * 2, r * 2); };
    const P = this.player; light(P.x, P.y - 10, 92 + Math.sin(G.t * 6) * 2);
    for (const e of this.ents) {
      if (e.kind === 'deco' && (e.d.kind === 'torch' || e.d.kind === 'campfire')) light(e.d.x, e.d.y - 16, 72 + Math.sin(G.t * 9 + e.d.x) * 5, .95);
      if (e.kind === 'deco' && e.d.kind === 'portal') light(e.d.x, e.d.y, 80);
      if (e.kind === 'crystal') light(e.x, e.y - 14, e.lit ? 62 : 26, e.lit ? .9 : .5);
      if (e.kind === 'pick') light(e.x, e.y - 10, 50);
    }
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.drawImage(this.lc, 0, 0);
  },
  drawDayNight() {
    const m = this.map; if (m.kind === 'indoor' || m.dark) return; const h = hour(); let a = 0, col = '10,12,60';
    if (h >= 19 || h < 5) a = .5; else if (h >= 17) { a = (h - 17) / 2 * .5; col = h < 18.3 ? '90,40,30' : '30,20,70'; } else if (h < 7) { a = (7 - h) / 2 * .5; col = '60,40,70'; }
    if (m.theme === 'grass' && a > 0) { ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, VW, VH); }
  },
};
/* tanda "!" di atas NPC */
const TALK_HINT = {
  wira: () => !F('metWira') || (has('permata') && !F('gameEnd')) || (F('wiraStory') === undefined && FR.lv('wira') >= 3),
  joko: () => !F('ayamStart') || (S.stats.chickens >= 3 && !F('ayamDone')),
  sari: () => (F('metWira') && !F('obatStart')) || (F('obatStart') && has('obat_nenek') && false) || (F('resepSari') && has('kue_sari') && !F('resepDone')) || (cond('sold>=5 && bizTotal>=1') && F('pasarStart') && !F('pasarDone')),
  lastri: () => has('obat_nenek') && !F('obatDone') || (FR.lv('lastri') >= 2 && !F('legendHeard')),
  jana: () => !F('janaStart') || (cond('kills.raider>=3') && !F('janaDone')),
  darma: () => false, budi: () => false, rudi: () => false, nyx: () => false,
};
const NODE = {
  herba:  { n: 'Herba', item: 'herba', n1: 1, n2: 2 }, bunga: { n: 'Bunga Liar', item: 'bunga', n1: 1, n2: 1 }, kayu: { n: 'Kayu', item: 'kayu', n1: 1, n2: 2 },
  bijih:  { n: 'Bijih Besi', item: 'bijih', n1: 1, n2: 2, bonus: ['kristal', .12] }, kristal: { n: 'Kristal', item: 'kristal', n1: 1, n2: 1 }, bulan: { n: 'Bunga Bulan', item: 'bulan', n1: 1, n2: 1 },
};
