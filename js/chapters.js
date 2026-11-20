/* chapters.js — struktur bab. Bab dihitung dari langkah quest utama (tanpa state baru selain flag 'chap'). */
'use strict';
const CHAPTERS = [
  { id: 0, n: 'Prolog', t: 'Lembah yang Sunyi', d: 'Permata Hijau hilang. Wira meminta bantuanmu.', upto: 2 },
  { id: 1, n: 'Bab 1', t: 'Hutan Bisik', d: 'Kamp orc, tawanan, dan seorang kapten.', upto: 5 },
  { id: 2, n: 'Bab 2', t: 'Gema di Dalam Gua', d: 'Kristal, prasasti, dan arena sunyi.', upto: 9 },
  { id: 3, n: 'Bab 3', t: 'Benteng Orc', d: 'Panglima Grumak menunggu di takhta.', upto: 11 },
  { id: 4, n: 'Bab Final', t: 'Permata Hijau', d: 'Bawa pulang apa yang dicuri.', upto: 12 },
  { id: 5, n: 'Epilog', t: 'Lembah Kembali Hijau', d: 'Cerita ini selesai. Lembah masih bisa dijelajahi.', upto: 99 },
];
const Chapter = {
  cur() { const s = S.quests && S.quests.main; if (!s) return CHAPTERS[0]; const k = s.st === 'done' ? 99 : s.step; return CHAPTERS.find(c => k < c.upto) || CHAPTERS[5]; },
  /* dipanggil dari Story.tick (dunia, tidak sibuk). Tampilkan banner sekali per bab, simpan di flag. */
  tick() {
    if (!S.quests || !S.quests.main) return; const c = this.cur();
    if ((S.flags.chap ?? -1) >= c.id) return;
    S.flags.chap = c.id; this.banner(c); saveGame();
  },
  banner(c) {
    const el = $('chap'); if (!el) return;
    el.innerHTML = `<small>${esc(c.n)}</small><b>${esc(c.t)}</b><i>${esc(c.d)}</i>`; el.className = 'show'; Audio8.sfx('levelup');
    clearTimeout(this.tm); this.tm = setTimeout(() => { el.className = ''; }, 4800);
  },
};
