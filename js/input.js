/* =========================================================================
   input.js  —  keyboard, mouse, sentuh (joystick melayang), layout layar
   ========================================================================= */
'use strict';
const Input = {
  keys: {}, pressed: {}, joy: { x: 0, y: 0, id: null, bx: 0, by: 0 }, hot: {},
  KM: { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyE: 'act', Space: 'act', Enter: 'act', Escape: 'menu', KeyJ: 'quest', KeyM: 'map', KeyI: 'bag', KeyP: 'menu', Tab: 'menu', KeyN: 'mute' },
  vec() {
    const k = this.keys; let x = (k.right ? 1 : 0) - (k.left ? 1 : 0), y = (k.down ? 1 : 0) - (k.up ? 1 : 0);
    if (!x && !y) { x = this.joy.x; y = this.joy.y; }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return { x, y };
  },
  took(a) { const r = this.pressed[a]; this.pressed[a] = false; return !!r; },
  press(a) { this.pressed[a] = true; },
  clear() { for (const k in this.keys) this.keys[k] = false; this.pressed = {}; this.joy.x = this.joy.y = 0; this.joy.id = null; const kn = document.getElementById('joyKnob'), bs = document.getElementById('joyBase'); if (kn) kn.style.display = bs.style.display = 'none'; },
};
addEventListener('keydown', e => {
  const a = Input.KM[e.code]; Audio8.init();
  const inForm = e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName); if (inForm) return;
  if (G.mode === 'world') {
    if (!a) return; e.preventDefault();
    if (!Input.keys[a]) Input.pressed[a] = true; Input.keys[a] = true;
    if (e.repeat) return;
    if (Input.hot[a]) Input.hot[a]();
  } else if (G.mode === 'dialog' || G.mode === 'menu' || G.mode === 'battle' || G.mode === 'title' || G.mode === 'cut') {
    UI.key(e);
  }
});
addEventListener('keyup', e => { const a = Input.KM[e.code]; if (a) Input.keys[a] = false; });
addEventListener('blur', () => Input.clear());

/* ---------- layout ---------- */
const Layout = {
  fit() {
    const w = innerWidth, h = innerHeight, s = Math.min(w / 960, h / 540), cw = Math.floor(960 * s), ch = Math.floor(540 * s);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.style.left = Math.floor((w - cw) / 2) + 'px'; cv.style.top = Math.floor((h - ch) / 2) + 'px';
    this.r = { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch, s: cw / 960 };
    const ui = document.getElementById('ui'); if (ui) { ui.style.left = this.r.x + 'px'; ui.style.top = this.r.y + 'px'; ui.style.width = cw + 'px'; ui.style.height = ch + 'px'; }
    document.documentElement.style.setProperty('--u', Math.max(9, Math.min(18, Math.min(cw / 54, ch / 30))) + 'px');
    const portrait = IS_TOUCH && h > w * 1.05 && !(Prefs && Prefs.d && Prefs.d.mode === 'desktop'); document.getElementById('rot').style.display = portrait ? 'flex' : 'none';
  },
};
(function touchInit() {
  const stage = document.getElementById('stage'), pad = document.getElementById('pad');
  const base = document.getElementById('joyBase'), knob = document.getElementById('joyKnob'), J = Input.joy;
  const R = 54;
  function isUi(t) { return t.closest && t.closest('.ui, .b, #menu, #dlg, #bt, #title'); }
  stage.addEventListener('pointerdown', ev => {
    Audio8.init();
    if (G.mode !== 'world' || (ev.pointerType === 'mouse' && !IS_TOUCH) || isUi(ev.target) || J.id !== null) return;
    const fx = IS_TOUCH && Prefs.d.joy === 'fixed' ? document.getElementById('joyFix').getBoundingClientRect() : null;
    if (fx) { const cx = fx.left + fx.width / 2, cy = fx.top + fx.height / 2; if (Math.hypot(ev.clientX - cx, ev.clientY - cy) > fx.width * .95) return; ev.preventDefault(); J.id = ev.pointerId; J.bx = cx; J.by = cy; J.x = J.y = 0; base.style.display = knob.style.display = 'block'; base.style.left = (cx - R) + 'px'; base.style.top = (cy - R) + 'px'; knob.style.left = (cx - 22) + 'px'; knob.style.top = (cy - 22) + 'px'; stage.setPointerCapture && stage.setPointerCapture(ev.pointerId); return; }
    if (ev.clientX > innerWidth * .55) return;
    ev.preventDefault(); J.id = ev.pointerId; J.bx = ev.clientX; J.by = ev.clientY; J.x = J.y = 0;
    base.style.display = knob.style.display = 'block'; base.style.left = (J.bx - R) + 'px'; base.style.top = (J.by - R) + 'px'; knob.style.left = (J.bx - 22) + 'px'; knob.style.top = (J.by - 22) + 'px';
  });
  stage.addEventListener('pointermove', ev => {
    if (ev.pointerId !== J.id) return; const dx = ev.clientX - J.bx, dy = ev.clientY - J.by, l = Math.hypot(dx, dy) || 1, m = Math.min(l, R);
    J.x = (dx / l) * (m / R); J.y = (dy / l) * (m / R); if (Math.hypot(J.x, J.y) < .18) { J.x = J.y = 0; }
    knob.style.left = (J.bx + dx / l * m - 22) + 'px'; knob.style.top = (J.by + dy / l * m - 22) + 'px';
  });
  const end = ev => { if (ev.pointerId !== J.id) return; J.id = null; J.x = J.y = 0; base.style.display = knob.style.display = 'none'; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  // tombol
  const mk = (id, fn) => { const b = document.getElementById(id); b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); if (G.mode === 'edit') return; Audio8.init(); b.classList.add('on'); fn(); }); const up = () => b.classList.remove('on'); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); };
  mk('bA', () => Input.press('act')); mk('bMenu', () => Input.hot.menu && Input.hot.menu()); mk('bQuest', () => Input.hot.quest && Input.hot.quest()); mk('bMap', () => Input.hot.map && Input.hot.map()); mk('bBag', () => Input.hot.bag && Input.hot.bag()); mk('bFs', () => FS.toggle());
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.clear(); Audio8.suspend(); } else Audio8.resume(); });
  for (const ev of ['gesturestart', 'dblclick']) document.addEventListener(ev, e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', () => Layout.fit()); addEventListener('orientationchange', () => setTimeout(() => Layout.fit(), 250));
  Layout.fit();
})();
