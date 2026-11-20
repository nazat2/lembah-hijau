/* =========================================================================
   main.js  —  boot, judul, loop utama, game baru / muat
   ========================================================================= */
'use strict';
const Game = {
  ready: false, last: 0, autosave: 0,
  showTitle() {
    Setup.stop(); const t = $('title'); t.classList.remove('hide'); const sv = hasSave(), many = hasSave(0) + hasSave(1) + hasSave(2) > 1;
    t.innerHTML = `<button class="btn" id="tFs" aria-label="Layar penuh" ${FS.can() ? '' : 'hidden'}>${FS.on() ? '⤢' : '⛶'}</button><h1>LEGENDA<br>LEMBAH HIJAU<small>V1 · RPG BERBASIS GILIRAN</small></h1><div class="menu">${sv ? '<button class="btn" id="tCont">Lanjutkan</button>' : ''}<button class="btn" id="tNew">Game Baru</button>${sv ? '<button class="btn" id="tLoad">Muat Game</button>' : ''}<button class="btn ghost" id="tSet">Pengaturan</button></div><p>${IS_TOUCH ? 'Geser kiri layar = gerak · tombol A = aksi' : 'WASD / panah = gerak · E = aksi · Esc = menu · J = jurnal · M = peta · F = layar penuh'}</p><p>Pilih Zat atau Jess. Pilihanmu menentukan akhir cerita.</p>`;
    const c = $('tCont'), n = $('tNew');
    if (c) c.onclick = () => { Audio8.init(); Audio8.sfx('select'); this.load(); };
    const go = slot => Setup.hero(g => this.newGame(g, slot), () => this.showTitle());
    n.onclick = () => { Audio8.init(); Audio8.sfx('select'); if (sv) Slots.open('new', slot => go(slot)); else go(0); };
    if ($('tLoad')) $('tLoad').onclick = () => { Audio8.init(); Audio8.sfx('select'); Slots.open('load'); };
    $('tSet').onclick = () => { Audio8.init(); Audio8.sfx('select'); Settings.open(true); };
    $('tFs').onclick = () => { Audio8.init(); FS.toggle(); };
    const f = c || n; if (!IS_TOUCH) f.focus({ preventScroll: true });
  },
  resetUi() {
    Battle.on = false; Battle.over = true; Battle.pending = null; $('bt').classList.add('hide'); $('btRes').classList.add('hide'); Dlg.active = false; Dlg.q = []; Dlg.o = {}; $('dlg').classList.add('hide'); VOICE.stop();
    UI.stack = []; $('menu').classList.add('hide'); $('menu').innerHTML = ''; $('title').classList.add('hide'); Input.clear();
  },
  toTitle() {
    saveGame(); this.resetUi(); G.mode = 'title'; Audio8.music('judul'); this.showTitle();
  },
  newGame(g, slot) {
    this.resetUi(); Setup.stop(); S = newState(); if (slot !== undefined) setSlot(slot); Hero.apply(g || 'm'); initChar('arga', 1); W.lastHour = -1; W.load('desa', 24, 21); G.mode = 'world'; Q.check(); saveGame(); Audio8.setVol(S.settings.vol);
    Cut.play('prolog', () => Dlg.play('prolog', { after: () => { Q.check(); saveGame(); } }));
  },
  load(i) {
    if (!loadGame(i)) { toast('Tidak ada save.'); return; }
    this.resetUi(); Hero.apply(S.gender || 'm', S.name); for (const id of S.party) if (!S.chars[id]) initChar(id, 1);
    W.lastHour = -1; W.load(S.map || 'desa', Math.floor(S.px / TS), Math.floor(S.py / TS)); W.player.x = S.px; W.player.y = S.py; W.cam.x = S.px - VW / 2; W.cam.y = S.py - VH / 2; W.clampCam();
    G.mode = 'world'; Q.check(); Audio8.setVol(S.settings.vol); toast('Game dimuat.');
  },
  frame(now) {
    const dt = Math.min(.05, (now - this.last) / 1000 || .016); this.last = now; G.dt = dt;
    try {
      if (G.mode === 'world') {
        if (Input.took('act')) W.interact();
        W.update(dt); W.draw(); Story.tick(); Audio8.walk(!!(W.player && W.player.moving && !W.busy && !Dlg.active), /gua|benteng/.test(W.id || '') ? 'step4' : 'step1');
        this.autosave += dt; if (this.autosave > 45) { this.autosave = 0; saveGame(); }
      } else if (Battle.on) { Audio8.walk(false); G.t += dt; Battle.draw(); }
      else if (Cut.on) { Audio8.walk(false); G.t += dt; Cut.update(dt); Cut.draw(); }
      else if (W.map) {
        G.t += dt; Audio8.walk(false);
        if (G.mode === 'title') { W.cam.x += dt * 8; W.clampCam(); if (W.cam.x >= W.map.w * TS - VW) W.cam.x = 0; W.player.x = W.cam.x + VW / 2; }
        W.draw();
      }
      UI.tick(dt);
    } catch (e) { Game.fail(e); }
    requestAnimationFrame(t => this.frame(t));
  },
  fail(e) { try { const d = $('err'); d.style.display = 'block'; d.textContent = 'Error: ' + (e && e.message || e); console.error(e); } catch (x) {} },
};
window.addEventListener('error', e => { Game.fail(e.error || e.message); });
window.addEventListener('unhandledrejection', e => { Game.fail(e.reason); });

Input.hot.menu = () => { if (G.mode === 'world') Menu.open(); else if (G.mode === 'menu') UI.close(); };
Input.hot.quest = () => { if (G.mode === 'world') Menu.open('jurnal'); else if (G.mode === 'menu') UI.closeAll(); };
Input.hot.map = () => { if (G.mode === 'world') Menu.open('peta'); };
Input.hot.bag = () => { if (G.mode === 'world') Menu.open('item'); };
Input.hot.mute = () => Audio8.toggleMute();
document.querySelectorAll('#hot .chip').forEach(b => b.addEventListener('click', () => { Audio8.init(); const k = b.dataset.h; if (k === 'fs') FS.toggle(); else if (Input.hot[k]) Input.hot[k](); b.blur(); }));
$('btAuto').addEventListener('click', () => { Audio8.sfx('select'); Battle.setAuto(!Battle.auto); });
$('btSpd').addEventListener('click', () => { Audio8.sfx('select'); S.settings.speed = (S.settings.speed || 1) >= 3 ? 1 : (S.settings.speed || 1) + 1; Battle.syncTools(); });
$('btQuick').addEventListener('click', () => { Audio8.sfx('select'); Battle.quickWin(); });
document.getElementById('dlg').addEventListener('click', e => { if (e.target.closest('#dlgCh')) return; Audio8.init(); Dlg.next(); });
cv.addEventListener('pointerdown', ev => {
  if (G.mode !== 'battle' || !Layout.r) return; const x = (ev.clientX - Layout.r.x) / Layout.r.s / 2, y = (ev.clientY - Layout.r.y) / Layout.r.s / 2; Battle.canvasTap(x, y);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode !== 'title' && G.mode !== 'boot') saveGame(); });
Prefs.apply();
document.body.dataset.mode = 'boot';
/* pemicu cerita berbasis syarat (dicek tiap frame di mode dunia) */
const Story = { tick() { if (W.busy || Dlg.active || Cut.on || !W.player) return; Chapter.tick(); if (F('captainDown') && !F('nyxMet') && !S.party.includes('nyx')) Cut.play('nyx', () => { Q.check(); saveGame(); }); } };

(async function boot() {
  try {
    const ld = $('title'); ld.classList.remove('hide'); ld.innerHTML = '<h1>LEGENDA<br>LEMBAH HIJAU</h1><p id="ldp">Memuat… 0%</p>';
    await loadAssets(p => { const e = $('ldp'); if (e) e.textContent = `Memuat… ${Math.round(p * 100)}%`; });
    await VOICE.load(); const hadSave = hasSave(); S = newState(); Hero.apply('m'); initChar('arga', 1);
    try { const m = localStorage.getItem('llh2_muted'); if (m === '1') Audio8.toggleMute(); } catch (e) {}
    W.load('desa', 24, 21); W.cam.x = 0; G.mode = 'title'; Audio8.music('judul'); Game.ready = true; if (Prefs.d.mode) Game.showTitle(); else Setup.platform(() => Game.showTitle());
    Game.last = performance.now(); requestAnimationFrame(t => Game.frame(t));
  } catch (e) { Game.fail(e); }
})();
