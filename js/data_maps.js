/* data_maps.js — peta, bangunan, objek. (dibangun dengan kelas MB)  */
'use strict';
const TS = 16;                         // ukuran tile
const T = { GRASS: 0, DIRT: 1, WATER: 2, CAVE: 3, CWALL: 4, WOOD: 5, IWALL: 6, FORT: 7, FWALL: 8, VOID: 9, BRIDGE: 11, SOIL: 12, CARPET: 13 };
const SOLID_T = new Set([T.WATER, T.CWALL, T.IWALL, T.FWALL, T.VOID]);


/* RNG deterministik supaya peta selalu sama */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

class MB {
  constructor(id, name, w, h, fill, opt = {}) {
    Object.assign(this, { id, name, w, h, music: 'desa', dark: 0, kind: 'outdoor', theme: 'grass' }, opt);
    this.grid = Array.from({ length: h }, () => Array(w).fill(fill));
    this.props = []; this.animals = []; this.encs = []; this.chests = []; this.nodes = []; this.inters = []; this.plots = [];
    this.warps = []; this.triggers = []; this.blocks = []; this.crystals = []; this.signs = [];
    this.decos = []; this.reserved = []; this._en = 0;
  }
  set(x, y, t) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.grid[y][x] = t; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? T.VOID : this.grid[y][x]; }
  rect(x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); return this; }
  ellipse(cx, cy, rx, ry, t) {
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++)
      if ((i * i) / (rx * rx + .5) + (j * j) / (ry * ry + .5) <= 1) this.set(cx + i, cy + j, t);
    return this;
  }
  path(pts, w, t) {   // jalur tebal mengikuti titik-titik
    for (let k = 0; k < pts.length - 1; k++) {
      const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2 || 1;
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x1 + (x2 - x1) * s / n), y = Math.round(y1 + (y2 - y1) * s / n);
        this.rect(x - (w >> 1), y - (w >> 1), w, w, t);
      }
    }
    return this;
  }
  keep(x, y, w, h) { this.reserved.push([x, y, w, h]); return this; }
  isReserved(x, y) { return this.reserved.some(r => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]); }

  /* --- objek bersolid --- */
  tree(tx, ty, kind) {
    const big = kind === 'big' || (kind === undefined && (tx * 7 + ty * 13) % 5 > 1);
    this.props.push({ x: tx * TS + 8, y: ty * TS + 16, spr: big ? ['treeBig', 'oakA', 'oakB'][(tx * 3 + ty * 5) % 3] : 'treeMed', col: big ? [-6, -9, 12, 9] : [-4, -7, 8, 7], blockArrow: true });
  }
  /* semak: bersolid kecil. pal: g hijau, o zaitun, b cokelat, r karat */
  bush(tx, ty, size, pal) { this.props.push({ x: tx * TS + 8, y: ty * TS + 15, spr: `v_bush_${size}_${pal}`, col: size === 'l' ? [-9, -8, 18, 8] : size === 'm' ? [-7, -6, 14, 6] : [-5, -5, 10, 5] }); }
  scatterBush(seed, n, pals, ex = []) {
    const r = rng(seed); let done = 0;
    for (let k = 0; k < n * 40 && done < n; k++) {
      const tx = 2 + (r() * (this.w - 4) | 0), ty = 2 + (r() * (this.h - 4) | 0); let ok = true;
      for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1; i++) if (this.get(tx + i, ty + j) !== T.GRASS || this.isReserved(tx + i, ty + j)) { ok = false; break; }
      if (ok) for (const p of this.props) if (Math.abs(p.x - (tx * TS + 8)) < 28 && Math.abs(p.y - (ty * TS + 15)) < 24) { ok = false; break; }
      if (ok) for (const n of this.nodes) if (Math.abs(n.x - (tx * TS + 8)) < 30 && Math.abs(n.y - (ty * TS + 15)) < 26) { ok = false; break; }
      if (ok) for (const z of ex) if (tx >= z[0] && tx <= z[2] && ty >= z[1] && ty <= z[3]) { ok = false; break; }
      if (!ok) continue;
      const q = r(); this.bush(tx, ty, q < .25 ? 'l' : q < .6 ? 'm' : q < .85 ? 's' : 't', pals[(r() * pals.length) | 0]); done++;
    }
  }
  sprite(name, tx, ty, col) { this.props.push({ x: tx * TS + 8, y: ty * TS + 16, spr: name, col: col || null }); }
  house(tx, ty, door, kind = 'houseB') {   // tx = tile tengah, ty = baris tepat di bawah rumah
    const cx = tx * TS + 8, by = ty * TS;
    this.props.push({ x: cx, y: by, spr: kind, col: [-34, -50, 68, 44], blockArrow: true });
    if (door) this.warps.push({ x: cx + 3, y: by - 5, w: 18, h: 9, to: door.to, tx: door.tx, ty: door.ty, dir: 'up', req: door.req, msg: door.msg });
  }
  fenceRect(x0, y0, x1, y1, gaps = []) {
    const col = (x, y, c) => this.props.push({ x: x * TS + 8, y: y * TS + 16, spr: c.spr, col: c.col, flat: true });
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) {
      if (gaps.some(g => g[0] === x && g[1] === y)) continue;
      col(x, y, { spr: x === x0 ? 'fenceL' : x === x1 ? 'fenceR' : 'fenceM', col: [-8, -6, 16, 6] });
    }
    for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1])
      col(x, y, { spr: 'fenceV', col: [-4, -16, 8, 16] });
  }
  rock(tx, ty, n = 'rock1') { this.props.push({ x: tx * TS + 8, y: ty * TS + 16, spr: n, col: n === 'rock3' ? [-14, -12, 28, 12] : [-6, -8, 12, 8], blockArrow: n !== 'rock1' }); }
  crop(tx, ty, n) { this.props.push({ x: tx * TS + 8, y: ty * TS + 16, spr: n, col: null, flat: true }); }
  deco(kind, tx, ty, extra = {}) { this.decos.push({ kind, x: tx * TS + 8, y: ty * TS + 16, ...extra }); }
  border(gaps = [], step = 2) {
    const inGap = (x, y) => gaps.some(g => x >= g[0] && x < g[0] + g[2] && y >= g[1] && y < g[1] + g[3]);
    for (let x = 0; x < this.w; x += step) {
      for (const y of [0, this.h - 1]) if (!inGap(x, y)) this.tree(x, y, 'big');
      if (!inGap(x + 1, 1)) this.tree(x + 1, 1, 'med');
      if (!inGap(x + 1, this.h - 2)) this.tree(x + 1, this.h - 2, 'med');
    }
    for (let y = 2; y < this.h - 1; y += step) {
      for (const x of [0, this.w - 1]) if (!inGap(x, y)) this.tree(x, y, 'big');
      if (!inGap(1, y + 1)) this.tree(1, y + 1, 'med');
      if (!inGap(this.w - 2, y + 1)) this.tree(this.w - 2, y + 1, 'med');
    }
  }
  scatter(seed, density, margin = 3) {   // hutan lebat
    const r = rng(seed);
    for (let y = 3; y < this.h - 3; y += 2) for (let x = 3; x < this.w - 3; x += 2) {
      const tx = x + (r() < .5 ? 0 : 1), ty = y + (r() < .5 ? 0 : 1);
      if (r() > density) continue;
      let ok = true;
      for (let j = -margin; j <= margin && ok; j++) for (let i = -margin; i <= margin; i++) {
        const t = this.get(tx + i, ty + j);
        if (t !== T.GRASS || this.isReserved(tx + i, ty + j)) { if (Math.abs(i) <= 1 && Math.abs(j) <= 1 || t === T.DIRT || t === T.BRIDGE || this.isReserved(tx + i, ty + j)) ok = false; }
        if (!ok) break;
      }
      if (ok) this.tree(tx, ty);
    }
  }

  /* --- penghuni --- */
  node(kind, tx, ty) { const nx = tx * TS + 8, ny = ty * TS + 14; this.props = this.props.filter(p => !(p.col && p.spr && p.spr.startsWith('v_bush') && Math.abs(p.x - nx) < 18 && Math.abs(p.y - ny) < 14)); this.nodes.push({ id: this.id + ':n' + this.nodes.length, kind, x: tx * TS + 8, y: ty * TS + 14 }); }
  inter(kind, tx, ty, o = {}) { this.inters.push({ kind, x: tx * TS + 8, y: ty * TS + 12, r: 20, ...o }); }
  animal(kind, tx, ty, o = {}) { this.animals.push({ kind, tx, ty, id: this.id + ':a' + this.animals.length, ...o }); }
  trap(tx, ty, ph = 0) { this.deco('spikes', tx, ty, { ph }); }
  en(form, tx, ty, o = {}) { this.encs.push({ id: this.id + ':e' + (this._en++), form, x: tx * TS + 8, y: ty * TS + 8, ...o }); }
  chest(id, tx, ty, loot, o = {}) {
    const it = {}; if (loot.potion) it.potion = loot.potion; if (loot.arrows) it.herba = Math.ceil(loot.arrows / 4); if (loot.maxhp) it.hati = 1;
    this.chests.push({ id: this.id + ':' + id, x: tx * TS + 8, y: ty * TS + 16, loot: { gold: loot.gold || 0, items: { ...it, ...(loot.items || {}) } }, ...o });
  }
  warp(tx, ty, tw, th, to, dx, dy, o = {}) { this.warps.push({ x: tx * TS, y: ty * TS, w: tw * TS, h: th * TS, to, tx: dx, ty: dy, ...o }); }
  trigger(id, tx, ty, tw, th, fn, o = {}) { this.triggers.push({ id: this.id + ':' + id, x: tx * TS, y: ty * TS, w: tw * TS, h: th * TS, fn, once: true, ...o }); }
  block(id, tx, ty, tw, th, o = {}) { this.blocks.push({ id, x: tx * TS, y: ty * TS, w: tw * TS, h: th * TS, on: false, ...o }); }
  sign(tx, ty, lines) { this.signs.push({ x: tx * TS + 8, y: ty * TS + 16, lines }); }
}

/* =========================================================================
   DESA HIJAU
   ========================================================================= */
function buildDesa() {
  const m = new MB('desa', 'Desa Hijau', 50, 38, T.GRASS, { music: 'desa' });
  m.rect(0, 17, 50, 3, T.DIRT); m.rect(23, 4, 3, 34, T.DIRT); m.rect(19, 14, 11, 9, T.DIRT); m.rect(8, 30, 18, 2, T.DIRT);
  m.rect(3, 6, 9, 5, T.WATER); m.rect(4, 5, 7, 1, T.WATER); m.rect(4, 11, 7, 1, T.WATER);
  m.rect(32, 31, 13, 3, T.SOIL);

  m.border([[46, 16, 4, 5]]);
  // rumah
  m.house(14, 17, { to: 'rumah_tetua', tx: 7, ty: 10 });
  m.house(33, 17, { to: 'toko', tx: 6, ty: 8 });
  m.house(15, 30, { to: 'rumah_warga', tx: 5, ty: 8 });
  m.house(40, 12, null, 'houseA');
  m.deco('sign', 18, 17); m.sign(18, 17, ['Rumah Tetua Wira', '(Pintu ada di sebelah kanan)']);
  m.deco('sign', 29, 17); m.sign(29, 17, ['Toko Bu Sari', 'Ramuan, panah, dan asah pedang!']);
  m.deco('sign', 26, 22); m.sign(26, 22, ['Desa Hijau', 'Timur: Hutan Bisik (berbahaya!)']);

  // kolam & batu
  m.rock(12, 8); m.rock(3, 13, 'rock3'); m.rock(11, 12);
  m.chest('kolam', 3, 12, { gold: 35 });
  // pohon pelindung & hutan kecil
  [[5, 22], [7, 25], [10, 23], [4, 27], [12, 26], [9, 20], [6, 33], [11, 34], [18, 34], [21, 31], [28, 28], [29, 33], [20, 26]].forEach(p => m.tree(p[0], p[1]));
  [[36, 5], [38, 7], [43, 6], [41, 8], [34, 9], [44, 9], [46, 6]].forEach(p => m.tree(p[0], p[1]));
  // peti rahasia di balik pohon (pojok timur laut)
  m.tree(44, 3, 'big'); m.tree(46, 4, 'big'); m.tree(45, 2, 'med'); m.tree(43, 4, 'med');
  m.chest('rahasia', 45, 4, { potion: 2, gold: 20 }, { secret: 1 });
  m.inter('board', 26, 21, { label: 'Papan Pengumuman' });
  [[5, 16], [9, 24], [14, 24], [6, 30], [20, 33], [13, 12], [3, 20]].forEach((p, i) => m.node(i % 3 === 2 ? 'bunga' : 'herba', p[0], p[1]));
  [[10, 12], [16, 5], [35, 16], [2, 34]].forEach(p => m.node('kayu', p[0], p[1]));

  // peternakan
  m.fenceRect(30, 23, 46, 35, [[37, 23], [38, 23]]);
  for (let i = 0; i < 6; i++) { m.plots.push({ x: (32 + i * 2) * TS + 8, y: 31 * TS + 16 }); m.plots.push({ x: (32 + i * 2) * TS + 8, y: 33 * TS + 16 }); }
  m.animal('cow', 34, 27, { v: 'f' }); m.animal('cow', 42, 28, { v: 'm' }); m.animal('cow', 40, 26, { v: 'f' });
  m.animal('chicken', 35, 29, { v: 'blonde' }); m.animal('chicken', 43, 25, { v: 'blonde' }); m.animal('chick', 36, 29); m.animal('chick', 41, 29);
  m.animal('sheep', 32, 25); m.animal('sheep', 44, 25); m.animal('pig', 38, 25); m.animal('pig', 34, 29);
  // ayam hilang (quest sampingan)
  m.animal('chicken', 5, 24, { v: 'red', quest: true }); m.animal('chicken', 43, 10, { v: 'red', quest: true }); m.animal('chicken', 28, 34, { v: 'red', quest: true });


  // gerbang timur -> hutan
  m.warp(49, 16, 1, 5, 'hutan', 2, 23, { req: () => F('metWira'), msg: 'Temui Tetua Wira dulu di alun-alun.', dir: 'right' });
  m.scatterBush(1717, 22, ['g', 'g', 'g', 'o'], [[29, 22, 47, 36]]);
  return m;
}

/* =========================================================================
   INTERIOR
   ========================================================================= */
function room(id, name, w, h, music) {
  const m = new MB(id, name, w, h, T.WOOD, { music, kind: 'indoor', theme: 'wood' });
  m.rect(0, 0, w, 2, T.IWALL); m.rect(0, 0, 1, h, T.IWALL); m.rect(w - 1, 0, 1, h, T.IWALL);
  return m;
}
function buildTetua() {
  const m = room('rumah_tetua', 'Rumah Tetua Wira', 16, 12, 'desa');
  m.deco('rug', 6, 7); m.sprite('fire', 11, 2, [-12, -10, 24, 8]); m.sprite('bedV', 3, 3, [-9, -22, 18, 22]);
  m.sprite('table', 8, 7, [-11, -12, 22, 10]); m.sprite('chair', 6, 7, [-5, -6, 10, 6]); m.sprite('chair', 10, 7, [-5, -6, 10, 6]);
  m.sprite('drawer', 14, 2, [-8, -8, 16, 8]); m.sprite('plant', 1, 3); m.sprite('ptree', 14, 5, [-5, -4, 10, 4]);
  m.deco('wall', 6, 1, { spr: 'picture' }); m.deco('wall', 8, 1, { spr: 'clock' });
  m.chest('tetua', 13, 9, { potion: 2, arrows: 5 });
  m.inter('bed', 3, 5, { label: 'Tidur' });
  m.warp(7, 11, 2, 1, 'desa', 15, 17, { dir: 'down', instant: true });
  return m;
}
function buildToko() {
  const m = room('toko', 'Toko Bu Sari', 14, 10, 'desa');
  m.sprite('drawer', 3, 3, [-8, -8, 16, 8]); m.sprite('drawer', 4, 3, [-8, -8, 16, 8]); m.sprite('drawer', 9, 3, [-8, -8, 16, 8]);
  m.sprite('plant', 11, 3); m.sprite('ptree', 2, 6, [-5, -4, 10, 4]);
  m.sprite('table', 6, 5, [-11, -12, 22, 10]); m.sprite('table', 7, 5, [-11, -12, 22, 10]);
  m.deco('wall', 6, 1, { spr: 'picture' }); m.deco('wall', 8, 1, { spr: 'clock' });
  m.deco('bench', 10, 6); m.inter('bench', 10, 6, { label: 'Meja Kerja' });
  m.warp(6, 9, 2, 1, 'desa', 34, 17, { dir: 'down', instant: true });
  return m;
}
function buildWarga() {
  const m = room('rumah_warga', 'Rumah Nenek Lastri', 12, 10, 'desa');
  m.deco('rug', 4, 6); m.sprite('bedH', 8, 4, [-14, -8, 28, 10]); m.sprite('fire', 3, 2, [-12, -10, 24, 8]);
  m.sprite('chair', 5, 5, [-5, -6, 10, 6]); m.sprite('plant', 10, 3); m.sprite('drawer', 6, 2, [-8, -8, 16, 8]);
  m.chest('lastri', 10, 7, { gold: 25 });
  m.inter('bed', 8, 5, { label: 'Tidur' });
  m.warp(5, 9, 2, 1, 'desa', 16, 30, { dir: 'down', instant: true });
  return m;
}

/* =========================================================================
   HUTAN BISIK
   ========================================================================= */
function buildHutan() {
  const m = new MB('hutan', 'Hutan Bisik', 72, 48, T.GRASS, { music: 'hutan', tintDark: .12 });
  // sungai + jembatan
  m.rect(26, 0, 3, 48, T.WATER); m.rect(26, 13, 3, 3, T.BRIDGE);
  // jalan setapak
  m.path([[0, 23], [18, 23], [18, 14], [25, 14]], 3, T.DIRT);
  m.path([[29, 14], [36, 14], [36, 30], [52, 30], [52, 10], [60, 10]], 3, T.DIRT);
  m.path([[36, 30], [36, 38], [44, 38]], 3, T.DIRT);
  m.rect(8, 20, 11, 7, T.DIRT);               // lahan terbuka barat
  m.rect(40, 28, 13, 13, T.DIRT);             // kamp orc
  m.rect(54, 5, 14, 11, T.DIRT);              // arena kapten
  m.keep(2, 20, 20, 8); m.keep(38, 26, 16, 16); m.keep(52, 3, 18, 14); m.keep(56, 0, 8, 6);
  m.border([[0, 21, 2, 5], [58, 0, 5, 3]]);
  m.scatter(777, .97, 2);
  m.scatterBush(4242, 70, ['o', 'o', 'b', 'g', 'r']);

  // pintu gua (terkunci)
  m.deco('caveDoor', 60, 4);
  m.rock(57, 4, 'rock3'); m.rock(63, 4, 'rock3'); m.rock(55, 3, 'rock2'); m.rock(65, 3, 'rock2');
  m.warp(59, 3, 3, 2, 'gua', 24, 41, { req: () => has('kunci'), msg: 'Pintu gua terkunci. Butuh Kunci Gua.', dir: 'up', onOpen: 'caveOpen' });
  m.warp(0, 21, 1, 5, 'desa', 47, 18, { dir: 'left' });

  // kamp orc + kerangkeng
  m.deco('campfire', 45, 35); m.deco('cage', 47, 32, { id: 'cage' });
  m.rock(41, 31, 'rock1'); m.rock(51, 36); m.rock(42, 39); m.rock(50, 29);
  m.en('camp', 45, 35, { q: 'camp' });
  // balok penghalang jalan ke utara (sampai Darma bebas)
  m.deco('log', 52, 24); m.block('log', 51, 23, 3, 2, { vis: false });

  // musuh-musuh
  m.en('raider', 12, 22); m.en('raider', 17, 26); m.en('raider', 21, 13);
  m.en('w_orc1', 33, 17); m.en('w_orc2', 32, 12); m.en('w_orc2', 40, 15); m.en('w_orc3', 44, 22); m.en('w_orc3', 37, 26);
  m.en('captain', 61, 10);
  m.inter('liontin', 41, 38, { label: 'Benda berkilau', need: 'kenangStart' });
  m.trigger('budiAmbush', 7, 20, 3, 7, 'budiAmbush', { once: false });
  [[9, 18], [14, 18], [22, 20], [30, 10], [20, 30], [31, 36], [36, 20], [46, 8], [58, 18], [45, 45]].forEach((p, i) => m.node(i % 4 === 3 ? 'bijih' : 'herba', p[0], p[1]));
  [[10, 12], [19, 36], [34, 24], [56, 8], [8, 28]].forEach(p => m.node('bulan', p[0], p[1]));
  [[12, 16], [25, 22], [48, 14], [32, 40]].forEach(p => m.node('kayu', p[0], p[1]));

  m.chest('barat', 10, 27, { gold: 40 });
  m.chest('sungai', 24, 8, { arrows: 10 });
  m.chest('timur', 46, 12, { potion: 1, gold: 30 });
  m.chest('hati', 66, 7, { maxhp: 20 }, { hidden: true, needFlag: 'captainDown', secret: 1 });
  m.sign(4, 24, ['Hutan Bisik', 'Awas: orc berkeliaran. Jalan setapak ke timur.']);
  m.deco('sign', 4, 24);
  return m;
}

/* =========================================================================
   GUA GEMA
   ========================================================================= */
function buildGua() {
  const m = new MB('gua', 'Gua Gema', 48, 44, T.CWALL, { music: 'gua', dark: .86, theme: 'cave' });
  m.rect(16, 32, 17, 10, T.CAVE); m.rect(22, 42, 5, 2, T.CAVE);
  m.rect(22, 28, 5, 4, T.CAVE);
  m.rect(8, 20, 33, 9, T.CAVE);
  m.rect(10, 22, 5, 5, T.WATER); m.rect(34, 22, 5, 5, T.WATER); m.rect(22, 22, 5, 3, T.WATER);
  m.rect(22, 14, 5, 6, T.CAVE);
  m.rect(14, 6, 21, 8, T.CAVE);
  m.rect(22, 1, 5, 5, T.CAVE);

  m.warp(22, 43, 5, 1, 'hutan', 61, 6, { dir: 'down', instant: true });
  m.warp(22, 1, 5, 1, 'benteng', 22, 36, { dir: 'up', instant: true, onOpen: 'fortEnter' });

  // obor
  [[17, 31], [31, 31], [9, 19], [39, 19], [21, 19], [27, 19], [14, 5], [34, 5], [21, 3], [27, 3]].forEach(p => m.deco('torch', p[0], p[1]));
  // ruang 1
  m.en('g_guard', 19, 38); m.en('g_skel1', 27, 35); m.en('g_skel1', 22, 40);
  m.chest('awal', 30, 40, { arrows: 12, potion: 1 });
  m.rock(18, 34, 'rock1'); m.rock(30, 39, 'rock1');
  // ruang puzzle
  m.deco('pedestal', 15, 24); m.deco('pedestal', 33, 24); m.deco('pedestal', 24, 26);
  m.crystals.push({ id: 'R', x: 15 * TS + 8, y: 24 * TS + 8, c: '#ff5050', order: 0 });
  m.crystals.push({ id: 'B', x: 33 * TS + 8, y: 24 * TS + 8, c: '#4aa8ff', order: 1 });
  m.crystals.push({ id: 'K', x: 24 * TS + 8, y: 26 * TS + 8, c: '#ffe14a', order: 2 });
  m.deco('inscription', 21, 29); m.inter('inscription', 21, 29, { label: 'Prasasti Kuno', r: 26 });
  m.en('g_skel2', 13, 28); m.en('g_demon', 34, 28); m.en('g_skel2', 24, 28); m.en('g_skel1', 18, 21);
  [[10, 21], [39, 21], [9, 27], [40, 27], [16, 10], [32, 10], [24, 3]].forEach((p, i) => m.node(i % 3 === 2 ? 'kristal' : 'bijih', p[0], p[1]));
  [[19, 32], [20, 32], [28, 32], [29, 32]].forEach((p, i) => m.trap(p[0], p[1], i * .8));
  m.deco('fountain', 17, 25, { c: 'blue', v: 0 }); m.deco('fountain', 31, 25, { c: 'red', v: 1 });
  m.block('gate', 22, 19, 5, 1, { vis: 'gate', on: true });
  // arena
  m.block('arena', 22, 14, 5, 1, { vis: 'bars', on: false });
  m.trigger('arena', 17, 7, 15, 5, 'arena', { once: true });
  m.chest('arena', 24, 7, { maxhp: 20 }, { hidden: true, needFlag: 'arenaClear', secret: 1 });
  m.chest('sisi', 16, 7, { potion: 2, arrows: 10 }, { hidden: true, needFlag: 'arenaClear' });
  return m;
}

/* =========================================================================
   BENTENG ORC
   ========================================================================= */
function buildBenteng() {
  const m = new MB('benteng', 'Benteng Orc', 44, 40, T.FWALL, { music: 'benteng', dark: .74, theme: 'fort' });
  m.rect(20, 38, 5, 2, T.FORT);
  m.rect(10, 26, 25, 12, T.FORT);
  m.rect(20, 21, 5, 5, T.FORT);
  m.rect(6, 3, 33, 18, T.FORT);
  m.rect(21, 4, 3, 17, T.CARPET);
  m.warp(20, 39, 5, 1, 'gua', 24, 3, { dir: 'down', instant: true });
  // obor & pilar
  [[11, 25], [33, 25], [8, 2], [20, 2], [25, 2], [37, 2], [6, 12], [38, 12]].forEach(p => m.deco('torch', p[0], p[1]));
  [[12, 28], [32, 28], [12, 35], [32, 35]].forEach(p => m.deco('pillar', p[0], p[1], { col: true }));
  [[9, 8], [9, 14], [35, 8], [35, 14], [17, 8], [27, 8], [17, 15], [27, 15]].forEach(p => m.deco('pillar', p[0], p[1], { col: true }));
  // halaman
  m.en('f_orc', 14, 30); m.en('f_blood', 30, 31); m.en('f_demon', 22, 31); m.en('f_orc', 16, 35); m.en('f_blood', 29, 35); m.en('g_skel2', 22, 28);
  [[21, 24], [23, 24], [22, 23]].forEach((p, i) => m.trap(p[0], p[1], i * .6));
  m.deco('fountain', 17, 30, { c: 'red', v: 2 }); m.deco('fountain', 27, 30, { c: 'blue', v: 0 });
  m.chest('halaman', 11, 37, { potion: 2, arrows: 15 });
  m.chest('halaman2', 33, 37, { gold: 80 });
  // ruang takhta
  m.block('seal', 20, 21, 5, 1, { vis: 'bars', on: false });
  m.trigger('boss', 18, 15, 9, 3, 'bossGrumak', { once: true });
  m.deco('throne', 22, 5);
  return m;
}


const MAPS = { desa: buildDesa, rumah_tetua: buildTetua, toko: buildToko, rumah_warga: buildWarga, hutan: buildHutan, gua: buildGua, benteng: buildBenteng };
