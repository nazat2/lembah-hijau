/* =========================================================================
   draw.js  —  menggambar tanah (tile), sprite, dekorasi, karakter
   ========================================================================= */
'use strict';
function drawSprTo(g, name, x, y, flip) {
  const s = SPR[name]; if (!s) return;
  g.drawImage(IMG[s[0]], s[1], s[2], s[3], s[4], Math.round(x - s[3] / 2), Math.round(y - s[4]), s[3], s[4]);
}
function buildGround(m) {
  const c = document.createElement('canvas'); c.width = m.w * TS; c.height = m.h * TS;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const r = rng(m.w * 31 + m.h * 7 + m.id.length);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawTile(g, m, x, y, r);
  if (m.kind !== 'indoor' && m.theme !== 'cave' && m.theme !== 'fort' && m.theme !== 'wood') scatterGroundDecor(g, m);
  if (m.theme === 'cave') { g.fillStyle = 'rgba(34,56,130,.28)'; g.fillRect(0, 0, c.width, c.height); }
  if (m.tintDark) { g.fillStyle = `rgba(10,40,20,${m.tintDark})`; g.fillRect(0, 0, c.width, c.height); }
  for (const d of m.decos) {
    if (d.kind === 'rug') drawSprTo(g, 'rug', d.x, d.y);
    if (d.kind === 'wall') drawSprTo(g, d.spr, d.x, d.y - 4);
  }
  return c;
}
/* autotile 9-irisan (Cute Fantasy): kotak 3x3 + sudut dalam di baris 3-4.
   dalam(dx,dy) = true bila tetangga masih satu jenis (tanpa tepi) */
function autoTile(g, img, px, py, dalam) {
  const N = !dalam(0, -1), S = !dalam(0, 1), Wd = !dalam(-1, 0), E = !dalam(1, 0);
  const c = Wd ? 0 : E ? 2 : 1, rr = N ? 0 : S ? 2 : 1;
  g.drawImage(img, c * 16, rr * 16, 16, 16, px, py, 16, 16);
  if (!N && !S && !Wd && !E) {   // sudut dalam, per kuadran 8x8
    if (!dalam(1, 1)) g.drawImage(img, 8, 56, 8, 8, px + 8, py + 8, 8, 8);
    if (!dalam(-1, 1)) g.drawImage(img, 16, 56, 8, 8, px, py + 8, 8, 8);
    if (!dalam(1, -1)) g.drawImage(img, 8, 64, 8, 8, px + 8, py, 8, 8);
    if (!dalam(-1, -1)) g.drawImage(img, 16, 64, 8, 8, px, py, 8, 8);
  }
}
function scatterGroundDecor(g, m) {
  const r = rng(m.w * 17 + m.h * 3 + 91), forest = m.id === 'hutan';
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
    if (m.get(x, y) !== T.GRASS || (m.isReserved && m.isReserved(x, y))) continue;
    const q = r(); let k = null;
    if (q < .05) k = FLOWERS[(r() * FLOWERS.length) | 0]; else if (q < .12) k = TUFTS[(r() * TUFTS.length) | 0]; else if (forest && q < .16) k = SHROOMS[(r() * SHROOMS.length) | 0];
    const ox = 3 + (r() * 10 | 0), oy = 8 + (r() * 7 | 0);
    const s = k && SPR['v_' + k]; if (s && IMG[s[0]]) g.drawImage(IMG[s[0]], s[1], s[2], s[3], s[4], x * TS + ox - (s[3] >> 1), y * TS + oy - s[4] + 2, s[3], s[4]);
  }
}
function drawTile(g, m, x, y, r) {
  const t = m.get(x, y), px = x * TS, py = y * TS, nb = (dx, dy) => m.get(x + dx, y + dy);
  const speck = (col, n) => { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(px + (r() * 15 | 0), py + (r() * 15 | 0), 1, 1); };
  switch (t) {
    case T.GRASS: {
      if (IMG.cfPath) {   // rumput selaras dengan autotile Cute Fantasy (62,137,72)
        g.fillStyle = '#3e8948'; g.fillRect(px, py, 16, 16);
        const q = r(); g.fillStyle = q < .5 ? '#378041' : '#47924f';
        for (let i = 0, n = 1 + (r() * 3 | 0); i < n; i++) g.fillRect(px + (r() * 15 | 0), py + (r() * 15 | 0), 2, 1);
        break;
      }
      g.drawImage(IMG.tileset, 9 * 16, 2 * 16, 16, 16, px, py, 16, 16);
      break;
    }
    case T.DIRT: case T.SOIL: {
      const soil = t === T.SOIL;
      if (IMG.cfPath && IMG.cfFarm && m.theme !== 'cave' && m.theme !== 'fort') {
        const same = t === T.SOIL ? (dx, dy) => nb(dx, dy) === T.SOIL : (dx, dy) => nb(dx, dy) !== T.GRASS && nb(dx, dy) !== T.WATER && nb(dx, dy) !== T.SOIL;
        if (soil) { const N = !same(0, -1), S = !same(0, 1), Wd = !same(-1, 0), E = !same(1, 0); g.drawImage(IMG.cfFarm, (Wd ? 0 : E ? 2 : 1) * 16, (N ? 0 : S ? 2 : 1) * 16, 16, 16, px, py, 16, 16); }
        else autoTile(g, IMG.cfPath, px, py, same);
        break;
      }
      g.fillStyle = soil ? '#6b4426' : '#c9a66b'; g.fillRect(px, py, 16, 16);
      speck(soil ? '#563519' : '#b8935a', 9); speck(soil ? '#7d5330' : '#d9b97f', 5);
      if (soil) { g.fillStyle = '#4e3017'; for (let i = 3; i < 16; i += 5) g.fillRect(px, py + i, 16, 1); }
      const edge = soil ? '#4e3017' : '#a88050';
      g.fillStyle = edge;
      if (nb(0, -1) === T.GRASS) g.fillRect(px, py, 16, 2);
      if (nb(0, 1) === T.GRASS) g.fillRect(px, py + 14, 16, 2);
      if (nb(-1, 0) === T.GRASS) g.fillRect(px, py, 2, 16);
      if (nb(1, 0) === T.GRASS) g.fillRect(px + 14, py, 2, 16);
      break;
    }
    case T.WATER: {
      if (IMG.cfWater && m.theme !== 'cave' && m.theme !== 'fort') { autoTile(g, IMG.cfWater, px, py, (dx, dy) => nb(dx, dy) === T.WATER || nb(dx, dy) === T.BRIDGE); break; }
      g.fillStyle = m.theme === 'cave' ? '#1f4b78' : '#3f8fd2'; g.fillRect(px, py, 16, 16);
      speck(m.theme === 'cave' ? '#2a639b' : '#5aa6e6', 6);
      g.fillStyle = m.theme === 'cave' ? '#12304f' : '#2f78b8';
      if (nb(0, -1) !== T.WATER && nb(0, -1) !== T.BRIDGE) g.fillRect(px, py, 16, 3);
      g.fillStyle = m.theme === 'cave' ? '#4b6a8a' : '#d6ecff';
      if (nb(0, 1) !== T.WATER && nb(0, 1) !== T.BRIDGE) g.fillRect(px, py + 14, 16, 2);
      if (nb(-1, 0) !== T.WATER && nb(-1, 0) !== T.BRIDGE) g.fillRect(px, py, 2, 16);
      if (nb(1, 0) !== T.WATER && nb(1, 0) !== T.BRIDGE) g.fillRect(px + 14, py, 2, 16);
      break;
    }
    case T.BRIDGE: {
      g.fillStyle = '#9b6a3c'; g.fillRect(px, py, 16, 16);
      g.fillStyle = '#7a4f28'; for (let i = 0; i < 16; i += 4) g.fillRect(px + i, py, 1, 16);
      g.fillStyle = '#b98550'; for (let i = 1; i < 16; i += 4) g.fillRect(px + i, py, 2, 16);
      if (nb(0, -1) !== T.BRIDGE) { g.fillStyle = '#5c3a1c'; g.fillRect(px, py, 16, 3); }
      if (nb(0, 1) !== T.BRIDGE) { g.fillStyle = '#5c3a1c'; g.fillRect(px, py + 13, 16, 3); }
      break;
    }
    case T.WOOD: {
      g.fillStyle = '#b07a4a'; g.fillRect(px, py, 16, 16);
      g.fillStyle = '#8f5f36'; g.fillRect(px, py + 7, 16, 1); g.fillRect(px, py + 15, 16, 1);
      g.fillRect(px + ((x * 5 + y * 3) % 12) + 2, py, 1, 7); g.fillRect(px + ((x * 7 + y) % 12) + 2, py + 8, 1, 7);
      speck('#c28c58', 4);
      break;
    }
    case T.CAVE: case T.FORT: if (IMG.dungeon) { const q = r(), f = DUN.floor[q < .72 ? 0 : 1 + (r() * 7 | 0)]; g.drawImage(IMG.dungeon, f[0], f[1], 16, 16, px, py, 16, 16); break; }
    // (cadangan tanpa atlas)
    case 'unused_cave': {
      g.fillStyle = '#4b4560'; g.fillRect(px, py, 16, 16); speck('#3d3850', 10); speck('#5d577a', 6);
      break;
    }
    case 'unused_fort': {
      g.fillStyle = '#6a6378'; g.fillRect(px, py, 16, 16);
      g.fillStyle = '#585166'; g.fillRect(px, py + 15, 16, 1); g.fillRect(px + 15, py, 1, 16);
      g.fillStyle = '#7c7590'; g.fillRect(px + 1, py + 1, 14, 1); speck('#5a5368', 4);
      break;
    }
    case T.CARPET: {
      g.fillStyle = '#8e2a35'; g.fillRect(px, py, 16, 16);
      g.fillStyle = '#c9a24a'; if (nb(-1, 0) !== T.CARPET) g.fillRect(px, py, 2, 16); if (nb(1, 0) !== T.CARPET) g.fillRect(px + 14, py, 2, 16);
      g.fillStyle = '#7a2230'; g.fillRect(px + 7, py + 3, 2, 2); g.fillRect(px + 7, py + 11, 2, 2);
      break;
    }
    case T.CWALL: case T.FWALL: if (IMG.dungeon) {
      const isW = v => v === T.CWALL || v === T.FWALL || v === T.VOID, D = IMG.dungeon;
      const below = nb(0, 1), above = nb(0, -1);
      if (!isW(below)) {   // sisi depan tembok
        const L = !isW(nb(-1, 0)), Rr = !isW(nb(1, 0)), src = L ? DUN.wallLeft : Rr ? DUN.wallRight : DUN.wallMid;
        g.drawImage(D, src[0], src[1], 16, 16, px, py, 16, 16);
        const h = r(); if (!L && !Rr) {
          if (h < .07) { const b = DUN.banner[m.theme === 'fort' ? (r() < .5 ? 'red' : 'yellow') : (r() < .5 ? 'green' : 'blue')]; g.drawImage(D, b[0], b[1], 16, 16, px, py, 16, 16); }
          else if (h < .13) { const o = DUN.hole[r() < .5 ? 0 : 1]; g.drawImage(D, o[0], o[1], 16, 16, px, py, 16, 16); }
          else if (h < .19 && m.theme === 'cave') g.drawImage(D, DUN.goo[0], DUN.goo[1], 16, 16, px, py, 16, 16);
        }
      } else if (!isW(above) || !isW(nb(0, 2))) { g.drawImage(D, DUN.wallTop[0], DUN.wallTop[1], 16, 16, px, py, 16, 16); }   // permukaan atas
      else { g.fillStyle = '#17121f'; g.fillRect(px, py, 16, 16); }
      break;
    }
    // (cadangan tanpa atlas) lanjut ke gambar prosedural di bawah
    case T.IWALL: {
      const fort = t === T.FWALL, inn = t === T.IWALL;
      const top = inn ? '#5a3a22' : fort ? '#241e2e' : '#1c1826', face = inn ? '#dbbb90' : fort ? '#554a63' : '#3b3450', line = inn ? '#b8966c' : fort ? '#3f364b' : '#2b2639';
      const below = nb(0, 1);
      const floorBelow = !SOLID_T.has(below);
      g.fillStyle = top; g.fillRect(px, py, 16, 16);
      if (floorBelow) {
        g.fillStyle = face; g.fillRect(px, py, 16, 16);
        g.fillStyle = line;
        if (inn) { g.fillRect(px, py + 13, 16, 3); g.fillStyle = '#c8a678'; for (let i = 3; i < 13; i += 5) g.fillRect(px, py + i, 16, 1); }
        else { g.fillRect(px, py + 5, 16, 1); g.fillRect(px, py + 10, 16, 1); g.fillRect(px + ((y % 2) ? 4 : 10), py, 1, 5); g.fillRect(px + ((y % 2) ? 12 : 4), py + 5, 1, 5); g.fillRect(px + ((y % 2) ? 8 : 2), py + 10, 1, 5); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, py + 13, 16, 3); }
      } else { speck(inn ? '#6b4829' : fort ? '#2e2639' : '#241f31', 5); }
      break;
    }
    default: g.fillStyle = '#000'; g.fillRect(px, py, 16, 16);
  }
}


function drawChar(kind, name, f, x, y, face, sc, tint, flash, alpha) {
  const A = ANIMS[kind][name], key = A[0], fw = A[3], fh = A[4] || fw, an = A[5] || [50, 58, 1];
  let img = IMG[key];
  if (flash) img = tinted(key, '#ffffff', .85); else if (tint) img = tinted(key, tint[0], tint[1]);
  ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face * sc, sc);
  ctx.drawImage(img, f * fw, 0, fw, fh, -an[0] * an[2], -an[1] * an[2] + 2, fw * an[2], fh * an[2]);
  ctx.restore();
}
const frameOf = (A, t, loop) => { const f = Math.floor(t * A[2]); return loop ? f % A[1] : Math.min(A[1] - 1, f); };
function shadow(x, y, rx, ry = rx * .38, a = .28) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, 6.3); ctx.fill(); }


function flame(x, y, s = 1) {
  const fl = Math.sin(G.t * 18 + x) * .6;
  ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(x, y, 3 * s, (4.5 + fl) * s, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(x, y + 1, 1.8 * s, (3 + fl * .6) * s, 0, 0, 6.3); ctx.fill();
}
function drawDeco(e) {
  const d = e.d, x = Math.round(d.x), y = Math.round(d.y);
  switch (d.kind) {
    case 'torch':
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 1, y - 12, 3, 8); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 14, 7, 3);
      flame(x, y - 18); break;
    case 'campfire':
      shadow(x, y - 2, 11); ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 9, y - 6, 18, 4); ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - 6, y - 9, 4, 8); ctx.fillRect(x + 3, y - 9, 4, 8);
      ctx.fillStyle = '#777'; for (let i = -10; i <= 10; i += 5) ctx.fillRect(x + i, y - 3, 3, 3);
      flame(x, y - 13, 1.6); break;
    case 'cage': {
      const open = !!S.flags.campCleared;
      shadow(x, y - 1, 13);
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(x - 12, y - 26, 24, 3);
      for (let i = -11; i <= 11; i += 4) { if (open && i > -3 && i < 3) continue; ctx.fillStyle = '#6b6b78'; ctx.fillRect(x + i, y - 24, 2, 23); }
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(x - 12, y - 3, 24, 3);
      if (open) { ctx.fillStyle = '#8a8a96'; ctx.fillRect(x + 3, y - 24, 2, 22); }
      break;
    }
    case 'log':
      if (S.flags.darmaJoined) break;
      ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - 24, y - 20, 48, 16); ctx.fillStyle = '#6b4424'; ctx.fillRect(x - 24, y - 20, 48, 5); ctx.fillStyle = '#3a2412'; ctx.fillRect(x - 24, y - 7, 48, 3);
      ctx.fillStyle = '#8a6038'; ctx.fillRect(x - 26, y - 19, 4, 14); ctx.fillStyle = '#a0764a'; ctx.fillRect(x - 25, y - 17, 2, 10); break;
    case 'caveDoor': {
      const open = has('kunci');
      ctx.fillStyle = '#2d2a38'; ctx.fillRect(x - 28, y - 44, 56, 48); ctx.fillStyle = '#4a4660'; ctx.fillRect(x - 28, y - 44, 56, 6);
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(x - 16, y - 36, 32, 40);
      if (!open) { ctx.fillStyle = '#6b4424'; ctx.fillRect(x - 16, y - 36, 32, 40); ctx.fillStyle = '#4a2e18'; for (let i = -12; i < 16; i += 8) ctx.fillRect(x + i, y - 36, 2, 40); ctx.fillStyle = '#b8b8c8'; ctx.fillRect(x - 3, y - 18, 6, 7); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 1, y - 16, 2, 3); }
      else { ctx.fillStyle = '#1a1226'; ctx.fillRect(x - 16, y - 36, 32, 4); }
      break;
    }
    case 'pedestal': ctx.fillStyle = '#2b2838'; ctx.beginPath(); ctx.ellipse(x, y - 2, 10, 5, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#5b5670'; ctx.beginPath(); ctx.ellipse(x, y - 4, 9, 4, 0, 0, 6.3); ctx.fill(); break;
    case 'inscription': ctx.fillStyle = '#6b6580'; ctx.fillRect(x - 7, y - 20, 14, 20); ctx.fillStyle = '#8a84a0'; ctx.fillRect(x - 7, y - 20, 14, 3); ctx.fillStyle = '#2d2a3a'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 4, y - 15 + i * 4, 8 - (i % 2) * 3, 1); break;
    case 'pillar': ctx.fillStyle = '#2d2838'; ctx.fillRect(x - 8, y - 4, 16, 4); ctx.fillStyle = '#7d7592'; ctx.fillRect(x - 6, y - 30, 12, 28); ctx.fillStyle = '#a49cb8'; ctx.fillRect(x - 6, y - 30, 3, 28); ctx.fillStyle = '#5a5270'; ctx.fillRect(x + 3, y - 30, 3, 28); ctx.fillStyle = '#9890b0'; ctx.fillRect(x - 8, y - 34, 16, 5); break;
    case 'throne': ctx.fillStyle = '#3a1a4a'; ctx.fillRect(x - 14, y - 38, 28, 40); ctx.fillStyle = '#5a2a70'; ctx.fillRect(x - 10, y - 34, 20, 24); ctx.fillStyle = '#c9a24a'; ctx.fillRect(x - 14, y - 38, 28, 3); ctx.fillRect(x - 14, y - 14, 28, 3); ctx.fillStyle = '#8a1a2a'; ctx.fillRect(x - 8, y - 12, 16, 10); break;
    case 'portal': {
      const t = G.t; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(80,255,140,${.25 - i * .06})`; ctx.beginPath(); ctx.ellipse(x, y + 4, 22 - i * 5 + Math.sin(t * 3 + i) * 2, 10 - i * 2, 0, 0, 6.3); ctx.fill(); }
      ctx.restore();
      for (let i = 0; i < 6; i++) { const a = t * 2 + i; ctx.fillStyle = '#b8ffd0'; ctx.fillRect(Math.round(x + Math.cos(a) * 14), Math.round(y - 4 - ((t * 20 + i * 9) % 28)), 2, 2); }
      break;
    }
    case 'spikes': { const st = spikeState(d), r = DUN.spikes[st]; ctx.drawImage(IMG.dungeon, r[0], r[1], 16, 16, x - 8, y - 16, 16, 16); if (st === 1 && Math.floor(G.t * 12) % 2) { ctx.fillStyle = 'rgba(255,60,60,.35)'; ctx.fillRect(x - 8, y - 16, 16, 16); } break; }
    case 'fountain': {
      const F = DUN.fountain[d.c || 'red'], fr = Math.floor(G.t * 6) % 3, tp = DUN.fountainTop[(d.v || 0) % 3];
      ctx.drawImage(IMG.dungeon, tp[0], tp[1], 16, 16, x - 8, y - 48, 16, 16);
      ctx.drawImage(IMG.dungeon, F.mid[0] + 16 * fr, F.mid[1], 16, 16, x - 8, y - 32, 16, 16);
      ctx.drawImage(IMG.dungeon, F.basin[0] + 16 * fr, F.basin[1], 16, 16, x - 8, y - 16, 16, 16); break;
    }
    case 'sign': ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 1, y - 10, 3, 10); ctx.fillStyle = '#b07a4a'; ctx.fillRect(x - 7, y - 18, 14, 9); ctx.fillStyle = '#8f5f36'; ctx.fillRect(x - 7, y - 18, 14, 1); ctx.fillRect(x - 7, y - 10, 14, 1); ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - 4, y - 15, 8, 1); ctx.fillRect(x - 4, y - 13, 6, 1); break;
  }
}

function drawCrystal(e) {
  const c = e.c, x = Math.round(e.x), y = Math.round(e.y - 14), b = Math.sin(e.t * 2) * 1.5;
  const lit = e.lit, a = lit ? 1 : .55;
  ctx.save();
  if (lit || e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c.c; ctx.globalAlpha = .25 + (e.flash > 0 ? .3 : 0); ctx.beginPath(); ctx.arc(x, y + b, 16, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalAlpha = a; ctx.fillStyle = c.c;
  ctx.beginPath(); ctx.moveTo(x, y - 12 + b); ctx.lineTo(x + 7, y + b); ctx.lineTo(x, y + 12 + b); ctx.lineTo(x - 7, y + b); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x, y - 12 + b); ctx.lineTo(x + 3, y - 2 + b); ctx.lineTo(x - 2, y + b); ctx.lineTo(x - 7, y + b); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawAnimal(e) {
  const k = e.a.kind;
  if (k === 'cow') {
    shadow(e.x, e.y, 9);
    const key = e.a.v === 'm' ? 'cow_m' : 'cow_f', f = e.moving ? Math.floor(e.t * 5) % 4 : Math.floor(e.t * 1.5) % 4;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); if (e.row === 0) ctx.scale(-e.face, 1);
    ctx.drawImage(IMG[key], f * 32, e.row * 32, 32, 32, -16, -28, 32, 32); ctx.restore();
  } else if (k === 'pig' || k === 'sheep') {
    shadow(e.x, e.y, 7);
    const f = Math.floor(e.t * (e.moving ? 5 : 1.5)) % 2;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.scale(-e.face, 1);
    ctx.drawImage(IMG[k === 'pig' ? 'cfPig' : 'cfSheep'], f * 32, e.moving ? 32 : 0, 32, 32, -16, -26, 32, 32); ctx.restore();
  } else {
    shadow(e.x, e.y, 4);
    const key = k === 'chick' ? 'chick' : e.a.v === 'red' ? 'chicken_red' : 'chicken_blonde';
    const f = Math.floor(e.t * (e.moving ? 8 : 3)) % 4;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.scale(-e.face, 1);
    ctx.drawImage(IMG[key], f * 16, (k === 'chick' ? Math.min(e.row, 2) : e.row) * 16, 16, 16, -8, -13, 16, 16); ctx.restore();
    if (e.a.quest && S.flags.ayamStart) { const b = Math.sin(G.t * 6) * 1.2; ctx.fillStyle = '#ffd84a'; ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 24 + b), 3, 4); ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y - 18 + b), 3, 2); }
  }
}

