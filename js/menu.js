/* =========================================================================
   menu.js  —  Menu utama: Jurnal, Peta, Party, Item, Perlengkapan, Skill (BP), Bisnis, Opsi
   ========================================================================= */
'use strict';
const STAT_KEYS = [['hp', 'HP'], ['mp', 'MP'], ['atk', 'ATK'], ['def', 'DEF'], ['mat', 'MAT'], ['mdf', 'MDF'], ['spd', 'SPD'], ['crt', 'KRT']];
const SLOT_N = { w: 'Senjata', a: 'Zirah', x: 'Aksesori' };
function download(name, text, type = 'text/csv') {
  try { const b = new Blob([text], { type: type + ';charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return true; } catch (e) { return false; }
}

const Menu = {
  TABS: [['jurnal', 'Jurnal'], ['peta', 'Peta'], ['party', 'Party'], ['item', 'Item'], ['gear', 'Gear'], ['skill', 'Skill'], ['bisnis', 'Bisnis'], ['opsi', 'Opsi']],
  open(tab) {
    if (G.mode === 'menu' && UI.top() && UI.top().isMenu) { const P = UI.top(); P.tab = tab || P.tab; UI.paint(true); return; }
    if (G.mode !== 'world' && G.mode !== 'menu') return;
    const P = { isMenu: true, title: `${fmtClock()} · ${ICON.gold} ${S.gold} · ${ICON.bp} BP ${S.bp}`, tab: tab || UI.lastTab, tabs: this.TABS, ch: S.party[0], slot: null, sel: S.track || 'main', note: '', use: null, cls: 'big',
      render: () => { UI.lastTab = P.tab; P.title = `${fmtClock()} · ${ICON.gold} ${S.gold} · ${ICON.bp} BP ${S.bp}`; return Menu['r_' + P.tab](P); }, on: {}, after: m => { const f = Menu['a_' + P.tab]; if (f) f(P, m); } };
    P.on = Menu.handlers(P); UI.open(P);
  },
  memberBar(P) { return `<div class="row wrap">${S.party.map(id => `<button class="btn tab${P.ch === id ? ' on' : ''}" data-a="ch" data-id="${id}">${esc(CHARS[id].n)}</button>`).join('')}</div>`; },
  note(P) { return `<p class="note ${P.bad ? 'bad' : ''}">${esc(P.note || '')}</p>`; },

  /* ---------------- JURNAL ---------------- */
  r_jurnal(P) {
    const ids = Object.keys(S.quests).filter(k => QUESTS[k]), grp = { main: 'Utama', side: 'Sampingan', hidden: 'Tersembunyi' };
    const ch = Chapter.cur(); let h = `<div class="split"><div class="lst"><h4>${esc(ch.n)}: ${esc(ch.t)}</h4>`;
    for (const t of ['main', 'side', 'hidden']) { const L = ids.filter(k => QUESTS[k].type === t); if (!L.length) continue; h += `<h4>${grp[t]}</h4>` + L.map(k => { const s = S.quests[k]; return `<button class="btn q${P.sel === k ? ' on' : ''}${s.st === 'done' ? ' done' : ''}" data-a="q" data-id="${k}"><span class="l">${S.track === k && s.st === 'active' ? '◆ ' : ''}${esc(QUESTS[k].n)}</span><span class="s">${s.st === 'done' ? 'Selesai' : esc((QUESTS[k].steps[s.step] || {}).t || '')}</span></button>`; }).join(''); }
    h += '</div><div class="det">';
    const q = QUESTS[P.sel], s = S.quests[P.sel];
    if (q && s) {
      h += `<h3>${esc(q.n)}</h3><p class="txt small">Pemberi: ${esc(q.giver)} · Hadiah: ${esc(q.reward.text)}</p><p class="txt">${esc(q.desc)}</p><ol class="steps">${q.steps.map((st, i) => `<li class="${i < s.step || s.st === 'done' ? 'ok' : i === s.step ? 'cur' : 'todo'}">${esc(st.t)}</li>`).join('')}</ol>`;
      if (s.st === 'active') { const t = Q.target(P.sel); const nav = P.sel === (S.track || 'main') ? Q.nav() : null;
        h += `<p class="txt guide">${t ? (t.away ? `${esc(t.label)} sedang tidak ada.` : `Tujuan: <b>${esc(MAP_NAMES[t.map] || t.map || '')}</b>${t.map === S.map ? ' (di sini)' : ''}`) : ''}${nav && nav.text && !nav.here ? `<br>${esc(nav.text)}` : ''}</p>${t && t.away && t.next ? `<button class="btn" data-a="wait" data-h="${t.next.h}"><span class="l">Tunggu sampai jam ${String(t.next.h).padStart(2, '0')}:00</span><span class="s">${esc(t.label)} kembali di ${esc(MAP_NAMES[t.next.map] || t.next.map)}</span></button>` : ''}<button class="btn" data-a="track" data-id="${P.sel}" ${S.track === P.sel ? 'disabled' : ''}><span class="l">${S.track === P.sel ? 'Sedang dilacak' : 'Lacak misi ini'}</span></button>`; }
    } else h += '<p class="txt">Pilih misi.</p>';
    const L = LORE.filter(l => S.lore[l.id]);
    h += `<h4>Catatan (${L.length}/${LORE.length}) · Kebenaran ${S.truth}</h4>${L.map(l => `<p class="lore"><b>${esc(l.t)}</b><br>${esc(l.x)}</p>`).join('')}</div></div>`; return h;
  },

  /* ---------------- PETA ---------------- */
  r_peta(P) {
    const nav = Q.nav(), tq = S.track && S.quests[S.track] && S.quests[S.track].st === 'active' ? S.track : 'main', st = Q.cur(tq);
    return `<canvas id="mapC" width="480" height="270"></canvas><div class="legend"><span><i class="dot p"></i> Kamu</span><span><i class="dot q"></i> Tujuan misi</span><span><i class="dot n"></i> NPC</span><span><i class="dot w"></i> Pintu</span></div>
    <p class="txt"><b>${esc(MAP_NAMES[S.map] || S.map)}</b>${st ? `<br>Misi: ${esc(QUESTS[tq].n)} — ${esc(st.t)}` : ''}${nav ? `<br>${esc(nav.text || '')}` : ''}</p><p class="txt small">Dikunjungi: ${Object.keys(S.discovered).map(k => esc(MAP_NAMES[k] || k)).join(', ')}</p>`;
  },
  a_peta(P, m) {
    const c = m.querySelector('#mapC'); if (!c || !W.map) return; const g = c.getContext('2d'), mp = W.map, gw = mp.w * TS, gh = mp.h * TS, s = Math.min(480 / gw, 270 / gh), ox = (480 - gw * s) / 2, oy = (270 - gh * s) / 2;
    g.fillStyle = '#05040a'; g.fillRect(0, 0, 480, 270); g.imageSmoothingEnabled = false; g.drawImage(W.ground, ox, oy, gw * s, gh * s); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(ox, oy, gw * s, gh * s);
    const pt = (x, y) => [ox + x * s, oy + y * s]; g.font = 'bold 10px monospace'; g.textAlign = 'center';
    for (const w of W.warps) { const [x, y] = pt(w.x + w.w / 2, w.y + w.h / 2); g.fillStyle = '#6ab0ff'; g.fillRect(x - 3, y - 3, 7, 7); g.fillStyle = '#000'; g.fillText(MAP_NAMES[w.to] || w.to, x + 1, y - 6); g.fillStyle = '#cfe4ff'; g.fillText(MAP_NAMES[w.to] || w.to, x, y - 7); }
    for (const e of W.ents) if (e.kind === 'npc' && !e.leaving) { const [x, y] = pt(e.x, e.y); g.fillStyle = '#7bff9a'; g.beginPath(); g.arc(x, y, 3.5, 0, 6.3); g.fill(); g.fillStyle = '#000'; g.fillText(e.name, x + 1, y - 5); g.fillStyle = '#d8ffe0'; g.fillText(e.name, x, y - 6); }
    for (const e of W.ents) if (e.kind === 'enc') { const [x, y] = pt(e.x, e.y); g.fillStyle = '#ff6a6a'; g.fillRect(x - 2, y - 2, 4, 4); }
    const nav = Q.nav(); if (nav && nav.x !== undefined) { const [x, y] = pt(nav.x, nav.y), b = 1 + Math.sin(G.t * 4) * 2; g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(x, y - 9 - b); g.lineTo(x + 6, y - 2); g.lineTo(x, y + 5); g.lineTo(x - 6, y - 2); g.fill(); g.strokeStyle = '#000'; g.stroke(); g.fillStyle = '#fff'; g.fillText(nav.here ? 'Tujuan' : 'Menuju', x, y - 14); }
    const [px, py] = pt(W.player.x, W.player.y); g.fillStyle = '#4aa8ff'; g.beginPath(); g.arc(px, py, 5, 0, 6.3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.lineWidth = 1;
  },

  /* ---------------- PARTY ---------------- */
  r_party(P) {
    let h = this.note(P) + '<div class="cards2">';
    for (const id of S.party) { const C = CHARS[id], ch = S.chars[id], st = statsOf(id), nx = expNeed(ch.lv);
      h += `<div class="pcard"><h4>${esc(C.n)} <small>${esc(C.cls)} · Lv ${ch.lv}</small></h4><p class="txt small">${esc(C.desc)}</p><div class="bar hp"><i style="width:${ch.hp / st.maxhp * 100}%"></i></div><small>HP ${ch.hp}/${st.maxhp} · MP ${ch.mp}/${st.maxmp}</small><div class="bar xp"><i style="width:${ch.exp / nx * 100}%"></i></div><small>EXP ${ch.exp}/${nx}</small><div class="stats">${STAT_KEYS.filter(k => k[0] !== 'hp' && k[0] !== 'mp').map(([k, n]) => `<span>${n} <b>${st[k]}</b></span>`).join('')}</div>${id !== 'arga' ? `<button class="btn" data-a="talk" data-id="${id}"><span class="l">Bicara</span><span class="s">Obrolan & misi pribadi</span></button>` : ''}</div>`; }
    h += '</div><h4>Persahabatan</h4><div class="frl">';
    for (const id in NPCS) { const f = S.fr[id], met = f && (f.pts > 0 || f.talkDay); if (!met && !(id === 'wira' && F('metWira'))) continue; const lv = FR.lv(id); h += `<div class="frr"><b>${esc(NPCS[id].n)}</b><span>${esc(NPCS[id].role)}</span><span class="hearts">${'♥'.repeat(lv)}${'♡'.repeat(5 - lv)}</span><em>${FR_NAMES[lv]}</em></div>`; }
    return h + '</div>';
  },

  /* ---------------- ITEM ---------------- */
  r_item(P) {
    const us = Items.list(), other = Object.keys(S.inv).filter(k => !Items.usable(k));
    let h = this.note(P);
    if (P.use) { h += `<p class="txt">Pakai <b>${esc(ITEMS[P.use].n)}</b> ke siapa?</p><div class="col">${S.party.map(id => { const st = statsOf(id), ch = S.chars[id]; return `<button class="btn" data-a="usedo" data-id="${id}"><span class="l">${esc(CHARS[id].n)}</span><span class="s">HP ${ch.hp}/${st.maxhp} · MP ${ch.mp}/${st.maxmp}${ch.hp <= 0 ? ' · KO' : ''}</span></button>`; }).join('')}<button class="btn back" data-a="usecancel">◀ Batal</button></div>`; return h; }
    h += `<h4>Bisa dipakai</h4><div class="list">${us.length ? us.map(k => `<button class="btn row2" data-a="use" data-k="${k}"><span class="l">${esc(ITEMS[k].n)} ×${S.inv[k]}</span><span class="s">${esc(ITEMS[k].d || '')}</span></button>`).join('') : '<p class="txt">Tidak ada.</p>'}</div>`;
    h += `<h4>Tas</h4><div class="chips">${other.map(k => `<span class="chip" title="${esc(ITEMS[k].d || statTxt(ITEMS[k], S.up[k] || 0))}">${esc(ITEMS[k].n)} ×${S.inv[k]}${S.up[k] ? ' +' + S.up[k] : ''}</span>`).join('') || '—'}</div>`; return h;
  },

  /* ---------------- GEAR ---------------- */
  r_gear(P) {
    const id = P.ch, C = CHARS[id], ch = S.chars[id], st = statsOf(id); let h = this.memberBar(P) + this.note(P);
    h += `<div class="stats big">${STAT_KEYS.map(([k, n]) => `<span>${n} <b>${k === 'hp' ? st.maxhp : k === 'mp' ? st.maxmp : st[k]}</b></span>`).join('')}</div>`;
    h += '<div class="col">' + ['w', 'a', 'x'].map(sl => { const it = ch.eq[sl]; return `<button class="btn ${P.slot === sl ? 'on' : ''}" data-a="slot" data-s="${sl}"><span class="l">${SLOT_N[sl]}: ${it ? esc(ITEMS[it].n) + (S.up[it] ? ` +${S.up[it]}` : '') : '— kosong —'}</span><span class="s">${it ? esc(statTxt(ITEMS[it], S.up[it] || 0)) : 'Ketuk untuk memilih'}</span></button>`; }).join('') + '</div>';
    if (P.slot) { const sl = P.slot, ty = { w: 'weapon', a: 'armor', x: 'acc' }[sl];
      const cand = Object.keys(S.inv).filter(k => ITEMS[k].t === ty && (sl !== 'w' || ITEMS[k].f === id));
      h += `<h4>Pilih ${SLOT_N[sl]}</h4><div class="list">${sl === 'x' && ch.eq.x ? `<button class="btn row2" data-a="eq" data-k=""><span class="l">Lepas aksesori</span></button>` : ''}${cand.length ? cand.map(k => { const used = S.party.filter(c => S.chars[c].eq[sl] === k && c !== id).length, free = (S.inv[k] || 0) - used; return `<button class="btn row2" data-a="eq" data-k="${k}" ${free <= 0 ? 'disabled' : ''}><span class="l">${esc(ITEMS[k].n)}${S.up[k] ? ` +${S.up[k]}` : ''} ${ch.eq[sl] === k ? '(dipakai)' : ''}</span><span class="s">${esc(statTxt(ITEMS[k], S.up[k] || 0))}${free <= 0 ? ' · dipakai orang lain' : ''}</span></button>`; }).join('') : '<p class="txt">Tidak ada yang cocok. Racik di Meja Kerja (toko Bu Sari).</p>'}</div>`; }
    h += `<p class="txt small">Tempa (+upgrade) di Meja Kerja Toko Sari. Senjata hanya bisa dipakai pemilik jenisnya.</p>`; return h;
  },

  /* ---------------- SKILL (BP) ---------------- */
  r_skill(P) {
    const id = P.ch, C = CHARS[id], ch = S.chars[id]; let h = this.memberBar(P) + this.note(P) + `<p class="txt"><b>BP: ${S.bp}</b> — didapat tiap naik level dan menang pertarungan. Level ${C.n}: ${ch.lv}</p><div class="list">`;
    for (const sid of C.skills) { const sk = SK[sid]; if (sid === C.basic) continue; const own = ch.sk.includes(sid), reqOk = !sk.req || ch.sk.includes(sk.req), lvOk = ch.lv >= (sk.lv || 1), bpOk = S.bp >= (sk.bp || 0), can = !own && reqOk && lvOk && bpOk;
      const why = own ? 'DIPELAJARI' : !lvOk ? `Butuh Lv ${sk.lv}` : !reqOk ? `Butuh ${SK[sk.req].n}` : !bpOk ? `Butuh ${sk.bp} BP` : `Buka (${sk.bp} BP)`;
      h += `<button class="btn row2 sk${own ? ' own' : ''}" data-a="learn" data-k="${sid}" ${can ? '' : 'disabled'}><span class="l">${elChip(sk.el)}${esc(sk.n)}${sk.ult ? ' <b class="ult">ULT</b>' : ''} <small>MP ${sk.mp}${sk.pow ? ` · Daya ${sk.pow}${sk.hits ? '×' + sk.hits : ''}` : ''}</small></span><span class="s">${esc(sk.d)}</span><span class="pr">${why}</span></button>`; }
    h += '</div><h4>Combo (gauge Sinkron)</h4>' + COMBOS.filter(c => c.pair.every(i => S.party.includes(i))).map(c => `<p class="lore"><b>${esc(c.n)}</b> — ${esc(c.d)}</p>`).join('') || '<p class="txt">Rekrut sekutu untuk membuka Combo.</p>';
    return h;
  },

  /* ---------------- BISNIS ---------------- */
  r_bisnis(P) {
    const ev = MARKET_EVENTS[S.market.ev]; let h = this.note(P) + `<div class="bar2"><span>${ICON.gold} ${S.gold}</span><span>Pasar: <b>${ev.n}</b></span><span>Keuntungan siap diambil: <b>${S.bank}</b></span></div><button class="btn" data-a="collect" ${S.bank > 0 ? '' : 'disabled'}><span class="l">Ambil Keuntungan (${S.bank} Gold)</span></button><div class="list">`;
    for (const k in BIZ) { const B = BIZ[k], lv = S.biz[k], locked = B.need && !F(B.need), c = B.cost[lv + 1];
      h += `<div class="biz"><b>${esc(B.n)}</b> <small>Lv ${lv}/4 · +${B.inc[lv]} Gold/hari</small><p class="txt small">${esc(B.d)}${locked ? ' <i>(Belum terbuka — temukan tambang di hutan.)</i>' : ''}</p><button class="btn" data-a="inv" data-k="${k}" ${lv >= 4 || locked || S.gold < c ? 'disabled' : ''}><span class="l">${lv >= 4 ? 'Maksimum' : `Investasi ${c} Gold`}</span><span class="s">${lv < 4 ? `→ +${B.inc[lv + 1]} Gold/hari` : ''}</span></button></div>`; }
    h += `</div><p class="txt small">Keuntungan masuk tiap hari baru. Investasi Ladang menambah petak; investasi Toko menambah stok harian.</p>`; return h;
  },

  /* ---------------- OPSI ---------------- */
  r_opsi(P) {
    const sp = S.settings; return this.note(P) + `<div class="col">
    <button class="btn" data-a="save"><span class="l">Simpan Game</span><span class="s">Otomatis juga tersimpan saat pindah area</span></button>
    <button class="btn" data-a="load" ${hasSave() ? '' : 'disabled'}><span class="l">Muat Game</span></button>
    <label class="sl">Volume musik & efek <input type="range" min="0" max="100" value="${Math.round(sp.vol * 100)}" data-r="vol"></label>
    <label class="sl">Volume suara dialog <input type="range" min="0" max="100" value="${Math.round(sp.voice * 100)}" data-r="voice"></label>
    <button class="btn" data-a="speed"><span class="l">Kecepatan teks & battle: ${sp.speed === 2 ? 'CEPAT (2x)' : 'Normal (1x)'}</span></button>
    <button class="btn" data-a="mute"><span class="l">Suara: ${Audio8.muted && Audio8.muted() ? 'MATI' : 'HIDUP'}</span></button>
    <button class="btn" data-a="csv"><span class="l">Ekspor daftar Voice ID (.csv)</span><span class="s">${VOICE.all().length} baris dialog · taruh rekaman di Audio/Voice_Dialog/</span></button>
    <button class="btn" data-a="json"><span class="l">Ekspor templat voices.json</span><span class="s">Pemetaan ID → nama file. File tak ada = dialog tetap jalan.</span></button>
    <button class="btn" data-a="title"><span class="l">Ke Menu Judul</span></button></div>
    <p class="txt small">Kontrol: WASD/panah gerak · E/Spasi aksi · J jurnal · M peta · I tas · Esc menu · N bisu. Layar sentuh: geser kiri = joystick, tombol A = aksi.</p>`;
  },
  a_opsi(P, m) { m.querySelectorAll('input[data-r]').forEach(i => { i.oninput = () => { const v = +i.value / 100; if (i.dataset.r === 'vol') { S.settings.vol = v; Audio8.setVol(v); } else S.settings.voice = v; }; }); },

  /* ---------------- aksi ---------------- */
  handlers(P) {
    const say = (t, bad) => { P.note = t; P.bad = !!bad; if (bad) Audio8.sfx('error'); };
    return {
      ch: d => { P.ch = d.id; P.slot = null; P.note = ''; },
      q: d => { P.sel = d.id; }, track: d => { S.track = d.id; say('Misi dilacak.'); }, wait: d => { UI.waitUntil(+d.h); return false; },
      talk: d => { UI.closeAll(); UI.talk(d.id); return false; },
      use: d => { P.use = d.k; }, usecancel: () => { P.use = null; },
      usedo: d => {
        const ch = S.chars[d.id], st = statsOf(d.id), t = { name: CHARS[d.id].n, hp: ch.hp, maxhp: st.maxhp, mp: ch.mp, maxmp: st.maxmp, status: {} };
        const r = Items.apply(P.use, t, b => { ch.bonusHp = (ch.bonusHp || 0) + b; });
        if (!r) { say('Tidak ada efek.', true); return; }
        ch.hp = Math.min(t.hp, statsOf(d.id).maxhp); ch.mp = t.mp; takeItem(P.use, 1); Audio8.sfx('heal'); say(r); if (!has(P.use)) P.use = null;
      },
      slot: d => { P.slot = P.slot === d.s ? null : d.s; },
      eq: d => { const ch = S.chars[P.ch]; ch.eq[P.slot] = d.k || null; const st = statsOf(P.ch); ch.hp = Math.min(ch.hp, st.maxhp); ch.mp = Math.min(ch.mp, st.maxmp); Audio8.sfx('select'); say(d.k ? `${ITEMS[d.k].n} dipasang.` : 'Aksesori dilepas.'); P.slot = null; },
      learn: d => { const sk = SK[d.k], ch = S.chars[P.ch]; if (S.bp < sk.bp) return; S.bp -= sk.bp; ch.sk.push(d.k); Audio8.sfx('levelup'); say(`${sk.n} dipelajari!`); },
      inv: d => { const r = ECO.invest(d.k); say(r, !/naik/.test(r)); }, collect: () => { say(ECO.collect()); },
      save: () => { Slots.open('save'); return false; }, qsave: () => { saveGame(true); return false; },
      load: () => { Slots.open('load'); return false; },
      speed: () => { S.settings.speed = S.settings.speed === 2 ? 1 : 2; },
      mute: () => { Audio8.toggleMute(); },
      csv: () => { say(download('voice_lines.csv', VOICE.csv()) ? 'voice_lines.csv diunduh.' : 'Gagal mengunduh.'); },
      json: () => { const o = {}; VOICE.all().forEach(r => { o[r.id] = ''; }); say(download('voices.json', JSON.stringify(o, null, 1), 'application/json') ? 'Isi nama file (relatif ke Audio/Voice_Dialog/) tiap ID, simpan sebagai voices.json.' : 'Gagal.'); },
      title: () => { UI.confirm('Kembali ke menu judul? Simpan dulu bila perlu.', () => { UI.closeAll(); Game.toTitle(); }); return false; },
    };
  },
};
