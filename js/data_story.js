/* =========================================================================
   data_story.js  —  CERITA: pembicara, dialog, NPC, jadwal, quest, catatan
   -------------------------------------------------------------------------
   Format baris dialog: ['kunci_pembicara', 'teks', {efek}]
     efek: set:{flag:nilai}  gold:n  item:{id:n}  fr:['npc',poin]  truth:n  q:'idQuest'  fn:'namaFungsi'  toast:'teks'
   Pilihan: { ch:[ { t:'teks pilihan', go:'idScene', set:{}, fr:[], if:'syarat' } ] }
   Setiap baris dialog otomatis punya Voice ID:  <PREFIX>_<pembicara>_<scene>_<nn>
   ========================================================================= */
'use strict';

/* pembicara: cat = kategori folder suara */
const SPK = {
  narrator: { n: '', cat: 'NAR' },
  arga:   { n: 'Arga',           cat: 'MC',  p: ['hero'] },
  nyx:    { n: 'Nyx',            cat: 'CMP', p: ['nyxp'] },
  yara:   { n: 'Yara',           cat: 'NPC', p: ['por', 'yara', [48, 0, 104, 104]] },
  wira:   { n: 'Tetua Wira',     cat: 'NPC', p: ['eleonore'] },
  joko:   { n: 'Pak Joko',       cat: 'NPC', p: ['farmer', '#e0a040'] },
  budi:   { n: 'Budi',           cat: 'NPC', p: ['farmer', '#7ac0ff'] },
  sari:   { n: 'Bu Sari',        cat: 'NPC', p: ['girl1'] },
  lastri: { n: 'Nenek Lastri',   cat: 'NPC', p: ['farmer', '#d0d0d0'] },
  rudi:   { n: 'Rudi',           cat: 'NPC', p: ['farmer', '#c08060'] },
  jana:   { n: 'Jana',           cat: 'CMP', p: ['joanna'] },
  darma:  { n: 'Pak Darma',      cat: 'CMP', p: ['hunter'] },
  orc:    { n: 'Orc',            cat: 'ENM', p: ['orc'] },
  skel:   { n: 'Kerangka',       cat: 'ENM', p: ['skel'] },
  captain:{ n: 'Kapten Orc',     cat: 'BOS', p: ['orc', '#3050ff'] },
  grumak: { n: 'Panglima Grumak',cat: 'BOS', p: ['orc', '#40004a'] },
};
const VOICE_CAT = { NAR: 'Narrator', MC: 'Main_Character', NPC: 'NPC', CMP: 'Companions', ENM: 'Enemy', BOS: 'Boss' };

const DLG = {};
/* pembantu penulisan */
const D = (id, ...lines) => { DLG[id] = lines; };

/* ========================= PROLOG ========================= */
D('prolog.1',
  ['narrator', 'Lembah Hijau hidup karena satu hal: Permata Hijau, jantung yang menjaga sungai tetap jernih dan ladang tetap subur.']);
D('prolog.2',
  ['narrator', 'Tiga malam lalu, saat badai, permata itu lenyap dari altarnya. Daun-daun menguning, sumur menyusut, dan ternak mulai gelisah.']);
D('prolog.3',
  ['yara', 'Penjaga terakhir masih menunggu di dalam batu itu... Pulanglah, anak lembah. Tanah ini masih mengenali darahmu.'],
  ['narrator', 'Suara itu lenyap bersama angin dingin.']);
D('prolog',
  ['narrator', 'Arga, ksatria muda yang baru pulang setelah lima tahun di ibu kota, tiba di Desa Hijau tepat saat desa itu mulai merasa takut.'],
  ['arga', 'Desa ini... terasa lebih sunyi dari yang kuingat. Liontin giok peninggalan ibu berdenyut hangat di dadaku. Kuncinya pasti ada pada Tetua Wira. Aku harus menemuinya di alun-alun.']);

/* ========================= WIRA ========================= */
D('wira.intro',
  ['wira', 'Arga! Lima tahun, dan kau pulang dengan pedang di pinggang. Sayang, desa menyambutmu dengan kabar buruk.'],
  ['arga', 'Aku sudah dengar di gerbang. Permata Hijau hilang?'],
  ['wira', 'Dicuri. Pasukan orc dari Hutan Bisik menyerbu saat malam. Mereka membawanya ke benteng di balik Gua Gema.'],
  ['wira', 'Pak Darma, pemburu terbaik kita, pergi mengintai dan tak pernah kembali. Kuduga ia ditawan di kamp mereka.'],
  { ch: [
    { t: 'Aku akan merebutnya kembali.', go: 'wira.intro2' },
    { t: 'Kenapa orc mencuri permata itu? Mereka tak pernah menyerang desa.', go: 'wira.intro_why' } ] });
D('wira.intro_why',
  ['wira', '...Orc mengejar apa saja yang berkilau, Arga. Jangan buang waktu mencari alasan pada makhluk buas.', { set: { askedWhy: 1 } }],
  ['arga', '(Ia menjawab terlalu cepat. Seolah sudah menyiapkan jawabannya.)'],
  ['wira', 'Pergilah. Waktu kita sempit.', { go: 'wira.intro2' }]);
D('wira.intro2',
  ['wira', 'Bawa ini. Dan ingat: jangan bertarung sendirian bila bisa dihindari. Orang yang kau selamatkan akan jadi sekutumu.', { item: { potion: 3, antidote: 1 }, set: { metWira: 1 } }],
  ['wira', 'Jalan ke Hutan Bisik ada di gerbang timur, dijaga Jana. Hati-hati.', { toast: 'Misi utama diperbarui. Buka Jurnal (J) untuk detail.' }]);
D('wira.hint',
  ['wira', 'Kau sudah tahu langkah selanjutnya, Arga. Periksa Jurnal bila ragu. Desa ini menunggumu.']);
D('wira.story',
  ['wira', 'Kau seperti anakku sendiri, Arga, jadi kuceritakan sedikit. Dua puluh tahun lalu wabah menyerang lembah ini.'],
  ['wira', 'Aku menyegel roh lembah ke dalam permata itu agar desa selamat. Aku... membayar sesuatu untuk itu.'],
  ['arga', 'Membayar apa?'],
  ['wira', 'Suatu hari, ceritanya akan lengkap. Hari ini belum.', { set: { wiraStory: 1 }, fr: ['wira', 3] }]);
D('wira.final',
  ['wira', 'Permata Hijau... kau membawanya. Bukan main, Arga. Berikan padaku, biar kuselesaikan penyegelannya.'],
  { ch: [
    { t: 'Ini, Tetua. Desa selamat.', go: 'end.hero' },
    { t: 'Aku tahu apa yang kau lakukan, Wira. Permata ini harus dibebaskan.', go: 'end.restore', if: 'grumakSpared' },
    { t: 'Aku akan menyimpannya sendiri.', go: 'end.dark' },
    { t: '(Belum. Aku butuh waktu.)', go: 'end.wait' } ] });
D('end.wait', ['wira', 'Aku akan menunggu, tapi jangan terlalu lama.']);

D('wira.story2',
  ['wira', 'Kau sudah cukup kuat untuk mendengarnya, Arga. Harga penyegelan itu... bukan emas.'],
  ['wira', 'Roh lembah butuh wadah yang hidup. Ibumu, Penjaga terakhir, menawarkan dirinya. Aku yang menyegelnya. Dan aku tak pernah berani memberitahumu.'],
  ['arga', '...Ibu tidak meninggal karena wabah.'],
  ['wira', 'Ia tertidur di dalam permata itu sejak malam itu. Liontin giok di lehermu adalah serpihannya. Itu sebabnya ia berdenyut setiap kali permata dekat.', { set: { wiraStory2: 1, motherSeal: 1 }, fr: ['wira', 4] }],
  ['arga', 'Akan kubawa dia pulang. Apa pun akhirnya.']);

/* ========================= NYX ========================= */
D('nyx.meet',
  ['narrator', 'Udara mendadak dingin. Embun membeku di bilah pedang Kapten yang terjatuh.'],
  ['nyx', 'Jangan bergerak. Pecahan es ini menahan sisa pasukannya.'],
  ['arga', 'Siapa kau?'],
  ['nyx', 'Nyx, ksatria Ordo Senja. Aku memburu "bayangan" yang merembes dari permata itu sejak sebelum desamu punya nama.'],
  ['nyx', 'Orc-orc ini bukan sekadar penjahat. Bayangan membuat mereka lapar dan marah. Segel Wira bocor.'],
  ['arga', 'Segel Wira...? Kau tahu sesuatu tentang dua puluh tahun lalu?'],
  ['nyx', 'Cukup untuk tahu kau tak akan selamat di gua itu sendirian. Aku ikut. Anggap saja kita punya musuh yang sama.'],
  ['arga', 'Selamat datang di party, Nyx.']);
D('nyx.story',
  ['nyx', 'Kau pernah bertanya kenapa aku bicara sedikit. Ordo Senja mengajarkan: kata-kata menarik bayangan.'],
  ['nyx', 'Dua puluh tahun lalu Ordo mengirim satu regu ke lembah ini. Hanya pemimpinnya yang pulang, dan ia tak pernah mau cerita.'],
  ['arga', 'Dan kau ingin tahu apa yang terjadi.'],
  ['nyx', 'Dia kakakku. Karena itu aku di sini.', { set: { nyxStory: 1 }, fr: ['nyx', 3] }]);
D('nyx.story2',
  ['nyx', 'Aku sudah menyusun potongannya. Segel di permata itu memang menahan bayangan. Tapi ia juga menahan roh lembah, dan itulah yang membuat bayangan itu berkembang.'],
  ['nyx', 'Apa pun pilihanmu di akhir nanti, pastikan itu pilihanmu sendiri, bukan pilihan Wira.'],
  ['arga', 'Kau tidak akan menghentikanku?'],
  ['nyx', 'Aku ksatria, bukan hakim. Aku hanya menjaga punggungmu.', { set: { nyxStory2: 1 }, fr: ['nyx', 3] }]);
D('end.mother_a',
  ['narrator', 'Wira menyegel ulang permata itu. Di balik cahayanya, sebuah suara yang dikenal Arga memudar pelan, dan liontin di lehernya meredup.']);
D('end.mother_b',
  ['yara', 'Penjaga terakhir telah bebas. Kau mendengarnya, bukan?'],
  ['arga', 'Ibu...? Liontin ini... hangat sekali.'],
  ['yara', 'Ia menitipkan satu pesan: "Pulanglah ke lembah, Nak. Itu sudah cukup."']);
D('end.mother_c',
  ['narrator', 'Liontin giok di leher Arga retak dalam diam. Dari dalam permata, seseorang memanggil namanya, dan ia memilih untuk tidak mendengar.']);

/* ========================= ENDING ========================= */
D('end.hero',
  ['wira', 'Terima kasih. Desa kembali hidup... dan kau akan dikenang sebagai pahlawan.', { fn: 'endHero' }],
  ['narrator', 'Permata kembali ke altar. Sungai kembali jernih, ladang kembali hijau, dan Arga dielu-elukan sebagai pahlawan Lembah.'],
  ['narrator', 'Namun jauh di dalam Hutan Bisik, pohon-pohon terus menguning. Tak ada yang bertanya mengapa.']);
D('end.restore',
  ['wira', '...Jadi kau tahu. Darma sudah bercerita, dan Grumak pun begitu.'],
  ['wira', 'Aku takut, Arga. Takut wabah itu datang lagi bila permata ini kulepas.'],
  ['arga', 'Lembah ini tidak hanya milik desa, Wira. Hutan itu juga rumah. Kita cari jalan bersama.'],
  ['wira', '...Baiklah. Bantu aku membukanya.', { fn: 'endRestore' }],
  ['narrator', 'Permata dibebaskan. Roh lembah mengalir ke dua arah: ke ladang desa dan ke akar hutan yang layu.'],
  ['narrator', 'Para orc dan penduduk desa berdiri di dua sisi sungai yang sama. Untuk pertama kali dalam dua puluh tahun, tak ada yang menyeberang dengan senjata.']);
D('end.dark',
  ['wira', 'Arga...? Apa maksudmu?'],
  ['arga', 'Permata ini memberi kekuatan yang tak pernah kudapat dengan pedang. Aku tak akan melepasnya.'],
  ['wira', 'Kekuatan itu menelan roh lembah! Kau tak akan sanggup...', { fn: 'endDark' }],
  ['narrator', 'Arga memegang permata itu dan lembah patuh padanya. Desa makmur, hutan layu, dan tak seorang pun berani melawan sang penjaga baru.'],
  ['narrator', 'Pahlawan Lembah Hijau berubah menjadi penguasanya.']);

/* ========================= GRUMAK & KAPTEN ========================= */
D('captain.intro',
  ['captain', 'Manusia kecil! Kau membunuh anak buahku di kamp itu. Panglima Grumak akan memuji kepalamu!'],
  ['arga', 'Minggirlah. Aku tak ingin lebih banyak pertumpahan darah.'],
  ['captain', 'Tak ingin? Hahaha! Kalian yang memulainya dua puluh tahun lalu!']);
D('captain.p2',
  ['captain', 'Kuat juga kau! Tapi aku belum selesai!']);
D('captain.dead',
  ['captain', 'Panglima... benar. Kalian tak mau mendengar...', { set: { captainDown: 1, heardCaptain: 1 }, fn: 'dropKey' }],
  ['arga', '"Kalian yang memulainya." Apa maksudnya...?']);
D('grumak.intro',
  ['grumak', 'Jadi kau yang menembus gua dan benteng-bentengku. Pantas. Kau membawa bau Wira.'],
  ['arga', 'Kembalikan Permata Hijau, Grumak. Lembah itu butuh jantungnya.'],
  ['grumak', 'Lembah?! Kau pikir hanya ada satu lembah, manusia?! Lihat hutanku, lihat anak-anakku mati kelaparan!'],
  ['grumak', 'Bicara itu mudah. Buktikan pedangmu!']);
D('grumak.p2',
  ['grumak', 'Hh... kau tidak seperti prajurit manusia lainnya.']);
D('grumak.p2choice',
  ['grumak', 'Dengar, manusia. Permata itu menguras hutan kami sejak Wira menyegelnya. Aku tidak mencuri; aku mengambil kembali.'],
  { ch: [
    { t: 'Aku mau mendengar. Hentikan pertarungan ini.', go: 'grumak.listen', if: 'truth>=2' },
    { t: 'Bohong! Aku tak akan percaya!', go: 'grumak.refuse' },
    { t: 'Aku tak tahu harus percaya siapa...', go: 'grumak.refuse', if: '!truth>=2' } ] });
D('grumak.refuse', ['grumak', 'Kalau begitu pedangmu yang akan menjawab!']);
D('grumak.listen',
  ['arga', 'Darma menceritakannya. Nenek Lastri juga. Tulisan di gua itu pun sama. Kau tidak berbohong.', { set: { grumakSpared: 1 } }],
  ['grumak', 'Kau... telah melihatnya sendiri? Bahwa roh lembah ditawan, dan hutan perlahan mati karenanya?'],
  ['arga', 'Aku akan membawa permata itu pulang. Tapi bukan untuk disegel lagi.', { truth: 1 }],
  ['grumak', 'Kalau begitu pergilah. Dan ingat: yang kuinginkan hanya rumah, bukan perang.', { fn: 'grumakPeace' }]);
D('grumak.dead',
  ['grumak', 'Kau... menang. Tapi... bahkan setelah aku mati, hutan akan tetap layu...', { fn: 'grumakKilled' }],
  ['arga', '(Tangannya terkulai. Di genggamannya, Permata Hijau bersinar lemah.)']);

/* ========================= PAK JOKO ========================= */
D('joko.ask',
  ['joko', 'Eh, Arga! Tolong, tiga ayam merahku lepas dari kandang waktu orc menyerbu. Mereka kabur ke arah pohon, kolam, dan jalan selatan.'],
  { ch: [
    { t: 'Aku bantu cari.', go: 'joko.accept' },
    { t: 'Maaf, sedang sibuk.', go: 'joko.decline' } ] });
D('joko.accept', ['joko', 'Terima kasih! Tangkap saja kalau ketemu, ya.', { set: { ayamStart: 1 }, q: 'ayam' }]);
D('joko.decline', ['joko', 'Ah, ya sudah. Kalau luang, kabari aku.']);
D('joko.wait', ['joko', 'Sudah ketemu? Mereka biasanya main dekat pohon, kolam, atau jalan selatan.']);
D('joko.done',
  ['joko', 'Luar biasa! Ketiga ayamku pulang. Ini hadiah dariku. Dan mulai hari ini, kau boleh pakai petak ladangku.', { set: { ayamDone: 1, farmOpen: 1 }, gold: 60, item: { b_gandum: 4, b_wortel: 4 }, fr: ['joko', 8] }],
  ['joko', 'Tanam, tunggu, panen. Kalau mau beres sendiri, aku bisa menyewa pekerja untuk ladang. Hubungi aku di panel Ladang.', { toast: 'Ladang terbuka! Interaksi dengan petak tanah di peternakan.' }]);
D('joko.story',
  ['joko', 'Dulu aku prajurit di benteng orc, Arga. Bukan musuh; kami berdagang. Sebelum wabah, desa dan hutan itu sahabat.'],
  ['joko', 'Entah mengapa semua orang sekarang lupa.', { set: { jokoStory: 1 }, fr: ['joko', 3], truth: 0 }]);

/* ========================= BUDI (ANAK HILANG) ========================= */
D('budi.found',
  ['budi', 'Kak Arga! Aku... aku cuma mau lihat cahaya hijau di hutan itu. Tapi aku tersesat, dan ada suara orc...'],
  ['arga', 'Tenang. Tetap dekat denganku. Kita pulang sekarang.'],
  ['budi', 'Janji jangan marahi aku?', { set: { budiEscort: 1 }, fn: 'budiFollow', q: 'budi' }]);
D('budi.ambush',
  ['orc', 'Anak manusia kecil! Tangkap dia!'],
  ['arga', 'Budi, di belakangku!']);
D('budi.home',
  ['budi', 'Aku pulang! Terima kasih, Kak Arga. Aku janji nggak ke hutan lagi... kecuali sama Kakak!', { set: { budiHome: 1 }, fr: ['budi', 12], gold: 40, item: { bunga: 2 } }]);

/* ========================= BU SARI ========================= */
D('sari.obat',
  ['sari', 'Arga... boleh minta tolong? Nenekku makin lemah. Tabib bilang hanya Bunga Bulan yang bisa menolong, tapi bunganya hanya mekar di malam hari.'],
  ['sari', 'Kumpulkan tiga kuntum di hutan, lalu racik Obat Nenek di Meja Kerja toko ini.'],
  { ch: [ { t: 'Pasti kubantu.', go: 'sari.obat_ok' }, { t: 'Nanti ya.', go: 'sari.obat_no' } ] });
D('sari.obat_ok', ['sari', 'Terima kasih banyak. Bunga itu bercahaya biru di bawah bulan.', { set: { obatStart: 1 }, q: 'obat' }]);
D('sari.obat_no', ['sari', 'Aku mengerti. Tapi jangan lama-lama ya.']);
D('sari.obat_wait', ['sari', 'Bunga Bulan hanya mekar malam hari di hutan. Lalu racik Obat Nenek di Meja Kerja. Semoga Nenek kuat.']);
D('sari.pasar',
  ['sari', 'Arga, kau punya mata dagang? Toko ini bisa maju kalau ada modal baru. Jual hasil tani ke aku, dan pertimbangkan investasi.'],
  ['sari', 'Jual lima hasil panen, dan tanamkan modal ke salah satu usaha. Kuberi bonus besar.', { set: { pasarStart: 1 }, q: 'pasar' }]);
D('sari.pasar_done',
  ['sari', 'Kau cepat sekali belajar! Nih, bonus dari toko. Pelanggan bilang tokoku lebih ramai sejak kau berinvestasi.', { set: { pasarDone: 1 }, gold: 150, item: { potion2: 2 }, fr: ['sari', 6] }]);
D('sari.resep',
  ['sari', 'Kita sudah dekat, Arga. Aku mau mewariskan resep kue Nenek. Syaratnya: bawa empat gandum, satu madu hutan, dan satu bunga liar.'],
  ['sari', 'Racik di Meja Kerja, lalu bawa kuenya padaku.', { set: { resepSari: 1 }, q: 'resep' }]);
D('sari.resep_done',
  ['sari', 'Rasanya persis seperti buatan Nenek. Terima kasih, Arga. Ambil ini, anting peninggalan ibuku.', { set: { resepDone: 1 }, item: { a_anting: 1 }, fr: ['sari', 10] }]);
D('sari.story',
  ['sari', 'Aku bukan penduduk asli desa ini. Ibuku pedagang dari hutan, bukan orc, tapi kaum yang hidup di antaranya.'],
  ['sari', 'Setelah wabah, dagang antara hutan dan desa dilarang. Aku masih menunggu hari ia dibuka lagi.', { set: { sariStory: 1 }, fr: ['sari', 3] }]);
D('sari.obat_done_note', ['sari', 'Nenek sudah sehat berkat kau. Aku berhutang budi.']);

/* ========================= NENEK LASTRI ========================= */
D('lastri.legend',
  ['lastri', 'Duduk sini, Nak. Aku tahu kau penasaran. Ada legenda lama yang tak dituliskan Wira di papan desa.'],
  ['lastri', '"Roh lembah memberi hidup pada dua kaum: manusia di hilir, orc di hulu. Bila salah satunya mengurungnya, yang lain layu."'],
  ['lastri', 'Permata Hijau tak pernah mencuri apa-apa. Yang mencuri adalah tangan yang menyegelnya.', { set: { legendHeard: 1 }, truth: 1, q: 'legenda', fr: ['lastri', 3] }],
  ['arga', '(Legenda itu... jadi menjelaskan jawaban Wira yang terlalu cepat.)']);
D('lastri.obat',
  ['lastri', 'Ah... obat ini wangi. Terima kasih, Nak. Rasanya seperti pulang.', { set: { obatDone: 1 }, fr: ['lastri', 12], gold: 80, item: { madu: 1 } }]);
D('lastri.obat_note', ['lastri', 'Kau mengantar obat dari Sari? Ia cucu yang baik.']);

/* ========================= JANA ========================= */
D('jana.ask',
  ['jana', 'Kau yang diutus Wira? Aku Jana, penjaga gerbang. Bukan prajurit biasa, aku pernah mengawal bangsawan di ibu kota.'],
  ['jana', 'Beberapa gerombolan orc penyerbu berkeliaran di sisi barat hutan. Selama mereka di situ, aku tak bisa meninggalkan gerbang. Bantu aku bereskan tiga kelompok.'],
  { ch: [ { t: 'Serahkan padaku.', go: 'jana.accept' }, { t: 'Sebentar lagi.', go: 'jana.decline' } ] });
D('jana.accept', ['jana', 'Bagus. Mereka berkeliaran di barat hutan.', { set: { janaStart: 1 }, q: 'jana' }]);
D('jana.decline', ['jana', 'Kalau gerbang ini jatuh, desa ikut jatuh. Tapi baiklah.']);
D('jana.wait', ['jana', 'Masih ada gerombolan di barat hutan. Aku bersiap di sini.']);
D('jana.done',
  ['jana', 'Kau melakukannya. Aku memutuskan satu hal: aku ikut denganmu.', { set: { janaDone: 1, janaJoined: 1 }, fn: 'joinJana', fr: ['jana', 12] }],
  ['jana', 'Tamengku untuk tujuanmu. Jangan sia-siakan.', { toast: 'Jana bergabung dengan party!' }]);
D('jana.story',
  ['jana', 'Aku meninggalkan ibu kota karena menolak perintah membakar sebuah desa penuh warga. Aku tak mau jadi pedang yang tak berpikir.'],
  ['jana', 'Karena itu aku pilih jadi penjaga gerbang. Setidaknya di sini, perisaiku melindungi, bukan melukai.', { set: { janaStory: 1 }, fr: ['jana', 3] }]);

/* ========================= PAK DARMA ========================= */
D('darma.rescue',
  ['darma', 'Kau... manusia desa? Aku dikurung dua hari. Orc-orang itu tidak menyiksaku, tapi mereka tak mau melepaskanku.'],
  ['darma', 'Namaku Darma. Terima kasih sudah datang. Aku ikut denganmu; hutan ini bukan hutan yang kukenal lagi.', { set: { darmaJoined: 1 }, fn: 'joinDarma', fr: ['darma', 10] }],
  ['darma', 'Dengar, anak muda. Bila aku bicara tentang benteng, kau mungkin kaget. Tapi aku akan menjelaskan nanti.', { toast: 'Pak Darma bergabung dengan party!' }]);
D('darma.story1',
  ['darma', 'Aku bukan hanya pemburu. Dua puluh tahun lalu aku berburu bersama seorang orc muda bernama Grumak. Ia sahabatku.'],
  ['darma', 'Saat wabah, aku melihat sendiri Wira menyegel roh lembah. Setelah itu hutan orc layu. Anak-anak Grumak sakit.'],
  ['darma', 'Aku tak bisa melawan. Aku diam. Itu penyesalan terbesarku.', { set: { darmaStory: 1 }, truth: 1, fr: ['darma', 3] }]);
D('darma.kenangan',
  ['darma', 'Arga... ada satu hal. Liontin pemberian Grumak ketinggalan di bekas kemahku di hutan selatan. Maukah kau ambilkan?'],
  ['darma', 'Letaknya di dekat jalan setapak selatan, di balik batu besar.', { set: { kenangStart: 1 }, q: 'kenangan' }]);
D('darma.kenangan_done',
  ['darma', 'Liontin ini... lambang orc dan manusia berdampingan. Terima kasih, Nak.', { set: { kenangDone: 1 }, item: { a_jimat: 1 }, fr: ['darma', 10] }]);

/* ========================= RUDI (TAWANAN GUA) ========================= */
D('rudi.rescue',
  ['rudi', 'Syukurlah! Aku pedagang keliling. Kerangka-kerangka itu mengurungku sejak kemarin.'],
  ['rudi', 'Sebagai balas jasa: aku akan berdagang di alun-alun desa tiap hari, pagi sampai sore. Aku punya barang yang tak ada di toko.', { set: { rudiSaved: 1 }, fr: ['rudi', 10], gold: 30 }]);
D('rudi.hi', ['rudi', 'Selamat datang! Barang langka, harga bersahabat.']);

/* ========================= PRASASTI & TEKA-TEKI ========================= */
D('inscription',
  ['narrator', 'Prasasti kuno berpendar redup. Tulisannya hampir pudar.'],
  ['narrator', '"Merah membuka, Biru menjaga, Kuning menutup. Hidupkan dalam urutan itu."', { set: { readInsc: 1 } }],
  ['narrator', 'Di bagian bawah ada tulisan lain: "Roh lembah memberi hidup pada hulu dan hilir. Bila satu mengurung, yang lain layu."', { truth: 1, set: { inscTruth: 1 }, q: 'legenda' }]);
D('crystal.ok', ['narrator', 'Kristal menyala. Gema merambat ke dinding gua.']);
D('crystal.fail', ['narrator', 'Kristal-kristal itu padam dengan dengung sumbang. Urutannya salah.']);
D('crystal.done', ['narrator', 'Ketiga kristal menyala. Gerbang besi terangkat perlahan, dan gua bergetar.']);
D('arena.start', ['narrator', 'Jeruji besi menutup di belakangmu! Gelombang musuh muncul dari kegelapan.']);
D('arena.done', ['narrator', 'Jeruji terbuka. Sebuah peti muncul dari kegelapan.']);
D('benteng.seal', ['narrator', 'Pintu besar benteng menutup. Hanya satu jalan: menembus ruang takhta.']);
D('night.fall', ['narrator', 'Hari beranjak malam. Bulan menggantung di atas lembah.']);

/* ===== obrolan persahabatan: band 0 (lv0-1), 1 (lv2-3), 2 (lv4-5) ===== */
const CHAT = {};
const C = (npc, band, ...pairs) => { CHAT[npc] = CHAT[npc] || [[], [], []]; pairs.forEach((p, i) => { const id = `chat.${npc}.${band}.${CHAT[npc][band].length}`; DLG[id] = [[npc, p]]; CHAT[npc][band].push(id); }); };
C('wira', 0, 'Desa ini bergantung padamu sekarang, Arga.', 'Kau belum banyak berubah. Masih terburu-buru.');
C('wira', 1, 'Dulu kau suka duduk di sini mendengar dongengku. Ingat?', 'Orang tua ini hanya ingin lembah ini tetap utuh.');
C('wira', 2, 'Aku bangga padamu, Arga. Apa pun yang terjadi nanti, ingatlah itu.', 'Beban menyimpan rahasia itu berat. Kau akan mengerti suatu hari.');
C('nyx', 0, 'Bayangan tidak suka cahaya. Tetap dekat lenteranya.', 'Jangan mengasihaniku. Fokus ke depan.');
C('nyx', 1, 'Es itu jujur: ia tidak berpura-pura hangat.', 'Kau cepat belajar, ' + 'Arga. Aku tidak sering mengatakannya.');
C('nyx', 2, 'Aku mulai betah di desa ini. Jangan bilang siapa-siapa.', 'Kalau aku jatuh, lanjutkan tanpa aku. Itu perintah.');
C('joko', 0, 'Ayam-ayamku nakal semua. Tapi sayang, ya.', 'Tanah di sini subur, asal dirawat.');
C('joko', 1, 'Tanam bibit, tunggu, panen. Sederhana, tapi bikin damai.', 'Konon dulu orc dan petani saling tukar hasil bumi. Aneh, ya?');
C('joko', 2, 'Kau mirip anakku: keras kepala. Maksudku itu pujian.', 'Kalau ladang ini sampai kering, hatiku ikut kering.');
C('budi', 0, 'Kak Arga, pedangmu keren!', 'Aku mau jadi ksatria juga!');
C('budi', 1, 'Aku mau ke hutan lagi, tapi bareng Kakak ya!', 'Aku bisa memanjat pohon paling tinggi di desa!');
C('budi', 2, 'Kakak sudah seperti kakakku sendiri. Terima kasih!', 'Nanti kalau besar aku ikut Kakak berpetualang.');
C('sari', 0, 'Mau belanja? Stok baru datang tiap hari.', 'Harga naik turun mengikuti pasar, lho.');
C('sari', 1, 'Dagang itu soal percaya. Aku suka orang yang bisa dipercaya.', 'Kalau modalmu ada, investasikan saja. Untungnya stabil.');
C('sari', 2, 'Kau sahabat terbaikku di desa ini, tahu?', 'Suatu hari aku ingin membuka jalur dagang ke hutan lagi.');
C('lastri', 0, 'Duduklah, Nak. Aku sedang merajut.', 'Cuaca dingin tak baik untuk tulang tua ini.');
C('lastri', 1, 'Dulu hutan itu ramai, penuh tawa orc kecil. Kau tak akan percaya.', 'Ceritaku panjang, kalau kau mau mendengar.');
C('lastri', 2, 'Aku bahagia kau pulang. Desa ini butuh orang sepertimu.', 'Jaga dirimu, Nak. Itu saja pintaku.');
C('jana', 0, 'Berjaga itu membosankan, tapi perlu.', 'Jangan melamun di gerbang.');
C('jana', 1, 'Perisai ini sudah menemaniku bertahun-tahun.', 'Kalau lelah, istirahat. Pertarungan tak lari.');
C('jana', 2, 'Aku senang memilih ikut kau. Jarang ada yang membuatku percaya.', 'Kita bagus bersama. Aku di depan, kau menyerang.');
C('darma', 0, 'Hutan ini berbisik, kalau kau mau mendengar.', 'Jangan injak ranting kering. Musuh mendengar.');
C('darma', 1, 'Panah itu soal napas. Tahan, lalu lepas.', 'Anak muda, kau punya mata pemburu.');
C('darma', 2, 'Kalau semua ini selesai, aku ingin ke hutan lagi dan menemui kawan lamaku.', 'Terima kasih sudah membuatku berhenti bersembunyi dari penyesalan.');
C('rudi', 0, 'Barang bagus, harga bersahabat!', 'Hati-hati di jalan. Banyak bandit.');
C('rudi', 1, 'Aku punya rekan di ibu kota yang bisa kirim barang langka.', 'Dagang itu seperti ladang: sabar dan telaten.');
C('rudi', 2, 'Berkat kau aku masih hidup. Aku tak akan lupa itu.', 'Hubungi aku kalau butuh sesuatu yang susah dicari.');

/* ========================= NPC ========================= */
/* sched: [jamMulai, jamSelesai, peta|null, tx, ty, aktivitas]  (null = tidak di peta mana pun) */
const NPCS = {
  wira: { n: 'Tetua Wira', spr: 'eleonore', likes: ['bunga', 'madu'], hates: ['tulang'], bio: 'Penjaga desa yang bijak. Menyimpan rahasia dua puluh tahun.', role: 'Tetua Desa',
    sched: [[0, 7, 'rumah_tetua', 4, 5, 'Tidur'], [7, 9, 'rumah_tetua', 9, 8, 'Menyeduh teh'], [9, 17, 'desa', 21, 18, 'Mengawasi desa'], [17, 20, 'desa', 17, 19, 'Menikmati senja'], [20, 24, 'rumah_tetua', 9, 8, 'Membaca']] },
  joko: { n: 'Pak Joko', spr: 'farmer', tint: ['#e0a040', .35], likes: ['gandum', 'tomat'], hates: ['darah'], bio: 'Petani ramah yang dulu berdagang dengan hutan.', role: 'Petani',
    sched: [[0, 6, null], [6, 17, 'desa', 36, 29, 'Merawat ternak'], [17, 20, 'desa', 28, 19, 'Mengobrol'], [20, 24, null]] },
  budi: { n: 'Budi', spr: 'farmer', tint: ['#7ac0ff', .35], small: 1, likes: ['madu', 'kue'], hates: ['herba'], bio: 'Anak penasaran yang suka menjelajah.', role: 'Anak Desa',
    sched: [[0, 7, null], [7, 19, 'desa', 27, 21, 'Bermain', 1], [19, 24, null]], wander: 1 },
  sari: { n: 'Bu Sari', spr: 'girl1', likes: ['bunga', 'kue'], hates: ['tulang', 'darah'], bio: 'Pedagang muda yang cekatan. Pemilik Toko Sari.', role: 'Pedagang',
    sched: [[0, 7, 'rumah_warga', 8, 7, 'Tidur'], [7, 19, 'toko', 6, 4, 'Menjaga toko'], [19, 24, 'rumah_warga', 8, 7, 'Beristirahat']] },
  lastri: { n: 'Nenek Lastri', spr: 'farmer', tint: ['#cfcfcf', .5], likes: ['madu', 'bunga'], hates: ['taring'], bio: 'Nenek Sari. Penyimpan legenda lama.', role: 'Tetua Cerita',
    sched: [[0, 8, 'rumah_warga', 9, 5, 'Tidur'], [8, 17, 'rumah_warga', 6, 6, 'Merajut'], [17, 20, 'desa', 28, 19, 'Duduk di bangku'], [20, 24, 'rumah_warga', 6, 6, 'Merajut']] },
  jana: { n: 'Jana', spr: 'joanna', likes: ['kue', 'kristal'], hates: ['bunga'], bio: 'Penjaga gerbang bermasa lalu pengawal bangsawan.', role: 'Penjaga Gerbang', party: 'jana',
    sched: [[0, 6, 'desa', 44, 19, 'Berjaga malam'], [6, 22, 'desa', 46, 15, 'Berjaga'], [22, 24, 'desa', 44, 19, 'Berjaga malam']] },
  darma: { n: 'Pak Darma', spr: 'hunter', likes: ['madu', 'wortel'], hates: ['kulit'], bio: 'Pemburu tua yang menyimpan penyesalan.', role: 'Pemburu', party: 'darma',
    sched: [[0, 24, 'hutan', 47, 34, 'Ditawan']] },
  nyx: { n: 'Nyx', spr: 'nyxI', likes: ['kristal', 'bulan'], hates: ['kue', 'madu'], bio: 'Ksatria Ordo Senja yang memburu bayangan. Dingin di luar, setia di dalam.', role: 'Ksatria Senja', party: 'nyx',
    sched: [[0, 24, null]] },
  rudi: { n: 'Rudi', spr: 'farmer', tint: ['#c08060', .4], likes: ['kristal', 'gandum'], hates: ['tulang'], bio: 'Pedagang keliling dengan barang langka.', role: 'Pedagang Langka',
    sched: [[0, 8, null], [8, 18, 'desa', 30, 19, 'Berdagang'], [18, 24, null]] },
};
/* syarat kehadiran NPC di dunia */
const NPC_PRESENT = {
  budi:  () => !(F('budiLost') && !F('budiHome')),   // saat hilang tidak ada di desa
  rudi:  () => F('rudiSaved') && S.day >= (S.flags.rudiDay || 0),
  darma: () => !F('darmaJoined'),
  jana:  () => !F('janaJoined'),
  nyx:   () => false,
};
const GIFT_TEXT = {   // respon hadiah (suka / biasa / tak suka) — otomatis dapat Voice ID
  wira: ['Madu... sudah lama sekali. Kau baik sekali, Arga.', 'Terima kasih, Nak.', 'Hm. Aku akan menyimpannya... jauh-jauh.'],
  joko: ['Wah, ini kesukaanku! Mantap!', 'Terima kasih ya, nak.', 'Eh... baunya kurang enak.'],
  budi: ['Wah! Kak Arga baik banget!', 'Makasih, Kak!', 'Ih... aku nggak suka itu.'],
  sari: ['Ya ampun, cantiknya! Terima kasih!', 'Terima kasih, Arga.', 'Hm, ini... bukan seleraku.'],
  lastri: ['Ah, cucu yang baik. Terima kasih, Nak.', 'Ya, ya, terima kasih.', 'Waduh, simpan saja, Nak.'],
  jana: ['Hadiah yang bagus. Aku suka.', 'Terima kasih.', 'Aku tak butuh itu.'],
  darma: ['Hah, kau tahu seleraku. Terima kasih.', 'Cukup berguna. Terima kasih.', 'Aku tidak mau.'],
  nyx: ['...Kristal. Kau memperhatikan. Terima kasih.', 'Berguna. Terima kasih.', 'Tidak, terima kasih.'],
  rudi: ['Barang bagus! Kau tahu kesukaanku.', 'Terima kasih.', 'Aku tak berminat.'],
};
const FR_NAMES = ['Asing', 'Kenalan', 'Teman', 'Akrab', 'Sahabat', 'Sehati'];
const FR_STEPS = [0, 8, 20, 38, 62, 90];

/* ========================= QUEST ========================= */
/* tipe: main | side | hidden.  step.c = syarat selesai (lihat cond() di systems.js). hint: {npc} atau {map,tx,ty} */
const QUESTS = {
  main: { n: 'Permata yang Hilang', type: 'main', giver: 'Tetua Wira', desc: 'Permata Hijau dicuri pasukan orc. Rebut kembali sebelum lembah mati.',
    steps: [
      { t: 'Temui Tetua Wira di alun-alun desa.', c: 'metWira', hint: { npc: 'wira' } },
      { t: 'Keluar lewat gerbang timur menuju Hutan Bisik.', c: 'inForest', hint: { map: 'desa', tx: 48, ty: 18 } },
      { t: 'Kalahkan orc penjaga kamp di timur hutan.', c: 'campCleared', hint: { map: 'hutan', tx: 44, ty: 33 } },
      { t: 'Bebaskan Pak Darma dari kerangkeng.', c: 'darmaJoined', hint: { map: 'hutan', tx: 47, ty: 33 } },
      { t: 'Kalahkan Kapten Orc di timur laut hutan.', c: 'captainDown', hint: { map: 'hutan', tx: 61, ty: 10 } },
      { t: 'Ambil Kunci Gua yang dijatuhkan Kapten.', c: 'item.kunci>=1', hint: { map: 'hutan', tx: 61, ty: 11 } },
      { t: 'Buka pintu Gua Gema di utara hutan.', c: 'inCave', hint: { map: 'hutan', tx: 60, ty: 4 } },
      { t: 'Nyalakan tiga kristal sesuai urutan prasasti.', c: 'gateOpen', hint: { map: 'gua', tx: 24, ty: 24 } },
      { t: 'Bertahan di arena gua bagian utara.', c: 'arenaClear', hint: { map: 'gua', tx: 24, ty: 9 } },
      { t: 'Masuki Benteng Orc di ujung gua.', c: 'inFort', hint: { map: 'gua', tx: 24, ty: 3 } },
      { t: 'Hadapi Panglima Grumak di ruang takhta.', c: 'grumakDone', hint: { map: 'benteng', tx: 22, ty: 9 } },
      { t: 'Bawa Permata Hijau kembali ke Tetua Wira.', c: 'gameEnd', hint: { npc: 'wira' } },
    ], reward: { text: 'Tamat' } },
  ayam: { n: 'Ayam yang Hilang', type: 'side', giver: 'Pak Joko', desc: 'Tiga ayam merah Pak Joko kabur saat orc menyerbu desa.',
    steps: [{ t: 'Cari tiga ayam merah (dekat pohon, kolam, jalan selatan).', c: 'chickens>=3', hint: { map: 'desa', tx: 5, ty: 24 } }, { t: 'Kembali ke Pak Joko.', c: 'ayamDone', hint: { npc: 'joko' } }], reward: { text: '60 Gold, bibit, petak ladang' } },
  budi: { n: 'Anak Penjelajah', type: 'side', giver: 'Budi', desc: 'Budi tersesat di Hutan Bisik. Kawal dia pulang dengan selamat.',
    steps: [{ t: 'Antar Budi ke gerbang barat hutan tanpa dia terluka.', c: 'budiHome', hint: { map: 'hutan', tx: 1, ty: 23 } }], reward: { text: '40 Gold, Bunga Liar, persahabatan Budi' } },
  obat: { n: 'Obat untuk Nenek', type: 'side', giver: 'Bu Sari', desc: 'Nenek Lastri sakit. Bunga Bulan mekar malam hari di hutan dan dibutuhkan untuk obatnya.',
    steps: [{ t: 'Kumpulkan 3 Bunga Bulan di Hutan Bisik (hanya mekar malam).', c: 'item.bulan>=3', hint: { map: 'hutan', tx: 14, ty: 18 } }, { t: 'Racik Obat Nenek di Meja Kerja Toko Sari.', c: 'item.obat_nenek>=1', hint: { map: 'toko', tx: 10, ty: 6 } }, { t: 'Antar obat ke Nenek Lastri.', c: 'obatDone', hint: { npc: 'lastri' } }], reward: { text: '80 Gold, Madu Hutan, persahabatan' } },
  jana: { n: 'Beban Sang Penjaga', type: 'side', giver: 'Jana', desc: 'Gerombolan orc penyerbu mengganggu jalur barat hutan. Bereskan agar Jana bisa ikut bertualang.',
    steps: [{ t: 'Kalahkan 3 gerombolan penyerbu di barat hutan.', c: 'kills.raider>=3', hint: { map: 'hutan', tx: 14, ty: 23 } }, { t: 'Kembali ke Jana.', c: 'janaDone', hint: { npc: 'jana' } }], reward: { text: 'Jana bergabung ke party' } },
  rudi: { n: 'Tawanan di Gua', type: 'side', giver: 'Auto', desc: 'Seseorang terkurung di Gua Gema, dijaga kerangka.',
    steps: [{ t: 'Kalahkan penjaga sel di bagian barat daya gua.', c: 'kills.rudi>=1', hint: { map: 'gua', tx: 19, ty: 38 } }, { t: 'Bebaskan sang tawanan.', c: 'rudiSaved', hint: { map: 'gua', tx: 17, ty: 39 } }], reward: { text: '30 Gold, pedagang Rudi di desa' } },
  pasar: { n: 'Pasar Ramai', type: 'side', giver: 'Bu Sari', desc: 'Belajar berdagang: jual hasil tani dan tanam modal pada sebuah usaha.',
    steps: [{ t: 'Jual 5 hasil tani ke Toko Sari.', c: 'sold>=5', hint: { npc: 'sari' } }, { t: 'Tanamkan modal ke satu usaha (Menu > Bisnis).', c: 'bizTotal>=1', hint: { npc: 'sari' } }, { t: 'Lapor ke Bu Sari.', c: 'pasarDone', hint: { npc: 'sari' } }], reward: { text: '150 Gold, 2 Ramuan Besar' } },
  resep: { n: 'Resep Rahasia Sari', type: 'side', giver: 'Bu Sari', desc: 'Sari bersedia membagi resep keluarga bagi sahabat sejatinya.',
    steps: [{ t: 'Racik Kue Rahasia Sari (4 Gandum, 1 Madu, 1 Bunga Liar).', c: 'item.kue_sari>=1', hint: { map: 'toko', tx: 10, ty: 6 } }, { t: 'Beri kue itu ke Sari.', c: 'resepDone', hint: { npc: 'sari' } }], reward: { text: 'Anting Angin, persahabatan' } },
  kenangan: { n: 'Kenangan Darma', type: 'side', giver: 'Pak Darma', desc: 'Pak Darma kehilangan liontin pemberian sahabat lamanya di hutan selatan.',
    steps: [{ t: 'Temukan liontin di bekas kemah Darma, hutan selatan.', c: 'item.liontin>=1', hint: { map: 'hutan', tx: 41, ty: 38 } }, { t: 'Antarkan liontin ke Pak Darma (menu Party).', c: 'kenangDone', hint: { npc: 'darma' } }], reward: { text: 'Jimat Hijau, persahabatan' } },
  legenda: { n: 'Legenda Lama', type: 'hidden', giver: 'Nenek Lastri', desc: 'Ada rahasia tentang roh lembah yang tak ada di papan desa.',
    steps: [{ t: 'Dengarkan legenda Nenek Lastri (butuh persahabatan Teman).', c: 'legendHeard', hint: { npc: 'lastri' } }, { t: 'Baca prasasti kuno di Gua Gema.', c: 'readInsc', hint: { map: 'gua', tx: 22, ty: 30 } }], reward: { text: 'Kebenaran (+2 petunjuk)' } },
  peti: { n: 'Harta Tersembunyi', type: 'hidden', giver: 'Rumor', desc: 'Orang bilang ada tiga peti rahasia di lembah ini.',
    steps: [{ t: 'Temukan 3 peti rahasia (desa, hutan, gua).', c: 'secrets>=3', hint: { map: 'desa', tx: 45, ty: 4 } }], reward: { text: 'Kristal Hati' } },
};
/* quest yang muncul dengan syarat (otomatis ditambah ke jurnal) */
const QUEST_AUTO = [
  { id: 'main', c: 'true' },
  { id: 'budi', c: 'budiLost', start: 1 },
  { id: 'rudi', c: 'inCave', start: 1 },
  { id: 'peti', c: 'day>=2', hidden: 1 },
  { id: 'darma.kenangan', c: 'false' },
];
/* catatan jurnal (lore) */
const LORE = [
  { id: 'l1', t: 'Permata Hijau', c: 'true', x: 'Batu pusaka yang menjaga kesuburan Lembah Hijau. Hilang tiga malam lalu.' },
  { id: 'l2', t: 'Hutan Bisik', c: 'inForest', x: 'Hutan lebat di timur desa. Kini dihuni pasukan orc dan makin layu.' },
  { id: 'l3', t: 'Kata Kapten Orc', c: 'heardCaptain', x: '"Kalian yang memulainya dua puluh tahun lalu." Apa maksudnya?' },
  { id: 'l4', t: 'Cerita Darma', c: 'darmaStory', x: 'Darma bersahabat dengan Grumak. Wira menyegel roh lembah saat wabah, dan hutan orc layu sejak itu.' },
  { id: 'l5', t: 'Legenda Nenek Lastri', c: 'legendHeard', x: 'Roh lembah menghidupi hulu dan hilir. Bila satu mengurungnya, yang lain layu.' },
  { id: 'l6', t: 'Prasasti Gua Gema', c: 'inscTruth', x: 'Tulisan kuno menegaskan isi legenda itu.' },
  { id: 'l7', t: 'Cerita Wira', c: 'wiraStory', x: 'Wira mengakui menyegel roh lembah ke dalam permata, dan membayar sesuatu untuk itu.' },
  { id: 'l9', t: 'Ksatria Senja', c: 'nyxMet', x: 'Nyx dari Ordo Senja memburu "bayangan" yang bocor dari segel Permata Hijau.' },
  { id: 'l10', t: 'Harga Penyegelan', c: 'wiraStory2', x: 'Ibumu, Penjaga terakhir, menjadi wadah roh lembah dalam permata. Liontin giok di lehermu adalah serpihannya.' },
  { id: 'l8', t: 'Kata Grumak', c: 'grumakSpared', x: 'Grumak tidak mencuri. Ia hanya ingin hutannya kembali.' },
];
