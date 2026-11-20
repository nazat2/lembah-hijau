/* =========================================================================
   data_core.js  —  DATA INTI: elemen, status, item, karakter, skill, musuh, formasi, resep
   Semua angka keseimbangan ada di sini. Ubah di sini, tidak perlu menyentuh mesin.
   ========================================================================= */
'use strict';

const EL = {   // elemen: nama, ikon (huruf), warna
  slash:   { n: 'Tebas',  i: 'T', c: '#d0d8e8' },
  pierce:  { n: 'Tusuk',  i: 'U', c: '#9ad0ff' },
  fire:    { n: 'Api',    i: 'A', c: '#ff7a3a' },
  thunder: { n: 'Petir',  i: 'P', c: '#ffe14a' },
  holy:    { n: 'Suci',   i: 'S', c: '#fff4b0' },
  dark:    { n: 'Gelap',  i: 'G', c: '#b070ff' },
  ice:     { n: 'Es',     i: 'E', c: '#8ae4ff' },
  none:    { n: '-',      i: '-', c: '#aaa' },
};

const STATUS = {   // status efek
  poison: { n: 'Racun',    c: '#7bd64a', bad: 1 }, burn:   { n: 'Bakar',   c: '#ff7a3a', bad: 1 },
  stun:   { n: 'Pingsan',  c: '#ffe14a', bad: 1 }, weak:   { n: 'Lemah',   c: '#b0a0c0', bad: 1 },
  atkUp:  { n: 'ATK+',     c: '#ff8a5a' },         defUp:  { n: 'DEF+',    c: '#6ab0ff' },
  crtUp:  { n: 'KRIT+',    c: '#ffd84a' },         regen:  { n: 'Regen',   c: '#6bff8a' },
  taunt:  { n: 'Pancing',  c: '#ff6a6a' },         inv:    { n: 'Kebal',   c: '#fff' },
  enrage: { n: 'Amuk',     c: '#ff4040' },         adapt:  { n: 'Adaptasi', c: '#c0a0ff' },
};

/* ---------------- ITEM ---------------- */
// tipe: use (dipakai), mat (bahan), crop, seed, gift, weapon/armor/acc (perlengkapan), key
const ITEMS = {
  potion:  { n: 'Ramuan',          t: 'use', p: 25,  d: 'Pulihkan 60 HP.',               heal: 60 },
  potion2: { n: 'Ramuan Besar',    t: 'use', p: 70,  d: 'Pulihkan 160 HP.',              heal: 160 },
  ether:   { n: 'Elixir',          t: 'use', p: 45,  d: 'Pulihkan 30 MP.',               mp: 30 },
  antidote:{ n: 'Penawar',         t: 'use', p: 20,  d: 'Hapus racun & bakar.',          cure: 1 },
  revive:  { n: 'Bunga Hidup',     t: 'use', p: 90,  d: 'Bangkitkan sekutu (50% HP).',   revive: .5 },
  hati:    { n: 'Kristal Hati',    t: 'use', p: 0,   d: 'Naikkan HP maks anggota +20 selamanya.', maxhp: 20 },
  // bahan
  herba:   { n: 'Herba Hijau',     t: 'mat', p: 6,   d: 'Daun obat umum.' },
  bulan:   { n: 'Bunga Bulan',     t: 'mat', p: 40,  d: 'Hanya mekar malam hari.' },
  kayu:    { n: 'Kayu',            t: 'mat', p: 5,   d: 'Kayu keras.' },
  bijih:   { n: 'Bijih Besi',      t: 'mat', p: 14,  d: 'Untuk menempa.' },
  kristal: { n: 'Serpihan Kristal',t: 'mat', p: 35,  d: 'Berpendar lembut.' },
  kulit:   { n: 'Kulit Orc',       t: 'mat', p: 10,  d: 'Liat dan tebal.' },
  taring:  { n: 'Taring Orc',      t: 'mat', p: 14,  d: 'Tajam.' },
  tulang:  { n: 'Tulang Tua',      t: 'mat', p: 8,   d: 'Rapuh namun berguna.' },
  darah:   { n: 'Inti Darah',      t: 'mat', p: 45,  d: 'Masih berdenyut.' },
  bunga:   { n: 'Bunga Liar',      t: 'gift', p: 12, d: 'Cantik. Cocok untuk hadiah.' },
  madu:    { n: 'Madu Hutan',      t: 'gift', p: 30, d: 'Manis dan langka.' },
  kue:     { n: 'Kue Gandum',      t: 'gift', p: 35, d: 'Hangat dan wangi.', heal: 40 },
  kue_sari:{ n: 'Kue Rahasia Sari',t: 'gift', p: 60, d: 'Resep rahasia keluarga Sari.', heal: 90 },
  obat_nenek:{ n: 'Obat Nenek',    t: 'key', p: 0,   d: 'Ramuan khusus untuk Nenek Lastri.' },
  liontin: { n: 'Liontin Tua',     t: 'key', p: 0,   d: 'Berukir lambang orc dan manusia berdampingan.' },
  kunci:   { n: 'Kunci Gua',       t: 'key', p: 0,   d: 'Membuka pintu Gua Gema.' },
  permata: { n: 'Permata Hijau',   t: 'key', p: 0,   d: 'Jantung kehidupan Lembah.' },
  // hasil tani
  gandum:  { n: 'Gandum',          t: 'crop', p: 12 }, wortel: { n: 'Wortel', t: 'crop', p: 9 },
  tomat:   { n: 'Tomat',           t: 'crop', p: 22 }, labu:   { n: 'Labu',   t: 'crop', p: 45 },
  b_gandum:{ n: 'Bibit Gandum',    t: 'seed', p: 4,  crop: 'gandum' }, b_wortel: { n: 'Bibit Wortel', t: 'seed', p: 3, crop: 'wortel' },
  b_tomat: { n: 'Bibit Tomat',     t: 'seed', p: 8,  crop: 'tomat' },  b_labu:   { n: 'Bibit Labu',   t: 'seed', p: 16, crop: 'labu' },
  // senjata  (untuk: siapa yang boleh pakai)
  s_kayu:  { n: 'Pedang Kayu',     t: 'weapon', f: 'arga',  atk: 3,  p: 30 },
  s_besi:  { n: 'Pedang Besi',     t: 'weapon', f: 'arga',  atk: 9,  p: 140 },
  s_baja:  { n: 'Pedang Baja',     t: 'weapon', f: 'arga',  atk: 16, mat: 4, p: 320 },
  b_pendek:{ n: 'Busur Pendek',    t: 'weapon', f: 'darma', atk: 3,  p: 30 },
  b_hutan: { n: 'Busur Hutan',     t: 'weapon', f: 'darma', atk: 9,  crt: 3, p: 140 },
  b_elang: { n: 'Busur Elang',     t: 'weapon', f: 'darma', atk: 16, crt: 6, p: 320 },
  p_ksatria:{ n: 'Pedang Penjaga', t: 'weapon', f: 'jana',  atk: 3,  def: 2, p: 30 },
  p_besi:  { n: 'Pedang & Perisai Besi', t: 'weapon', f: 'jana', atk: 8, def: 5, p: 140 },
  p_baja:  { n: 'Pedang & Perisai Baja', t: 'weapon', f: 'jana', atk: 14, def: 9, p: 320 },
  n_belati:{ n: 'Belati Senja',     t: 'weapon', f: 'nyx',   atk: 3,  mat: 3, p: 30 },
  n_es:    { n: 'Belati Embun',     t: 'weapon', f: 'nyx',   atk: 8,  mat: 8, p: 140 },
  n_kutub: { n: 'Belati Kutub',     t: 'weapon', f: 'nyx',   atk: 14, mat: 15, p: 320 },
  // zirah
  z_kain:  { n: 'Baju Kain',       t: 'armor', def: 3, mdf: 2,  p: 25 },
  z_kulit: { n: 'Zirah Kulit',     t: 'armor', def: 7, mdf: 3,  p: 90 },
  z_besi:  { n: 'Zirah Besi',      t: 'armor', def: 13, mdf: 5, p: 220 },
  z_baja:  { n: 'Zirah Baja',      t: 'armor', def: 20, mdf: 9, p: 420 },
  // aksesori
  a_cincin:{ n: 'Cincin Api',      t: 'acc', atk: 4, mat: 4, p: 150 },
  a_jimat: { n: 'Jimat Hijau',     t: 'acc', hp: 40, mdf: 4,  p: 0 },
  a_anting:{ n: 'Anting Angin',    t: 'acc', spd: 4, crt: 3,  p: 130 },
  a_kalung:{ n: 'Kalung Bulan',    t: 'acc', mp: 18, mat: 4,  p: 130 },
  a_sabuk: { n: 'Sabuk Penjaga',   t: 'acc', def: 4, hp: 20,  p: 120 },
};

/* resep crafting (bisa dibuat di Meja Kerja, Toko Bu Sari) */
const RECIPES = [
  { id: 'potion',  out: 'potion', n: 2, need: { herba: 2 }, gold: 0 },
  { id: 'potion2', out: 'potion2', n: 1, need: { herba: 4, bulan: 1 }, gold: 10 },
  { id: 'antidote',out: 'antidote', n: 2, need: { herba: 2, tulang: 1 }, gold: 0 },
  { id: 'ether',   out: 'ether', n: 1, need: { kristal: 1, herba: 1 }, gold: 5 },
  { id: 'kue',     out: 'kue', n: 2, need: { gandum: 3, madu: 0 }, gold: 5 },
  { id: 'kue_sari',out: 'kue_sari', n: 1, need: { gandum: 4, madu: 1, bunga: 1 }, gold: 10, flag: 'resepSari' },
  { id: 'obat_nenek', out: 'obat_nenek', n: 1, need: { bulan: 3, herba: 2 }, gold: 0, flag: 'obatStart' },
  { id: 's_besi',  out: 's_besi', n: 1, need: { bijih: 4, kayu: 2 }, gold: 60 },
  { id: 's_baja',  out: 's_baja', n: 1, need: { bijih: 8, kristal: 2, taring: 3 }, gold: 150 },
  { id: 'b_hutan', out: 'b_hutan', n: 1, need: { kayu: 5, kulit: 2 }, gold: 60 },
  { id: 'b_elang', out: 'b_elang', n: 1, need: { kayu: 8, taring: 3, kristal: 2 }, gold: 150 },
  { id: 'p_besi',  out: 'p_besi', n: 1, need: { bijih: 4, kulit: 2 }, gold: 60 },
  { id: 'p_baja',  out: 'p_baja', n: 1, need: { bijih: 8, kristal: 2, kulit: 4 }, gold: 150 },
  { id: 'n_es',    out: 'n_es', n: 1, need: { bijih: 3, kristal: 2 }, gold: 60 },
  { id: 'n_kutub', out: 'n_kutub', n: 1, need: { bijih: 6, kristal: 4, taring: 3 }, gold: 150 },
  { id: 'z_kulit', out: 'z_kulit', n: 1, need: { kulit: 4 }, gold: 20 },
  { id: 'z_besi',  out: 'z_besi', n: 1, need: { bijih: 6, kulit: 3 }, gold: 90 },
  { id: 'z_baja',  out: 'z_baja', n: 1, need: { bijih: 10, kristal: 3, tulang: 4 }, gold: 200 },
  { id: 'a_cincin',out: 'a_cincin', n: 1, need: { kristal: 2, bijih: 2 }, gold: 60 },
  { id: 'a_anting',out: 'a_anting', n: 1, need: { taring: 2, bunga: 2 }, gold: 40 },
  { id: 'a_sabuk', out: 'a_sabuk', n: 1, need: { kulit: 3, bijih: 2 }, gold: 40 },
];
/* upgrade perlengkapan: level +1..+5. Biaya naik tiap level. */
const UPG = { max: 5, cost: lv => ({ gold: 40 + lv * 45, bijih: 1 + lv, kristal: lv >= 3 ? lv - 2 : 0 }), mult: lv => 1 + lv * .12 };

/* tanaman */
const CROPS = {
  gandum: { n: 'Gandum', grow: 300, seed: 'b_gandum', spr: 'cropA', yield: [2, 3] },
  wortel: { n: 'Wortel', grow: 200, seed: 'b_wortel', spr: 'cropB', yield: [2, 3] },
  tomat:  { n: 'Tomat',  grow: 420, seed: 'b_tomat',  spr: 'cropC', yield: [2, 4] },
  labu:   { n: 'Labu',   grow: 600, seed: 'b_labu',   spr: 'cropD', yield: [1, 2] },
};

/* bisnis: modal per level, penghasilan per hari */
const BIZ = {
  toko:  { n: 'Toko Bu Sari',   d: 'Perluas stok dan etalase.',      cost: [0, 120, 260, 480, 800], inc: [0, 12, 30, 58, 100] },
  ladang:{ n: 'Ladang Pak Joko',d: 'Tambah petak & hasil panen.',     cost: [0, 100, 220, 420, 700], inc: [0, 10, 26, 50, 88] },
  tambang:{ n: 'Tambang Kecil', d: 'Gali bijih di tebing hutan.',     cost: [0, 160, 320, 560, 900], inc: [0, 14, 34, 64, 110], need: 'tambang' },
};

/* ---------------- KARAKTER (pesta) ---------------- */
const CHARS = {
  arga: { n: 'Arga', cls: 'Ksatria', cat: 'MC', spr: 'knight',
    base: { hp: 120, mp: 30, atk: 14, def: 9, mat: 10, mdf: 7, spd: 10, crt: 8 },
    grow: { hp: 17, mp: 4, atk: 3, def: 2, mat: 2, mdf: 1.5, spd: .6, crt: .25 },
    w: 's_kayu', a: 'z_kain', basic: 'atk_arga', skills: ['atk_arga', 'a_cross', 'a_bash', 'a_flame', 'a_bolt', 'a_rally', 'a_holy', 'u_arga'], desc: 'Ksatria muda pulang ke desa. Seimbang: serangan kuat, dukungan, dan elemen.' },
  darma: { n: 'Pak Darma', cls: 'Pemburu', cat: 'CMP', spr: 'hunter',
    base: { hp: 95, mp: 34, atk: 13, def: 6, mat: 8, mdf: 6, spd: 13, crt: 14 },
    grow: { hp: 13, mp: 4, atk: 3, def: 1.3, mat: 1.5, mdf: 1.2, spd: .8, crt: .35 },
    w: 'b_pendek', a: 'z_kain', basic: 'atk_darma', skills: ['atk_darma', 'd_double', 'd_poison', 'd_weak', 'd_fire', 'd_rain', 'd_focus', 'u_darma'], desc: 'Pemburu tua yang hafal hutan. Cepat, kritikal, ahli menembus pertahanan.' },
  jana: { n: 'Jana', cls: 'Penjaga', cat: 'CMP', spr: 'joanna',
    base: { hp: 135, mp: 28, atk: 11, def: 12, mat: 10, mdf: 10, spd: 7, crt: 5 },
    grow: { hp: 20, mp: 3.5, atk: 2.3, def: 2.6, mat: 2.1, mdf: 2.2, spd: .4, crt: .1 },
    w: 'p_ksatria', a: 'z_kain', basic: 'atk_jana', skills: ['atk_jana', 'j_guard', 'j_bless', 'j_taunt', 'j_smash', 'j_pray', 'j_revive', 'u_jana'], desc: 'Mantan pengawal kerajaan. Tameng party, penyembuh, dan pemancing musuh.' },
  nyx: { n: 'Nyx', cls: 'Ksatria Senja', cat: 'CMP', spr: 'nyx',
    base: { hp: 100, mp: 40, atk: 12, def: 7, mat: 15, mdf: 9, spd: 12, crt: 12 },
    grow: { hp: 14, mp: 4.5, atk: 2.4, def: 1.5, mat: 3, mdf: 1.8, spd: .7, crt: .3 },
    w: 'n_belati', a: 'z_kain', basic: 'atk_nyx', skills: ['atk_nyx', 'n_frost', 'n_chill', 'n_shatter', 'n_storm', 'n_bolt', 'n_veil', 'u_nyx'], desc: 'Ksatria Ordo Senja pemburu bayangan. Es & petir: melemahkan, membekukan, memecah shield.' },
};

/* ---------------- SKILL ----------------
 k: phys|mag|heal|buff|rev  | tgt: one|all|self|ally|allies|dead | hits | brk: kerusakan shield | st:{s,c(hance),t(turns)}
 bp: biaya BP untuk membuka | req: skill syarat | lv: level minimal | ult: butuh gauge 100 */
const SK = {
  atk_arga: { n: 'Tebas', ch: 'arga', mp: 0, el: 'slash', pow: 1.0, tgt: 'one', k: 'phys', d: 'Serangan dasar.' },
  a_cross:  { n: 'Tebasan Silang', ch: 'arga', mp: 5, el: 'slash', pow: .72, hits: 2, tgt: 'one', k: 'phys', d: 'Dua tebasan beruntun.', bp: 0 },
  a_bash:   { n: 'Pukulan Perisai', ch: 'arga', mp: 6, el: 'none', pow: 1.1, brk: 2, tgt: 'one', k: 'phys', st: { s: 'stun', c: .3, t: 1 }, d: 'Pecahkan shield (x2). 30% pingsan.', bp: 2, lv: 2 },
  a_flame:  { n: 'Api Pedang', ch: 'arga', mp: 8, el: 'fire', pow: 1.5, tgt: 'one', k: 'mag', d: 'Tebasan berapi.', bp: 2, lv: 3 },
  a_bolt:   { n: 'Petir Ksatria', ch: 'arga', mp: 12, el: 'thunder', pow: 1.0, tgt: 'all', k: 'mag', d: 'Petir ke semua musuh.', bp: 3, req: 'a_flame', lv: 5 },
  a_rally:  { n: 'Semangat Ksatria', ch: 'arga', mp: 9, tgt: 'allies', k: 'buff', st: { s: 'atkUp', t: 3 }, d: 'ATK seluruh party naik 3 giliran.', bp: 3, lv: 4 },
  a_holy:   { n: 'Cahaya Fajar', ch: 'arga', mp: 14, el: 'holy', pow: 1.15, tgt: 'all', k: 'mag', d: 'Cahaya suci ke semua musuh.', bp: 4, req: 'a_rally', lv: 7 },
  u_arga:   { n: 'Pedang Cahaya Hijau', ch: 'arga', mp: 0, el: 'holy', pow: 4.4, brk: 3, tgt: 'one', k: 'phys', ult: 1, d: 'ULTIMATE. Tebasan suci dahsyat.', bp: 5, lv: 6 },

  atk_darma:{ n: 'Panah', ch: 'darma', mp: 0, el: 'pierce', pow: 1.0, tgt: 'one', k: 'phys', d: 'Tembakan dasar.' },
  d_double: { n: 'Panah Ganda', ch: 'darma', mp: 5, el: 'pierce', pow: .72, hits: 2, tgt: 'one', k: 'phys', d: 'Dua anak panah sekaligus.', bp: 0 },
  d_poison: { n: 'Panah Racun', ch: 'darma', mp: 6, el: 'pierce', pow: .9, tgt: 'one', k: 'phys', st: { s: 'poison', c: .75, t: 4 }, d: '75% meracuni.', bp: 2, lv: 2 },
  d_weak:   { n: 'Bidikan Lemah', ch: 'darma', mp: 7, el: 'pierce', pow: 1.0, brk: 3, tgt: 'one', k: 'phys', d: 'Shield rusak (x3).', bp: 2, lv: 3 },
  d_fire:   { n: 'Panah Api', ch: 'darma', mp: 8, el: 'fire', pow: 1.3, tgt: 'one', k: 'phys', st: { s: 'burn', c: .5, t: 3 }, d: '50% membakar.', bp: 3, lv: 4 },
  d_rain:   { n: 'Hujan Panah', ch: 'darma', mp: 11, el: 'pierce', pow: .8, tgt: 'all', k: 'phys', d: 'Panah ke semua musuh.', bp: 3, req: 'd_double', lv: 5 },
  d_focus:  { n: 'Fokus Pemburu', ch: 'darma', mp: 6, tgt: 'self', k: 'buff', st: { s: 'crtUp', t: 3 }, d: 'Peluang kritikal +40% 3 giliran.', bp: 3, req: 'd_weak', lv: 5 },
  u_darma:  { n: 'Bidikan Mematikan', ch: 'darma', mp: 0, el: 'pierce', pow: 4.8, brk: 3, tgt: 'one', k: 'phys', ult: 1, crit: 1, d: 'ULTIMATE. Pasti kritikal.', bp: 5, lv: 6 },

  atk_jana: { n: 'Tebas', ch: 'jana', mp: 0, el: 'slash', pow: 1.0, tgt: 'one', k: 'phys', d: 'Serangan dasar.' },
  j_guard:  { n: 'Perisai Kokoh', ch: 'jana', mp: 7, tgt: 'allies', k: 'buff', st: { s: 'defUp', t: 3 }, d: 'DEF party naik 3 giliran.', bp: 0 },
  j_bless:  { n: 'Berkat Suci', ch: 'jana', mp: 8, tgt: 'ally', k: 'heal', pow: 2.2, d: 'Pulihkan satu sekutu.', bp: 0 },
  j_taunt:  { n: 'Pancing Musuh', ch: 'jana', mp: 4, tgt: 'self', k: 'buff', st: { s: 'taunt', t: 2 }, d: 'Musuh menyerang Jana 2 giliran.', bp: 2, lv: 2 },
  j_smash:  { n: 'Hantaman Bumi', ch: 'jana', mp: 10, el: 'slash', pow: .8, tgt: 'all', k: 'phys', d: 'Hantaman ke semua musuh.', bp: 3, lv: 4 },
  j_pray:   { n: 'Doa Cahaya', ch: 'jana', mp: 9, el: 'holy', pow: 1.25, tgt: 'one', k: 'mag', d: 'Serangan suci.', bp: 3, lv: 4 },
  j_revive: { n: 'Kebangkitan', ch: 'jana', mp: 15, tgt: 'dead', k: 'rev', pow: .4, d: 'Bangkitkan sekutu (40% HP).', bp: 4, req: 'j_bless', lv: 6 },
  atk_nyx:  { n: 'Tebas Bayang', ch: 'nyx', mp: 0, el: 'slash', pow: 1.0, tgt: 'one', k: 'phys', d: 'Serangan dasar.' },
  n_frost:  { n: 'Tusukan Es', ch: 'nyx', mp: 5, el: 'ice', pow: 1.3, tgt: 'one', k: 'mag', d: 'Pecahan es menusuk satu musuh.', bp: 0 },
  n_chill:  { n: 'Embun Beku', ch: 'nyx', mp: 6, el: 'ice', pow: .8, tgt: 'one', k: 'mag', st: { s: 'weak', c: .7, t: 2 }, d: '70% melemahkan (ATK turun).', bp: 0 },
  n_shatter:{ n: 'Pecah Es', ch: 'nyx', mp: 8, el: 'ice', pow: 1.0, brk: 3, tgt: 'one', k: 'mag', d: 'Shield rusak (x3).', bp: 2, lv: 3 },
  n_storm:  { n: 'Badai Es', ch: 'nyx', mp: 12, el: 'ice', pow: .85, tgt: 'all', k: 'mag', st: { s: 'weak', c: .3, t: 2 }, d: 'Badai es ke semua musuh.', bp: 3, lv: 4 },
  n_bolt:   { n: 'Sambaran Senja', ch: 'nyx', mp: 10, el: 'thunder', pow: 1.4, tgt: 'one', k: 'mag', st: { s: 'stun', c: .35, t: 1 }, d: 'Petir menyambar. 35% pingsan.', bp: 3, lv: 5 },
  n_veil:   { n: 'Tirai Bayang', ch: 'nyx', mp: 7, tgt: 'self', k: 'buff', st: { s: 'crtUp', t: 3 }, d: 'Peluang kritikal +40% 3 giliran.', bp: 3, req: 'n_chill', lv: 5 },
  u_nyx:    { n: 'Kutub Senja', ch: 'nyx', mp: 0, el: 'ice', pow: 3.3, brk: 2, tgt: 'all', k: 'mag', ult: 1, d: 'ULTIMATE. Es mutlak ke semua musuh.', bp: 5, lv: 6 },
  u_jana:   { n: 'Benteng Terakhir', ch: 'jana', mp: 0, tgt: 'allies', k: 'buff', ult: 1, st: { s: 'inv', t: 1 }, heal: .3, d: 'ULTIMATE. Party kebal 1 giliran & pulih 30%.', bp: 5, lv: 6 },
};
/* serangan gabungan (Combo): butuh gauge Sinkron >= 50 dan kedua anggota hidup */
const COMBOS = [
  { id: 'c_ad', n: 'Tebasan Panah', pair: ['arga', 'darma'], els: ['slash', 'pierce'], pow: 1.3, hits: 3, brk: 2, tgt: 'one', d: 'Arga & Darma: 3 serangan beruntun.' },
  { id: 'c_aj', n: 'Perisai Fajar', pair: ['arga', 'jana'], els: ['holy'], pow: 1.05, hits: 1, tgt: 'all', st: { s: 'defUp', t: 2, ally: 1 }, d: 'Arga & Jana: cahaya ke semua musuh, DEF party naik.' },
  { id: 'c_dj', n: 'Jebakan Kokoh', pair: ['darma', 'jana'], els: ['pierce'], pow: .9, hits: 1, tgt: 'all', st: { s: 'stun', c: .45, t: 1 }, d: 'Darma & Jana: panah ke semua musuh, 45% pingsan.' },
  { id: 'c_an', n: 'Tebas Beku', pair: ['arga', 'nyx'], els: ['slash', 'ice'], pow: 1.25, hits: 2, brk: 2, tgt: 'one', st: { s: 'weak', c: .5, t: 2 }, d: 'Arga & Nyx: dua tebasan es, 50% melemahkan.' },
  { id: 'c_dn', n: 'Panah Es', pair: ['darma', 'nyx'], els: ['pierce', 'ice'], pow: 1.5, hits: 2, tgt: 'one', d: 'Darma & Nyx: dua panah es beruntun.' },
  { id: 'c_jn', n: 'Fajar Beku', pair: ['jana', 'nyx'], els: ['holy', 'ice'], pow: 1.0, hits: 1, tgt: 'all', st: { s: 'defUp', t: 2, ally: 1 }, d: 'Jana & Nyx: cahaya beku ke semua musuh, DEF party naik.' },
];

/* skill musuh. chg = butuh persiapan (giliran) sebelum dilepas; Break membatalkan. */
const ES = {
  e_atk:    { n: 'Serang', el: 'slash', pow: 1.0, tgt: 'one', k: 'phys' },
  e_smash:  { n: 'Hantam', el: 'slash', pow: 1.7, tgt: 'one', k: 'phys' },
  e_sweep:  { n: 'Sapuan', el: 'slash', pow: .75, tgt: 'all', k: 'phys' },
  e_roar:   { n: 'Raungan', tgt: 'allies', k: 'buff', st: { s: 'atkUp', t: 3 } },
  e_heal:   { n: 'Penyembuhan', tgt: 'ally', k: 'heal', pow: 2.4 },
  e_bolt:   { n: 'Tembakan Tengkorak', el: 'dark', pow: 1.25, tgt: 'one', k: 'mag' },
  e_fire:   { n: 'Api Neraka', el: 'fire', pow: .9, tgt: 'all', k: 'mag', st: { s: 'burn', c: .3, t: 3 } },
  e_poison: { n: 'Gigitan Racun', el: 'pierce', pow: .9, tgt: 'one', k: 'phys', st: { s: 'poison', c: .7, t: 3 } },
  e_steal:  { n: 'Curi', el: 'pierce', pow: .8, tgt: 'one', k: 'phys', steal: 1 },
  e_drain:  { n: 'Hisap Darah', el: 'dark', pow: 1.15, tgt: 'one', k: 'mag', drain: .5 },
  e_guard:  { n: 'Bertahan', tgt: 'self', k: 'buff', st: { s: 'defUp', t: 2 } },
  e_adapt:  { n: 'Adaptasi', tgt: 'self', k: 'buff', adapt: 1 },
  e_summon: { n: 'Panggil Pasukan', tgt: 'self', k: 'buff', summon: 1 },
  e_quake:  { n: 'Gempa Murka', el: 'slash', pow: 1.5, tgt: 'all', k: 'phys', chg: 1, tele: 'Menghimpun tenaga...' },
  e_fury:   { n: 'Murka Orc', el: 'slash', pow: 2.2, tgt: 'all', k: 'phys', chg: 2, tele: 'Cahaya merah menyelimuti Grumak! Pecahkan shield-nya!' },
  e_mark:   { n: 'Tebasan Bidik', el: 'slash', pow: 1.9, tgt: 'one', k: 'phys', chg: 1, tele: 'Membidik satu target...' },
};

/* ---------------- MUSUH ----------------
 sheet: kunci animasi (ANIMS) atau skin kerangka | sh: jumlah shield | weak/res: elemen | ai: [[skill, bobot]] | drop: [[item, peluang, jumlah]] */
const ENEMIES = {
  orc:     { n: 'Orc', sheet: 'orc', sc: 1.25, hp: 62, atk: 13, def: 6, mat: 6, mdf: 4, spd: 8, crt: 5, sh: 2, weak: ['fire', 'thunder'], res: [], exp: 14, gold: [4, 9], ai: [['e_atk', 5], ['e_smash', 2], ['e_guard', 1]], drop: [['kulit', .35, 1], ['taring', .15, 1]], bark: 'Grrah!' },
  orcRed:  { n: 'Orc Prajurit', sheet: 'orc', tint: ['#ff2020', .42], sc: 1.35, hp: 95, atk: 17, def: 9, mat: 6, mdf: 5, spd: 9, crt: 8, sh: 3, weak: ['fire', 'pierce'], res: ['slash'], exp: 26, gold: [8, 15], ai: [['e_atk', 4], ['e_smash', 3], ['e_roar', 1], ['e_guard', 1]], drop: [['kulit', .5, 1], ['taring', .3, 1], ['bijih', .2, 1]], bark: 'Mati kau!' },
  captain: { n: 'Kapten Orc', sheet: 'orc', tint: ['#3050ff', .42], sc: 1.8, hp: 300, atk: 20, def: 11, mat: 8, mdf: 7, spd: 9, crt: 8, sh: 5, weak: ['thunder', 'pierce'], res: ['dark'], exp: 120, gold: [40, 55], boss: 1, ai: [['e_atk', 3], ['e_smash', 3], ['e_sweep', 2], ['e_roar', 1], ['e_mark', 2]], drop: [['taring', 1, 3], ['bijih', 1, 2]], bark: 'Kalian tak akan lewat!' },
  demon:   { n: 'Iblis', sheet: 'demon', sc: 1.3, hp: 110, atk: 16, def: 8, mat: 18, mdf: 11, spd: 12, crt: 8, sh: 3, weak: ['holy', 'pierce', 'ice'], res: ['fire', 'dark'], exp: 40, gold: [10, 18], ai: [['e_bolt', 4], ['e_fire', 2], ['e_atk', 2], ['e_heal', 1]], drop: [['kristal', .3, 1], ['darah', .1, 1]], bark: 'Hihihi...' },
  blood:   { n: 'Monster Darah', sheet: 'blood', sc: 1.45, hp: 190, atk: 24, def: 12, mat: 10, mdf: 8, spd: 6, crt: 6, sh: 4, weak: ['thunder', 'holy', 'ice'], res: ['slash'], exp: 58, gold: [14, 24], ai: [['e_smash', 3], ['e_drain', 3], ['e_atk', 2]], drop: [['darah', .4, 1], ['kulit', .3, 1]], bark: '...' },
  skel:    { n: 'Kerangka', skin: 'base', sc: 1.2, hp: 72, atk: 15, def: 8, mat: 6, mdf: 6, spd: 9, crt: 6, sh: 2, weak: ['holy', 'fire'], res: ['pierce', 'dark'], exp: 22, gold: [3, 8], ai: [['e_atk', 5], ['e_smash', 1], ['e_adapt', 1]], drop: [['tulang', .6, 1]], bark: 'Klak klak.' },
  skelR:   { n: 'Kerangka Pencuri', skin: 'rogue', sc: 1.2, hp: 52, atk: 14, def: 6, mat: 6, mdf: 5, spd: 16, crt: 14, sh: 2, weak: ['pierce', 'holy', 'ice'], res: ['dark'], exp: 24, gold: [3, 8], ai: [['e_steal', 3], ['e_atk', 3], ['e_poison', 2]], drop: [['tulang', .5, 1], ['taring', .1, 1]], bark: 'Hehehe!' },
  skelM:   { n: 'Kerangka Penyihir', skin: 'mage', sc: 1.2, hp: 60, atk: 8, def: 5, mat: 17, mdf: 12, spd: 10, crt: 6, sh: 2, weak: ['slash', 'holy'], res: ['dark', 'fire'], exp: 30, gold: [6, 12], ai: [['e_bolt', 4], ['e_heal', 2], ['e_adapt', 1]], drop: [['kristal', .35, 1], ['tulang', .4, 1]], bark: 'Rasakan kutukanku.' },
  grumak:  { n: 'Panglima Grumak', sheet: 'orc', tint: ['#40004a', .42], sc: 2.3, hp: 950, atk: 26, def: 14, mat: 12, mdf: 9, spd: 10, crt: 8, sh: 6, weak: ['thunder', 'holy'], res: ['slash'], exp: 400, gold: [150, 150], boss: 1, bossId: 'grumak', ai: [], drop: [['kristal', 1, 3], ['bijih', 1, 3]], bark: '' },
};
/* tingkat musuh: hp/atk dkk dikali sesuai level (1 + (lv-1)*0.13) */
const lvScale = lv => 1 + (lv - 1) * .13;

/* formasi di peta: musuh tampil sebagai satu sosok, sentuh = battle.  enemies: daftar id musuh; lv: level musuh */
const FORMS = {
  w_orc1:  { en: ['orc', 'orc'], lv: 2, vis: 'orc' }, w_orc2: { en: ['orc', 'orc', 'orcRed'], lv: 3, vis: 'orc' }, w_orc3: { en: ['orcRed', 'orc', 'orc'], lv: 4, vis: 'orcRed' },
  raider:  { en: ['orc', 'orc'], lv: 3, vis: 'orc', q: 'raider' },
  camp:    { en: ['orc', 'orc', 'orcRed', 'orc'], lv: 3, vis: 'orcRed', q: 'camp', once: 1, bg: 'camp' },
  captain: { en: ['orc', 'captain', 'orc'], lv: 5, vis: 'captain', q: 'captain', once: 1, boss: 1 },
  g_skel1: { en: ['skel', 'skel'], lv: 5, vis: 'skel' }, g_skel2: { en: ['skel', 'skelM', 'skelR'], lv: 6, vis: 'skelM' }, g_demon: { en: ['demon', 'skel'], lv: 7, vis: 'demon' },
  g_guard: { en: ['skelR', 'skel', 'skelR'], lv: 6, vis: 'skelR', q: 'rudi', once: 1 },
  arena1:  { en: ['skel', 'skelM', 'skel'], lv: 7, wave: 1 }, arena2: { en: ['demon', 'skelR', 'skelM'], lv: 7, wave: 1 }, arena3: { en: ['blood', 'demon'], lv: 8, wave: 1 },
  f_orc:   { en: ['orcRed', 'orcRed', 'orc'], lv: 9, vis: 'orcRed' }, f_blood: { en: ['blood', 'orcRed'], lv: 9, vis: 'blood' }, f_demon: { en: ['demon', 'demon', 'skelM'], lv: 9, vis: 'demon' },
  ambush:  { en: ['orc', 'orcRed'], lv: 3, q: 'ambush', guest: 'budi' },
  boss_grumak: { en: ['grumak'], lv: 10, boss: 1, q: 'grumak', bg: 'benteng' },
};

/* gambar rapi: kamus ikon heksa untuk tombol (dipakai UI) */
const ICON = { hp: '♥', mp: '✦', gold: '●', bp: '◆', day: '☀', night: '☾', quest: '!', map: '▣', bag: '▤', skill: '★', party: '☻', craft: '⚒', farm: '❀', save: '▼', gear: '⚔' };
