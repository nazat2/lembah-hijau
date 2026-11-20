/* =========================================================================
   systems.js  —  Quest, Persahabatan, Ekonomi, Pertanian, Crafting, Suara dialog, fungsi cerita
   ========================================================================= */
'use strict';

/* ============================ QUEST ============================ */
const Q = {
  busy: false,
  st: id => S.quests[id],
  start(id, quiet) {
    const q = QUESTS[id]; if (!q || S.quests[id]) return;
    S.quests[id] = { st: 'active', step: 0 };
    if (!quiet) { toast(`Misi baru: ${q.n}`, 4); Audio8.sfx('pickup'); }
    if (q.type !== 'hidden' || id === 'legenda') S.track = id === 'main' ? S.track : id;
    this.check();
  },
  check() {
    if (this.busy) return; this.busy = true;
    try {
      for (const a of QUEST_AUTO) if (QUESTS[a.id] && !S.quests[a.id] && cond(a.c)) { S.quests[a.id] = { st: 'active', step: 0 }; if (a.id !== 'main') { toast(`Misi baru: ${QUESTS[a.id].n}`, 4); if (!a.hidden) S.track = a.id; } }
      for (const id in S.quests) {
        const s = S.quests[id], q = QUESTS[id]; if (!q || s.st !== 'active') continue;
        let adv = false;
        while (s.step < q.steps.length && cond(q.steps[s.step].c)) { s.step++; adv = true; if (s.step < q.steps.length) toast(`${q.n}: ${q.steps[s.step].t}`, 4); }
        if (s.step >= q.steps.length) this.finish(id); else if (adv) Audio8.sfx('select');
      }
      // lore terbuka
      for (const l of LORE) if (!S.lore[l.id] && cond(l.c)) { S.lore[l.id] = 1; if (l.id !== 'l1') toast('Catatan baru di Jurnal: ' + l.t); }
    } finally { this.busy = false; }
  },
  finish(id) {
    const s = S.quests[id], q = QUESTS[id]; if (s.st === 'done') return;
    s.st = 'done'; s.step = q.steps.length;
    if (id !== 'main') { toast(`Misi selesai: ${q.n}`, 4); Audio8.sfx('win'); }
    if (id === 'peti') { addItem('hati', 1); addGold(100); }
    if (id === 'ayam') FR.add('joko', 4);
    if (S.track === id) S.track = Object.keys(S.quests).find(k => S.quests[k].st === 'active' && QUESTS[k].type !== 'hidden') || 'main';
    saveGame();
  },
  cur(id) { const s = S.quests[id], q = QUESTS[id]; if (!s || !q || s.st !== 'active') return null; return q.steps[s.step] || null; },
  /* posisi tujuan langkah: {map, x, y, label} */
  target(id) {
    const st = this.cur(id); if (!st || !st.hint) return null;
    let h = st.hint;
    if (id === 'budi' && !F('budiEscort') && !F('budiHome')) h = { map: 'hutan', tx: 14, ty: 24 };
    if (h.npc) { const p = NPCPOS(h.npc); if (!p) return { map: null, label: (NPCS[h.npc] || {}).n || '', away: true, next: NPCNext(h.npc) }; return { map: p.map, x: p.tx * TS + 8, y: p.ty * TS + 8, label: NPCS[h.npc].n }; }
    return { map: h.map, x: h.tx * TS + 8, y: h.ty * TS + 8, label: st.t };
  },
  /* petunjuk navigasi lintas peta: {text, x, y, map} (x,y pada peta sekarang) */
  nav() {
    const t = this.target(S.track && S.quests[S.track] && S.quests[S.track].st === 'active' ? S.track : 'main');
    if (!t) return null;
    if (t.away) { const n = t.next, pad = x => String(x).padStart(2, '0'); return n ? { text: `${t.label} sedang istirahat dan kembali jam ${pad(n.h)}:00 (sekitar ${n.left} jam lagi) di ${MAP_NAMES[n.map] || n.map}. Tidur di kasur untuk mempercepat waktu.`, short: `Tunggu sampai ${pad(n.h)}:00`, away: 1 } : { text: `${t.label} belum bisa ditemui sekarang.`, short: 'Belum tersedia', away: 1 }; }
    if (t.map === S.map) return { text: t.label, x: t.x, y: t.y, here: 1 };
    const path = Nav.route(S.map, t.map);
    if (!path || !path.length) return { text: `Pergi ke ${MAP_NAMES[t.map] || t.map}.`, none: 1 };
    const w = path[0];
    return { text: w.to === t.map ? `Masuk ke ${MAP_NAMES[t.map] || t.map}` : `Menuju ${MAP_NAMES[t.map] || t.map} lewat ${w.label}`, x: w.x, y: w.y, door: 1 };
  },
};
const MAP_NAMES = { desa: 'Desa Hijau', hutan: 'Hutan Bisik', gua: 'Gua Gema', benteng: 'Benteng Orc', rumah_tetua: 'Rumah Tetua Wira', toko: 'Toko Bu Sari', rumah_warga: 'Rumah Nenek Lastri' };
/* graf peta untuk navigasi */
const Nav = {
  g: null,
  build() {
    this.g = {};
    for (const id in MAPS) { const m = MAPS[id](); this.g[id] = m.warps.map(w => ({ to: w.to, x: w.x + w.w / 2, y: w.y + w.h / 2, label: 'pintu ke ' + (MAP_NAMES[w.to] || w.to) })); }
  },
  route(a, b) {
    if (!this.g) this.build();
    const prev = { [a]: null }, qu = [a];
    while (qu.length) { const c = qu.shift(); if (c === b) break; for (const e of this.g[c] || []) if (!(e.to in prev)) { prev[e.to] = { from: c, e }; qu.push(e.to); } }
    if (!(b in prev)) return null; const out = []; let c = b; while (prev[c]) { out.unshift(prev[c].e); c = prev[c].from; } return out;
  },
};

/* ============================ PERSAHABATAN ============================ */
const FR = {
  get(id) { return S.fr[id] || (S.fr[id] = { pts: 0, talkDay: 0, giftDay: 0, seen: {} }); },
  lv(id) { const p = this.get(id).pts; let l = 0; for (let i = 0; i < FR_STEPS.length; i++) if (p >= FR_STEPS[i]) l = i; return l; },
  add(id, n) {
    const f = this.get(id), before = this.lv(id); f.pts = clamp(f.pts + n, 0, 100); const after = this.lv(id);
    if (n > 0) toast(`♥ ${NPCS[id] ? NPCS[id].n : id} +${n}`);
    if (after > before) { toast(`${NPCS[id].n} kini ${FR_NAMES[after]}!`, 4); Audio8.sfx('levelup'); }
    Q.check();
  },
  canTalk(id) { return this.get(id).talkDay < day(); },
  talked(id) { const f = this.get(id); if (f.talkDay < day()) { f.talkDay = day(); this.add(id, 2); } },
  canGift(id) { return this.get(id).giftDay < day(); },
  gift(id, item) {
    const N = NPCS[id], f = this.get(id), it = ITEMS[item]; if (!N || !it || !this.canGift(id)) return null;
    f.giftDay = day(); takeItem(item, 1);
    let kind = 1, pts = 2; if (N.likes.includes(item)) { kind = 0; pts = 6 + (it.p > 25 ? 2 : 0); } else if (N.hates.includes(item)) { kind = 2; pts = -3; }
    this.add(id, pts); if (pts < 0) toast(`${N.n} kurang senang.`);
    return `gift_${id}_${kind}`;
  },
};

/* ============================ EKONOMI ============================ */
const MARKET_EVENTS = {
  normal:   { n: 'Pasar biasa', d: 'Harga stabil.' },
  festival: { n: 'Festival Panen', d: 'Harga jual +25%. Desa ramai!' },
  paceklik: { n: 'Paceklik', d: 'Hasil tani langka: harga tani +50%.' },
  badai:    { n: 'Badai Kemarin', d: 'Bahan hutan sulit dicari: harga bahan +60%.' },
  pajak:    { n: 'Pajak Perdagangan', d: 'Harga beli +10%.' },
};
const SHOPS = {
  sari: { n: 'Toko Bu Sari', items: [
    ['potion', 10], ['potion2', 5, 'day>=3'], ['ether', 5], ['antidote', 8], ['revive', 3, 'campCleared'],
    ['b_gandum', 10], ['b_wortel', 10], ['b_tomat', 6, 'day>=3'], ['b_labu', 4, 'day>=6'], ['herba', 10], ['kayu', 8], ['bijih', 5, 'biz.toko>=1'],
    ['z_kulit', 1, 'campCleared'], ['z_besi', 1, 'inCave'], ['s_besi', 1, 'inCave'], ['b_hutan', 1, 'inCave'], ['p_besi', 1, 'inCave'] ] },
  rudi: { n: 'Dagang Rudi (Barang Langka)', items: [
    ['revive', 5], ['potion2', 6], ['ether', 6], ['kristal', 4], ['a_kalung', 1], ['a_cincin', 1], ['a_sabuk', 1], ['b_labu', 6], ['z_baja', 1, 'arenaClear'], ['s_baja', 1, 'arenaClear'], ['b_elang', 1, 'arenaClear'], ['p_baja', 1, 'arenaClear'] ] },
};
const ECO = {
  newDay() {
    const d = day(); if (S.market.day === d) return;
    const roll = hash('ev', d); S.market.day = d;
    S.market.ev = roll < .55 ? 'normal' : roll < .67 ? 'festival' : roll < .79 ? 'paceklik' : roll < .91 ? 'badai' : 'pajak';
    S.stock = { day: d };
    // penghasilan bisnis (hari yang terlewat)
    let days = d - S.bizDay; S.bizDay = d;
    if (days > 0 && days < 40) {
      let inc = 0; for (const k in BIZ) { const lv = S.biz[k]; if (lv > 0) inc += BIZ[k].inc[lv] * days; }
      if (S.market.ev === 'festival') inc = Math.round(inc * 1.3);
      if (inc > 0) { S.bank += inc; toast(`Bisnis menghasilkan ${inc} Gold (cek Menu > Bisnis).`, 4); }
      if (S.farm.auto) { const w = 6 * days; if (S.gold >= w) { S.gold -= w; } else { S.farm.auto = 0; toast('Gaji pekerja ladang tak terbayar. Pekerja berhenti.'); } }
    }
  },
  mult(id) {
    const base = .85 + hash('p', day(), id) * .35, it = ITEMS[id]; let m = base;
    const ev = S.market.ev;
    if (ev === 'paceklik' && (it.t === 'crop')) m *= 1.5;
    if (ev === 'badai' && (it.t === 'mat')) m *= 1.6;
    return m;
  },
  buy(id) { let p = ITEMS[id].p * this.mult(id) * 1.1; if (S.market.ev === 'pajak') p *= 1.1; return Math.max(1, Math.round(p)); },
  sell(id) {
    const it = ITEMS[id]; let p = it.p * this.mult(id) * (it.t === 'crop' || it.t === 'gift' ? .72 : .5); if (S.market.ev === 'festival') p *= 1.25;
    if (it.t === 'weapon' || it.t === 'armor' || it.t === 'acc') p *= (1 + (S.up[id] || 0) * .3);
    return Math.max(1, Math.round(p));
  },
  stockLeft(shop, id, max) {
    const k = shop + ':' + id, lvB = shop === 'sari' ? 1 + S.biz.toko * .35 : 1;
    if (S.stock.day !== day()) S.stock = { day: day() };
    if (S.stock[k] === undefined) S.stock[k] = Math.max(1, Math.round(max * lvB));
    return S.stock[k];
  },
  list(shop) { return SHOPS[shop].items.filter(r => cond(r[2])).map(r => ({ id: r[0], max: r[1], left: this.stockLeft(shop, r[0], r[1]), price: this.buy(r[0]) })); },
  doBuy(shop, id) {
    const e = this.list(shop).find(x => x.id === id); if (!e) return 'Barang tidak tersedia.';
    if (e.left <= 0) return 'Stok habis hari ini.'; if (S.gold < e.price) return 'Gold tidak cukup.';
    S.gold -= e.price; S.stock[shop + ':' + id]--; addItem(id, 1, true); Audio8.sfx('buy'); return `Membeli ${ITEMS[id].n} (-${e.price}).`;
  },
  doSell(id) {
    if (!has(id) || ITEMS[id].t === 'key') return 'Tidak bisa dijual.';
    for (const c of S.party) if (Object.values(S.chars[c].eq).includes(id) && (S.inv[id] || 0) <= 1) return 'Sedang dipakai.';
    const p = this.sell(id); takeItem(id, 1); S.gold += p; if (ITEMS[id].t === 'crop') { S.stats.sold++; Q.check(); }
    Audio8.sfx('coin'); return `Menjual ${ITEMS[id].n} (+${p}).`;
  },
  invest(k) {
    const lv = S.biz[k], B = BIZ[k]; if (lv >= 4) return 'Sudah level maksimum.'; if (B.need && !F(B.need)) return 'Belum terbuka.';
    const c = B.cost[lv + 1]; if (S.gold < c) return `Butuh ${c} Gold.`;
    S.gold -= c; S.biz[k]++; Audio8.sfx('levelup'); Q.check(); return `${B.n} naik ke level ${S.biz[k]}!`;
  },
  collect() { if (S.bank <= 0) return 'Belum ada keuntungan.'; const n = S.bank; S.gold += n; S.bank = 0; Audio8.sfx('coin'); return `Mengambil keuntungan ${n} Gold.`; },
};

/* ============================ PERTANIAN ============================ */
const FARM = {
  openCount() { return F('farmOpen') ? Math.min(12, 4 + S.biz.ladang * 2) : 0; },
  prog(i) { const p = S.farm.plots[i]; if (!p || !p.crop) return 0; return (S.clock - p.t) / CROPS[p.crop].grow; },
  plant(i, crop) {
    const p = S.farm.plots[i]; if (!p || p.crop || i >= this.openCount()) return false;
    if (!takeItem(CROPS[crop].seed, 1)) return false; p.crop = crop; p.t = S.clock; p.last = crop; Audio8.sfx('select'); return true;
  },
  harvest(i, auto) {
    const p = S.farm.plots[i]; if (!p || !p.crop || this.prog(i) < 1) return false;
    const C = CROPS[p.crop], n = rint(C.yield[0], C.yield[1]) + (S.biz.ladang >= 3 ? 1 : 0);
    addItem(p.crop, n, !!auto); S.farm.got += n; p.crop = null;
    if (!auto) Audio8.sfx('pickup'); return n;
  },
  tick() {
    if (!S.farm.auto) return; const lim = this.openCount();
    for (let i = 0; i < lim; i++) {
      const p = S.farm.plots[i]; let guard = 0;
      while (p.crop && this.prog(i) >= 1 && guard++ < 12) {
        const crop = p.crop, gt = CROPS[crop].grow, t0 = p.t; this.harvest(i, true);
        if (takeItem(CROPS[crop].seed, 1)) { p.crop = crop; p.t = t0 + gt; } else break;
      }
      if (!p.crop) { const c = p.last && has(CROPS[p.last].seed) ? p.last : Object.keys(CROPS).find(k => has(CROPS[k].seed)); if (c) this.plant(i, c); }
    }
  },
  hire() { if (S.farm.auto) return 'Pekerja sudah bekerja.'; if (S.gold < 200) return 'Butuh 200 Gold (gaji 6 Gold per hari).'; S.gold -= 200; S.farm.auto = 1; Audio8.sfx('buy'); return 'Pekerja ladang disewa! Panen & tanam ulang otomatis.'; },
};

/* ============================ CRAFTING ============================ */
const CRAFT = {
  list() { return RECIPES.filter(r => !r.flag || F(r.flag)); },
  can(r) { return Object.keys(r.need).every(k => !r.need[k] || has(k, r.need[k])) && S.gold >= r.gold; },
  make(r) {
    if (!this.can(r)) return 'Bahan atau Gold kurang.';
    for (const k in r.need) if (r.need[k]) takeItem(k, r.need[k]); S.gold -= r.gold; addItem(r.out, r.n, true); Audio8.sfx('chest'); return `Berhasil membuat ${r.n}× ${ITEMS[r.out].n}!`;
  },
  upCost(id) { const lv = S.up[id] || 0; return lv >= UPG.max ? null : UPG.cost(lv); },
  upgrade(id) {
    const c = this.upCost(id); if (!c) return 'Sudah maksimum (+5).';
    if (S.gold < c.gold || !has('bijih', c.bijih) || (c.kristal && !has('kristal', c.kristal))) return 'Bahan atau Gold kurang.';
    S.gold -= c.gold; takeItem('bijih', c.bijih); if (c.kristal) takeItem('kristal', c.kristal); S.up[id] = (S.up[id] || 0) + 1; Audio8.sfx('levelup'); return `${ITEMS[id].n} naik ke +${S.up[id]}!`;
  },
};

/* ============================ SUARA DIALOG ============================ */
const VOICE = {
  map: {}, cur: null, ready: false,
  PRE: { NAR: 'NAR', MC: 'MC', NPC: 'NPC', CMP: 'CMP', ENM: 'ENM', BOS: 'BOS' },
  async load() {
    try {
      if (location.protocol === 'file:') { this.ready = true; return; }
      if (window.VOICE_DATA) { this.map = window.VOICE_DATA; this.ready = true; return; }
      const r = await fetch('Audio/Voice_Dialog/voices.json', { cache: 'no-cache' });
      if (r.ok) this.map = await r.json();
    } catch (e) { /* tanpa suara: tidak apa-apa */ }
    this.ready = true;
  },
  /* ID unik: <PREFIX>_<pembicara>_<scene>_<nn> */
  id(scene, idx, spk) { const s = SPK[spk] || SPK.narrator; return `${s.cat}_${spk}_${scene.replace(/[^A-Za-z0-9]+/g, '_')}_${String(idx + 1).padStart(2, '0')}`; },
  barkId(e) { return `${ENEMIES[e].boss ? 'BOS' : 'ENM'}_${e}_bark_01`; },
  path(id) { const p = this.map[id]; return p ? 'Audio/Voice_Dialog/' + p : null; },
  play(id) {
    try {
      this.stop(); const p = this.path(id); if (!p || !(S.settings.voice > 0)) return;
      const a = new Audio(p); a.volume = clamp(S.settings.voice, 0, 1); a.onerror = () => {}; this.cur = a; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
    } catch (e) {}
  },
  stop() { try { if (this.cur) { this.cur.pause(); this.cur = null; } } catch (e) {} },
  /* seluruh baris yang butuh rekaman */
  all() {
    const out = [], add = (id, spk, scene, text) => { const s = SPK[spk] || SPK.narrator; out.push({ id, cat: VOICE_CAT[s.cat], speaker: s.n || 'Narator', scene, text }); };
    for (const sc in DLG) DLG[sc].forEach((ln, i) => { if (Array.isArray(ln)) add(this.id(sc, i, ln[0]), ln[0], sc, ln[1]); });
    for (const n in GIFT_TEXT) GIFT_TEXT[n].forEach((t, k) => add(this.id(`gift_${n}_${k}`, 0, n), n, `gift_${n}_${k}`, t));
    for (const e in ENEMIES) if (ENEMIES[e].bark) add(this.barkId(e), e, `bark_${e}`, ENEMIES[e].bark);
    for (const c in SHOUTS) SHOUTS[c].forEach((t, i) => add(`${SPK[c].cat}_${c}_battle_${String(i + 1).padStart(2, '0')}`, c, 'battle', t));
    return out;
  },
  csv() {
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    return 'voice_id,kategori,folder,pembicara,scene,teks\n' + this.all().map(r => [r.id, r.cat, `Audio/Voice_Dialog/${r.cat}/`, r.speaker, r.scene, r.text].map(q).join(',')).join('\n');
  },
};
/* seruan di battle (suara tipis, opsional) */
const SHOUTS = { arga: ['Haaah!', 'Rasakan ini!', 'Untuk Lembah Hijau!'], darma: ['Kena!', 'Lepaskan!', 'Napas... tembak!'], jana: ['Di belakangku!', 'Hiyaa!', 'Kuhentikan kau!'] };

/* ============================ FUNGSI CERITA (dipanggil dialog / pemicu) ============================ */
const FN = {
  joinDarma() { joinParty('darma'); NPCS.darma.sched = [[0, 24, null]]; },
  joinJana() { joinParty('jana'); },
  joinNyx() { joinParty('nyx'); },
  dropKey() { W.spawnKey(); },
  budiFollow() { W.budiFollow(); },
  caveOpen() { setF('inCave'); toast('Kunci Gua berputar... pintu terbuka!'); },
  fortEnter() { setF('inFort'); },
  arena() { W.arena(); },
  bossGrumak() { W.bossGrumak(); },
  budiAmbush() { if (F('budiEscort') && !F('budiAmbushed') && !F('budiHome')) { setF('budiAmbushed'); W.ambush(); } },
  grumakPeace() { setF('grumakDone'); S.dead['boss_grumak'] = day(); W.spawnGem(); },
  grumakKilled() { setF('grumakDone'); setF('grumakKilled'); S.dead['boss_grumak'] = day(); W.spawnGem(); },
  endHero() { endGame('A'); }, endRestore() { endGame('B'); }, endDark() { endGame('C'); },
};
function joinParty(id) {
  if (S.party.includes(id)) return;
  const avg = Math.round(S.party.reduce((a, c) => a + S.chars[c].lv, 0) / S.party.length);
  initChar(id, Math.max(2, avg - 1)); S.party.push(id);
  const ch = S.chars[id]; ch.sk = CHARS[id].skills.filter(s => s === CHARS[id].basic || SK[s].bp === 0);
  S.npcState[id] = 'party'; if (typeof W !== 'undefined' && W.addFollower) W.addFollower(id); toast(`${CHARS[id].n} bergabung!`, 4); Audio8.sfx('levelup');
}
function endGame(kind) { S.ending = kind; S.flags.gameEnd = 1; S.flags['ending' + kind] = 1; Q.check(); saveGame(); }
