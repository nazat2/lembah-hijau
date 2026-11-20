/* =========================================================================
   core.js  —  state permainan, waktu, simpan/muat, utilitas, evaluator syarat
   ========================================================================= */
'use strict';
const VW = 480, VH = 270;
const SAVE_KEY = 'llh2_save';
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let IS_TOUCH = false;
try { IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (e) {}

/* ---------- utilitas ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const sgn = v => v < 0 ? -1 : 1;
const choice = a => a[Math.floor(Math.random() * a.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const wait = ms => new Promise(r => setTimeout(r, ms));
function hash(...a) { let h = 2166136261; for (const v of a) { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } } return (h >>> 0) / 4294967296; }
function K(k) { return IS_TOUCH ? 'tombol ' + k : '[' + k + ']'; }
function buzz(ms) { try { if (IS_TOUCH && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

const G = { t: 0, mode: 'boot' };   // mode: boot|title|world|dialog|menu|battle|cut

/* ---------- state ---------- */
function newState() {
  const S0 = {
    v: 1, name: 'Arga', clock: 7 * 60, map: 'desa', px: 24 * TS + 8, py: 21 * TS, gold: 80, bp: 0, truth: 0,
    flags: {}, inv: { potion: 3, b_gandum: 2, s_kayu: 1, z_kain: 1 }, up: {}, quests: {}, track: 'main', fr: {}, npcState: {},
    stats: { chickens: 0, sold: 0, secrets: 0, kills: {}, battles: 0, steps: 0, played: 0 },
    party: ['arga'], chars: {}, dead: {}, chests: {}, nodes: {}, bestiary: {}, lore: {}, market: { day: 0, ev: 'normal' },
    farm: { plots: Array.from({ length: 12 }, () => ({ crop: null, t: 0 })), auto: 0, got: 0 }, biz: { toko: 0, ladang: 0, tambang: 0 }, bank: 0, bizDay: 1, stock: { day: 0 },
    settings: { vol: 1, voice: 1, speed: 1 }, sync: 0, ending: null, discovered: { desa: 1 },
  };
  return S0;
}
let S = newState();
function initChar(id, lv = 1) {
  const C = CHARS[id];
  const ch = { lv, exp: 0, sk: C.skills.filter(s => !SK[s].bp && SK[s].bp !== undefined || s === C.basic || SK[s].bp === 0), eq: { w: C.w, a: C.a, x: null }, ult: 0, hp: 1, mp: 1 };
  ch.sk = C.skills.filter(s => s === C.basic || SK[s].bp === 0);
  S.chars[id] = ch;
  const st = statsOf(id); ch.hp = st.hp; ch.mp = st.mp;
}

/* ---------- waktu ---------- */
const day = () => Math.floor(S.clock / 1440) + 1;
const hour = () => (S.clock % 1440) / 60;
const hh = () => String(Math.floor(hour())).padStart(2, '0') + ':' + String(Math.floor((S.clock % 60))).padStart(2, '0');
const isNight = () => hour() >= 19 || hour() < 5;
function fmtClock() { return `Hari ${day()}  ${hh()}`; }

/* ---------- flag / item ---------- */
const F = k => S.flags[k];
function setF(k, v = 1) { if (S.flags[k] === v) return; S.flags[k] = v; Q.check(); }
const has = (id, n = 1) => (S.inv[id] || 0) >= n;
function addItem(id, n = 1, quiet) {
  S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id];
  if (!quiet && n > 0 && ITEMS[id]) { toast(`+${n} ${ITEMS[id].n}`); Audio8.sfx('pickup'); }
  Q.check();
}
function takeItem(id, n = 1) { if (!has(id, n)) return false; S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id]; Q.check(); return true; }
function addGold(n, quiet) { S.gold = Math.max(0, S.gold + n); if (!quiet && n > 0) { toast(`+${n} Gold`); Audio8.sfx('coin'); } }
const bizTotal = () => S.biz.toko + S.biz.ladang + S.biz.tambang;

/* ---------- evaluator syarat string ---------- */
function cond(e) {
  if (e === undefined || e === null || e === true || e === 'true') return true;
  if (e === false || e === 'false') return false;
  if (typeof e === 'function') return !!e();
  return String(e).split('&&').every(part => {
    const m = part.trim().match(/^(!?)([A-Za-z0-9_.]+)\s*(>=|<=|>|<|==)?\s*(-?\d+)?$/);
    if (!m) return false;
    const neg = m[1] === '!', key = m[2], op = m[3], num = m[4] === undefined ? null : +m[4];
    let v;
    if (key === 'truth') v = S.truth; else if (key === 'day') v = day(); else if (key === 'gold') v = S.gold; else if (key === 'chickens') v = S.stats.chickens;
    else if (key === 'sold') v = S.stats.sold; else if (key === 'secrets') v = S.stats.secrets; else if (key === 'bizTotal') v = bizTotal();
    else if (key.startsWith('item.')) v = S.inv[key.slice(5)] || 0; else if (key.startsWith('fr.')) v = FR.lv(key.slice(3));
    else if (key.startsWith('kills.')) v = S.stats.kills[key.slice(6)] || 0; else if (key.startsWith('biz.')) v = S.biz[key.slice(4)] || 0;
    else if (key.startsWith('q.')) v = (S.quests[key.slice(2)] || {}).st === 'done' ? 1 : 0; else v = S.flags[key] || 0;
    let r; if (op === null || op === undefined) r = !!v; else r = op === '>=' ? v >= num : op === '<=' ? v <= num : op === '>' ? v > num : op === '<' ? v < num : v === num;
    return neg ? !r : r;
  });
}

/* ---------- statistik karakter ---------- */
const expNeed = lv => Math.floor(25 * lv * (1 + lv * .25));
const MAXLV = 20;
function itemStat(id, key) { if (!id || !ITEMS[id]) return 0; const b = ITEMS[id][key] || 0; return ITEMS[id].t === 'acc' ? b : Math.round(b * UPG.mult(S.up[id] || 0)); }
function statsOf(id) {
  const C = CHARS[id], ch = S.chars[id] || { lv: 1, eq: { w: C.w, a: C.a } }, o = {};
  for (const k in C.base) o[k] = Math.round(C.base[k] + C.grow[k] * (ch.lv - 1));
  for (const slot of ['w', 'a', 'x']) { const it = ch.eq[slot]; if (!it) continue; for (const k of ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'spd', 'crt']) o[k] += itemStat(it, k); }
  o.maxhp = o.hp + (ch.bonusHp || 0); o.hp = o.maxhp; o.maxmp = o.mp; return o;
}
function gainExp(id, n) {
  const ch = S.chars[id], out = []; if (!ch || ch.lv >= MAXLV) return out;
  ch.exp += n;
  while (ch.lv < MAXLV && ch.exp >= expNeed(ch.lv)) {
    ch.exp -= expNeed(ch.lv); ch.lv++; S.bp++; const st = statsOf(id); ch.hp = Math.min(st.maxhp, ch.hp + Math.round(st.maxhp * .3)); out.push(ch.lv);
  }
  return out;
}

/* ---------- simpan / muat ---------- */
/* ---- slot save: 3 slot. Slot 1 memakai kunci lama (kompatibel dengan save sebelumnya) ---- */
const SLOT_KEYS = ['llh2_save', 'llh2_save_2', 'llh2_save_3'], SAVE_VER = 2;
let SLOT = 0;
try { SLOT = Math.max(0, Math.min(2, +localStorage.getItem('llh2_slot') || 0)); } catch (e) {}
function setSlot(i) { SLOT = Math.max(0, Math.min(2, i | 0)); try { localStorage.setItem('llh2_slot', String(SLOT)); } catch (e) {} }
function saveGame(manual, slot) {
  try {
    if (slot !== undefined) setSlot(slot);
    if (W && W.player) { S.px = W.player.x; S.py = W.player.y; }
    S.v = SAVE_VER; S.savedAt = Date.now();
    localStorage.setItem(SLOT_KEYS[SLOT], JSON.stringify(S));
    if (manual) toast('Game tersimpan di Slot ' + (SLOT + 1) + '.');
    return true;
  } catch (e) { if (manual) toast('Gagal menyimpan (penyimpanan penuh/diblokir).'); return false; }
}
function readSlot(i) { try { const raw = localStorage.getItem(SLOT_KEYS[i]); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function hasSave(i) { return i === undefined ? [0, 1, 2].some(k => !!readSlot(k)) : !!readSlot(i); }
function latestSlot() { let best = -1, t = -1; for (let i = 0; i < 3; i++) { const d = readSlot(i); if (d && (d.savedAt || 1) > t) { t = d.savedAt || 1; best = i; } } return best; }
function slotInfo(i) {
  const d = readSlot(i); if (!d) return null;
  const hr = (d.clock % 1440) / 60, h = Math.floor(hr), m = Math.floor(d.clock % 60), pl = Math.round((d.stats && d.stats.played || 0) / 60);
  const lv = d.chars && d.chars.arga ? d.chars.arga.lv : 1;
  return { name: d.name || 'Zat', lv, day: Math.floor(d.clock / 1440) + 1, time: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'), map: (typeof MAP_NAMES !== 'undefined' && MAP_NAMES[d.map]) || d.map, play: pl >= 60 ? Math.floor(pl / 60) + 'j ' + (pl % 60) + 'm' : pl + ' menit', party: (d.party || []).length, at: d.savedAt || 0 };
}
/* migrasi save lama ke versi sekarang (bidang yang hilang diisi bawaan) */
function migrate(d, base) {
  d.v = SAVE_VER;
  if (!d.gender) d.gender = 'm';
  if (!d.flags) d.flags = {}; if (!d.quests) d.quests = {}; if (!d.fr) d.fr = {}; if (!d.npcState) d.npcState = {};
  return d;
}
function loadGame(i) {
  try {
    if (i === undefined) i = latestSlot(); if (i < 0) return false;
    const d0 = readSlot(i); if (!d0) return false;
    const base = newState(), d = migrate(d0, base);
    S = Object.assign(base, d); S.settings = Object.assign(base.settings, d.settings || {}); S.stats = Object.assign(base.stats, d.stats || {});
    S.farm = Object.assign(base.farm, d.farm || {}); S.biz = Object.assign(base.biz, d.biz || {});
    setSlot(i); return true;
  } catch (e) { return false; }
}
function deleteSave(i) { try { localStorage.removeItem(SLOT_KEYS[i === undefined ? SLOT : i]); } catch (e) {} }
