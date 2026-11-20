/* =========================================================================
   assets.js  —  DAFTAR ASSET (manifest) + pemotong sprite (atlas)
   -------------------------------------------------------------------------
   Mau tambah asset baru (v2, v3, ...)?
   1. Taruh file PNG di folder assets/
   2. Tambahkan satu baris di MANIFEST di bawah
   3. Pakai di game lewat IMG.namaKey  (lihat contoh SPR / ANIMS)
   ========================================================================= */

const MANIFEST = {
  // --- Farm RPG pack (16x16) ---
  tileset:   'assets/world/farm/tileset.png',
  props: 'assets/world/props.png', cfPath: 'assets/world/cf_path.png', cfWater: 'assets/world/cf_water.png', cfFarm: 'assets/world/cf_farm.png', cfOak: 'assets/world/cf_oak.png', cfPig: 'assets/world/cf_pig.png', cfSheep: 'assets/world/cf_sheep.png',
  char_idle: 'assets/world/farm/char_idle.png',
  char_walk: 'assets/world/farm/char_walk.png',
  house:     'assets/world/farm/house.png',
  interior:  'assets/world/farm/interior.png',
  tree:      'assets/world/farm/tree.png',
  fence:     'assets/world/farm/fence.png',
  rocks:     'assets/world/farm/rocks.png',
  chest:     'assets/world/farm/chest.png',
  crops:     'assets/world/farm/crops.png',
  cow_f:     'assets/world/farm/cow_f.png',
  cow_m:     'assets/world/farm/cow_m.png',
  chicken_red:    'assets/world/farm/chicken_red.png',
  chicken_blonde: 'assets/world/farm/chicken_blonde.png',
  chick:     'assets/world/farm/chick.png',
  // --- Tiny RPG Character pack (100x100 per frame) ---
  sol_idle:  'assets/chars/knight/idle.png',
  sol_walk:  'assets/chars/knight/walk.png',
  sol_atk1:  'assets/chars/knight/atk1.png',
  sol_atk2:  'assets/chars/knight/atk2.png',
  sol_bow:   'assets/chars/knight/bow.png',
  sol_hurt:  'assets/chars/knight/hurt.png',
  sol_death: 'assets/chars/knight/death.png',
  orc_idle:  'assets/chars/orc/idle.png',
  orc_walk:  'assets/chars/orc/walk.png',
  orc_atk1:  'assets/chars/orc/attack01.png',
  orc_atk2:  'assets/chars/orc/attack02.png',
  orc_hurt:  'assets/chars/orc/hurt.png',
  orc_death: 'assets/chars/orc/death.png',
  arrow:     'assets/ui/arrow.png',
  // --- Pemburu (Tiny RPG Soldier) untuk Pak Darma ---
  drm_idle: 'assets/chars/soldier/idle.png', drm_walk: 'assets/chars/soldier/walk.png', drm_atk: 'assets/chars/soldier/attack03.png',
  drm_hurt: 'assets/chars/soldier/hurt.png', drm_death: 'assets/chars/soldier/death.png',
  // --- Tiny RPG Character Pack 02 (v1.2): iblis & monster darah ---
  dem_idle: 'assets/chars/orc2/demon_idle.png', dem_walk: 'assets/chars/orc2/demon_walk.png', dem_atk1: 'assets/chars/orc2/demon_attack01.png',
  dem_atk2: 'assets/chars/orc2/demon_attack02.png', dem_hurt: 'assets/chars/orc2/demon_hurt.png', dem_death: 'assets/chars/orc2/demon_death.png',
  bld_idle: 'assets/chars/orc2/blood_idle.png', bld_walk: 'assets/chars/orc2/blood_walk.png', bld_atk1: 'assets/chars/orc2/blood_attack01.png',
  bld_atk2: 'assets/chars/orc2/blood_attack02.png', bld_hurt: 'assets/chars/orc2/blood_hurt.png', bld_death: 'assets/chars/orc2/blood_death.png',
  // --- Pixel Crawler: kerangka ---
  sk_base_idle: 'assets/chars/skeleton/base_idle.png', sk_base_run: 'assets/chars/skeleton/base_run.png', sk_base_death: 'assets/chars/skeleton/base_death.png',
  sk_mage_idle: 'assets/chars/skeleton/mage_idle.png', sk_mage_run: 'assets/chars/skeleton/mage_run.png', sk_mage_death: 'assets/chars/skeleton/mage_death.png',
  sk_rogue_idle: 'assets/chars/skeleton/rogue_idle.png', sk_rogue_run: 'assets/chars/skeleton/rogue_run.png', sk_rogue_death: 'assets/chars/skeleton/rogue_death.png',
  // --- NPC baru (Eleonore & Joanna, antarcticbees) ---
  npc_eleonore: 'assets/chars/npc/eleonore.png', npc_joanna: 'assets/chars/npc/joanna.png', npc_girl1: 'assets/chars/npc/girl1.png',
  // --- 0x72 Dungeon Tileset II (atlas) ---
  dungeon:  'assets/world/dungeon/atlas.png',
  // --- VFX ---
  fx_smear1: 'assets/fx/basic/smear_h1.png', fx_smear2: 'assets/fx/basic/smear_h2.png', fx_smear3: 'assets/fx/basic/smear_h3.png',
  fx_holy_init: 'assets/fx/basic/holy1_init.png', fx_holy_hit: 'assets/fx/basic/holy1_hit.png', fx_beam: 'assets/fx/basic/holy2.png',
  fx_dark1: 'assets/fx/basic/dark1.png', fx_ghost: 'assets/fx/basic/dark2.png',
  fx_bolt: 'assets/fx/basic/bolt.png',
  fx_explosion: 'assets/fx/basic/explosion.png', fx_dust: 'assets/fx/basic/dust.png',
  // --- v2: pahlawan (Zat = male_hero Ozzbit, Jess = Warrior), Nyx, potret, VFX baru ---
  zat_idle: 'assets/chars/hero/zat_idle.png', zat_walk: 'assets/chars/hero/zat_walk.png', zat_atk1: 'assets/chars/hero/zat_atk1.png',
  zat_atk2: 'assets/chars/hero/zat_atk2.png', zat_hurt: 'assets/chars/hero/zat_hurt.png', zat_death: 'assets/chars/hero/zat_death.png',
  jess_idle: 'assets/chars/hero/jess_idle.png', jess_walk: 'assets/chars/hero/jess_walk.png', jess_atk1: 'assets/chars/hero/jess_atk1.png',
  jess_atk2: 'assets/chars/hero/jess_atk2.png', jess_hurt: 'assets/chars/hero/jess_hurt.png', jess_death: 'assets/chars/hero/jess_death.png',
  nyx_idle: 'assets/chars/nyx/idle.png', nyx_walk: 'assets/chars/nyx/walk.png', nyx_wind: 'assets/chars/nyx/wind.png',
  por_luna: 'assets/chars/portraits/luna.png', por_yara: 'assets/chars/portraits/yara.png', por_annabel: 'assets/chars/portraits/annabel.png', por_lyriana: 'assets/chars/portraits/lyriana.png',
  por_nara: 'assets/chars/portraits/nara.png', por_eyvira: 'assets/chars/portraits/eyvira.png', por_iris: 'assets/chars/portraits/iris.png', por_lisara: 'assets/chars/portraits/lisara.png', por_leona: 'assets/chars/portraits/leona.png',
  fx_thunder_hit: 'assets/fx/elemental/thunder_hit.png', fx_thunder_strike: 'assets/fx/elemental/thunder_strike.png', fx_thunder_splash: 'assets/fx/elemental/thunder_splash.png',
  fx_ice_hit: 'assets/fx/elemental/ice_hit.png', fx_boom2: 'assets/fx/pack/boom2.png', fx_xp1: 'assets/fx/pack/xp1.png', fx_xp2: 'assets/fx/pack/xp2.png', fx_xp3: 'assets/fx/pack/xp3.png', fx_sx1: 'assets/fx/pack/sx1.png', fx_sx2: 'assets/fx/pack/sx2.png', fx_sx4: 'assets/fx/pack/sx4.png', fx_absorb: 'assets/fx/pack/absorb.png', fx_death2: 'assets/fx/pack/death2.png', fx_stpoison: 'assets/fx/pack/stpoison.png', fx_sparkle_st: 'assets/fx/pack/sparkle_st.png', fx_fire3: 'assets/fx/pack/fire3.png', fx_fire4: 'assets/fx/pack/fire4.png', fx_imp_b: 'assets/fx/pack/imp_b.png', fx_imp_w: 'assets/fx/pack/imp_w.png', fx_imp_v: 'assets/fx/pack/imp_v.png', fx_imp_y: 'assets/fx/pack/imp_y.png', fx_simp2: 'assets/fx/pack/simp2.png', fx_simp3: 'assets/fx/pack/simp3.png', fx_simp4: 'assets/fx/pack/simp4.png', fx_simp6: 'assets/fx/pack/simp6.png', fx_laura: 'assets/fx/pack/laura.png', fx_lb1: 'assets/fx/pack/lb1.png', fx_lb2: 'assets/fx/pack/lb2.png', fx_lb3: 'assets/fx/pack/lb3.png', fx_heart: 'assets/fx/pack/heart.png', fx_fw1: 'assets/fx/pack/fw1.png', fx_fw2: 'assets/fx/pack/fw2.png', fx_sp1: 'assets/fx/pack/sp1.png', fx_sp2: 'assets/fx/pack/sp2.png', fx_sp3: 'assets/fx/pack/sp3.png', fx_coin: 'assets/fx/pack/coin.png', fx_bubble: 'assets/fx/pack/bubble.png', fx_charge: 'assets/fx/pack/charge.png', fx_warp1: 'assets/fx/pack/warp1.png', fx_warp2: 'assets/fx/pack/warp2.png', fx_warp3: 'assets/fx/pack/warp3.png', fx_sparkb: 'assets/fx/pack/sparkb.png', fx_smk1: 'assets/fx/pack/smk1.png', fx_smk2: 'assets/fx/pack/smk2.png', fx_smk3: 'assets/fx/pack/smk3.png', fx_smkskull: 'assets/fx/pack/smkskull.png', fx_smk5: 'assets/fx/pack/smk5.png', fx_spl1: 'assets/fx/pack/spl1.png', fx_spl3: 'assets/fx/pack/spl3.png', fx_dspl1: 'assets/fx/pack/dspl1.png', fx_alert: 'assets/fx/pack/alert.png', fx_lvltext: 'assets/fx/pack/lvltext.png', fx_bulb: 'assets/fx/pack/bulb.png', fx_quest: 'assets/fx/pack/quest.png', fx_ok: 'assets/fx/pack/ok.png', fx_fail: 'assets/fx/pack/fail.png', fx_crown: 'assets/fx/pack/crown.png', fx_warn: 'assets/fx/pack/warn.png', fx_sup_atk: 'assets/fx/pack/sup_atk.png', fx_sup_def: 'assets/fx/pack/sup_def.png', fx_sup_mag: 'assets/fx/pack/sup_mag.png', fx_wst1: 'assets/fx/pack/wst1.png', fx_wst2: 'assets/fx/pack/wst2.png', fx_o_slash_w: 'assets/fx/pack/o_slash_w.png', fx_o_slash_g: 'assets/fx/pack/o_slash_g.png', fx_o_slash_r: 'assets/fx/pack/o_slash_r.png', fx_o_shard: 'assets/fx/pack/o_shard.png', fx_o_leaf: 'assets/fx/pack/o_leaf.png', fx_o_pillar: 'assets/fx/pack/o_pillar.png', fx_o_rune: 'assets/fx/pack/o_rune.png', bg_camp_gnd: 'assets/bg/camp_gnd.png', bg_camp_mid: 'assets/bg/camp_mid.png', bg_cave_gnd: 'assets/bg/cave_gnd.png', bg_cave_mid: 'assets/bg/cave_mid.png', bg_fort_gnd: 'assets/bg/fort_gnd.png', bg_fort_mid: 'assets/bg/fort_mid.png', bg_grass_d_gnd: 'assets/bg/grass_d_gnd.png', bg_grass_d_mid: 'assets/bg/grass_d_mid.png', bg_grass_n_gnd: 'assets/bg/grass_n_gnd.png', bg_grass_n_mid: 'assets/bg/grass_n_mid.png', bg_sky1_1: 'assets/bg/sky1_1.png', bg_sky1_2: 'assets/bg/sky1_2.png', bg_sky1_3: 'assets/bg/sky1_3.png', bg_sky1_4: 'assets/bg/sky1_4.png', bg_sky3_1: 'assets/bg/sky3_1.png', bg_sky3_2: 'assets/bg/sky3_2.png', bg_sky3_3: 'assets/bg/sky3_3.png', bg_sky3_4: 'assets/bg/sky3_4.png', bg_sky5_1: 'assets/bg/sky5_1.png', bg_sky5_2: 'assets/bg/sky5_2.png', bg_sky5_3: 'assets/bg/sky5_3.png', bg_sky5_4: 'assets/bg/sky5_4.png', bg_sky5_5: 'assets/bg/sky5_5.png', bg_sky7_1: 'assets/bg/sky7_1.png', bg_sky7_2: 'assets/bg/sky7_2.png', bg_sky7_3: 'assets/bg/sky7_3.png', bg_sky7_4: 'assets/bg/sky7_4.png', fx_heal: 'assets/fx/pack/heal.png', fx_atkup: 'assets/fx/pack/atkup.png', fx_defup: 'assets/fx/pack/defup.png', fx_haste: 'assets/fx/pack/haste.png', fx_poison: 'assets/fx/pack/poison.png', fx_strike: 'assets/fx/pack/strike.png', fx_boom: 'assets/fx/pack/boom.png', fx_impact: 'assets/fx/pack/impact.png', fx_burst: 'assets/fx/pack/burst.png', fx_wsplash: 'assets/fx/pack/wsplash.png', fx_wspike: 'assets/fx/pack/wspike.png', fx_ice_active: 'assets/fx/elemental/ice_active.png', fx_firebolt: 'assets/fx/elemental/firebolt.png', fx_fire_hit: 'assets/fx/elemental/fire_hit.png',
};

const IMG = {};

function loadAssets(onProgress) {
  const keys = Object.keys(MANIFEST);
  let done = 0;
  return Promise.all(keys.map(k => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; done++; onProgress && onProgress(done / keys.length); res(); };
    im.onerror = () => rej(new Error('Gagal memuat asset: ' + k));
    // build satu-file menyisipkan data-URI di window.ASSET_DATA
    im.src = (window.ASSET_DATA && window.ASSET_DATA[k]) || MANIFEST[k];
  })));
}

/* Potongan sprite statis: [gambar, sx, sy, lebar, tinggi] */
const SPR = {
  treeBig:    ['tree', 96, 1, 32, 46],
  treeMed:    ['tree', 71, 14, 20, 33],
  sapling:    ['tree', 43, 34, 9, 12],
  stump:      ['tree', 137, 35, 14, 12],
  houseA:     ['house', 4, 3, 72, 86],     // dinding polos (lumbung)
  houseB:     ['house', 148, 3, 72, 95],   // rumah lengkap + pintu
  chestClosed:['chest', 8, 2, 16, 15],
  chestOpen:  ['chest', 8, 18, 16, 14],
  fenceL:     ['fence', 0, 32, 16, 16],
  fenceM:     ['fence', 16, 32, 16, 16],
  fenceR:     ['fence', 32, 32, 16, 16],
  fenceV:     ['fence', 32, 16, 16, 16],
  rock1:      ['rocks', 2, 1, 13, 13],
  rock2:      ['rocks', 34, 3, 13, 22],
  rock3:      ['rocks', 1, 37, 31, 23],
  // interior
  bedV:   ['interior', 87, 8, 18, 34],
  bedH:   ['interior', 80, 52, 32, 24],
  fire:   ['interior', 115, 8, 26, 40],
  doorIn: ['interior', 144, 19, 16, 23],
  rug:    ['interior', 0, 82, 48, 30],
  chair:  ['interior', 2, 125, 11, 18],
  table:  ['interior', 68, 120, 24, 23],
  drawer: ['interior', 96, 120, 16, 18],
  plant:  ['interior', 1, 1, 13, 14],
  picture:['interior', 18, 1, 13, 14],
  clock:  ['interior', 1, 17, 13, 14],
  ptree:  ['interior', 34, 0, 11, 16],
  // tanaman (matang)
  cropA: ['crops', 80, 16, 16, 16],
  cropB: ['crops', 80, 48, 16, 16],
  cropC: ['crops', 96, 80, 16, 16],
  cropD: ['crops', 80, 112, 16, 16],
};

/* Atlas properti kecil (Pixel Crawler Vegetation): nama -> [x, y, w, h] */
const PROPS = {"bush_l_g":[0,0,43,43],"bush_m_g":[44,0,42,32],"bush_s_g":[87,0,36,31],"bush_t_g":[124,0,29,26],"bush_l_o":[154,0,43,43],"bush_m_o":[198,0,42,32],"bush_s_o":[241,0,36,31],"bush_t_o":[278,0,29,26],"bush_l_b":[308,0,43,43],"bush_m_b":[352,0,42,32],"bush_s_b":[395,0,36,31],"bush_t_b":[432,0,29,26],"bush_l_r":[462,0,43,43],"bush_m_r":[0,44,42,32],"bush_s_r":[43,44,36,31],"bush_t_r":[80,44,29,26],"fl0_0":[110,44,5,11],"fl0_1":[116,44,2,11],"fl0_2":[119,44,2,2],"fl0_3":[122,44,7,6],"fl0_4":[130,44,6,6],"fl0_5":[137,44,10,12],"fl0_6":[148,44,8,7],"fl0_7":[157,44,7,6],"fl0_8":[165,44,6,5],"fl0_9":[172,44,6,6],"fl0_10":[179,44,5,5],"fl0_11":[185,44,2,2],"fl0_12":[188,44,2,2],"fl0_13":[191,44,2,2],"fl1_0":[194,44,5,3],"fl1_1":[200,44,2,2],"fl1_2":[203,44,2,2],"fl1_3":[206,44,7,6],"fl1_4":[214,44,6,6],"fl1_5":[221,44,5,5],"fl1_6":[227,44,8,7],"fl1_7":[236,44,7,6],"fl1_8":[244,44,6,5],"fl1_9":[251,44,6,6],"fl1_10":[258,44,5,5],"fl1_11":[264,44,2,2],"fl1_12":[267,44,2,2],"fl1_13":[270,44,2,2],"fl2_0":[273,44,5,3],"fl2_1":[279,44,2,2],"fl2_2":[282,44,2,2],"fl2_3":[285,44,7,6],"fl2_4":[293,44,6,6],"fl2_5":[300,44,5,5],"fl2_6":[306,44,8,7],"fl2_7":[315,44,7,6],"fl2_8":[323,44,6,5],"fl2_9":[330,44,6,6],"fl2_10":[337,44,5,5],"fl2_11":[343,44,2,2],"fl2_12":[346,44,2,2],"fl2_13":[349,44,2,2],"fl3_0":[352,44,5,3],"fl3_1":[358,44,2,2],"fl3_2":[361,44,2,2],"fl3_3":[364,44,7,6],"fl3_4":[372,44,6,6],"fl3_5":[379,44,5,5],"fl3_6":[385,44,8,7],"fl3_7":[394,44,7,6],"fl3_8":[402,44,6,5],"fl3_9":[409,44,6,6],"fl3_10":[416,44,5,5],"fl3_11":[422,44,2,2],"fl3_12":[425,44,2,2],"fl3_13":[428,44,2,2],"mu_0":[431,44,11,23],"mu_1":[443,44,11,26],"mu_2":[455,44,8,9],"mu_3":[0,77,76,30],"pl0_0":[77,77,7,16],"pl0_1":[85,77,8,16],"pl0_2":[94,77,10,9],"pl0_3":[105,77,9,6],"pl0_4":[115,77,47,21],"pl0_5":[163,77,2,5],"pl1_0":[166,77,11,20],"pl1_1":[178,77,9,20],"pl1_2":[188,77,9,20],"pl1_3":[198,77,3,20],"pl1_4":[202,77,11,6],"pl1_5":[214,77,75,20],"pl1_6":[290,77,5,10],"pl1_7":[296,77,5,5],"pl1_8":[302,77,5,20],"pl2_0":[308,77,3,5],"pl2_1":[312,77,3,5],"pl2_2":[316,77,4,12],"pl2_3":[321,77,4,2],"pl2_4":[326,77,14,11],"pl2_5":[341,77,12,12],"pl2_6":[354,77,45,12],"pl2_7":[400,77,15,6],"pl2_8":[416,77,9,6],"pl2_9":[426,77,7,6],"pl2_10":[434,77,5,6],"dead1":[0,108,83,51]};
for (const k in PROPS) SPR['v_' + k] = ['props', ...PROPS[k]];
SPR.oakA = ['cfOak', 32, 0, 32, 46]; SPR.oakB = ['cfOak', 64, 0, 32, 46];
const FLOWERS = Object.keys(PROPS).filter(k => /^fl[0-3]_[3-8]$/.test(k)), SHROOMS = Object.keys(PROPS).filter(k => /^mu_[0-3]$/.test(k)), TUFTS = Object.keys(PROPS).filter(k => /^pl[01]_[0-3]$/.test(k));

/* Animasi: [kunci gambar, jumlah frame, fps, lebar frame] */
const ANIMS = {
  soldier: {   // Knight 2D (112x96): [kunci, frame, fps, lebar, tinggi, [ankerX, ankerY, skala]]
    idle:  ['sol_idle', 14, 8, 112, 96, [56, 84, .72]], walk: ['sol_walk', 8, 12, 112, 96, [56, 84, .72]],
    atk1:  ['sol_atk1', 8, 20, 112, 96, [56, 84, .72]], atk2: ['sol_atk2', 9, 20, 112, 96, [56, 84, .72]],
    bow:   ['sol_bow', 6, 12, 112, 96, [56, 84, .72]], hurt: ['sol_hurt', 8, 20, 112, 96, [56, 84, .72]],
    death: ['sol_death', 15, 10, 112, 96, [56, 84, .72]],
  },
  hunter: {
    idle: ['drm_idle', 6, 6, 100], walk: ['drm_walk', 8, 11, 100], atk: ['drm_atk', 9, 15, 100],
    hurt: ['drm_hurt', 4, 12, 100], death: ['drm_death', 4, 6, 100],
  },
  orc: {
    idle:  ['orc_idle', 6, 6, 100], walk: ['orc_walk', 8, 10, 100],
    atk1:  ['orc_atk1', 6, 10, 100], atk2: ['orc_atk2', 6, 9, 100],
    hurt:  ['orc_hurt', 4, 12, 100], death: ['orc_death', 4, 6, 100],
  },
  demon: {
    idle:  ['dem_idle', 6, 6, 100], walk: ['dem_walk', 8, 10, 100],
    atk1:  ['dem_atk1', 7, 11, 100], atk2: ['dem_atk2', 7, 9, 100],
    hurt:  ['dem_hurt', 4, 12, 100], death: ['dem_death', 4, 6, 100],
  },
  blood: {
    idle:  ['bld_idle', 6, 6, 100], walk: ['bld_walk', 8, 9, 100],
    atk1:  ['bld_atk1', 8, 10, 100], atk2: ['bld_atk2', 8, 9, 100],
    hurt:  ['bld_hurt', 4, 12, 100], death: ['bld_death', 4, 6, 100],
  },
  zat: {   // male_hero 128x128: kaki di (57,80)
    idle: ['zat_idle', 10, 8, 128, 128, [57, 80, .9]], walk: ['zat_walk', 10, 14, 128, 128, [57, 80, .9]],
    atk1: ['zat_atk1', 3, 14, 128, 128, [57, 80, .9]], atk2: ['zat_atk2', 4, 14, 128, 128, [57, 80, .9]], bow: ['zat_atk1', 3, 12, 128, 128, [57, 80, .9]],
    hurt: ['zat_hurt', 4, 16, 128, 128, [57, 80, .9]], death: ['zat_death', 4, 8, 128, 128, [57, 80, .9]],
  },
  jess: {  // Warrior 72x44: kaki di (27,43)
    idle: ['jess_idle', 6, 7, 72, 44, [27, 43, 1.05]], walk: ['jess_walk', 8, 12, 72, 44, [27, 43, 1.05]],
    atk1: ['jess_atk1', 12, 26, 72, 44, [27, 43, 1.05]], atk2: ['jess_atk2', 10, 22, 72, 44, [27, 43, 1.05]], bow: ['jess_atk1', 12, 22, 72, 44, [27, 43, 1.05]],
    hurt: ['jess_hurt', 4, 14, 72, 44, [27, 43, 1.05]], death: ['jess_death', 11, 10, 72, 44, [27, 43, 1.05]],
  },
  farmer: {   // 32x32, baris: 0 bawah, 1 atas, 2 samping(kiri)
    idle: ['char_idle', 4, 4, 32], walk: ['char_walk', 6, 9, 32],
  },
};

/* Potongan atlas dungeon (0x72): [x, y, w, h] pada assets/dungeon/atlas.png */
const DUN = {
  floor: [[16, 64], [32, 64], [48, 64], [16, 80], [32, 80], [48, 80], [16, 96], [32, 96]],   // 16x16
  wallMid: [32, 16], wallLeft: [16, 16], wallRight: [48, 16], wallTop: [32, 0],
  banner: { red: [16, 32], blue: [32, 32], green: [16, 48], yellow: [32, 48] },
  hole: [[48, 32], [48, 48]], goo: [64, 80],
  fountainTop: [[64, 0], [80, 0], [96, 0]],
  fountain: { red: { mid: [64, 16], basin: [64, 32] }, blue: { mid: [64, 48], basin: [64, 64] } },   // 3 frame: x + 16*f
  spikes: [[16, 192], [32, 192], [48, 192], [64, 192]],
  chestFull: [[304, 416], [320, 416], [336, 416]], chestEmpty: [[304, 400], [320, 400], [336, 400]],
  heart: { full: [289, 370, 13, 12], half: [305, 370, 13, 12], empty: [321, 370, 13, 12] },
  flask: [288, 336, 16, 16], coin: [289, 385, 6, 7], arrow: [324, 202, 7, 21],
  skelIdle: [368, 88], skelRun: [432, 88],
};

/* Kerangka Pixel Crawler: [kunci, frame, fps, lebar, tinggi] */
const SKD = {
  base:  { idle: ['sk_base_idle', 4, 6, 32, 32], run: ['sk_base_run', 6, 10, 64, 64], death: ['sk_base_death', 12, 14, 64, 64] },
  mage:  { idle: ['sk_mage_idle', 4, 6, 32, 32], run: ['sk_mage_run', 6, 8, 64, 64], death: ['sk_mage_death', 6, 9, 64, 64] },
  rogue: { idle: ['sk_rogue_idle', 4, 8, 32, 32], run: ['sk_rogue_run', 6, 14, 64, 64], death: ['sk_rogue_death', 6, 9, 64, 64] },
};

/* Sprite NPC khusus: [kunci, frame, fps, lebar, tinggi, ankerX, ankerY, skala] (menghadap kanan) */
const NPCSPR = {
  eleonore: ['npc_eleonore', 9, 8, 64, 64, 32, 57, .5],
  joanna:   ['npc_joanna', 6, 8, 64, 64, 32, 53, .55],
  girl1:    ['npc_girl1', 1, 1, 32, 32, 16, 30, .8],
  nyx:      ['nyx_wind', 7, 7, 64, 64, 31, 53, .55],   // diam / pertempuran
  nyxW:     ['nyx_walk', 5, 9, 64, 64, 31, 53, .55],   // jalan
  nyxI:     ['nyx_idle', 3, 4, 64, 64, 31, 53, .55],
};

/* Efek visual: [kunci, lebar frame, tinggi frame, jumlah frame, fps, anchorX, anchorY, baris] */
const FXD = {
  smear1: ['fx_smear1', 48, 48, 5, 26, .5, .5, 0], smear2: ['fx_smear2', 48, 48, 5, 26, .5, .5, 0], smear3: ['fx_smear3', 48, 48, 5, 26, .5, .5, 0],
  holyInit: ['fx_holy_init', 32, 32, 2, 22, .5, .5, 0], holyHit: ['fx_holy_hit', 32, 32, 7, 26, .5, .5, 0],
  beam: ['fx_beam', 48, 48, 16, 26, .5, 1, 0],
  skull: ['fx_dark1', 40, 32, 10, 18, .5, .5, 0], skullHit: ['fx_dark1', 40, 32, 6, 20, .5, .5, 1],
  ghost: ['fx_ghost', 48, 64, 16, 15, .5, 1, 0],
  bolt: ['fx_bolt', 128, 256, 5, 12, .5, .93, 0],
  iceHit: ['fx_ice_hit', 48, 32, 8, 18, .5, .5, 0], iceActive: ['fx_ice_active', 32, 32, 8, 16, .5, .5, 0],
  thunderHit: ['fx_thunder_hit', 32, 32, 6, 20, .5, .5, 0], thunderStrike: ['fx_thunder_strike', 64, 64, 13, 24, .5, .8, 0], thunderSplash: ['fx_thunder_splash', 48, 48, 14, 24, .5, .5, 0],
  firebolt: ['fx_firebolt', 48, 48, 11, 22, .5, .5, 0], fireHit: ['fx_fire_hit', 48, 48, 5, 18, .5, .5, 0],
  boom2: ['fx_boom2', 192, 192, 15, 15, .5, 0.55, 0], xp1: ['fx_xp1', 96, 96, 9, 15, .5, 0.55, 0], xp2: ['fx_xp2', 96, 96, 10, 15, .5, 0.55, 0], xp3: ['fx_xp3', 128, 96, 14, 15, .5, 0.55, 0], sx1: ['fx_sx1', 64, 64, 8, 15, .5, 0.55, 0], sx2: ['fx_sx2', 64, 64, 11, 15, .5, 0.55, 0], sx4: ['fx_sx4', 96, 96, 12, 15, .5, 0.55, 0], absorb: ['fx_absorb', 128, 128, 31, 15, .5, 0.55, 0], death2: ['fx_death2', 64, 128, 24, 15, .5, 0.9, 0], stpoison: ['fx_stpoison', 96, 96, 24, 15, .5, 0.55, 0], sparkle_st: ['fx_sparkle_st', 96, 96, 24, 15, .5, 0.55, 0], fire3: ['fx_fire3', 96, 128, 15, 15, .5, 0.95, 0], fire4: ['fx_fire4', 80, 128, 15, 15, .5, 0.95, 0], imp_b: ['fx_imp_b', 64, 64, 7, 15, .5, 0.55, 0], imp_w: ['fx_imp_w', 140, 50, 7, 15, .5, 0.55, 0], imp_v: ['fx_imp_v', 80, 80, 6, 15, .5, 0.55, 0], imp_y: ['fx_imp_y', 80, 80, 5, 15, .5, 0.55, 0], simp2: ['fx_simp2', 96, 96, 10, 15, .5, 0.55, 0], simp3: ['fx_simp3', 96, 96, 7, 15, .5, 0.55, 0], simp4: ['fx_simp4', 96, 96, 8, 15, .5, 0.55, 0], simp6: ['fx_simp6', 160, 160, 8, 15, .5, 0.55, 0], laura: ['fx_laura', 96, 96, 16, 15, .5, 0.7, 0], lb1: ['fx_lb1', 64, 64, 8, 15, .5, 0.55, 0], lb2: ['fx_lb2', 64, 64, 9, 15, .5, 0.55, 0], lb3: ['fx_lb3', 96, 96, 10, 15, .5, 0.55, 0], heart: ['fx_heart', 128, 128, 23, 15, .5, 0.55, 0], fw1: ['fx_fw1', 96, 96, 15, 15, .5, 0.55, 0], fw2: ['fx_fw2', 96, 96, 27, 15, .5, 0.55, 0], sp1: ['fx_sp1', 64, 64, 14, 15, .5, 0.55, 0], sp2: ['fx_sp2', 64, 64, 18, 15, .5, 0.55, 0], sp3: ['fx_sp3', 64, 64, 17, 15, .5, 0.55, 0], coin: ['fx_coin', 128, 128, 31, 15, .5, 0.55, 0], bubble: ['fx_bubble', 128, 128, 40, 15, .5, 0.55, 0], charge: ['fx_charge', 96, 96, 12, 15, .5, 0.55, 0], warp1: ['fx_warp1', 128, 128, 10, 15, .5, 0.55, 0], warp2: ['fx_warp2', 96, 96, 10, 15, .5, 0.55, 0], warp3: ['fx_warp3', 128, 128, 12, 15, .5, 0.55, 0], sparkb: ['fx_sparkb', 128, 128, 12, 15, .5, 0.55, 0], smk1: ['fx_smk1', 64, 64, 21, 15, .5, 0.7, 0], smk2: ['fx_smk2', 96, 96, 15, 15, .5, 0.7, 0], smk3: ['fx_smk3', 64, 64, 16, 15, .5, 0.7, 0], smkskull: ['fx_smkskull', 64, 64, 12, 15, .5, 0.7, 0], smk5: ['fx_smk5', 64, 64, 10, 15, .5, 0.6, 0], spl1: ['fx_spl1', 64, 64, 10, 15, .5, 0.55, 0], spl3: ['fx_spl3', 96, 96, 8, 15, .5, 0.55, 0], dspl1: ['fx_dspl1', 64, 64, 8, 15, .5, 0.55, 0], alert: ['fx_alert', 80, 80, 14, 15, .5, 0.55, 0], lvltext: ['fx_lvltext', 320, 128, 44, 15, .5, 0.55, 0], bulb: ['fx_bulb', 96, 96, 12, 15, .5, 0.55, 0], quest: ['fx_quest', 96, 96, 30, 15, .5, 0.55, 0], ok: ['fx_ok', 80, 80, 60, 15, .5, 0.55, 0], fail: ['fx_fail', 80, 80, 60, 15, .5, 0.55, 0], crown: ['fx_crown', 64, 48, 45, 15, .5, 0.55, 0], warn: ['fx_warn', 80, 80, 60, 15, .5, 0.55, 0], sup_atk: ['fx_sup_atk', 80, 80, 60, 15, .5, 0.55, 0], sup_def: ['fx_sup_def', 80, 80, 60, 15, .5, 0.55, 0], sup_mag: ['fx_sup_mag', 80, 80, 60, 15, .5, 0.55, 0], wst1: ['fx_wst1', 64, 16, 11, 22, .5, 0.5, 0], wst2: ['fx_wst2', 64, 16, 11, 22, .5, 0.5, 0], o_slash_w: ['fx_o_slash_w', 56, 56, 7, 22, .5, 0.55, 0], o_slash_g: ['fx_o_slash_g', 56, 56, 7, 22, .5, 0.55, 0], o_slash_r: ['fx_o_slash_r', 56, 56, 7, 22, .5, 0.55, 0], o_shard: ['fx_o_shard', 64, 64, 9, 18, .5, 0.55, 0], o_leaf: ['fx_o_leaf', 64, 64, 14, 16, .5, 0.9, 0], o_pillar: ['fx_o_pillar', 40, 112, 14, 16, .5, 1, 0], o_rune: ['fx_o_rune', 72, 36, 12, 14, .5, 0.55, 0],
  heal: ['fx_heal', 128, 128, 16, 15, .5, .6, 0], atkup: ['fx_atkup', 128, 128, 18, 15, .5, .6, 0], defup: ['fx_defup', 128, 128, 18, 15, .5, .6, 0], haste: ['fx_haste', 128, 128, 29, 15, .5, .6, 0], poison: ['fx_poison', 128, 128, 17, 15, .5, .6, 0],
  strike: ['fx_strike', 128, 128, 7, 15, .5, .8, 0], boom: ['fx_boom', 128, 128, 13, 15, .5, .6, 0], impact: ['fx_impact', 96, 96, 7, 15, .5, .5, 0], burst: ['fx_burst', 256, 144, 9, 15, .5, .5, 0],
  wsplash: ['fx_wsplash', 66, 77, 20, 20, .5, .9, 0], wspike: ['fx_wspike', 64, 64, 25, 24, .5, .8, 0],
  explosion: ['fx_explosion', 192, 192, 8, 18, .5, .55, 0], dust: ['fx_dust', 64, 64, 8, 22, .5, .8, 0],
};

/* Cache sprite berwarna (tint) — dibuat sekali, dipakai berulang */
const _tintCache = {};
function tinted(key, color, alpha) {
  const id = key + '|' + color + '|' + alpha;
  if (_tintCache[id]) return _tintCache[id];
  const src = IMG[key];
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = alpha;
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return (_tintCache[id] = c);
}
