/* =========================================================================
   battle.js  —  pertempuran BERBASIS GILIRAN
   Giliran berdasar SPD · Shield & Break · kelemahan/resistensi · kritikal · status
   Skill · Ultimate · Combo (gauge Sinkron) · Item · Guard · Kabur · AI musuh pintar · bos berfase
   ========================================================================= */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const elChip = el => (el && el !== 'none' && EL[el]) ? `<i class="el" style="background:${EL[el].c}">${EL[el].i}</i>` : '';

/* fase bos: hp = batas rasio HP untuk masuk fase; pool = pilihan skill [skill, bobot] */
const BOSS_AI = {
  captain: { phases: [
    { hp: 1, pool: [['e_atk', 3], ['e_smash', 3], ['e_sweep', 2], ['e_roar', 1], ['e_mark', 2]] },
    { hp: .5, scene: 'captain.p2', enrage: 1, pool: [['e_smash', 3], ['e_sweep', 2], ['e_mark', 2], ['e_quake', 3], ['e_roar', 1]] } ] },
  grumak: { phases: [
    { hp: 1, pool: [['e_atk', 3], ['e_smash', 3], ['e_sweep', 2], ['e_mark', 2]] },
    { hp: .66, scene: 'grumak.p2', choice: 'grumak.p2choice', pool: [['e_smash', 3], ['e_sweep', 2], ['e_mark', 2], ['e_quake', 3], ['e_roar', 1]] },
    { hp: .33, enrage: 1, msg: 'Grumak mengamuk!', pool: [['e_smash', 3], ['e_sweep', 2], ['e_fury', 3], ['e_quake', 2], ['e_summon', 1]] } ] },
};
const FXMAP = { slash: 'smear1', pierce: 'smear2', none: 'smear3', fire: 'explosion', thunder: 'strike', holy: 'holyHit', dark: 'skullHit', ice: 'wspike' };
const FXSC = { explosion: .6, strike: .8, wspike: .8, o_slash_w: .9, imp_b: .9, simp3: .6, xp1: .7, lb1: .9, burst: .45, xp2: .7, smkskull: .6, wsplash: .8 };
const FXEXTRA = { slash: ['o_slash_w'], pierce: ['imp_b'], none: ['simp3'], fire: ['xp1'], thunder: ['lb1'], holy: ['burst'], dark: ['xp2', 'smkskull'], ice: ['wsplash'] };
const COMBO_K = { c_ad: 'phys', c_aj: 'mag', c_dj: 'phys', c_an: 'mag', c_dn: 'phys', c_jn: 'mag' };
const SPRITE_SC = 1.45;

/* ---------- item: efek dipakai di dalam & luar battle ---------- */
const Items = {
  usable(id) { const it = ITEMS[id]; return !!it && (it.t === 'use' || it.t === 'gift') && !!(it.heal || it.mp || it.cure || it.revive || it.maxhp); },
  list() { return Object.keys(S.inv).filter(k => this.usable(k)); },
  /* terapkan ke objek {hp,maxhp,mp,maxmp,dead?,status?}; kembalikan teks atau null bila tak berguna */
  apply(id, t, setBonus) {
    const it = ITEMS[id], dead = t.hp <= 0;
    if (it.revive) { if (!dead) return null; t.hp = Math.max(1, Math.round(t.maxhp * it.revive)); return `${t.name} bangkit!`; }
    if (dead) return null;
    if (it.maxhp) { t.maxhp += it.maxhp; t.hp += it.maxhp; if (setBonus) setBonus(it.maxhp); return `HP maks ${t.name} +${it.maxhp}!`; }
    let did = '';
    if (it.heal && t.hp < t.maxhp) { const n = Math.min(it.heal, t.maxhp - t.hp); t.hp += n; did += `+${n} HP `; }
    if (it.mp && t.mp < t.maxmp) { const n = Math.min(it.mp, t.maxmp - t.mp); t.mp += n; did += `+${n} MP `; }
    if (it.cure && t.status && (t.status.poison || t.status.burn)) { delete t.status.poison; delete t.status.burn; did += 'bersih '; }
    return did ? `${t.name}: ${did.trim()}` : null;
  },
};

const Battle = {
  on: false, cfg: null, cb: null, U: [], P: [], E: [], guest: null, sync: 0, round: 0, cur: null, fx: [], pops: [], tw: [], shake: 0, snap: null,
  pending: null, hover: null, tmsg: '', tmsgT: 0, banner: null, hist: { els: [], focus: [], heals: 0, tgt: [] }, lastSkill: {}, over: false, summons: 0, mode: 'main', pickFn: null, t: 0, rect: null, queue: [], busy: false,
  spd() { return (S.settings.speed || 1); },
  wait(ms) { return wait(ms / this.spd()); },

  /* ---------------- mulai ---------------- */
  start(cfg, cb) {
    const F0 = FORMS[cfg.form] || {};
    cfg.noflee = !!(cfg.boss || F0.wave || F0.once || cfg.guest || F0.guest);
    this.cfg = cfg; this.cb = cb; this.on = true; this.over = false; this.auto = !!S.settings.auto; this.syncTools(); if (cfg.boss) saveGame();   // checkpoint sebelum bos
    this.snap = { inv: JSON.stringify(S.inv), ch: JSON.stringify(S.chars), gold: S.gold };
    this.setup(); G.mode = 'battle'; Input.clear(); S.stats.battles++;
    $('bt').classList.remove('hide'); $('btRes').classList.add('hide'); Audio8.music(cfg.boss ? 'boss' : 'battle'); Audio8.sfx('warn');
    this.run();
  },
  setup() {
    const cfg = this.cfg; this.U = []; this.P = []; this.E = []; this.guest = null; this.sync = 0; this.round = 0; this.fx = []; this.pops = []; this.tw = []; this.summons = 0;
    this.hist = { els: [], focus: [], heals: 0, tgt: [] }; this.lastSkill = {}; this.cur = null; this.mode = 'main';
    for (const id of S.party) {
      const ch = S.chars[id], st = statsOf(id), C = CHARS[id];
      const u = { id, side: 'p', name: C.n, st, hp: Math.max(1, Math.min(ch.hp, st.maxhp)), maxhp: st.maxhp, mp: Math.min(ch.mp, st.maxmp), maxmp: st.maxmp, sh: 0, maxsh: 0, broken: 0, status: {}, ult: ch.ult || 0, dead: false, spr: C.spr, face: 1, ox: 0, oy: 0, anim: 'idle', at: Math.random() * 3, flash: 0, alpha: 1 };
      this.P.push(u); this.U.push(u);
    }
    if (cfg.guest === 'budi') {
      const g = { id: 'budi', side: 'p', guest: 1, name: 'Budi', st: { atk: 1, def: 3, mat: 1, mdf: 3, spd: 5, crt: 0 }, hp: 90, maxhp: 90, mp: 0, maxmp: 0, sh: 0, maxsh: 0, broken: 0, status: {}, ult: 0, dead: false, spr: 'budi', face: 1, ox: 0, oy: 0, anim: 'idle', at: 0, flash: 0, alpha: 1 };
      this.guest = g; this.P.push(g); this.U.push(g);
    }
    for (const eid of cfg.enemies) this.addEnemy(eid, true);
    this.layout();
  },
  addEnemy(eid, init) {
    const E = ENEMIES[eid], sc = lvScale(this.cfg.lv || 1), B = BOSS_AI[this.cfg.bossId];
    const df = dif(), st = { atk: Math.round(E.atk * sc * df.atk), def: Math.round(E.def * sc), mat: Math.round(E.mat * sc * df.atk), mdf: Math.round(E.mdf * sc), spd: E.spd, crt: E.crt };
    const hp = Math.max(1, Math.round(E.hp * sc * df.hp)), n = this.E.filter(e => e.eid === eid).length;
    const u = { id: eid + this.E.length + (init ? '' : 's'), eid, E, side: 'e', name: E.n + (this.cfg.enemies.filter(x => x === eid).length > 1 || n ? ' ' + String.fromCharCode(65 + n) : ''), st, hp, maxhp: hp, mp: 99, maxmp: 99, sh: Math.max(1, E.sh + df.sh), maxsh: Math.max(1, E.sh + df.sh), broken: 0, status: {}, dead: false, face: -1, ox: 0, oy: 0, anim: 'idle', at: Math.random() * 3, flash: 0, alpha: 1, charge: null, phase: 0, pool: B && E.boss ? B.phases[0].pool : E.ai, stolen: 0, summoned: !init, barked: false, boss: !!E.boss };
    this.E.push(u); this.U.push(u); return u;
  },
  layout() {
    const P = this.P.filter(u => !u.guest), n = P.length, ys = n === 1 ? [140] : n === 2 ? [126, 152] : n === 3 ? [112, 135, 158] : [100, 123, 146, 169];
    P.forEach((u, i) => { u.x = 112 + (n === 1 ? 20 : (i % 2 ? -14 : 12)) + (this.guest ? 0 : 0); u.y = ys[i]; });
    if (this.guest) { this.guest.x = 62; this.guest.y = 150; }
    const E = this.E.filter(u => !u.dead), m = E.length;
    const slots = m <= 1 ? [[350, 142]] : m === 2 ? [[330, 128], [362, 156]] : m === 3 ? [[320, 112], [356, 136], [320, 160]] : m === 4 ? [[300, 112], [350, 126], [310, 150], [360, 160]] : [[296, 108], [346, 118], [306, 138], [356, 146], [320, 162]];
    E.forEach((u, i) => { u.x = slots[i][0]; u.y = slots[i][1]; u.hx = u.x; u.hy = u.y; });
  },
  alive(side) { return this.U.filter(u => u.side === side && !u.dead); },
  allies(u) { return this.U.filter(x => x.side === u.side); },

  /* ---------------- alur utama ---------------- */
  async run() {
    const cfg = this.cfg; this.renderParty(); this.renderOrder();
    this.setBanner(cfg.boss ? ENEMIES[cfg.enemies.find(e => ENEMIES[e].boss) || cfg.enemies[0]].n : 'PERTEMPURAN!');
    const first = this.E[0]; if (first && first.E.bark) { VOICE.play(VOICE.barkId(first.eid)); }
    await this.wait(900);
    while (true) {
      this.round++;
      const order = this.U.filter(u => !u.dead && !u.guest).map(u => ({ u, k: u.st.spd * (1 + Math.random() * .12) })).sort((a, b) => b.k - a.k).map(x => x.u);
      this.queue = order.slice();
      for (let i = 0; i < order.length; i++) {
        const u = order[i]; this.queue = order.slice(i + 1);
        if (u.dead) continue; if (this.verdict()) break;
        this.cur = u; this.renderOrder(); this.renderParty();
        await this.turn(u);
        if (this.over) return;
        await this.checkPhase(); if (this.over) return;
        if (this.verdict()) break;
      }
      const v = this.verdict(); if (v) { await this.finish(v); return; }
    }
  },
  verdict() {
    if (this.over) return null;
    if (this.guest && this.guest.dead) return 'guestdead';
    if (!this.alive('e').length) return 'win';
    if (!this.P.some(u => !u.guest && !u.dead)) return 'lose';
    return null;
  },
  async turn(u) {
    // awal giliran: DoT / regen / status
    if (u.status.poison || u.status.burn) {
      for (const k of ['poison', 'burn']) if (u.status[k]) { const d = Math.max(2, Math.round(u.maxhp * (k === 'poison' ? .05 : .07))); u.hp = Math.max(u.side === 'p' ? 1 : 0, u.hp - d); this.pop(u, d, STATUS[k].c); this.fxAt(k === 'poison' ? 'stpoison' : 'fire4', u, k === 'poison' ? .6 : .45); Audio8.sfx('hurt'); }
      this.renderParty(); await this.wait(420); if (u.hp <= 0) { await this.kill(u); return; }
    }
    if (u.status.regen) { const h = Math.round(u.maxhp * .08); u.hp = Math.min(u.maxhp, u.hp + h); this.pop(u, '+' + h, '#6bff8a'); await this.wait(300); }
    const stunned = !!u.status.stun; delete u.status.stun;
    for (const k in u.status) { if (u.status[k] === 99) continue; u.status[k]--; if (u.status[k] <= 0) delete u.status[k]; }
    if (u.status.adapt === undefined) u.adaptEl = null;
    this.renderParty();
    if (u.broken > 0) { u.broken = 0; u.sh = u.maxsh; this.say(`${u.name} terjatuh karena Break...`); u.anim = 'hurt'; u.at = 0; await this.wait(750); u.anim = 'idle'; this.say(`${u.name} pulih. Shield kembali.`); await this.wait(350); return; }
    if (stunned) { this.say(`${u.name} pingsan dan kehilangan giliran.`); u.anim = 'hurt'; u.at = 0; await this.wait(750); u.anim = 'idle'; return; }
    if (u.guest) { this.say('Budi meringkuk ketakutan...'); await this.wait(500); return; }
    if (u.side === 'p') await this.playerTurn(u); else await this.enemyTurn(u);
  },

  /* ---------------- giliran pemain ---------------- */
  async playerTurn(u) {
    while (true) {
      const cmd = await this.ask(u); if (this.over) return;
      if (cmd.type === 'flee') {
        const pS = this.P.filter(x => !x.dead && !x.guest).reduce((a, x) => a + x.st.spd, 0) / Math.max(1, this.P.filter(x => !x.dead && !x.guest).length), eS = this.alive('e').reduce((a, x) => a + x.st.spd, 0) / Math.max(1, this.alive('e').length);
        const ch = clamp(.55 + (pS - eS) * .03 + dif().flee, .25, .95);
        this.say('Mencoba kabur...'); await this.wait(500);
        if (Math.random() < ch) { this.say('Berhasil kabur!'); await this.wait(500); await this.finish('flee'); return; }
        this.say('Gagal kabur!'); await this.wait(500); return;
      }
      this.clearCmd();
      if (cmd.type === 'guard') { u.status.defUp = 1; u.mp = Math.min(u.maxmp, u.mp + 6); u.ult = Math.min(100, u.ult + 10); this.sync = Math.min(100, this.sync + 6); this.say(`${u.name} bertahan.`); this.pop(u, 'Guard', '#6ab0ff'); Audio8.sfx('select'); this.hist.heals++; await this.wait(650); this.renderParty(); return; }
      if (cmd.type === 'skill') { this.hist.heals = cmd.sk.k === 'heal' ? this.hist.heals + 1 : 0; await this.perform(u, cmd.sk, cmd.tg); return; }
      if (cmd.type === 'combo') { await this.performCombo(cmd.c, cmd.tg); return; }
      if (cmd.type === 'item') {
        const t = cmd.tg[0], it = ITEMS[cmd.id]; this.say(`${u.name} memakai ${it.n}.`);
        const msg = Items.apply(cmd.id, t, b => { const ch = S.chars[t.id]; ch.bonusHp = (ch.bonusHp || 0) + b; });
        if (!msg) { this.say('Tidak ada efek.'); await this.wait(400); continue; }
        takeItem(cmd.id, 1); if (t.hp > 0) t.dead = false; if (it.revive) { t.anim = 'idle'; t.alpha = 1; }
        Audio8.sfx('heal'); this.fxAt('holyHit', t); this.pop(t, msg.split(': ')[1] || '+', '#6bff8a'); this.renderParty(); await this.wait(700); return;
      }
    }
  },
  /* tunggu perintah lengkap dari UI */
  ask(u) {
    this.mode = 'main'; this.syncTools();
    return new Promise(res => { this.pending = res; this.curCmd = u; if (this.auto) { this.clearCmd(); this.autoPick(u); } else this.menuMain(u); });
  },
  /* ---- Auto Battle: heal bila ada yang sekarat, lalu skill terbaik, combo bila siap, kalau tidak serang ---- */
  async autoPick(u) {
    await this.wait(380);
    if (!this.pending || this.over) return;
    if (!this.auto) { this.menuMain(u); return; }
    this.done(this.autoCmd(u));
  },
  autoCmd(u) {
    const ch = S.chars[u.id], live = this.alive('e'), basic = SK[CHARS[u.id].basic];
    const hurt = this.P.filter(p => !p.dead && p.hp / p.maxhp < .45).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
    const sks = ch.sk.map(id => SK[id]).filter(s => s && s !== basic);
    if (hurt) {
      const hs = sks.find(s => s.k === 'heal' && u.mp >= (s.mp || 0) && (s.tgt === 'one' || s.tgt === 'allies' || s.tgt === 'self'));
      if (hs) return { type: 'skill', sk: hs, tg: hs.tgt === 'allies' ? this.P.filter(p => !p.dead) : hs.tgt === 'self' ? [u] : [hurt] };
      if (hurt.hp / hurt.maxhp < .35 && S.inv.potion > 0 && ITEMS.potion) return { type: 'item', id: 'potion', tg: [hurt] };
    }
    const combos = this.combosFor(u);
    if (this.sync >= 50 && combos.length) { const c = combos[0]; return { type: 'combo', c, tg: c.tgt === 'all' ? live : [live[0]] }; }
    const dmg = sks.filter(s => (s.k === 'phys' || s.k === 'mag') && (!s.ult || u.ult >= 100) && u.mp >= (s.mp || 0));
    let best = null, bt = null;
    for (const s of dmg) {   // utamakan kelemahan musuh
      for (const e of live) { const w = e.E && s.el && e.E.weak.includes(s.el) ? 2 : 1, sc = (s.pow || 1) * w * (s.tgt === 'all' ? live.length * .7 : 1) * (e.broken ? 1.3 : 1); if (!best || sc > best.sc) { best = { s, sc }; bt = e; } }
    }
    if (best && (best.sc > 1.1 || u.mp > u.maxmp * .5)) return { type: 'skill', sk: best.s, tg: best.s.tgt === 'all' ? live : [bt] };
    const tgt = live.slice().sort((a, b) => (b.broken ? 1 : 0) - (a.broken ? 1 : 0) || a.hp - b.hp)[0];
    return { type: 'skill', sk: basic, tg: [tgt] };
  },
  setAuto(on) { this.auto = !!on; S.settings.auto = this.auto ? 1 : 0; this.syncTools(); if (this.auto && this.pending && this.mode === 'main' && this.curCmd) { this.clearCmd(); this.autoPick(this.curCmd); } else if (!this.auto && this.pending && this.curCmd && this.mode === 'main') this.menuMain(this.curCmd); },
  canQuick() {
    if (!this.on || this.over || this.cfg.boss || this.cfg.noflee) return false;
    const live = this.alive('e'); if (!live.length) return false;
    const pl = this.P.filter(p => !p.guest).map(p => (S.chars[p.id] || {}).lv || 1), avg = pl.reduce((a, b) => a + b, 0) / Math.max(1, pl.length);
    return avg >= (this.cfg.lv || 1) + 1;
  },
  quickWin() {
    if (!this.canQuick()) return;
    for (const e of this.alive('e')) { e.hp = 0; e.dead = true; e.alpha = 0; this.fxAt('smk5', e, .9); }
    Audio8.sfx('ekill'); this.say('Menang Cepat!'); this.pop(this.P[0], 'Menang Cepat!', '#ffe08a', true);
    this.syncTools(); if (this.pending) this.done({ type: 'guard' });
  },
  syncTools() {
    const a = $('btAuto'), s = $('btSpd'), q = $('btQuick'); if (!a) return;
    a.textContent = 'Auto: ' + (this.auto ? 'NYALA' : 'MATI'); a.classList.toggle('on', !!this.auto);
    const sp = S.settings.speed || 1; s.textContent = 'Cepat ×' + sp; s.classList.toggle('on', sp > 1);
    q.classList.toggle('hide', !this.canQuick());
  },
  done(cmd) { const r = this.pending; this.pending = null; this.hover = null; if (r) r(cmd); },
  clearCmd() { $('btCmd').innerHTML = ''; this.hover = null; },

  /* ---------------- menu perintah (DOM) ---------------- */
  btn(label, sub, fn, o = {}) {
    const b = document.createElement('button'); b.className = 'btn' + (o.cls ? ' ' + o.cls : ''); b.type = 'button';
    b.innerHTML = `<span class="l">${label}</span>${sub ? `<span class="s">${sub}</span>` : ''}`; if (o.dis) b.disabled = true;
    b.onclick = () => { Audio8.sfx('select'); fn(); }; if (o.focus) b.onfocus = o.focus; if (o.hover) { b.onmouseenter = o.hover; b.onmouseleave = () => { this.hover = null; }; }
    return b;
  },
  setCmd(title, nodes, back, cls = '') {
    const c = $('btCmd'); c.innerHTML = ''; c.className = cls;
    const h = document.createElement('div'); h.className = 'ctitle'; h.innerHTML = title; c.appendChild(h);
    const l = document.createElement('div'); l.className = 'clist'; nodes.forEach(n => l.appendChild(n)); c.appendChild(l);
    if (back) { const b = this.btn('◀ Kembali', '', back, { cls: 'back' }); c.appendChild(b); this.backFn = back; } else this.backFn = null;
    const f = c.querySelector('.btn:not([disabled])'); if (f && !IS_TOUCH) f.focus({ preventScroll: true });
  },
  menuMain(u) {
    this.mode = 'main'; this.hover = null;
    const ch = S.chars[u.id], combos = this.combosFor(u), canCombo = combos.some(c => this.sync >= 50);
    const n = [
      this.btn('Serang', 'MP 0', () => this.pickTarget(u, SK[CHARS[u.id].basic], tg => this.done({ type: 'skill', sk: SK[CHARS[u.id].basic], tg }), () => this.menuMain(u))),
      this.btn('Skill', `${ch.sk.length - 1} skill`, () => this.menuSkills(u)),
      this.btn('Combo', this.sync >= 50 ? 'SIAP' : `Sinkron ${Math.floor(this.sync)}%`, () => this.menuCombos(u), { dis: !combos.length || this.sync < 50 }),
      this.btn('Item', Items.list().length + ' jenis', () => this.menuItems(u), { dis: !Items.list().length }),
      this.btn('Guard', '+MP', () => this.done({ type: 'guard' })),
      this.btn('Kabur', this.cfg.noflee ? 'tak bisa' : '', () => this.done({ type: 'flee' }), { dis: this.cfg.noflee }),
    ];
    this.setCmd(`<b>${esc(u.name)}</b> — pilih perintah`, n, null, 'grid3');
  },
  menuSkills(u) {
    const ch = S.chars[u.id], n = [];
    for (const id of ch.sk) {
      const sk = SK[id]; if (id === CHARS[u.id].basic) continue;
      const lack = u.mp < sk.mp, noUlt = sk.ult && u.ult < 100;
      n.push(this.btn(`${elChip(sk.el)}${esc(sk.n)}${sk.ult ? ' <b class="ult">ULT</b>' : ''}`, sk.ult ? (u.ult >= 100 ? 'SIAP' : `Gauge ${Math.floor(u.ult)}%`) : `MP ${sk.mp} · ${sk.d}`, () => {
        this.pickTarget(u, sk, tg => { u.mp -= 0; this.done({ type: 'skill', sk, tg }); }, () => this.menuSkills(u));
      }, { dis: lack || noUlt, focus: () => this.say(sk.d) }));
    }
    if (!n.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Belum ada skill. Buka di Menu > Skill (BP).'; n.push(e); }
    this.setCmd(`<b>Skill</b> · MP ${u.mp}/${u.maxmp}`, n, () => this.menuMain(u), 'col');
  },
  combosFor(u) { return COMBOS.filter(c => c.pair.includes(u.id) && c.pair.every(id => this.P.some(p => p.id === id && !p.dead))); },
  menuCombos(u) {
    const n = this.combosFor(u).map(c => this.btn(esc(c.n), `${c.pair.map(i => CHARS[i].n).join(' + ')} · ${c.d}`, () => {
      this.pickTarget(u, { tgt: c.tgt }, tg => this.done({ type: 'combo', c, tg }), () => this.menuCombos(u));
    }, { dis: this.sync < 50 }));
    this.setCmd(`<b>Combo</b> · Sinkron ${Math.floor(this.sync)}% (butuh 50%)`, n, () => this.menuMain(u), 'col');
  },
  menuItems(u) {
    const n = Items.list().map(id => this.btn(`${esc(ITEMS[id].n)} ×${S.inv[id]}`, ITEMS[id].d || '', () => {
      const rev = !!ITEMS[id].revive;
      this.pickTarget(u, { tgt: rev ? 'dead' : 'ally' }, tg => this.done({ type: 'item', id, tg }), () => this.menuItems(u));
    }));
    this.setCmd('<b>Item</b>', n, () => this.menuMain(u), 'col');
  },
  /* pilih target sesuai tipe skill; 'one' → musuh, 'ally' → sekutu, 'dead' → sekutu KO, lainnya otomatis */
  pickTarget(u, sk, ok, back) {
    const t = sk.tgt;
    if (t === 'all') return ok(this.alive('e'));
    if (t === 'allies') return ok(this.P.filter(x => !x.dead));
    if (t === 'self') return ok([u]);
    let list = t === 'one' ? this.alive('e') : t === 'dead' ? this.P.filter(x => x.dead && !x.guest) : this.P.filter(x => !x.dead);
    if (!list.length) { this.say('Tidak ada target.'); return back(); }
    this.mode = 'target'; this.tlist = list; this.pickFn = x => { this.hover = null; ok([x]); };
    const n = list.map(x => this.btn(esc(x.name), x.side === 'e' ? this.enemyInfo(x) : `HP ${x.hp}/${x.maxhp}`, () => this.pickFn(x), { focus: () => { this.hover = x; }, hover: () => { this.hover = x; } }));
    this.setCmd(`<b>Pilih target</b> ${t === 'one' ? '(atau ketuk musuh)' : ''}`, n, () => { this.hover = null; this.mode = 'main'; back(); }, 'col');
    this.hover = list[0];
  },
  enemyInfo(x) { const k = S.bestiary[x.eid] || { weak: [], res: [] }; return `HP ${Math.ceil(x.hp / x.maxhp * 100)}% · Shield ${x.sh}${x.broken ? ' (BREAK)' : ''}`; },
  /* ketuk kanvas untuk memilih musuh */
  canvasTap(cx, cy) {
    if (this.mode !== 'target' || !this.pickFn || !this.tlist) return;
    let best = null, bd = 36; for (const u of this.tlist) { const d = Math.hypot(u.x + u.ox - cx, u.y - 22 - cy); if (d < bd) { bd = d; best = u; } }
    if (best) { Audio8.sfx('select'); this.pickFn(best); }
  },
  back() { if (this.backFn && this.pending) { Audio8.sfx('back'); this.backFn(); } },

  /* ---------------- kartu party & urutan ---------------- */
  renderParty() {
    const c = $('btParty'); if (!c) return; let h = `<div class="sync"><span>SINKRON</span><div class="bar"><i style="width:${this.sync}%"></i></div></div><div class="cards">`;
    for (const u of this.P) {
      if (u.guest) { h += `<div class="card guest${u.dead ? ' ko' : ''}"><b>${esc(u.name)}</b><div class="bar hp"><i style="width:${u.hp / u.maxhp * 100}%"></i></div><small>HP ${u.hp}/${u.maxhp}</small></div>`; continue; }
      const stc = Object.keys(u.status).map(k => `<em style="background:${STATUS[k].c}">${STATUS[k].n}</em>`).join('');
      h += `<div class="card${u === this.cur ? ' act' : ''}${u.dead ? ' ko' : ''}"><b>${esc(u.name)}</b><div class="bar hp"><i style="width:${u.hp / u.maxhp * 100}%"></i></div><small>HP ${u.hp}/${u.maxhp}</small><div class="bar mp"><i style="width:${u.maxmp ? u.mp / u.maxmp * 100 : 0}%"></i></div><small>MP ${u.mp}</small><div class="bar ult${u.ult >= 100 ? ' full' : ''}"><i style="width:${u.ult}%"></i></div><div class="sts">${stc}</div></div>`;
    }
    c.innerHTML = h + '</div>';
  },
  renderOrder() {
    const c = $('btOrder'); if (!c) return; const list = [];
    if (this.cur && !this.cur.dead) list.push(this.cur);
    this.queue.forEach(u => !u.dead && list.push(u));
    const nxt = this.U.filter(u => !u.dead && !u.guest).sort((a, b) => b.st.spd - a.st.spd); nxt.forEach(u => list.push(u));
    c.innerHTML = list.slice(0, 9).map((u, i) => `<span class="oc ${u.side}${i === 0 ? ' cur' : ''}" title="${esc(u.name)}">${esc(this.tag(u))}</span>`).join('');
  },
  tag(u) { if (u.side === 'p') return u.name[0] + (u.name.includes(' ') ? u.name.split(' ')[1][0] : ''); const m = u.name.match(/ ([A-E])$/); return u.E.n[0] + (u.E.n.includes(' ') ? u.E.n.split(' ')[1][0] : '') + (m ? m[1] : ''); },
  say(t) { this.tmsg = t; this.tmsgT = 2.4; const m = $('btMsg'); m.textContent = t; m.classList.add('show'); clearTimeout(this._mt); this._mt = setTimeout(() => m.classList.remove('show'), 2400 / this.spd()); },
  setBanner(t) { this.banner = { t, a: 0, life: 1.4 }; },

  /* ---------------- tween / animasi / efek ---------------- */
  tweenTo(o, k, to, ms) { return new Promise(res => { ms /= this.spd(); this.tw.push({ o, k, from: o[k], to, ms, t: 0, res }); }); },
  play(u, a) { u.anim = a; u.at = 0; },
  animTime(u, a) { const kind = this.animKind(u), A = kind && kind[a]; return A ? (A[1] / A[2]) * 1000 : 300; },
  animKind(u) { if (u.side === 'p') return u.spr === 'knight' ? ANIMS.soldier : u.spr === 'hunter' ? ANIMS.hunter : null; return u.E.skin ? SKD[u.E.skin] : ANIMS[u.E.sheet]; },
  atkName(u) { if (u.side === 'p') return u.spr === 'knight' ? (this._a = !this._a) ? 'atk1' : 'atk2' : 'atk'; if (u.E.skin) return 'run'; return (this._a = !this._a) ? 'atk1' : 'atk2'; },
  fxAt(name, u, sc = 1) { this.fx.push({ n: name, x: u.x + u.ox, y: u.y - 14, t: 0, sc }); },
  pop(u, txt, col = '#fff', big) { this.pops.push({ x: u.x + u.ox + rnd(-6, 6), y: u.y - 40, txt: String(txt), col, t: 0, big: !!big }); },
  speak(u, txt) { this.pops.push({ x: u.x, y: u.y - 58, txt, col: '#fff', t: 0, say: 1, life: 1.4 }); },

  /* ---------------- perhitungan ---------------- */
  calc(a, t, sk, mult = 1) {
    const mag = sk.k === 'mag'; let A = mag ? a.st.mat : a.st.atk, D = mag ? t.st.mdf : t.st.def, m = mult;
    if (a.status.atkUp) m *= 1.3; if (a.status.weak) m *= .75; if (a.status.enrage) m *= 1.25; if (t.status.defUp) m *= .7;
    let dmg = A * (sk.pow || 1) * 1.6 * (100 / (100 + D * 2.2)) * m * rnd(.93, 1.07);
    const el = sk.el || 'none'; let weak = false, res = false;
    if (el !== 'none' && t.E) { if (t.E.weak.includes(el)) { weak = true; dmg *= 1.3; } else if (t.E.res.includes(el)) { res = true; dmg *= .6; } }
    if (el !== 'none' && t.status.adapt && t.adaptEl === el) { dmg *= .5; res = true; }
    if (t.broken > 0) dmg *= 1.4;
    const crit = sk.crit || Math.random() < a.st.crt / 100 + (a.status.crtUp ? .4 : 0); if (crit) dmg *= 1.5;
    return { dmg: t.status.inv ? 0 : Math.max(1, Math.round(dmg)), crit: !!crit, weak, res };
  },
  learn(t, el, weak, res) {
    if (!t.E || el === 'none') return; const b = S.bestiary[t.eid] || (S.bestiary[t.eid] = { weak: [], res: [] });
    if (weak && !b.weak.includes(el)) { b.weak.push(el); toast(`Kelemahan ${t.E.n}: ${EL[el].n}`); } if (res && !b.res.includes(el)) b.res.push(el);
  },
  applyStatus(t, st, chance = 1) {
    if (!st || t.dead) return false; let c = st.c === undefined ? 1 : st.c; if (t.boss && st.s === 'stun') c *= .3;
    if (t.status.inv && STATUS[st.s].bad) return false; if (Math.random() > c) return false;
    t.status[st.s] = Math.max(t.status[st.s] || 0, st.t); this.pop(t, STATUS[st.s].n, STATUS[st.s].c); return true;
  },
  /* satu serangan ke satu target */
  async strike(a, t, sk, mult = 1) {
    if (t.dead) return null; const r = this.calc(a, t, sk, mult); const el = sk.el || 'none';
    { const fn = FXMAP[el] || 'smear1'; this.fxAt(fn, t, FXSC[fn] || 1); for (const x of FXEXTRA[el] || []) this.fxAt(x, t, FXSC[x] || 1); }
    if (t.status.inv) { this.pop(t, 'Kebal', '#fff'); Audio8.sfx('select'); return r; }
    t.hp = Math.max(0, t.hp - r.dmg); t.flash = .16; this.pop(t, r.dmg, r.crit ? '#ffe14a' : r.weak ? '#ff9a4a' : '#fff', r.crit || r.weak);
    if (r.weak) { this.pop(t, 'LEMAH!', '#ff9a4a'); this.sync = Math.min(100, this.sync + 8); }
    if (r.res) this.pop(t, 'Tahan', '#9aa'); if (r.crit) this.pop(t, 'KRITIS!', '#ffe14a');
    Audio8.sfx(r.crit ? 'crit' : (el === 'none' || el === 'slash' || el === 'pierce' ? 'hit' : 'magic')); if (a.side === 'p' && !a.guest) { a.ult = Math.min(100, a.ult + (sk.ult ? 0 : 7)); this.hist.focus.push(t.id); if (el !== 'none') this.hist.els.push(el); }
    if (t.side === 'p') { if (!t.guest) t.ult = Math.min(100, t.ult + 9); this.shake = .25; buzz(25); }
    if (a.side === 'p') this.learn(t, el, r.weak, r.res);
    // shield & Break
    if (t.sh > 0 && !t.broken) {
      const sd = (r.weak ? 1 : 0) + (sk.brk || 0);
      if (sd > 0) { t.sh = Math.max(0, t.sh - sd); if (t.sh === 0) { t.broken = 1; t.charge = null; this.pop(t, 'BREAK!', '#ff5050', true); this.fxAt('impact', t, 1.1); this.fxAt('o_shard', t, 1); this.say(`${t.name} terkena BREAK!`); Audio8.sfx('brk'); this.shake = .4; this.sync = Math.min(100, this.sync + 10); } }
    }
    if (t.hp > 0 && t.anim !== 'death') { t.anim = 'hurt'; t.at = 0; setTimeout(() => { if (!t.dead && t.anim === 'hurt') t.anim = 'idle'; }, 380 / this.spd()); }
    if (a.drain && r.dmg) { a.hp = Math.min(a.maxhp, a.hp + Math.round(r.dmg * a.drain)); }
    if (t.hp <= 0) await this.kill(t); else if (sk.st && sk.st.s && !sk.st.ally) this.applyStatus(t, sk.st);
    this.renderParty(); return r;
  },
  async kill(t) {
    if (t.dead) return; t.dead = true; t.status = {}; t.charge = null; t.hp = 0; t.anim = 'death'; t.at = 0; Audio8.sfx(t.side === 'p' ? 'die' : 'ekill'); this.fxAt(t.boss ? 'smkskull' : (t.side === 'p' ? 'smk3' : 'smk5'), t, t.boss ? 1.6 : .9);
    if (t.side === 'e') { this.layoutSoon = true; setTimeout(() => this.layout(), 700 / this.spd()); }
    if (t.side === 'p' && !t.guest) { this.say(`${t.name} tumbang!`); }
    this.renderParty(); this.renderOrder(); await this.wait(520);
  },

  /* ---------------- eksekusi skill ---------------- */
  async perform(u, sk, tg) {
    if (u.side === 'p') { u.mp = Math.max(0, u.mp - (sk.mp || 0)); if (sk.ult) { u.ult = 0; Audio8.sfx('ult'); this.setBanner(sk.n); this.shake = .3; this.fxAt('boom', u, .8); this.fxAt('simp6', u, .7); this.fxAt('o_rune', u, 1.2); } this.sync = Math.min(100, this.sync + 7); this.lastSkill[u.id] = sk; if (!u.guest && (sk.ult || Math.random() < .3)) { const sh = SHOUTS[u.id]; if (sh) { const i = rint(0, sh.length - 1); this.speak(u, sh[i]); VOICE.play(`${SPK[u.id].cat}_${u.id}_battle_${String(i + 1).padStart(2, '0')}`); } } }
    this.say(`${u.name}: ${sk.n}`); this.renderParty(); await this.wait(sk.ult ? 700 : 350);
    const k = sk.k;
    if (k === 'phys' || k === 'mag') {
      tg = tg.filter(t => !t.dead); if (!tg.length) tg = this.alive(u.side === 'p' ? 'e' : 'p').slice(0, 1); if (!tg.length) return;
      const melee = k === 'phys' && u.id !== 'darma' && tg.length === 1; const a = this.atkName(u);
      if (melee) await this.tweenTo(u, 'ox', (tg[0].x - u.x) - u.face * 30, 170);
      this.play(u, NPCSPR[u.spr] ? 'idle' : a); if (u.side === 'p') Audio8.sfx(u.id === 'darma' ? 'bow' : 'slash'); else Audio8.sfx('slash');
      await this.wait(240);
      const hits = sk.hits || 1;
      for (let i = 0; i < hits; i++) {
        for (const t of tg) { if (!t.dead) await this.strike(u, t, sk, sk.ult ? 1 : 1); }
        if (i < hits - 1) { await this.wait(200); this.play(u, this.atkName(u)); }
        if (tg.every(t => t.dead)) break;
      }
      if (sk.steal) { const g = Math.min(S.gold, rint(6, 16)); if (g > 0) { S.gold -= g; u.stolen = (u.stolen || 0) + g; this.pop(tg[0], `-${g}G`, '#ffd84a'); } }
      await this.wait(220); if (melee) await this.tweenTo(u, 'ox', 0, 150); u.anim = 'idle';
    } else if (k === 'heal') {
      for (const t of tg) { if (t.dead) continue; const h = Math.round(((sk.pow || 1) * (u.st.mat * (u.side === 'p' ? 2 : 2.2)) + 8)); const n = Math.min(h, t.maxhp - t.hp); t.hp += n; this.pop(t, '+' + n, '#6bff8a'); this.fxAt('heal', t, .55); this.fxAt('o_leaf', t, .8); }
      Audio8.sfx('heal'); this.renderParty(); await this.wait(700);
    } else if (k === 'rev') {
      for (const t of tg) { if (!t.dead) continue; t.dead = false; t.hp = Math.max(1, Math.round(t.maxhp * (sk.pow || .4))); t.anim = 'idle'; t.alpha = 1; t.status = {}; this.pop(t, 'Bangkit!', '#6bff8a', true); this.fxAt('burst', t, .6); }
      Audio8.sfx('heal'); this.renderParty(); await this.wait(800);
    } else if (k === 'buff') {
      if (sk.adapt) { const el = this.hist.els[this.hist.els.length - 1] || null; if (el) { u.adaptEl = el; u.status.adapt = 3; this.pop(u, `Tahan ${EL[el].n}`, '#c0a0ff'); } else { u.status.defUp = 2; } }
      else if (sk.summon) { if (this.summons < 2 && this.E.filter(e => !e.dead).length < 5) { this.summons++; const n = this.addEnemy('orc', false); n.alpha = 0; this.layout(); this.tweenTo(n, 'alpha', 1, 400); this.pop(n, 'Datang!', '#ff9a4a', true); Audio8.sfx('roar'); this.renderOrder(); } else { u.status.atkUp = 2; } }
      else { for (const t of tg) { if (t.dead) continue; if (sk.st) { t.status[sk.st.s] = Math.max(t.status[sk.st.s] || 0, sk.st.t); this.pop(t, STATUS[sk.st.s].n, STATUS[sk.st.s].c); } if (sk.heal) { const h = Math.round(t.maxhp * sk.heal); t.hp = Math.min(t.maxhp, t.hp + h); this.pop(t, '+' + h, '#6bff8a'); } this.fxAt(sk.st ? ({ atkUp: 'atkup', defUp: 'defup', haste: 'haste', poison: 'poison', burn: 'poison', crtUp: 'haste', regen: 'heal' }[sk.st.s] || 'atkup') : (sk.heal ? 'heal' : 'defup'), t, .55); } }
      Audio8.sfx(u.side === 'e' ? 'roar' : 'heal'); this.renderParty(); await this.wait(650);
    }
    // status dari skill ke musuh/sekutu setelah serangan ditangani di strike(); buff ke sekutu:
    this.renderParty();
  },
  async performCombo(c, tg) {
    const ua = this.P.find(p => p.id === c.pair[0]), ub = this.P.find(p => p.id === c.pair[1]); this.sync = Math.max(0, this.sync - 50);
    this.setBanner(c.n); this.say(`COMBO! ${c.n}`); Audio8.sfx('combo'); Audio8.sfx('ult'); this.renderParty(); await this.wait(800);
    const k = COMBO_K[c.id], sk0 = { k, pow: c.pow, brk: c.brk, tgt: c.tgt };
    tg = tg.filter(t => !t.dead);
    for (let i = 0; i < (c.hits || 1); i++) {
      const att = i % 2 ? ub : ua, sk = { ...sk0, el: c.els[i % c.els.length] };
      this.play(att, NPCSPR[att.spr] ? 'idle' : this.atkName(att)); await this.wait(200);
      for (const t of tg) { if (!t.dead) await this.strike(att, t, sk); }
      await this.wait(180); att.anim = 'idle'; tg = tg.filter(t => !t.dead); if (!tg.length) break;
    }
    if (c.st) { if (c.st.ally) { for (const p of this.P.filter(x => !x.dead)) { p.status[c.st.s] = c.st.t; this.pop(p, STATUS[c.st.s].n, STATUS[c.st.s].c); } } else for (const t of tg) this.applyStatus(t, c.st); }
    ua.ult = Math.min(100, ua.ult + 12); ub.ult = Math.min(100, ub.ult + 12); this.renderParty(); await this.wait(400);
  },

  /* ---------------- AI musuh ---------------- */
  async enemyTurn(u) {
    if (!u.barked && u.E.bark && !u.boss && Math.random() < .5) { u.barked = true; this.speak(u, u.E.bark); VOICE.play(VOICE.barkId(u.eid)); }
    // serangan terpusat (charge)
    if (u.charge) {
      u.charge.left--;
      if (u.charge.left > 0) { this.say(`${u.name} masih menghimpun tenaga...`); Audio8.sfx('warn'); await this.wait(650); return; }
      const sk = { ...ES[u.charge.id], id: u.charge.id }; let tgt = u.charge.tgt; u.charge = null;
      let tg = sk.tgt === 'one' ? [(tgt && !tgt.dead) ? tgt : this.pickTargetAI(u)] : this.targetsAI(u, sk);
      u.markT = null; await this.perform(u, sk, tg); this.afterEnemy(u, sk); return;
    }
    const sk = this.chooseSkill(u);
    if (sk.chg) {
      const tgt = sk.tgt === 'one' ? this.pickTargetAI(u, true) : null; u.charge = { id: sk.id, left: sk.chg, tgt }; this.say(sk.tele || `${u.name} bersiap!`); this.pop(u, '!', '#ff5050', true); this.fxAt('o_rune', u, 1.3); this.fxAt('charge', u, .7); this.fxAt('alert', { x: u.x, y: u.y - 34, ox: u.ox }, .5); Audio8.sfx('roar'); if (tgt) this.pop(tgt, 'Dibidik!', '#ff5050');
      this.renderOrder(); await this.wait(1100); return;
    }
    await this.perform(u, sk, this.targetsAI(u, sk)); this.afterEnemy(u, sk);
  },
  afterEnemy(u, sk) { this.lastSkill[u.id] = sk; },
  chooseSkill(u) {
    const pool = (u.pool || u.E.ai || []).map(([id, w]) => ({ id, w, sk: { ...ES[id], id } })); if (!pool.length) return { ...ES.e_atk, id: 'e_atk' };
    const hurt = this.allies(u).filter(x => !x.dead && x.hp / x.maxhp < .45), lastEl = this.hist.els.slice(-2), focus = this.hist.focus.slice(-3);
    const lowP = this.P.filter(p => !p.dead && p.hp / p.maxhp < .35), last = this.lastSkill[u.id];
    for (const o of pool) {
      const s = o.sk;
      if (s.k === 'heal' && !hurt.length) o.w = 0; else if (s.k === 'heal') o.w *= 4;
      if (s.k === 'buff' && s.st && u.status[s.st.s]) o.w *= .1;
      if (s.adapt) { if (this.hist.els.length >= 2 && lastEl[0] === lastEl[1] && lastEl[0] !== 'none') o.w *= 5; else o.w *= .3; }
      if (s.summon && (this.summons >= 2 || u.hp / u.maxhp > .5)) o.w = 0;
      if (s.id === 'e_guard' && focus.length === 3 && focus.every(f => f === focus[0]) && focus[0] === u.id) o.w *= 4;
      if (s.tgt === 'one' && lowP.length && s.k !== 'buff') o.w *= 1.6;
      if (s.k === 'buff' && s.tgt === 'allies' && u.boss && u.hp / u.maxhp < .35) o.w *= 2;
      if (this.hist.heals >= 2 && (s.st && s.st.s === 'poison')) o.w *= 2;
      if (last && last.id === o.id && (s.pow || 0) >= 1.7) o.w *= .3;
      if (s.chg && last && last.chg) o.w *= .2;   // adil: jangan beruntun serangan terpusat
      if (s.tgt === 'all' && this.alive('p').length < 2) o.w *= .5;
    }
    const tot = pool.reduce((a, o) => a + o.w, 0); if (tot <= 0) return { ...ES.e_atk, id: 'e_atk' };
    let r = Math.random() * tot; for (const o of pool) { r -= o.w; if (r <= 0) return o.sk; } return pool[0].sk;
  },
  pickTargetAI(u, mark) {
    const live = this.P.filter(p => !p.dead); const taunt = live.find(p => p.status.taunt); if (taunt) return taunt;
    const recent = this.hist.tgt.slice(-2);
    const w = live.map(p => {
      let x = 1 + (1 - p.hp / p.maxhp) * 1.6; if (p.guest) x *= 1.1; if (p.id === 'jana' && this.hist.heals >= 2) x *= 1.8; if (p.st.mdf < 8 && p.maxmp) x *= 1.15; if (recent.length === 2 && recent[0] === p.id && recent[1] === p.id) x *= .25; if (mark) x *= 1 + (p.hp / p.maxhp < .5 ? .6 : 0);
      return x;
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0); let pick = live[0]; for (let i = 0; i < live.length; i++) { r -= w[i]; if (r <= 0) { pick = live[i]; break; } }
    this.hist.tgt.push(pick.id); if (this.hist.tgt.length > 6) this.hist.tgt.shift(); return pick;
  },
  targetsAI(u, sk) {
    switch (sk.tgt) {
      case 'one': return [this.pickTargetAI(u)];
      case 'all': return this.P.filter(p => !p.dead);
      case 'allies': return this.alive('e');
      case 'ally': return [this.alive('e').sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0]];
      default: return [u];
    }
  },

  /* ---------------- fase bos ---------------- */
  async checkPhase() {
    const cfg = this.cfg; if (!cfg.bossId) return; const A = BOSS_AI[cfg.bossId]; if (!A) return;
    const b = this.E.find(e => e.eid === cfg.bossId && !e.dead); if (!b) return;
    while (b.phase + 1 < A.phases.length && b.hp / b.maxhp <= A.phases[b.phase + 1].hp) {
      b.phase++; const ph = A.phases[b.phase]; b.pool = ph.pool; b.charge = null;
      this.shake = .5; this.fxAt('boom2', b, .8); this.fxAt('o_pillar', b, 1.2); Audio8.sfx('roar'); this.setBanner(`FASE ${b.phase + 1}`); await this.wait(900);
      if (ph.scene) await this.scene(ph.scene);
      if (ph.choice) { await this.scene(ph.choice); if (F('grumakSpared')) { await this.finish('peace'); return; } }
      if (ph.enrage) { b.status.enrage = 99; this.pop(b, 'AMUK!', '#ff4040', true); }
      if (ph.msg) this.say(ph.msg);
      this.renderParty(); await this.wait(500);
    }
  },
  scene(id) { return new Promise(r => { $('bt').classList.add('under'); Dlg.play(id, { after: () => { $('bt').classList.remove('under'); G.mode = 'battle'; r(); } }); }); },

  /* ---------------- akhir pertempuran ---------------- */
  writeBack() {
    for (const u of this.P) { if (u.guest) continue; const ch = S.chars[u.id]; ch.hp = u.hp; ch.mp = u.mp; ch.ult = u.ult; }
  },
  async finish(res) {
    if (this.over) return; this.over = true; this.pending = null; this.clearCmd(); this.writeBack();
    if (res === 'win') return this.victory();
    if (res === 'flee') { await this.wait(300); return this.close('flee'); }
    if (res === 'peace') { for (const u of this.P) { if (u.guest) continue; if (u.hp <= 0) S.chars[u.id].hp = 1; } return this.close('peace'); }
    if (res === 'guestdead') { this.restoreSnap(); return this.resPanel('Budi terluka!', '<p>Budi terkena serangan. Kamu harus melindunginya.</p>', [['Coba lagi', () => this.close('guestdead')]]); }
    // kalah
    Audio8.music('malam'); this.restoreSnap();
    this.resPanel('KALAH', '<p>Seluruh party tumbang.</p>', [['Coba lagi', () => this.retry()], ['Kembali ke desa', () => this.close('lose')]]);
  },
  restoreSnap() { S.inv = JSON.parse(this.snap.inv); S.chars = JSON.parse(this.snap.ch); S.gold = this.snap.gold; },
  retry() { this.over = false; this.restoreSnap(); $('btRes').classList.add('hide'); this.setup(); Audio8.music(this.cfg.boss ? 'boss' : 'battle'); this.run(); },
  victory() {
    Audio8.music(null); Audio8.sfx('win');
    const lv = this.cfg.lv || 1; let exp = 0, gold = 0; const drops = {};
    for (const e of this.E) { if (e.summoned) continue; exp += Math.round(e.E.exp * (1 + (lv - 1) * .08)); gold += rint(e.E.gold[0], e.E.gold[1]) + (e.stolen || 0); for (const [it, p, n] of e.E.drop) if (Math.random() < p) drops[it] = (drops[it] || 0) + n; }
    const stolen = this.E.reduce((a, e) => a + (e.stolen || 0), 0); if (stolen) S.gold += stolen;
    let rows = '', ups = [];
    for (const u of this.P) { if (u.guest) continue; const ch = S.chars[u.id]; if (u.hp <= 0) ch.hp = Math.max(1, Math.round(u.maxhp * .25)); const got = u.dead ? Math.round(exp * .5) : exp; const l = gainExp(u.id, got); if (l.length) { ups.push(`${u.name} naik ke Lv ${l[l.length - 1]}!`); } rows += `<div class="rrow"><b>${esc(u.name)}</b><span>+${got} EXP</span><span>Lv ${ch.lv}</span></div>`; }
    { const rc = dif().rec; if (rc) for (const u of this.P) { if (u.guest) continue; const ch = S.chars[u.id], st = statsOf(u.id); ch.hp = Math.min(st.maxhp, ch.hp + Math.round(st.maxhp * rc)); ch.mp = Math.min(st.maxmp, ch.mp + Math.round(st.maxmp * rc)); } }
    S.gold += gold - stolen; S.bp += 1; for (const k in drops) addItem(k, drops[k], true);
    const dl = Object.keys(drops).map(k => `${drops[k]}× ${ITEMS[k].n}`).join(', ') || '—';
    if (ups.length) { Audio8.sfx('levelup'); for (const p of this.P) if (!p.guest) { this.fxAt('o_pillar', p, 1); this.fxAt('sp2', p, .8); } }
    const html = `${rows}<div class="rrow"><b>Gold</b><span>+${gold}</span><span></span></div><div class="rrow"><b>Item</b><span>${dl}</span><span></span></div><div class="rrow"><b>BP</b><span>+1 (kini ${S.bp})</span><span></span></div>${ups.map(x => `<p class="up">${esc(x)}</p>`).join('')}${ups.length ? '<p class="up">Buka Menu > Skill untuk membuka kemampuan baru dengan BP.</p>' : ''}`;
    this.resPanel('MENANG!', html, [['Lanjut', () => this.close('win')]]);
  },
  resPanel(title, html, btns) {
    const r = $('btRes'); r.classList.remove('hide'); r.innerHTML = `<div class="rbox"><h2>${title}</h2><div class="rbody">${html}</div><div class="rbtn"></div></div>`;
    const bb = r.querySelector('.rbtn'); btns.forEach(([t, f]) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = t; b.onclick = () => { Audio8.sfx('select'); f(); }; bb.appendChild(b); });
    const f = bb.querySelector('.btn'); if (f) f.focus({ preventScroll: true });
  },
  close(res) {
    $('bt').classList.add('hide'); $('btRes').classList.add('hide'); this.on = false; this.over = true; VOICE.stop(); G.mode = 'world'; Input.clear(); W.musicFor(); saveGame();
    const cb = this.cb; this.cb = null; if (cb) cb(res);
  },

  /* ---------------- update & gambar ---------------- */
  update(dt) {
    this.t += dt; const sp = this.spd();
    for (const u of this.U) { u.at += dt * sp; if (u.flash > 0) u.flash -= dt; if (u.dead && u.side === 'e' && u.alpha > 0 && u.at > .9) u.alpha = Math.max(0, u.alpha - dt * 2.5); }
    for (const t of this.tw) { t.t += dt * 1000; const k = Math.min(1, t.t / t.ms); t.o[t.k] = t.from + (t.to - t.from) * (1 - Math.pow(1 - k, 2)); if (k >= 1) { t.done = 1; t.res(); } }
    this.tw = this.tw.filter(t => !t.done);
    for (const f of this.fx) f.t += dt * sp; this.fx = this.fx.filter(f => { const d = FXD[f.n]; return f.t * d[4] < d[3]; });
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < (p.life || 1.1));
    if (this.shake > 0) this.shake -= dt; if (this.banner) { this.banner.a += dt; if (this.banner.a > this.banner.life) this.banner = null; }
  },
  bgDraw() {
    const th = this.cfg.bg || (W.map ? W.map.theme : 'grass'), n = isNight();
    const key = th === 'camp' ? 'camp' : (th === 'gua' || th === 'cave') ? 'cave' : (th === 'benteng' || th === 'fort') ? 'fort' : (n ? 'grass_n' : 'grass_d');
    const sky = key === 'camp' ? 7 : key === 'grass_n' ? 3 : key === 'grass_d' ? (th === 'hutan' ? 5 : 1) : 0;
    ctx.fillStyle = '#10121e'; ctx.fillRect(0, 0, VW, VH);
    if (sky) {
      for (let k = 1; k <= 6; k++) {
        const im = IMG['bg_sky' + sky + '_' + k]; if (!im) break;
        const sw = k === 1 ? 0 : Math.sin(G.t * (.12 + k * .05) + k * 1.7) * (5 + k * 5);
        ctx.drawImage(im, Math.round(-48 + sw), -20);
      }
    }
    const m = IMG['bg_' + key + '_mid'], g = IMG['bg_' + key + '_gnd'];
    if (m) ctx.drawImage(m, 0, 0); if (g) ctx.drawImage(g, 0, 112);
    if (key === 'fort' || key === 'cave') {   // kerlip obor / kristal
      const f = .06 + .03 * Math.sin(G.t * 9) + .02 * Math.sin(G.t * 23); ctx.fillStyle = key === 'fort' ? `rgba(255,150,50,${f})` : `rgba(90,200,255,${f * .6})`; ctx.fillRect(0, 0, VW, 112);
    }
  },
  drawUnit(u) {
    const x = u.x + u.ox, y = u.y + u.oy, sc = u.side === 'e' ? (u.E.sc || 1) * (u.E.skin ? 1.9 : 1.55) : SPRITE_SC;
    if (u.alpha <= 0) return; shadow(x, y, 9 * (u.side === 'e' ? (u.E.sc || 1) * .8 : 1));
    ctx.save(); const a = (u.dead && u.side === 'p') ? .55 : u.alpha; ctx.globalAlpha = clamp(a, 0, 1);
    const fl = u.flash > 0, an = u.anim, t = u.at;
    if (u.side === 'p') {
      if (u.spr === 'knight') { const A = ANIMS.soldier[an] || ANIMS.soldier.idle; drawChar('soldier', ANIMS.soldier[an] ? an : 'idle', frameOf(A, t, an === 'idle'), x, y, 1, SPRITE_SC * (96 / 96), null, fl, null); }
      else if (u.spr === 'hunter') { const A = ANIMS.hunter[an] || ANIMS.hunter.idle; drawChar('hunter', ANIMS.hunter[an] ? an : 'idle', frameOf(A, t, an === 'idle'), x, y, 1, 1.8, null, fl, null); }
      else if (NPCSPR[u.spr]) { const N = NPCSPR[u.spr], f = Math.floor(t * N[2]) % N[1], s = N[7] * 1.5, sh = an === 'hurt' ? Math.sin(t * 60) * 2 : 0; ctx.translate(Math.round(x + sh), Math.round(y)); if (u.dead) ctx.rotate(-1.4); ctx.scale(s, s); ctx.drawImage(fl ? tinted(N[0], '#ffffff', .85) : IMG[N[0]], f * N[3], 0, N[3], N[4], -N[5], -N[6] + 3, N[3], N[4]); }
      else if (u.spr === 'budi') { W.drawFarmer(x, y, 1, t, false, ['#7ac0ff', .35], 1.1); }
    } else {
      const E = u.E;
      if (E.skin) { const K0 = SKD[E.skin], A = (an === 'death' ? K0.death : an === 'run' ? K0.run : K0.idle), f = an === 'death' ? Math.min(A[1] - 1, Math.floor(t * A[2])) : Math.floor(t * A[2]) % A[1], fw = A[3], fh = A[4]; ctx.translate(Math.round(x), Math.round(y)); ctx.scale(-sc * .6, sc * .6); ctx.drawImage(fl ? tinted(A[0], '#ffffff', .85) : IMG[A[0]], f * fw, 0, fw, fh, -fw / 2, -fh + 3, fw, fh); }
      else { const sh = ANIMS[E.sheet], nm = sh[an] ? an : 'idle', A = sh[nm]; drawChar(E.sheet, nm, frameOf(A, t, nm === 'idle'), x, y, -1, sc, E.tint, fl, null); }
    }
    ctx.restore();
  },
  drawHud(u) {
    const x = Math.round(u.x), y = Math.round(u.y), top = y - Math.round(36 * (u.E ? (u.E.sc || 1) * (u.E.skin ? 1.1 : 1.35) : 1.6));
    if (u.side === 'e') {
      const w = u.boss ? 54 : 34; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, 6); ctx.fillStyle = '#3a1010'; ctx.fillRect(x - w / 2, top, w, 4); ctx.fillStyle = u.hp / u.maxhp > .3 ? '#d04a4a' : '#ff8a3a'; ctx.fillRect(x - w / 2, top, Math.round(w * u.hp / u.maxhp), 4);
      ctx.font = 'bold 8px "Courier New",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(u.name, x + 1, top - 3); ctx.fillStyle = '#fff'; ctx.fillText(u.name, x, top - 4);
      // shield
      for (let i = 0; i < u.maxsh; i++) { ctx.fillStyle = i < u.sh ? '#7ad0ff' : '#1a2a3a'; ctx.fillRect(x - u.maxsh * 3 + i * 6, top + 6, 5, 4); }
      if (u.broken) { ctx.fillStyle = '#ff5050'; ctx.fillText('BREAK', x, top + 18); }
      // kelemahan
      const k = S.bestiary[u.eid] || { weak: [], res: [] }; const known = u.E.weak.map(e => dif().reveal || k.weak.includes(e)); const wk = u.E.weak.length;
      u.E.weak.forEach((e, i) => { const wx = x - wk * 5 + i * 10 + 1, wy = top + 12; ctx.fillStyle = known[i] ? EL[e].c : '#445'; ctx.fillRect(wx, wy, 9, 9); ctx.fillStyle = '#000'; ctx.font = 'bold 7px monospace'; ctx.fillText(known[i] ? EL[e].i : '?', wx + 4.5, wy + 7.5); });
      if (u.charge) { ctx.fillStyle = '#ff5050'; ctx.font = 'bold 12px monospace'; ctx.fillText('!', x, top - 14); }
      let sx = x - Object.keys(u.status).length * 4; for (const s in u.status) { ctx.fillStyle = STATUS[s].c; ctx.fillRect(sx, top + 22, 7, 4); sx += 8; }
    } else if (!u.dead) {
      let sx = x - Object.keys(u.status).length * 4; for (const s in u.status) { ctx.fillStyle = STATUS[s].c; ctx.fillRect(sx, y + 4, 7, 4); sx += 8; }
    }
  },
  draw() {
    this.update(Math.min(.05, G.dt || .016));
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false; ctx.save();
    if (this.shake > 0) ctx.translate(rnd(-2, 2), rnd(-2, 2));
    this.bgDraw();
    const list = this.U.filter(u => u.alpha > 0).sort((a, b) => a.y - b.y);
    for (const u of list) this.drawUnit(u);
    for (const u of this.U) if (u.side === 'e' && !u.dead) this.drawHud(u); else if (u.side === 'p') this.drawHud(u);
    // penunjuk giliran & target
    if (this.cur && !this.cur.dead && this.cur.side === 'p' && !this.over) { const b = Math.sin(this.t * 8) * 2, x = Math.round(this.cur.x), y = Math.round(this.cur.y - 56 + b); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.fill(); }
    if (this.hover) { const h = this.hover, b = Math.sin(this.t * 10) * 2, x = Math.round(h.x), y = Math.round(h.y - (h.E && h.E.boss ? 108 : 78) + b); ctx.fillStyle = '#ff5050'; ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.fill(); }
    for (const f of this.fx) { const d = FXD[f.n], fr = Math.min(d[3] - 1, Math.floor(f.t * d[4])); ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.sc, f.sc); if (d[7]) ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(IMG[d[0]], fr * d[1], 0, d[1], d[2], -d[1] * d[5], -d[2] * d[6], d[1], d[2]); ctx.restore(); }
    for (const p of this.pops) { const k = p.t / (p.life || 1.1); ctx.globalAlpha = 1 - k * k; ctx.font = p.say ? 'bold 9px "Courier New",monospace' : (p.big ? 'bold 14px "Courier New",monospace' : 'bold 11px "Courier New",monospace'); ctx.textAlign = 'center'; const y = p.y - (p.say ? 0 : p.t * 22); if (p.say) { const w = ctx.measureText(p.txt).width + 8; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(p.x - w / 2, y - 10, w, 13); } else { ctx.fillStyle = '#000'; ctx.fillText(p.txt, p.x + 1, y + 1); } ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, y); ctx.globalAlpha = 1; }
    ctx.restore();
    if (this.banner) { const b = this.banner, k = b.a / b.life, al = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1; ctx.globalAlpha = clamp(al, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 62, VW, 34); ctx.font = 'bold 22px "Courier New",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd84a'; ctx.fillText(b.t, VW / 2, 87); ctx.globalAlpha = 1; }
  },
  key(e) {
    if (e.code === 'Escape') { e.preventDefault(); this.back(); return true; }
    return false;
  },
};
