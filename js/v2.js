/* =========================================================================
   v2.js  —  Preferensi (mode Mobile/Desktop), layar penuh, pilihan hero (Zat/Jess),
             token nama, pengaturan, editor tata letak (geser tombol & HUD), layar awal
   ========================================================================= */
'use strict';

/* ---------------- PREFERENSI (terpisah dari save) ---------------- */
const EDIT_PAD = ['bA', 'bMenu', 'bQuest', 'bMap', 'bBag', 'bFs', 'joyFix'];
const EDIT_HUD = ['hudL', 'hParty', 'trk'];
const EDIT_IDS = EDIT_PAD.concat(EDIT_HUD);
const Prefs = {
  d: { mode: null, hs: 1, bs: 1, bo: .9, joy: 'float', lay: {}, diff: 1 },
  load() { try { const j = JSON.parse(localStorage.getItem('llh2_prefs') || 'null'); if (j && typeof j === 'object') { Object.assign(this.d, j); if (!this.d.lay || typeof this.d.lay !== 'object') this.d.lay = {}; } } catch (e) {} },
  save() { try { localStorage.setItem('llh2_prefs', JSON.stringify(this.d)); } catch (e) {} },
  setMode(m) { this.d.mode = m; this.save(); this.apply(); },
  apply() {
    const d = this.d; if (d.mode) IS_TOUCH = d.mode === 'mobile';
    document.body.classList.toggle('touch', IS_TOUCH);
    document.body.classList.toggle('joyfix', IS_TOUCH && d.joy === 'fixed');
    const r = document.documentElement.style; r.setProperty('--hs', d.hs); r.setProperty('--bs', d.bs); r.setProperty('--bo', d.bo);
    Layout.fit(); this.applyLayout();
  },
  ref(id) { return EDIT_PAD.includes(id) ? { w: innerWidth, h: innerHeight } : { w: (Layout.r || { w: innerWidth }).w, h: (Layout.r || { h: innerHeight }).h }; },
  applyLayout() {
    for (const id of EDIT_IDS) { const el = document.getElementById(id); if (!el) continue; const p = this.d.lay[id]; if (!p) { el.style.translate = ''; continue; } const r = this.ref(id); el.style.translate = `${p[0] * r.w}px ${p[1] * r.h}px`; }
  },
  resetLayout() { this.d.lay = {}; this.d.hs = 1; this.d.bs = 1; this.d.bo = .9; this.save(); this.apply(); },
};
Prefs.load();
addEventListener('resize', () => { try { Prefs.applyLayout(); } catch (e) {} });

/* ---------------- LAYAR PENUH ---------------- */
const FS = {
  el() { return document.fullscreenElement || document.webkitFullscreenElement || null; },
  can() { const e = document.documentElement; return !!(e.requestFullscreen || e.webkitRequestFullscreen); },
  on() { return !!this.el(); },
  async toggle() {
    try {
      if (this.on()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (!this.can()) { toast('Layar penuh tidak didukung browser ini. iPhone: Bagikan → Tambah ke Layar Utama.', 5); return; }
      const e = document.documentElement; await (e.requestFullscreen || e.webkitRequestFullscreen).call(e, { navigationUI: 'hide' });
      try { if (IS_TOUCH && screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (_) {}
    } catch (err) { toast('Layar penuh ditolak browser.', 3.5); }
  },
};
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => {
  setTimeout(() => { Layout.fit(); Prefs.applyLayout(); const P = UI.top && UI.top(); if (P && P.isSettings) UI.paint(); const t = document.getElementById('tFs'); if (t) t.textContent = FS.on() ? '⤢' : '⛶'; }, 120);
});
addEventListener('keydown', e => {
  if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if (t && /INPUT|SELECT|TEXTAREA/.test(t.tagName)) return; FS.toggle();
});

/* ---------------- TOKEN NAMA ---------------- */
const Names = {
  has: /\b(Arga|Zat|Jess)\b/, rep: /\b(Arga|Zat|Jess)\b/g,
  set(n) { [DLG, CHAT, QUESTS, LORE, GIFT_TEXT, NPCS, SPK, CHARS, COMBOS, SK].forEach(o => this.walk(o, n)); },
  walk(o, n) {
    for (const k in o) { const v = o[k]; if (typeof v === 'string') { if (this.has.test(v)) o[k] = v.replace(this.rep, n); } else if (v && typeof v === 'object') this.walk(v, n); }
  },
};

/* ---------------- HERO: Zat (cowok) / Jess (cewek) ---------------- */
const HERO = {
  m: { id: 'zat', n: 'Zat', cls: 'Ksatria Petir', bio: 'Pemuda tenang berjubah merah muda. Pulang ke desa membawa liontin giok peninggalan ibunya.', anim: 'zat' },
  f: { id: 'jess', n: 'Jess', cls: 'Ksatria Fajar', bio: 'Pejuang gesit dengan tombak-pedang. Pulang ke desa membawa liontin giok peninggalan ibunya.', anim: 'jess' },
};
const Hero = {
  g() { return S.gender === 'f' ? 'f' : 'm'; },
  apply(g, name) {
    g = g === 'f' ? 'f' : 'm'; S.gender = g; S.name = name || HERO[g].n; ANIMS.soldier = ANIMS[HERO[g].anim];
    Names.set(S.name);
  },
  /* gambar kepala hero ke canvas 2d (w x w) */
  portrait(g2d, g, w) {
    g2d.imageSmoothingEnabled = false;
    if (g === 'f') g2d.drawImage(IMG.jess_idle, 11, 5, 30, 30, 0, 0, w, w);
    else g2d.drawImage(IMG.zat_idle, 38, 40, 40, 40, 0, 0, w, w);
  },
};
/* potret khusus di dialog (dipanggil dari Dlg.portrait) */
const PORT_X = {
  hero(g) { Hero.portrait(g, Hero.g(), 64); },
  nyxp(g) { g.drawImage(IMG.nyx_idle, 12, 6, 40, 40, 0, 0, 64, 64); },
  por(g, p) { const im = IMG['por_' + p[1]]; if (!im) return; const c = p[2] || [0, 0, im.width, im.width]; g.drawImage(im, c[0], c[1], c[2], c[3], 0, 0, 64, 64); },
};

/* ---------------- MODE MUDAH (satu-satunya mode) ---------------- */
const EASY = { hp: .5, atk: .5, sh: -1, rec: .6, reveal: 1, flee: .3 };   // musuh 50% HP & serangan, shield -1, kelemahan terlihat, pulih 60% setelah menang
const dif = () => EASY;

/* ---------------- ARAHAN MISI: meter + mata angin ---------------- */
const Guide = {
  PER: 1.6,   // 1 petak = 1,6 meter
  m(px) { const m = px / TS * this.PER; return m < 10 ? Math.max(1, Math.round(m)) : m < 100 ? Math.round(m / 5) * 5 : Math.round(m / 10) * 10; },
  fm(px) { const m = this.m(px); return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : m + ' m'; },
  dir(dx, dy) { const a = Math.atan2(-dy, dx) * 180 / Math.PI, n = ['Timur', 'Timur Laut', 'Utara', 'Barat Laut', 'Barat', 'Barat Daya', 'Selatan', 'Tenggara']; return n[((Math.round(a / 45) % 8) + 8) % 8]; },
  to(x, y) { const P = W.player; if (!P) return null; const dx = x - P.x, dy = y - P.y, px = Math.hypot(dx, dy); return { px, ang: Math.atan2(dy, dx), dir: this.dir(dx, dy), m: this.m(px), txt: px < TS * 3 ? 'Sudah dekat' : this.dir(dx, dy) + ' · ' + this.fm(px) }; },
  place(t) { return t && t.map ? (MAP_NAMES[t.map] || t.map) : ''; },
};

/* ---------------- EDITOR TATA LETAK ---------------- */
const Edit = {
  on: false, ret: 'world', drag: null, bound: false,
  bounds(id) { if (EDIT_PAD.includes(id)) return { l: 0, t: 0, r: innerWidth, b: innerHeight }; const r = Layout.r; return { l: r.x, t: r.y, r: r.x + r.w, b: r.y + r.h }; },
  start(ret) {
    this.ret = ret || 'world'; this.on = true; Input.clear(); G.mode = 'edit'; document.body.dataset.mode = 'edit'; UI.bm = 'edit';
    document.body.classList.add('editing'); $('title').classList.add('hide'); $('editBar').classList.remove('hide');
    this.demo(); this.bind(); this.sync();
  },
  demo() {
    if ($('hTime') && !$('hTime').textContent) { $('hTime').textContent = `${ICON.day} Hari 1 07:00`; $('hGold').textContent = `${ICON.gold} 80`; $('hBp').textContent = `${ICON.bp} BP 0`; }
    if (!$('hParty').innerHTML) $('hParty').innerHTML = `<div class="mini"><b>${esc(S.name)}</b><div class="bar hp"><i style="width:100%"></i></div></div>`;
    if (!$('trkT').textContent) { $('trkT').textContent = 'Permata yang Hilang'; $('trkS').textContent = 'Temui Tetua Wira di alun-alun desa.'; $('trkDist'). textContent = 'Timur Laut · 20 m'; }
    $('trk').classList.remove('hide');
  },
  sync() {
    const d = Prefs.d, t = IS_TOUCH;
    $('edBsW').style.display = $('edBoW').style.display = t ? '' : 'none'; $('edHs').value = Math.round(d.hs * 100); $('edBs').value = Math.round(d.bs * 100); $('edBo').value = Math.round(d.bo * 100);
    $('edHint').textContent = t ? 'Seret tombol atau HUD untuk memindahkan.' : 'Seret HUD untuk memindahkan.';
  },
  bind() {
    if (this.bound) return; this.bound = true;
    for (const id of EDIT_IDS) {
      const el = document.getElementById(id); if (!el) continue;
      el.addEventListener('pointerdown', ev => {
        if (!Edit.on) return; ev.preventDefault(); ev.stopPropagation(); try { el.setPointerCapture(ev.pointerId); } catch (e) {}
        const cur = Prefs.d.lay[id] || [0, 0]; Edit.drag = { id, el, pid: ev.pointerId, x: ev.clientX, y: ev.clientY, fx: cur[0], fy: cur[1], r: el.getBoundingClientRect() };
        el.classList.add('drag');
      });
      el.addEventListener('pointermove', ev => {
        const D = Edit.drag; if (!D || D.id !== id || ev.pointerId !== D.pid) return;
        const b = Edit.bounds(id), ref = Prefs.ref(id);
        const dx = clamp(ev.clientX - D.x, b.l - D.r.left, b.r - D.r.right), dy = clamp(ev.clientY - D.y, b.t - D.r.top, b.b - D.r.bottom);
        const p = [D.fx + dx / ref.w, D.fy + dy / ref.h]; Prefs.d.lay[id] = p; el.style.translate = `${p[0] * ref.w}px ${p[1] * ref.h}px`;
      });
      const up = ev => { const D = Edit.drag; if (!D || D.id !== id || ev.pointerId !== D.pid) return; Edit.drag = null; el.classList.remove('drag'); Prefs.save(); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }
    const sl = (id, key, f) => { $(id).addEventListener('input', () => { Prefs.d[key] = f(+$(id).value); Prefs.apply(); }); $(id).addEventListener('change', () => Prefs.save()); };
    sl('edHs', 'hs', v => v / 100); sl('edBs', 'bs', v => v / 100); sl('edBo', 'bo', v => v / 100);
    $('edReset').addEventListener('click', () => { Prefs.resetLayout(); this.sync(); Audio8.sfx('select'); });
    $('edDone').addEventListener('click', () => this.stop());
  },
  stop() {
    if (!this.on) return; this.on = false; this.drag = null; Prefs.save(); document.body.classList.remove('editing'); $('editBar').classList.add('hide');
    for (const id of EDIT_IDS) { const el = document.getElementById(id); if (el) el.classList.remove('drag'); }
    if (this.ret === 'title') { G.mode = 'title'; document.body.dataset.mode = 'title'; UI.bm = 'title'; Game.showTitle(); Settings.open(true); }
    else { G.mode = 'world'; document.body.dataset.mode = 'world'; UI.bm = 'world'; UI.hudT = 0; Menu.open('opsi'); }
  },
};

/* ---------------- PENGATURAN ---------------- */
const Settings = {
  open(fromTitle) {
    const P = { isSettings: true, title: 'Pengaturan', cls: '', fromTitle: !!fromTitle, note: '', render: () => Settings.html(P), on: {}, after: m => Settings.after(P, m) };
    P.on = Settings.on(P); UI.open(P);
  },
  html(P) {
    const sp = S.settings, d = Prefs.d, t = IS_TOUCH, fs = FS.on();
    const sl = (lab, key, val, min, max, unit = '%') => `<label class="sl"><span>${lab} <b>${val}${unit}</b></span><input type="range" min="${min}" max="${max}" value="${val}" data-r="${key}"></label>`;
    let h = `<p class="note ${P.bad ? 'bad' : ''}">${esc(P.note || '')}</p>`;
    h += `<h4>Tampilan</h4><div class="col">
      <button class="btn" data-a="fs"><span class="l">Layar Penuh: ${fs ? 'AKTIF' : 'MATI'}</span><span class="s">${FS.can() ? 'Tombol F di keyboard juga bisa' : 'Browser ini tidak mendukung · iPhone: Tambah ke Layar Utama'}</span></button>
      <div class="seg"><button class="btn tab${!t ? ' on' : ''}" data-a="mode" data-m="desktop"><span class="l">🖥 Desktop</span></button><button class="btn tab${t ? ' on' : ''}" data-a="mode" data-m="mobile"><span class="l">📱 Mobile</span></button></div>
      <small>Mode Mobile menampilkan joystick &amp; tombol sentuh. Desktop memakai keyboard.</small>
      ${sl('Ukuran HUD', 'hs', Math.round(d.hs * 100), 70, 140)}
      ${t ? `${sl('Ukuran tombol', 'bs', Math.round(d.bs * 100), 70, 150)}${sl('Transparansi tombol', 'bo', Math.round(d.bo * 100), 30, 100)}
      <div class="seg"><button class="btn tab${d.joy !== 'fixed' ? ' on' : ''}" data-a="joy" data-m="float"><span class="l">Joystick melayang</span></button><button class="btn tab${d.joy === 'fixed' ? ' on' : ''}" data-a="joy" data-m="fixed"><span class="l">Joystick tetap</span></button></div>` : ''}
      <button class="btn" data-a="edit"><span class="l">Atur Tata Letak ${t ? 'Tombol &amp; ' : ''}HUD</span><span class="s">Seret untuk memindahkan, simpan otomatis</span></button>
      <button class="btn" data-a="relay"><span class="l">Reset Tata Letak</span></button></div>`;
    h += `<h4>Audio</h4><div class="col">${sl('Musik &amp; efek', 'vol', Math.round(sp.vol * 100), 0, 100)}${sl('Suara dialog', 'voice', Math.round(sp.voice * 100), 0, 100)}
      <button class="btn" data-a="mute"><span class="l">Suara: ${Audio8.muted ? 'MATI' : 'HIDUP'}</span></button></div>`;
    h += `<h4>Permainan</h4><div class="col"><small>Mode Mudah: musuh lebih lemah, kelemahan musuh terlihat, HP pulih sebagian setelah menang.</small><button class="btn" data-a="speed"><span class="l">Kecepatan teks &amp; battle: ${sp.speed === 2 ? 'CEPAT (2x)' : 'Normal (1x)'}</span></button></div>`;
    if (!P.fromTitle) h += `<h4>Data</h4><div class="col">
      <button class="btn" data-a="qsave"><span class="l">Simpan Cepat (Slot ${SLOT + 1})</span><span class="s">Otomatis juga tersimpan saat pindah area dan sebelum bos</span></button>
      <button class="btn" data-a="save"><span class="l">Simpan ke Slot…</span></button>
      <button class="btn" data-a="load" ${hasSave() ? '' : 'disabled'}><span class="l">Muat Game…</span></button>
      <button class="btn" data-a="csv"><span class="l">Ekspor daftar Voice ID (.csv)</span><span class="s">${VOICE.all().length} baris dialog · rekaman ke Audio/Voice_Dialog/</span></button>
      <button class="btn" data-a="json"><span class="l">Ekspor templat voices.json</span></button>
      <button class="btn" data-a="title"><span class="l">Ke Menu Judul</span></button></div>`;
    h += `<p class="txt small">Kontrol: WASD/panah gerak · E/Spasi aksi · J jurnal · M peta · I tas · Esc menu · F layar penuh · N bisu.</p>`;
    return h;
  },
  after(P, m) {
    m.querySelectorAll('input[data-r]').forEach(i => {
      i.oninput = () => {
        const k = i.dataset.r, v = +i.value, b = i.previousElementSibling && i.previousElementSibling.querySelector('b'); if (b) b.textContent = v + '%';
        if (k === 'vol') { S.settings.vol = v / 100; Audio8.setVol(v / 100); } else if (k === 'voice') S.settings.voice = v / 100;
        else { Prefs.d[k] = v / 100; Prefs.apply(); }
      };
      i.onchange = () => Prefs.save();
    });
  },
  on(P) {
    const say = (t, bad) => { P.note = t; P.bad = !!bad; if (bad) Audio8.sfx('error'); };
    return {
      fs: () => { FS.toggle(); return false; },
      mode: d => { Prefs.setMode(d.m); say(d.m === 'mobile' ? 'Mode Mobile aktif: tombol sentuh tampil.' : 'Mode Desktop aktif.'); },
      joy: d => { Prefs.d.joy = d.m; Prefs.save(); Prefs.apply(); },
      edit: () => { const ret = P.fromTitle ? 'title' : 'world'; UI.closeAll(); Edit.start(ret); return false; },
      relay: () => { Prefs.resetLayout(); say('Tata letak dikembalikan ke bawaan.'); },
      mute: () => { Audio8.toggleMute(); },
      speed: () => { S.settings.speed = S.settings.speed === 2 ? 1 : 2; },
    };
  },
};
/* tab "Opsi" di menu utama memakai panel yang sama */
Menu.r_opsi = P => Settings.html(P);
Menu.a_opsi = (P, m) => Settings.after(P, m);
{ const h0 = Menu.handlers.bind(Menu); Menu.handlers = P => Object.assign(h0(P), Settings.on(P)); }

/* ---------------- LAYAR AWAL: platform & hero ---------------- */
const Setup = {
  iv: null,
  stop() { if (this.iv) { clearInterval(this.iv); this.iv = null; } },
  platform(next) {
    this.stop(); const t = $('title'); t.classList.remove('hide'); const sug = (() => { try { return matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop'; } catch (e) { return 'desktop'; } })();
    t.innerHTML = `<h1>LEGENDA<br>LEMBAH HIJAU<small>MAINKAN SEBAGAI</small></h1>
      <div class="picks">
        <button class="pick${sug === 'desktop' ? ' rec' : ''}" data-m="desktop"><i>🖥</i><b>Desktop</b><span>Keyboard &amp; mouse<br>WASD · E · Esc</span>${sug === 'desktop' ? '<em>Disarankan</em>' : ''}</button>
        <button class="pick${sug === 'mobile' ? ' rec' : ''}" data-m="mobile"><i>📱</i><b>Mobile</b><span>Layar sentuh<br>Joystick + tombol</span>${sug === 'mobile' ? '<em>Disarankan</em>' : ''}</button>
      </div><p>Bisa diganti kapan saja di Pengaturan.</p>${FS.can() ? '<button class="btn mini2" id="pFs">⛶ Layar penuh</button>' : ''}`;
    t.querySelectorAll('.pick').forEach(b => b.onclick = () => { Audio8.init(); Audio8.sfx('select'); Prefs.setMode(b.dataset.m); next(); });
    const f = $('pFs'); if (f) f.onclick = () => { Audio8.init(); FS.toggle(); };
    if (!IS_TOUCH) { const r = t.querySelector('.pick.rec'); if (r) r.focus({ preventScroll: true }); }
  },
  hero(start, back) {
    this.stop(); const t = $('title'); let g = 'm';
    const card = (k) => `<button class="pick hero" data-g="${k}"><canvas width="96" height="96" id="hc_${k}"></canvas><b>${HERO[k].n}</b><small>${HERO[k].cls}</small><span>${HERO[k].bio}</span></button>`;
    t.innerHTML = `<h1>PILIH PAHLAWAN<small>NAMA TERKUNCI · CERITA TERSAMBUNG</small></h1><div class="picks">${card('m')}${card('f')}</div>
      <div class="menu"><button class="btn" id="hGo">Mulai sebagai Zat</button><button class="btn back" id="hBack">◀ Kembali</button></div>`;
    const sel = () => { t.querySelectorAll('.pick.hero').forEach(b => b.classList.toggle('rec', b.dataset.g === g)); $('hGo').textContent = `Mulai sebagai ${HERO[g].n}`; };
    t.querySelectorAll('.pick.hero').forEach(b => b.onclick = () => { Audio8.sfx('select'); g = b.dataset.g; sel(); });
    $('hGo').onclick = () => { Audio8.init(); Audio8.sfx('levelup'); this.stop(); start(g); };
    $('hBack').onclick = () => { Audio8.sfx('back'); this.stop(); back(); };
    sel();
    const draw = () => {
      const tt = performance.now() / 1000;
      for (const k of ['m', 'f']) {
        const c = $('hc_' + k); if (!c) continue; const x = c.getContext('2d'), A = ANIMS[HERO[k].anim].idle, f = Math.floor(tt * A[2]) % A[1], an = A[5];
        x.clearRect(0, 0, 96, 96); x.imageSmoothingEnabled = false; const sc = 1.7 * an[2] * (k === 'f' ? 1.25 : 1.1);
        x.save(); x.translate(48, 88); x.scale(sc, sc); x.drawImage(IMG[A[0]], f * A[3], 0, A[3], A[4], -an[0], -an[1] + 2, A[3], A[4]); x.restore();
      }
    };
    draw(); this.iv = setInterval(draw, 90);
    if (!IS_TOUCH) $('hGo').focus({ preventScroll: true });
  },
};

/* ---------------- SLOT SAVE (3 slot) ---------------- */
const Slots = {
  /* mode: 'load' | 'save' | 'new'.  cb(slot) dipanggil untuk 'new' */
  open(mode, cb) {
    const titles = { load: 'Muat Game', save: 'Simpan ke Slot', new: 'Pilih Slot Game Baru' };
    const P = { title: titles[mode], cls: 'small', mode, render: () => Slots.html(mode), on: {
      pick: d => Slots.pick(mode, +d.i, cb),
      del: d => { UI.confirm(`Hapus Slot ${+d.i + 1}? Tidak bisa dikembalikan.`, () => { deleteSave(+d.i); UI.close(); }); return false; },
    } };
    UI.open(P);
  },
  html(mode) {
    let h = '<div class="col slots">';
    for (let i = 0; i < 3; i++) {
      const f = slotInfo(i), cur = i === SLOT && mode === 'save';
      const dis = mode === 'load' && !f;
      h += `<div class="slot"><button class="btn${cur ? ' on' : ''}" data-a="pick" data-i="${i}" ${dis ? 'disabled' : ''}><span class="l">Slot ${i + 1}${f ? ` · ${esc(f.name)} Lv ${f.lv}` : ' · Kosong'}</span><span class="s">${f ? `Hari ${f.day} · ${f.time} · ${esc(f.map)} · ${f.party} anggota · main ${esc(f.play)}` : (mode === 'load' ? 'Belum ada data' : 'Slot kosong')}</span></button>${f && mode === 'load' ? `<button class="btn ghost" data-a="del" data-i="${i}" aria-label="Hapus slot ${i + 1}">🗑</button>` : ''}</div>`;
    }
    return h + '</div><p class="note">Game juga tersimpan otomatis ke slot yang sedang dipakai setiap pindah area dan sebelum bos.</p>';
  },
  pick(mode, i, cb) {
    const has = hasSave(i);
    if (mode === 'load') { UI.closeAll(); Game.load(i); return false; }
    const go = () => { UI.closeAll(); if (mode === 'save') { saveGame(true, i); } else if (cb) cb(i); };
    if (has) UI.confirm(`Timpa Slot ${i + 1}?`, go); else go();
    return false;
  },
};
