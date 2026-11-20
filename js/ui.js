/* =========================================================================
   ui.js  —  toast, dialog (suara + pilihan), HUD & pelacak misi, sistem panel,
             menu NPC, hadiah, toko, ladang, crafting, papan, tidur, ending
   ========================================================================= */
'use strict';

function toast(msg, secs = 2.6) {
  const c = $('toasts'); if (!c) return; const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; c.appendChild(d);
  while (c.children.length > 4) c.firstChild.remove();
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, secs * 1000);
}
const fmtMin = m => m < 60 ? `${Math.max(1, Math.ceil(m))} mnt` : `${Math.floor(m / 60)} j ${Math.round(m % 60)} m`;

/* ============================== DIALOG ============================== */
const Dlg = {
  lines: [], i: 0, scene: '', o: {}, prev: 'world', active: false, txt: '', pos: 0, typing: false, jump: null, q: [], choosing: false,
  play(id, o = {}) { const L = DLG[id]; if (!L) { if (o.after) o.after(); return; } this.begin(L, id, o); },
  run(lines, o = {}) { this.begin(lines, o.scene || '', o); },
  begin(lines, scene, o) {
    if (this.active) { this.q.push([lines, scene, o]); return; }
    this.active = true; this.lines = lines; this.scene = scene; this.i = 0; this.o = o; this.jump = null; this.prev = G.mode === 'dialog' ? 'world' : G.mode;
    G.mode = 'dialog'; Input.clear(); $('dlg').classList.remove('hide'); this.show();
  },
  show() {
    const ln = this.lines[this.i]; if (!ln) return this.end();
    $('dlgCh').innerHTML = ''; this.choosing = false;
    if (!Array.isArray(ln)) {   // pilihan
      const opts = ln.ch.filter(c => cond(c.if)); this.choosing = true; $('dlgHint').classList.add('hide');
      opts.forEach(c => { const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = c.t; b.onclick = () => { Audio8.sfx('select'); if (c.set) for (const k in c.set) S.flags[k] = c.set[k]; if (c.fr) FR.add(c.fr[0], c.fr[1]); Q.check(); $('dlgCh').innerHTML = ''; this.choosing = false; if (c.go) this.goto(c.go); else { this.i++; this.show(); } }; $('dlgCh').appendChild(b); });
      const f = $('dlgCh').querySelector('.btn'); if (f && !IS_TOUCH) f.focus({ preventScroll: true }); return;
    }
    const [spk, text, fx] = ln, sp = SPK[spk] || SPK.narrator; if (spk !== 'narrator' && spk !== 'arga') Audio8.sfx('voice');
    $('dlgName').textContent = sp.n || ''; $('dlgName').style.display = sp.n ? '' : 'none'; $('dlg').classList.toggle('nar', !sp.n);
    this.portrait(spk); this.txt = text; this.pos = 0; this.typing = true; $('dlgTxt').textContent = ''; $('dlgHint').classList.add('hide');
    if (!this.o.noVoice) VOICE.play(this.o.voiceId && this.i === 0 ? this.o.voiceId : VOICE.id(this.scene || '_', this.i, spk));
    this.fx(fx);
  },
  fx(f) {
    if (!f) return;
    const key = 'fx_' + this.scene + '_' + this.i, once = this.scene && (f.gold || f.item || f.truth || f.fr);
    if (f.set) for (const k in f.set) S.flags[k] = f.set[k];
    if (!once || !S.flags[key]) { if (once) S.flags[key] = 1; if (f.gold) addGold(f.gold); if (f.item) for (const k in f.item) addItem(k, f.item[k]); if (f.fr) FR.add(f.fr[0], f.fr[1]); if (f.truth) S.truth += f.truth; }
    if (f.q) Q.start(f.q); if (f.toast) toast(f.toast, 4); Q.check(); if (f.fn && FN[f.fn]) FN[f.fn](); if (f.go) this.jump = f.go;
  },
  goto(id) { const L = DLG[id]; if (!L) { this.end(); return; } this.lines = L; this.scene = id; this.i = 0; this.jump = null; this.show(); },
  next() {
    if (!this.active || this.choosing) return;
    if (this.typing) { this.typing = false; this.pos = this.txt.length; $('dlgTxt').textContent = this.txt; $('dlgHint').classList.remove('hide'); return; }
    Audio8.sfx('blip'); if (this.jump) { const j = this.jump; this.jump = null; this.goto(j); return; } this.i++; this.show();
  },
  auto: false, at: 0,
  setAuto(v) { this.auto = !!v; this.at = 0; if (S.settings) S.settings.autoDlg = this.auto ? 1 : 0; const b = $('dlgAuto'); if (b) b.classList.toggle('on', this.auto); },
  tick(dt) {
    if (Cut.on) { if (Cut.paused) return; dt *= Cut.spd; }
    if (this.active && !this.typing && !this.choosing && this.auto) { this.at += dt; if (this.at > 1.4 + this.txt.length * .03) { this.at = 0; this.next(); } } else if (this.typing) this.at = 0;
    if (!this.active || !this.typing) return; this.pos += dt * 52 * (S.settings.speed || 1);
    const n = Math.min(this.txt.length, Math.floor(this.pos)); const cur = $('dlgTxt').textContent.length; if (n > cur) { $('dlgTxt').textContent = this.txt.slice(0, n); if (n % 3 === 0) Audio8.sfx('blip'); }
    if (n >= this.txt.length) { this.typing = false; $('dlgHint').classList.remove('hide'); }
  },
  end() {
    this.active = false; this.choosing = false; $('dlg').classList.add('hide'); $('dlgCh').innerHTML = ''; VOICE.stop();
    if (G.mode === 'dialog') G.mode = this.prev; Input.clear(); const a = this.o.after; this.o = {}; this.lines = [];
    if (a) a(); if (!this.active && this.q.length) { const n = this.q.shift(); this.begin(...n); }
  },
  portrait(spk, canvas) {
    const c = canvas || $('dlgPort'), g = c.getContext('2d'); g.clearRect(0, 0, 64, 64); g.imageSmoothingEnabled = false; const p = (SPK[spk] || {}).p; c.style.visibility = p ? 'visible' : 'hidden'; if (!p) return;
    const k = p[0];
    try {
      if (PORT_X[k]) PORT_X[k](g, p);
      else if (k === 'knight') g.drawImage(IMG.sol_idle, 30, 14, 56, 56, 0, 0, 64, 64);
      else if (k === 'hunter') g.drawImage(IMG.drm_idle, 28, 22, 44, 44, 0, 0, 64, 64);
      else if (k === 'orc') g.drawImage(p[1] ? tinted('orc_idle', p[1], .42) : IMG.orc_idle, 28, 24, 44, 44, 0, 0, 64, 64);
      else if (k === 'skel') g.drawImage(IMG.sk_base_idle, 4, 2, 24, 24, 0, 0, 64, 64);
      else if (k === 'farmer') { const im = p[1] ? tinted('char_idle', p[1], .35) : IMG.char_idle; g.drawImage(im, 8, 3, 16, 16, 0, 0, 64, 64); }
      else if (NPCSPR[k]) { const N = NPCSPR[k], q = N[4] * .5; g.drawImage(IMG[N[0]], N[5] - q / 2, N[6] - N[4] * .78, q, q, 0, 0, 64, 64); }
    } catch (e) {}
  },
};

/* ============================== UI ============================== */
const UI = {
  stack: [], pm: 'world', lastTab: 'jurnal', promptTxt: '', hudT: 0, banT: 0, bm: '',
  banner(name) { const b = $('banner'); b.textContent = name; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); },
  setPrompt(t) {
    const p = $('prompt'), txt = t ? (IS_TOUCH ? `Tombol A: ${t.label}` : `[E] ${t.label}`) : ''; if (txt === this.promptTxt) return; this.promptTxt = txt; p.textContent = txt; p.classList.toggle('hide', !txt);
  },
  /* ---------------- HUD ---------------- */
  hud() { this.hudT = 0; this.hudTick(1); },
  hudTick(dt) {
    this.hudT -= dt; if (this.hudT > 0) return; this.hudT = .25; if (!W.player) return;
    $('hTime').textContent = `${isNight() ? ICON.night : ICON.day} Hari ${day()} ${hh()}`; $('hGold').textContent = `${ICON.gold} ${S.gold}`; $('hBp').textContent = `${ICON.bp} BP ${S.bp}`;
    $('hParty').innerHTML = S.party.map(id => { const st = statsOf(id), ch = S.chars[id]; return `<div class="mini"><b>${esc(CHARS[id].n.replace('Pak ', ''))}</b><div class="bar hp"><i style="width:${clamp(ch.hp / st.maxhp * 100, 0, 100)}%"></i></div></div>`; }).join('');
    const tq = S.track && S.quests[S.track] && S.quests[S.track].st === 'active' ? S.track : 'main', q = QUESTS[tq], st = Q.cur(tq), nav = Q.nav();
    const T = $('trk'); if (!st || !q) { T.classList.add('hide'); return; } T.classList.remove('hide');
    $('trkT').textContent = q.n; $('trkS').textContent = st.t;
    const a = $('trkA'), d = $('trkDist');
    if (nav && nav.x !== undefined) {
      const g = Guide.to(nav.x, nav.y), w = $('trkW');
      a.style.visibility = 'visible'; a.style.transform = `rotate(${g.ang}rad)`;
      d.textContent = g.px < TS * 3 ? 'Sudah dekat!' : `${g.dir} · ${Guide.fm(g.px)}`;
      w.textContent = nav.door ? `${nav.text}` : `${nav.text} (${MAP_NAMES[S.map] || ''})`;
    } else { a.style.visibility = 'hidden'; const w = $('trkW'); if (nav && nav.away) { d.textContent = nav.short; w.textContent = nav.text; } else { d.textContent = nav ? nav.text : ''; w.textContent = ''; } }
  },
  tick(dt) { Dlg.tick(dt); if (G.mode !== this.bm) { this.bm = G.mode; document.body.dataset.mode = G.mode; } if (G.mode === 'world') this.hudTick(dt); },

  /* ---------------- sistem panel ---------------- */
  open(P) {
    if (!this.stack.length) Audio8.sfx('uiopen'); this.stack.push(P); if (G.mode !== 'menu') { this.pm = G.mode; G.mode = 'menu'; Input.clear(); } $('menu').classList.remove('hide'); this.paint(true);
  },
  close() {
    const P = this.stack.pop(); if (P && P.onClose) P.onClose();
    if (this.stack.length) this.paint(true); else { $('menu').classList.add('hide'); $('menu').innerHTML = ''; if (G.mode === 'menu') G.mode = this.pm || 'world'; Input.clear(); }
    Audio8.sfx(this.stack.length ? 'back' : 'uiclose');
  },
  closeAll() { while (this.stack.length) { const P = this.stack.pop(); if (P.onClose) P.onClose(); } $('menu').classList.add('hide'); $('menu').innerHTML = ''; if (G.mode === 'menu') G.mode = this.pm || 'world'; Input.clear(); },
  top() { return this.stack[this.stack.length - 1]; },
  paint(first) {
    const P = this.top(); if (!P) return; const m = $('menu'), old = m.querySelector('.pb'), sc = old ? old.scrollTop : 0;
    let fi = -1; if (!first && document.activeElement) { const bs = [...m.querySelectorAll('.btn')]; fi = bs.indexOf(document.activeElement); }
    const tabs = P.tabs ? `<div class="tabs">${P.tabs.map(([k, n]) => `<button class="btn tab${P.tab === k ? ' on' : ''}" data-a="__tab" data-t="${k}">${n}</button>`).join('')}</div>` : '';
    m.innerHTML = `<div class="panel ${P.cls || ''}"><div class="ph"><h3>${P.title || ''}</h3><button class="btn x" data-a="__close" aria-label="Tutup">✕</button></div>${tabs}<div class="pb">${P.render()}</div></div>`;
    const pb = m.querySelector('.pb'); if (pb && !first) pb.scrollTop = sc;
    if (P.after) P.after(m);
    const bs = [...m.querySelectorAll('.btn:not([disabled])')];
    if (fi >= 0 && bs.length) { const all = [...m.querySelectorAll('.btn')]; const t = all[Math.min(fi, all.length - 1)]; (t && !t.disabled ? t : bs[0]).focus({ preventScroll: true }); }
    else if (first && bs.length && !IS_TOUCH) { (bs.find(b => !b.classList.contains('x') && !b.classList.contains('tab')) || bs[0]).focus({ preventScroll: true }); }
  },
  msg(t, bad) { const P = this.top(); if (P) { P.note = t; P.bad = !!bad; } if (bad) Audio8.sfx('error'); },
  /* konfirmasi kecil */
  confirm(text, yes, no) {
    this.open({ title: 'Konfirmasi', cls: 'small', render: () => `<p class="txt">${text}</p><div class="row"><button class="btn" data-a="y">Ya</button><button class="btn" data-a="n">Batal</button></div>`, on: { y: () => { this.close(); yes && yes(); return false; }, n: () => { this.close(); no && no(); return false; } } });
  },

  /* ---------------- NPC ---------------- */
  talkScene(id) {
    const lv = FR.lv(id), chat = () => { const b = lv <= 1 ? 0 : lv <= 3 ? 1 : 2, L = (CHAT[id] || [[], [], []])[b]; return L.length ? L[(day() + (FR.get(id).talks = (FR.get(id).talks || 0) + 1)) % L.length] : null; };
    switch (id) {
      case 'wira':
        if (!F('metWira')) return 'wira.intro'; if (has('permata') && !F('gameEnd')) return 'wira.final';
        if (lv >= 3 && !F('wiraStory')) return 'wira.story'; if (lv >= 4 && F('wiraStory') && !F('wiraStory2')) return 'wira.story2'; return FR.canTalk(id) || F('gameEnd') ? chat() : 'wira.hint';
      case 'joko':
        if (!F('ayamStart')) return 'joko.ask'; if (!F('ayamDone')) return S.stats.chickens >= 3 ? 'joko.done' : 'joko.wait';
        if (lv >= 3 && !F('jokoStory')) return 'joko.story'; return chat();
      case 'sari':
        if (F('metWira') && !F('obatStart')) return 'sari.obat'; if (F('obatStart') && !F('obatDone')) return 'sari.obat_wait';
        if (F('obatDone') && !F('sariThanks')) { S.flags.sariThanks = 1; return 'sari.obat_done_note'; }
        if (day() >= 2 && lv >= 1 && !F('pasarStart')) return 'sari.pasar'; if (F('pasarStart') && !F('pasarDone') && cond('sold>=5 && bizTotal>=1')) return 'sari.pasar_done';
        if (lv >= 3 && !F('resepSari')) return 'sari.resep'; if (F('resepSari') && !F('resepDone') && has('kue_sari')) return 'sari.resep_done';
        if (lv >= 2 && !F('sariStory')) return 'sari.story'; return chat();
      case 'lastri':
        if (F('obatStart') && !F('obatDone') && has('obat_nenek')) { takeItem('obat_nenek', 1); return 'lastri.obat'; }
        if (lv >= 2 && !F('legendHeard')) return 'lastri.legend'; return chat();
      case 'jana':
        if (!F('janaStart')) return 'jana.ask'; if (!F('janaDone')) return cond('kills.raider>=3') ? 'jana.done' : 'jana.wait';
        if (lv >= 3 && !F('janaStory')) return 'jana.story'; return chat();
      case 'darma':
        if (!F('darmaStory')) return 'darma.story1'; if (!F('kenangStart')) return 'darma.kenangan';
        if (F('kenangStart') && !F('kenangDone') && has('liontin')) { takeItem('liontin', 1); return 'darma.kenangan_done'; } return chat();
      case 'nyx': if (!F('nyxStory') && lv >= 2) return 'nyx.story'; if (F('nyxStory') && !F('nyxStory2') && lv >= 4) return 'nyx.story2'; return chat();
      case 'budi': return chat();
      case 'rudi': return F('rudiSaved') ? (FR.canTalk('rudi') ? chat() : 'rudi.hi') : null;
    }
    return chat();
  },
  talk(id, o = {}) {
    if (id === 'budi' && F('budiLost') && !F('budiEscort') && !F('budiHome')) { Dlg.play('budi.found', { after: () => Q.check() }); return; }
    if (id === 'rudi' && !F('rudiSaved')) { if (cond('kills.rudi>=1')) Dlg.play('rudi.rescue', { after: () => { W.syncNpcs(false); Q.check(); } }); else { toast('Penjaga sel masih berkeliaran di dekat sini.'); Audio8.sfx('error'); } return; }
    const sc = this.talkScene(id); if (!sc) return;
    const first = FR.canTalk(id), after = () => { if (sc.startsWith('chat.')) FR.talked(id); else if (first && FR.canTalk(id) && !/\.(ask|accept|decline|wait)$/.test(sc)) FR.talked(id); Q.check(); if (F('gameEnd') && sc === 'wira.final') Cut.play('end' + S.ending, () => this.ending()); if (o.after) o.after(); };
    if (sc.startsWith('chat.')) FR.talked(id);
    Dlg.play(sc, { after });
  },
  npcMenu(id) {
    const N = NPCS[id]; if (!N) return;
    if (id === 'rudi' && !F('rudiSaved')) return this.talk(id);
    if (id === 'budi' && F('budiLost') && !F('budiEscort') && !F('budiHome')) return this.talk(id);
    if (id === 'darma' && !F('darmaJoined')) { if (!F('campCleared')) { toast('Kerangkeng terkunci. Kalahkan penjaga kamp dulu.'); Audio8.sfx('error'); } else Dlg.play('darma.rescue', { after: () => { W.syncNpcs(false); Q.check(); saveGame(); } }); return; }
    const P = {
      title: esc(N.n), cls: 'small',
      render: () => { const lv = FR.lv(id), f = FR.get(id), nx = FR_STEPS[lv + 1]; const likes = lv >= 2 ? N.likes.map(i => ITEMS[i].n).join(', ') : '???', hates = lv >= 3 ? N.hates.map(i => ITEMS[i].n).join(', ') : '???';
        return `<div class="npcbox"><canvas id="npcPort" width="64" height="64"></canvas><div><div class="role">${esc(N.role)}</div><div class="fr">♥ ${FR_NAMES[lv]} <small>(${f.pts}${nx ? '/' + nx : ''})</small></div><div class="bar fr"><i style="width:${Math.min(100, f.pts)}%"></i></div></div></div><p class="txt small">${esc(N.bio)}<br>Suka: ${esc(likes)}<br>Tidak suka: ${esc(hates)}</p>
        <div class="col"><button class="btn" data-a="talk"><span class="l">Bicara</span><span class="s">${FR.canTalk(id) ? 'Pertama hari ini: +♥' : 'sudah bicara hari ini'}</span></button>
        <button class="btn" data-a="gift" ${FR.canGift(id) ? '' : 'disabled'}><span class="l">Beri Hadiah</span><span class="s">${FR.canGift(id) ? 'Sekali sehari' : 'sudah memberi hari ini'}</span></button>
        ${id === 'sari' ? `<button class="btn" data-a="shop"><span class="l">Belanja</span><span class="s">Beli & jual</span></button><button class="btn" data-a="craft"><span class="l">Meja Kerja</span><span class="s">Racik & tempa</span></button><button class="btn" data-a="biz"><span class="l">Investasi</span><span class="s">Modal usaha</span></button>` : ''}
        ${id === 'rudi' ? `<button class="btn" data-a="shop2"><span class="l">Barang Langka</span><span class="s">Beli & jual</span></button>` : ''}
        ${id === 'joko' && F('farmOpen') ? `<button class="btn" data-a="farm"><span class="l">Ladang & Pekerja</span><span class="s">Kelola petak</span></button>` : ''}</div>`; },
      after: () => { const c = $('npcPort'); if (c) Dlg.portrait(id, c); },
      on: { talk: () => { this.closeAll(); this.talk(id); return false; }, gift: () => { this.gift(id); return false; }, shop: () => { this.shop('sari'); return false; }, shop2: () => { this.shop('rudi'); return false; }, craft: () => { this.craft(); return false; }, biz: () => { Menu.open('bisnis'); return false; }, farm: () => { this.farm(); return false; } },
    };
    this.open(P);
  },
  gift(id) {
    const N = NPCS[id];
    const list = () => Object.keys(S.inv).filter(k => ['gift', 'crop', 'mat', 'use'].includes(ITEMS[k].t) && !(Items.usable(k) && ITEMS[k].t === 'use' && false));
    this.open({ title: `Hadiah untuk ${esc(N.n)}`, cls: 'small',
      render: () => { const l = list(); return `<div class="col">${l.length ? l.map(k => `<button class="btn" data-a="g" data-k="${k}"><span class="l">${esc(ITEMS[k].n)} ×${S.inv[k]}</span><span class="s">${FR.lv(id) >= 2 && N.likes.includes(k) ? '♥ Disukai' : FR.lv(id) >= 3 && N.hates.includes(k) ? '✗ Tidak suka' : ITEMS[k].d || ''}</span></button>`).join('') : '<p class="txt">Tidak ada barang untuk dihadiahkan.</p>'}</div>`; },
      on: { g: d => { const kind = FR.gift(id, d.k); if (!kind) return; const ki = +kind.split('_').pop(); this.closeAll(); Dlg.run([[id, GIFT_TEXT[id][ki]]], { voiceId: VOICE.id(`gift_${id}_${ki}`, 0, id) }); return false; } } });
  },

  /* ---------------- toko ---------------- */
  shop(id) {
    const P = { title: SHOPS[id].n, tab: 'beli', tabs: [['beli', 'Beli'], ['jual', 'Jual']], note: 'Harga berubah tiap hari.',
      render: () => {
        const ev = MARKET_EVENTS[S.market.ev]; let h = `<div class="bar2"><span>${ICON.gold} ${S.gold} Gold</span><span>Pasar: <b>${ev.n}</b> — ${ev.d}</span></div><p class="note ${P.bad ? 'bad' : ''}">${esc(P.note || '')}</p><div class="list">`;
        if (P.tab === 'beli') { const L = ECO.list(id); h += L.map(e => { const it = ITEMS[e.id]; return `<button class="btn row2" data-a="buy" data-k="${e.id}" ${e.left <= 0 || S.gold < e.price ? 'disabled' : ''}><span class="l">${esc(it.n)} <small>(punya ${S.inv[e.id] || 0})</small></span><span class="s">${esc(it.d || statTxt(it))}</span><span class="pr">${e.price}G · stok ${e.left}</span></button>`; }).join(''); }
        else { const L = Object.keys(S.inv).filter(k => ITEMS[k].t !== 'key'); h += L.length ? L.map(k => `<button class="btn row2" data-a="sell" data-k="${k}"><span class="l">${esc(ITEMS[k].n)} ×${S.inv[k]}</span><span class="s">${esc(ITEMS[k].d || statTxt(ITEMS[k]))}</span><span class="pr">${ECO.sell(k)}G</span></button>`).join('') : '<p class="txt">Tas kosong.</p>'; }
        return h + '</div>';
      },
      on: { buy: d => { const r = ECO.doBuy(id, d.k); this.msg(r, !/^Membeli/.test(r)); }, sell: d => { const r = ECO.doSell(d.k); this.msg(r, !/^Menjual/.test(r)); } } };
    this.open(P);
  },

  /* ---------------- ladang ---------------- */
  farm() {
    if (!F('farmOpen')) { toast('Ladang belum terbuka. Bantu Pak Joko dulu.'); return; }
    const P = { title: 'Ladang', note: 'Pilih petak untuk menanam atau memanen.', sel: null,
      render: () => {
        const n = FARM.openCount(); let h = `<div class="bar2"><span>${ICON.gold} ${S.gold}</span><span>Petak: ${n}/12 (naik lewat investasi Ladang)</span><span>Panen total: ${S.farm.got}</span></div><p class="note ${P.bad ? 'bad' : ''}">${esc(P.note)}</p><div class="plots">`;
        for (let i = 0; i < 12; i++) { const p = S.farm.plots[i]; if (i >= n) { h += `<button class="btn plot lock" disabled><span class="l">Terkunci</span></button>`; continue; } const pr = FARM.prog(i);
          h += `<button class="btn plot${p.crop ? (pr >= 1 ? ' ready' : ' grow') : ''}${P.sel === i ? ' sel' : ''}" data-a="plot" data-i="${i}"><span class="l">${p.crop ? esc(CROPS[p.crop].n) : 'Kosong'}</span><div class="bar"><i style="width:${clamp(pr * 100, 0, 100)}%"></i></div><span class="s">${p.crop ? (pr >= 1 ? 'SIAP PANEN' : `${Math.floor(pr * 100)}% · ${fmtMin((1 - pr) * CROPS[p.crop].grow)}`) : 'Ketuk untuk tanam'}</span></button>`; }
        h += `</div><div class="row"><button class="btn" data-a="all"><span class="l">Panen Semua</span></button><button class="btn" data-a="plantall"><span class="l">Tanam Semua Kosong</span></button></div>`;
        if (P.sel !== null && !S.farm.plots[P.sel].crop) { h += `<p class="txt">Tanam di petak ${P.sel + 1}:</p><div class="row wrap">${Object.keys(CROPS).map(c => `<button class="btn" data-a="seed" data-c="${c}" ${has(CROPS[c].seed) ? '' : 'disabled'}><span class="l">${esc(CROPS[c].n)} ×${S.inv[CROPS[c].seed] || 0}</span><span class="s">${fmtMin(CROPS[c].grow)}</span></button>`).join('')}</div>`; }
        h += `<div class="sep"></div><p class="txt">Pekerja ladang: ${S.farm.auto ? '<b class="ok">AKTIF</b> — memanen & menanam ulang otomatis (gaji 6 Gold/hari, butuh bibit di tas).' : 'Belum ada. Sewa 200 Gold, gaji 6 Gold/hari.'}</p><button class="btn" data-a="hire" ${S.farm.auto ? 'disabled' : ''}><span class="l">${S.farm.auto ? 'Pekerja bekerja' : 'Sewa Pekerja (200 Gold)'}</span></button>`;
        return h; },
      on: {
        plot: d => { const i = +d.i, p = S.farm.plots[i]; if (p.crop) { if (FARM.prog(i) >= 1) { const n = FARM.harvest(i); P.note = `Panen ${n}× ${ITEMS[p.crop || 'gandum'] ? '' : ''}hasil.`; P.note = 'Panen berhasil!'; P.bad = false; } else { P.note = 'Belum siap.'; P.bad = true; } P.sel = null; } else P.sel = i; },
        seed: d => { if (FARM.plant(P.sel, d.c)) { P.note = `Menanam ${CROPS[d.c].n}.`; P.bad = false; P.sel = null; } else { P.note = 'Bibit habis.'; P.bad = true; } },
        all: () => { let n = 0; for (let i = 0; i < FARM.openCount(); i++) if (S.farm.plots[i].crop && FARM.prog(i) >= 1) { FARM.harvest(i); n++; } P.note = n ? `${n} petak dipanen.` : 'Belum ada yang siap.'; P.bad = !n; },
        plantall: () => { let n = 0; for (let i = 0; i < FARM.openCount(); i++) if (!S.farm.plots[i].crop) { const c = S.farm.plots[i].last && has(CROPS[S.farm.plots[i].last].seed) ? S.farm.plots[i].last : Object.keys(CROPS).find(k => has(CROPS[k].seed)); if (c && FARM.plant(i, c)) n++; } P.note = n ? `${n} petak ditanami.` : 'Tidak ada bibit atau petak kosong.'; P.bad = !n; },
        hire: () => { const r = FARM.hire(); P.note = r; P.bad = !/disewa/.test(r); },
      }, onClose: () => {}, after: () => { clearTimeout(P.tm); P.tm = setTimeout(() => { if (this.top() === P) this.paint(); }, 1000); } };
    this.open(P);
  },

  /* ---------------- crafting ---------------- */
  craft() {
    const P = { title: 'Meja Kerja', tab: 'racik', tabs: [['racik', 'Racik'], ['tempa', 'Tempa']], note: 'Bahan didapat dari hutan, gua, musuh, dan ladang.',
      render: () => {
        let h = `<div class="bar2"><span>${ICON.gold} ${S.gold}</span></div><p class="note ${P.bad ? 'bad' : ''}">${esc(P.note)}</p><div class="list">`;
        if (P.tab === 'racik') h += CRAFT.list().map(r => { const ok = CRAFT.can(r), need = Object.keys(r.need).filter(k => r.need[k]).map(k => `<span class="${has(k, r.need[k]) ? 'ok' : 'no'}">${r.need[k]}× ${esc(ITEMS[k].n)} (${S.inv[k] || 0})</span>`).join(' · '); return `<button class="btn row2" data-a="mk" data-k="${r.id}" ${ok ? '' : 'disabled'}><span class="l">${esc(ITEMS[r.out].n)} ×${r.n} <small>${esc(ITEMS[r.out].d || statTxt(ITEMS[r.out]))}</small></span><span class="s">${need}${r.gold ? ` · <span class="${S.gold >= r.gold ? 'ok' : 'no'}">${r.gold}G</span>` : ''}</span></button>`; }).join('');
        else { const L = Object.keys(S.inv).filter(k => ['weapon', 'armor', 'acc'].includes(ITEMS[k].t) && ITEMS[k].t !== 'acc' || ITEMS[k].t === 'acc' && false); const all = Object.keys(S.inv).filter(k => ['weapon', 'armor'].includes(ITEMS[k].t));
          h += all.length ? all.map(k => { const c = CRAFT.upCost(k), lv = S.up[k] || 0; return `<button class="btn row2" data-a="up" data-k="${k}" ${c ? '' : 'disabled'}><span class="l">${esc(ITEMS[k].n)} <b>+${lv}</b> <small>${esc(statTxt(ITEMS[k], lv))}</small></span><span class="s">${c ? `${c.gold}G · ${c.bijih}× Bijih (${S.inv.bijih || 0})${c.kristal ? ` · ${c.kristal}× Kristal (${S.inv.kristal || 0})` : ''}` : 'MAKSIMUM'}</span></button>`; }).join('') : '<p class="txt">Belum punya senjata/zirah untuk ditempa.</p>'; }
        return h + '</div>'; },
      on: { mk: d => { const r = RECIPES.find(x => x.id === d.k), t = CRAFT.make(r); P.note = t; P.bad = !/Berhasil/.test(t); }, up: d => { const t = CRAFT.upgrade(d.k); P.note = t; P.bad = !/naik/.test(t); } } };
    this.open(P);
  },

  /* ---------------- papan pengumuman ---------------- */
  board() {
    this.open({ title: 'Papan Pengumuman', cls: 'small',
      render: () => { const ev = MARKET_EVENTS[S.market.ev], act = Object.keys(S.quests).filter(k => S.quests[k].st === 'active' && QUESTS[k].type !== 'hidden');
        return `<p class="txt"><b>Hari ${day()}</b> — ${esc(ev.n)}<br>${esc(ev.d)}</p><p class="txt"><b>Kabar desa:</b><br>• Pak Joko mencari ayam yang kabur.<br>• Jana butuh bantuan membersihkan jalur barat.<br>• Bu Sari menerima hasil tani. Rudi berdagang barang langka bila selamat.<br>• Bunga Bulan hanya mekar malam hari.</p><p class="txt"><b>Misi aktif:</b><br>${act.length ? act.map(k => `• ${esc(QUESTS[k].n)}: ${esc(Q.cur(k) ? Q.cur(k).t : '')}`).join('<br>') : '—'}</p>`; } });
  },
  waitUntil(h) {
    const pad = String(h).padStart(2, '0');
    this.confirm(`Tunggu sampai jam ${pad}:00? Sekarang ${hh()}.`, () => {
      this.closeAll(); Audio8.sfx('sleep'); W.fade.to = 1;
      W.fade.cb = () => {
        const d0 = day(); let add = h * 60 - (S.clock % 1440); if (add < 1) add += 1440; S.clock = Math.floor(S.clock + add);
        if (day() !== d0) { ECO.newDay(); FARM.tick(); }
        W.lastHour = -1; W.syncNpcs(true); W.refreshBlocks(); W.musicFor(); W.fade.to = 0; saveGame(); toast(`Sekarang jam ${pad}:00.`, 3); Q.check();
      };
    });
  },
  sleep() {
    this.confirm(`Tidur sampai pagi (07:00)? HP & MP party pulih penuh. Sekarang ${hh()}.`, () => {
      this.closeAll(); Audio8.sfx('sleep'); W.fade.to = 1;
      W.fade.cb = () => {
        const h = hour(), add = h < 7 ? (7 - h) * 60 : (31 - h) * 60; S.clock = Math.floor(S.clock + add - (S.clock % 1) + 1);
        for (const c of S.party) { const st = statsOf(c); S.chars[c].hp = st.maxhp; S.chars[c].mp = st.maxmp; }
        ECO.newDay(); FARM.tick(); W.lastHour = -1; W.syncNpcs(true); W.refreshBlocks(); W.musicFor(); W.fade.to = 0; saveGame(); toast(`Hari ${day()}, pagi. Semua pulih.`, 3); Q.check();
      };
    });
  },
  /* ---------------- tamat ---------------- */
  ending() {
    const E = { A: ['Akhir: Sang Pahlawan', 'Permata kembali, desa selamat. Hutan masih layu dan tak seorang pun bertanya mengapa.'], B: ['Akhir: Pemulih Lembah', 'Roh lembah dibebaskan. Hulu dan hilir hidup bersama. Akhir terbaik.'], C: ['Akhir: Sang Penguasa', 'Kekuatan permata menelan lembah. Pahlawan berubah menjadi penguasa.'] }[S.ending] || ['Tamat', ''];
    const P = { title: 'TAMAT', cls: 'small',
      render: () => `<h2 class="end">${E[0]}</h2><p class="txt">${E[1]}</p><p class="txt">Hari ke-${day()} · Pertarungan ${S.stats.battles} · Kebenaran ${S.truth}/5 · Peti rahasia ${S.stats.secrets}/3</p><p class="txt">Ending lain dapat dicapai dengan memuat save sebelum menyerahkan permata.</p><div class="col"><button class="btn" data-a="go"><span class="l">Lanjut bermain</span></button><button class="btn" data-a="title"><span class="l">Ke menu judul</span></button></div>`,
      on: { go: () => { this.closeAll(); return false; }, title: () => { this.closeAll(); Game.toTitle(); return false; } } };
    this.open(P);
  },

  /* ---------------- keyboard (mode non-dunia) ---------------- */
  key(e) {
    if (G.mode === 'cut') { if (e.code === 'Escape') Cut.doSkip(); else if (e.code === 'KeyP') Cut.togglePause(); else if (e.code === 'KeyF') Cut.toggleFF(); return; }
    if (G.mode === 'battle') { if (Battle.key(e)) return; }
    const dir = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', KeyW: 'u', KeyS: 'd', KeyA: 'l', KeyD: 'r' }[e.code];
    if (G.mode === 'dialog') {
      if (Dlg.choosing) { if (dir) { e.preventDefault(); this.nav(dir); } return; }
      if (['Enter', 'Space', 'KeyE'].includes(e.code)) { e.preventDefault(); Dlg.next(); } return;
    }
    if (G.mode === 'title') { if (dir) { e.preventDefault(); this.nav(dir); } return; }
    if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Tab') { if (G.mode === 'menu') { e.preventDefault(); this.close(); } return; }
    if (G.mode === 'menu' && (e.code === 'KeyJ' || e.code === 'KeyM' || e.code === 'KeyI')) { e.preventDefault(); this.closeAll(); return; }
    if (dir) { e.preventDefault(); this.nav(dir); }
    else if (e.code === 'Space' && document.activeElement && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); }
  },
  /* navigasi fokus spasial */
  nav(dir) {
    const root = G.mode === 'dialog' ? $('dlgCh') : G.mode === 'menu' ? $('menu') : G.mode === 'title' ? $('title') : $('btCmd'); if (!root) return;
    const bs = [...root.querySelectorAll('.btn:not([disabled])')].filter(b => b.offsetParent !== null); if (!bs.length) return;
    const cur = document.activeElement && bs.includes(document.activeElement) ? document.activeElement : null; if (!cur) { bs[0].focus(); return; }
    const a = cur.getBoundingClientRect(), ac = { x: a.left + a.width / 2, y: a.top + a.height / 2 }; let best = null, bd = 1e9;
    for (const b of bs) { if (b === cur) continue; const r = b.getBoundingClientRect(), c = { x: r.left + r.width / 2, y: r.top + r.height / 2 }, dx = c.x - ac.x, dy = c.y - ac.y;
      const ok = dir === 'u' ? dy < -4 : dir === 'd' ? dy > 4 : dir === 'l' ? dx < -4 : dx > 4; if (!ok) continue;
      const along = dir === 'u' || dir === 'd' ? Math.abs(dy) : Math.abs(dx), across = dir === 'u' || dir === 'd' ? Math.abs(dx) : Math.abs(dy), sc = along + across * 2.2; if (sc < bd) { bd = sc; best = b; } }
    if (best) { best.focus({ preventScroll: false }); best.scrollIntoView({ block: 'nearest' }); Audio8.sfx('blip'); }
  },
};
function statTxt(it, up = 0) {
  const m = it.t === 'acc' ? 1 : UPG.mult(up), n = { atk: 'ATK', def: 'DEF', mat: 'MAT', mdf: 'MDF', hp: 'HP', mp: 'MP', spd: 'SPD', crt: 'KRT' }; const o = []; for (const k in n) if (it[k]) o.push(`${n[k]}+${Math.round(it[k] * m)}`); return o.join(' ');
}
/* delegasi klik panel */
document.addEventListener('click', e => {
  const m = $('menu'); if (!m || !m.contains(e.target)) return; const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const P = UI.top(); if (!P) return; const a = b.dataset.a;
  if (a === '__close') { UI.close(); return; }
  if (a === '__tab') { Audio8.sfx('select'); P.tab = b.dataset.t; P.note = ''; if (P.onTab) P.onTab(); UI.paint(true); return; }
  if (P.on && P.on[a]) { Audio8.sfx('select'); const r = P.on[a](b.dataset); if (r !== false && UI.top() === P) UI.paint(); }
});
