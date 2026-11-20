#!/usr/bin/env python3
"""Buat Audio/Voice_Dialog/voices.json dari file suara yang ada.
Aturan: nama file (tanpa ekstensi) = Voice ID. Contoh: NPC_wira_wira_intro_01.ogg
Jalankan dari folder proyek:  python3 tools/make_voice_manifest.py"""
import os, json
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Audio', 'Voice_Dialog')
exts = ('.ogg', '.mp3', '.wav', '.m4a', '.webm')
out = {}
for folder in ('NPC', 'Main_Character', 'Enemy', 'Boss', 'Narrator', 'Companions'):
    d = os.path.join(root, folder)
    if not os.path.isdir(d): continue
    for dp, _, fs in os.walk(d):
        for f in fs:
            n, e = os.path.splitext(f)
            if e.lower() in exts: out[n] = os.path.relpath(os.path.join(dp, f), root).replace(os.sep, '/')
open(os.path.join(root, 'voices.json'), 'w', encoding='utf-8').write(json.dumps(out, indent=1, ensure_ascii=False))
print(len(out), 'file suara terdaftar')
