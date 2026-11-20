# Voice Dialogue System

Folder ini untuk rekaman suara dialog. Game TIDAK berisi suara AI. Hanya struktur folder + sistem pemutaran.

## Folder
- `NPC/` — Tetua Wira, Pak Joko, Budi, Bu Sari, Nenek Lastri, Rudi
- `Main_Character/` — Arga
- `Enemy/` — Orc, Kerangka, dll (teriakan/bark)
- `Boss/` — Kapten Orc, Panglima Grumak
- `Narrator/` — narator
- `Companions/` — Pak Darma, Jana

## Voice ID
Setiap baris dialog punya ID unik: `<KATEGORI>_<pembicara>_<scene>_<nn>`
Contoh: `NPC_wira_wira_intro_01`, `MC_arga_prolog_04`, `BOS_grumak_grumak_intro_01`.

Daftar lengkap semua ID + teksnya:
- di game: Menu > Opsi > "Ekspor daftar Voice ID (.csv)"
- atau: `node tools/make_voice_csv.js > voice_lines.csv`

## Memasang suara
1. Rekam / siapkan file (`.ogg`, `.mp3`, `.wav`) dengan nama = Voice ID, taruh di folder kategorinya.
2. Jalankan `python3 tools/make_voice_manifest.py` (membuat `voices.json`), atau isi `voices.json` manual:
   `{ "NPC_wira_wira_intro_01": "NPC/NPC_wira_wira_intro_01.ogg" }`
3. Selesai. Saat baris itu tampil, suara diputar otomatis. Volume diatur di Menu > Opsi.

## Bila file suara tidak ada
Dialog tetap berjalan normal. Tidak ada error, tidak ada popup.
