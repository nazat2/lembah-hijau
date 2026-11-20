// Cetak daftar seluruh Voice ID (CSV) ke stdout:  node tools/make_voice_csv.js > voice_lines.csv
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'js');
const ctx = { console, Math, window: {} }; vm.createContext(ctx);
for (const f of ['data_core.js', 'data_story.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
// ambil VOICE.all/csv dari systems.js saja
const src = fs.readFileSync(path.join(root, 'systems.js'), 'utf8'); const m = src.match(/const VOICE = \{[\s\S]*?\n\};\n/);
vm.runInContext('const S={settings:{voice:1}};' + m[0] + ';const SHOUTS={arga:["Haaah!","Rasakan ini!","Untuk Lembah Hijau!"],darma:["Kena!","Lepaskan!","Napas... tembak!"],jana:["Di belakangku!","Hiyaa!","Kuhentikan kau!"]};', ctx);
console.log(vm.runInContext('VOICE.csv()', ctx));
