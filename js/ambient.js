/* =========================================================================
   ambient.js  —  suasana dunia: daun jatuh, kabut, serbuk sari, kunang-kunang,
   debu gua, bara benteng. Partikel ruang layar, ringan (<= 40 titik).
   ========================================================================= */
'use strict';
const Amb = {
  key: '', list: [], fog: [],
  kind() {
    const m = W.map; if (!m || m.kind === 'indoor' || m.theme === 'wood') return '';
    if (m.theme === 'cave') return 'cave';
    if (m.theme === 'fort') return 'fort';
    return (m.id === 'hutan' ? 'hutan' : 'desa') + (isNight() ? 'N' : 'D');
  },
  make(k) {
    const R = Math.random, L = [];
    const n = { hutanD: 22, hutanN: 34, desaD: 14, desaN: 24, cave: 18, fort: 16 }[k] || 0;
    for (let i = 0; i < n; i++) L.push({ x: R() * VW, y: R() * VH, p: R() * 6.28, s: .6 + R(), c: R() });
    this.fog = k === 'hutanD' || k === 'hutanN' ? [0, 1, 2].map(i => ({ x: i * 190 - 60, y: 120 + i * 40, r: 120 + R() * 50, v: 3 + R() * 3 })) : [];
    return L;
  },
  tick(dt) {
    const k = this.kind(); if (k !== this.key) { this.key = k; this.list = k ? this.make(k) : []; }
    if (!k) return;
    const night = k.endsWith('N'), kk = k.replace(/[DN]$/, '');
    for (const o of this.list) {
      o.p += dt * (1 + o.s);
      if (kk === 'hutan' && !night) { o.x += Math.sin(o.p) * 14 * dt + 6 * dt; o.y += (12 + 10 * o.s) * dt; }
      else if (kk === 'fort') { o.y -= (10 + 14 * o.s) * dt; o.x += Math.sin(o.p * 1.3) * 6 * dt; }
      else if (kk === 'cave') { o.x += Math.sin(o.p * .5) * 5 * dt; o.y += Math.cos(o.p * .4) * 4 * dt; }
      else { o.x += Math.sin(o.p * .6) * 12 * dt; o.y += Math.cos(o.p * .45) * 9 * dt - (night ? 0 : 3 * dt); }
      if (o.x > VW + 6) o.x = -6; if (o.x < -6) o.x = VW + 6; if (o.y > VH + 6) o.y = -6; if (o.y < -6) o.y = VH + 6;
    }
    for (const f of this.fog) { f.x += f.v * dt; if (f.x - f.r > VW) f.x = -f.r; }
  },
  /* tahap 'bawah': sebelum gelap malam (daun, kabut, debu) */
  drawBelow() {
    const k = this.key; if (!k) return;
    const night = k.endsWith('N'), kk = k.replace(/[DN]$/, '');
    for (const f of this.fog) { const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.r); g.addColorStop(0, night ? 'rgba(120,150,190,.12)' : 'rgba(235,245,225,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); }
    if (kk === 'hutan' && !night) for (const o of this.list) { const cols = ['#e8a23a', '#c9761f', '#f0c850', '#b4542a']; ctx.fillStyle = cols[(o.c * 4) | 0]; const w = 2 + (Math.sin(o.p * 3) > 0 ? 1 : 0); ctx.fillRect(o.x | 0, o.y | 0, w, 2); ctx.fillStyle = 'rgba(255,240,170,.8)'; ctx.fillRect(o.x | 0, o.y | 0, 1, 1); }
    else if (kk === 'desa' && !night) for (const o of this.list) { ctx.fillStyle = `rgba(255,255,220,${.35 + .35 * Math.sin(o.p * 2)})`; ctx.fillRect(o.x | 0, o.y | 0, 1, 1); }
    else if (kk === 'cave') for (const o of this.list) { ctx.fillStyle = `rgba(150,200,255,${.25 + .3 * Math.sin(o.p * 2)})`; ctx.fillRect(o.x | 0, o.y | 0, 1, 1); }
  },
  /* tahap 'atas': setelah gelap malam, supaya menyala (kunang-kunang, bara) */
  drawAbove() {
    const k = this.key; if (!k) return;
    const night = k.endsWith('N'), kk = k.replace(/[DN]$/, '');
    if (night) for (const o of this.list) { const a = .45 + .55 * Math.max(0, Math.sin(o.p * 1.7)); const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 7); g.addColorStop(0, `rgba(255,240,120,${.5 * a})`); g.addColorStop(1, 'rgba(255,240,120,0)'); ctx.fillStyle = g; ctx.fillRect(o.x - 7, o.y - 7, 14, 14); ctx.fillStyle = `rgba(255,252,190,${a})`; ctx.fillRect(o.x | 0, o.y | 0, 2, 2); }
    else if (kk === 'fort') for (const o of this.list) { const a = .5 + .5 * Math.sin(o.p * 4); ctx.fillStyle = `rgba(255,${120 + (o.c * 90 | 0)},40,${a * .9})`; ctx.fillRect(o.x | 0, o.y | 0, 1, 2); }
  },
};
