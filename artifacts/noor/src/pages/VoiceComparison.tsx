import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Play, Pause, RotateCcw, Search, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SURAH_NAMES } from '@/lib/constants';
import { useAudio } from '@/contexts/AudioContext';

/* ── All confirmed labeled photos ── */
import imgAlafasy      from '@assets/myshary_elaphasy_1777223604376.webp';
import imgMaher        from '@assets/maher_elmeqly_1777223604347.webp';
import imgShuraim      from '@assets/elshrem_1777223604399.webp';
import imgDosari       from '@assets/yaser_eldosry_1777223604537.webp';
import imgTablawi      from '@assets/eltabalawy_1777223604322.webp';
import imgMustafa      from '@assets/mostafa_ismail_1777223604238.webp';
import imgJibreel      from '@assets/gebril_1777223604483.webp';
import imgShaatree     from '@assets/elshatry_1777223604202.webp';
import imgAkhdar       from '@assets/green_1777223604137.webp';
import imgQahtaani     from '@assets/khaled_elkahtany_1777223604453.webp';
import imgQasim        from '@assets/elkasm_1777223604295.webp';
import imgBudair       from '@assets/salah_elbader_1777223604426.webp';
import imgSowaid       from '@assets/sewid_1777223604506.webp';
import imgFares        from '@assets/fares_abad_1777223604267.webp';
import imgSudais       from '@assets/alsodis_1777223390350.webp';
import imgHusary       from '@assets/elhosary_1777223390375.webp';
import imgHudhaify     from '@assets/elhozify_1777223390404.webp';
import imgBasit        from '@assets/Abd_elbaset_Abd_ALsamad_1777224102477.webp';
import imgMinshawi     from '@assets/almanshawy_1777223390219.webp';
import imgBanna        from '@assets/elbana_1777223390242.webp';
import imgGhamdi       from '@assets/alghamdy_1777223390187.webp';
import imgQatami       from '@assets/algatamy_1777223390489.webp';
import imgAjamy        from '@assets/elagamy_1777223390098.webp';
import imgBasfar       from '@assets/basfr_1777223390462.webp';
import imgRifai        from '@assets/alrefa3y_1777223390265.webp';
import imgAyyoub       from '@assets/ayop_1777223390300.webp';
import imgBukhatir     from '@assets/bokhatr_1777223390515.webp';
import imgJaber        from '@assets/Ali_gaber_1777223390432.webp';

const RECITER_PHOTOS: Record<string, string> = {
  alafasy:        imgAlafasy,
  maher:          imgMaher,
  sudais:         imgSudais,
  shuraim:        imgShuraim,
  ghamdi:         imgGhamdi,
  dosari:         imgDosari,
  qatami:         imgQatami,
  hudhaify:       imgHudhaify,
  husary_mur:     imgHusary,
  husary_muj:     imgHusary,
  basit_mur:      imgBasit,
  basit_muj:      imgBasit,
  minshawi_muj:   imgMinshawi,
  tablawi:        imgTablawi,
  banna:          imgBanna,
  mustafa_ismail: imgMustafa,
  jibreel:        imgJibreel,
  ajamy:          imgAjamy,
  basfar:         imgBasfar,
  shaatree:       imgShaatree,
  rifai:          imgRifai,
  akhdar:         imgAkhdar,
  ayyoub:         imgAyyoub,
  qahtaani:       imgQahtaani,
  bukhatir:       imgBukhatir,
  qasim:          imgQasim,
  jaber:          imgJaber,
  budair:         imgBudair,
  sowaid:         imgSowaid,
  fares:          imgFares,
};

const SURAH_AYAH_COUNT: Record<number, number> = {
  1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,
  16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,
  30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,
  45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,
  60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,
  75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,
  90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,
  105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6,
};

// Makki (مكية) vs Madani (مدنية)
const MAKKI_SURAHS = new Set([1,6,7,10,11,12,14,15,16,17,18,19,20,21,23,25,26,27,28,29,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,50,51,52,53,54,56,67,68,69,70,71,72,73,74,75,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,100,101,102,103,104,105,106,107,108,109,111,112,113,114]);

const MIN_SELECT = 2;
const MAX_SELECT = 6;

interface Reciter {
  id: string;
  name: string;
  shortName: string;
  initial: string;
  folder: string;
  country: string;
  flag: string;
  style?: string; // مرتل / مجوّد
}

const RECITERS_RAW: Reciter[] = [
  { id: 'alafasy',          name: 'مشاري راشد العفاسي',     shortName: 'العفاسي',        initial: 'ع', folder: 'Alafasy_128kbps',                              country: 'الكويت',  flag: 'kw' },
  { id: 'maher',            name: 'ماهر المعيقلي',           shortName: 'المعيقلي',       initial: 'م', folder: 'MaherAlMuaiqly128kbps',                        country: 'السعودية', flag: 'sa' },
  { id: 'sudais',           name: 'عبد الرحمن السديس',      shortName: 'السديس',         initial: 'س', folder: 'Abdurrahmaan_As-Sudais_192kbps',               country: 'السعودية', flag: 'sa' },
  { id: 'shuraim',          name: 'سعود الشريم',             shortName: 'الشريم',         initial: 'ش', folder: 'Saood_ash-Shuraym_128kbps',                    country: 'السعودية', flag: 'sa' },
  { id: 'ghamdi',           name: 'سعد الغامدي',             shortName: 'الغامدي',        initial: 'غ', folder: 'Ghamadi_40kbps',                               country: 'السعودية', flag: 'sa' },
  { id: 'dosari',           name: 'ياسر الدوسري',            shortName: 'الدوسري',        initial: 'د', folder: 'Yasser_Ad-Dussary_128kbps',                    country: 'السعودية', flag: 'sa' },
  { id: 'qatami',           name: 'ناصر القطامي',            shortName: 'القطامي',        initial: 'ق', folder: 'Nasser_Alqatami_128kbps',                      country: 'السعودية', flag: 'sa' },
  { id: 'hudhaify',         name: 'علي الحذيفي',             shortName: 'الحذيفي',        initial: 'ذ', folder: 'Hudhaify_128kbps',                             country: 'السعودية', flag: 'sa' },
  { id: 'husary_mur',       name: 'محمود خليل الحصري',      shortName: 'الحصري (مرتل)',  initial: 'ح', folder: 'Husary_128kbps',                               country: 'مصر',     flag: 'eg', style: 'مرتل' },
  { id: 'husary_muj',       name: 'محمود خليل الحصري',      shortName: 'الحصري (مجوّد)', initial: 'ح', folder: 'Husary_Mujawwad_64kbps',                       country: 'مصر',     flag: 'eg', style: 'مجوّد' },
  { id: 'basit_mur',        name: 'عبد الباسط عبد الصمد',   shortName: 'عبد الباسط (مرتل)', initial: 'ب', folder: 'Abdul_Basit_Murattal_192kbps',              country: 'مصر',     flag: 'eg', style: 'مرتل' },
  { id: 'basit_muj',        name: 'عبد الباسط عبد الصمد',   shortName: 'عبد الباسط (مجوّد)', initial: 'ب', folder: 'Abdul_Basit_Mujawwad_128kbps',              country: 'مصر',     flag: 'eg', style: 'مجوّد' },
  { id: 'minshawi_muj',     name: 'محمد صديق المنشاوي',     shortName: 'المنشاوي (مجوّد)', initial: 'ن', folder: 'Minshawy_Mujawwad_192kbps',                   country: 'مصر',     flag: 'eg', style: 'مجوّد' },
  { id: 'tablawi',          name: 'محمد محمود الطبلاوي',    shortName: 'الطبلاوي',       initial: 'ط', folder: 'Mohammad_al_Tablaway_128kbps',                 country: 'مصر',     flag: 'eg' },
  { id: 'banna',            name: 'محمود علي البنا',         shortName: 'البنا',          initial: 'ن', folder: 'Mahmoud_Ali_Al_Banna_32kbps',                  country: 'مصر',     flag: 'eg' },
  { id: 'mustafa_ismail',   name: 'مصطفى إسماعيل',          shortName: 'مصطفى إسماعيل',   initial: 'إ', folder: 'Mustafa_Ismail_48kbps',                        country: 'مصر',     flag: 'eg' },
  { id: 'jibreel',          name: 'محمد جبريل',              shortName: 'جبريل',          initial: 'ج', folder: 'Muhammad_Jibreel_128kbps',                     country: 'مصر',     flag: 'eg' },
  { id: 'ajamy',            name: 'أحمد بن علي العجمي',     shortName: 'العجمي',         initial: 'ج', folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', country: 'السعودية', flag: 'sa' },
  { id: 'basfar',           name: 'عبد الله بصفر',            shortName: 'بصفر',           initial: 'ص', folder: 'Abdullah_Basfar_192kbps',                      country: 'السعودية', flag: 'sa' },
  { id: 'shaatree',         name: 'أبو بكر الشاطري',         shortName: 'الشاطري',        initial: 'ر', folder: 'Abu_Bakr_Ash-Shaatree_128kbps',                country: 'اليمن',   flag: 'ye' },
  { id: 'rifai',            name: 'هاني الرفاعي',            shortName: 'الرفاعي',        initial: 'ر', folder: 'Hani_Rifai_192kbps',                           country: 'السعودية', flag: 'sa' },
  { id: 'akhdar',           name: 'إبراهيم الأخضر',          shortName: 'الأخضر',         initial: 'خ', folder: 'Ibrahim_Akhdar_32kbps',                        country: 'السعودية', flag: 'sa' },
  { id: 'ayyoub',           name: 'محمد أيوب',                shortName: 'أيوب',           initial: 'أ', folder: 'Muhammad_Ayyoub_128kbps',                      country: 'السعودية', flag: 'sa' },
  { id: 'qahtaani',         name: 'خالد القحطاني',           shortName: 'القحطاني',       initial: 'ط', folder: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps',       country: 'السعودية', flag: 'sa' },
  { id: 'bukhatir',         name: 'صلاح بوخاطر',             shortName: 'بوخاطر',         initial: 'خ', folder: 'Salaah_AbdulRahman_Bukhatir_128kbps',          country: 'الإمارات', flag: 'ae' },
  { id: 'qasim',            name: 'محسن القاسم',             shortName: 'القاسم',         initial: 'ق', folder: 'Muhsin_Al_Qasim_192kbps',                      country: 'السعودية', flag: 'sa' },
  { id: 'jaber',            name: 'علي جابر',                shortName: 'علي جابر',        initial: 'ج', folder: 'Ali_Jaber_64kbps',                             country: 'السعودية', flag: 'sa' },
  { id: 'budair',           name: 'صلاح البدير',             shortName: 'البدير',         initial: 'ب', folder: 'Salah_Al_Budair_128kbps',                      country: 'السعودية', flag: 'sa' },
  { id: 'sowaid',           name: 'أيمن سويد',                shortName: 'سويد',           initial: 'و', folder: 'Ayman_Sowaid_64kbps',                          country: 'سوريا',   flag: 'sy' },
  { id: 'fares',            name: 'فارس عباد',                shortName: 'فارس عباد',      initial: 'ع', folder: 'Fares_Abbad_64kbps',                           country: 'اليمن',   flag: 'ye' },
];

/* Color palette for reciter cards (cycles through). */
const PALETTE: Array<{ grad: string; accent: string }> = [
  { grad: 'linear-gradient(145deg, #1a5c5c 0%, #0d3b3b 100%)', accent: '#5fb8b8' },
  { grad: 'linear-gradient(145deg, #6b3a0f 0%, #3d2008 100%)', accent: '#d49a5e' },
  { grad: 'linear-gradient(145deg, #1e4d7b 0%, #0f2d4d 100%)', accent: '#5e9bd4' },
  { grad: 'linear-gradient(145deg, #7a3a1e 0%, #4d2310 100%)', accent: '#e89968' },
  { grad: 'linear-gradient(145deg, #5c3a7a 0%, #3a1f52 100%)', accent: '#b59ad8' },
  { grad: 'linear-gradient(145deg, #2d6a4f 0%, #1b4332 100%)', accent: '#6cc09a' },
  { grad: 'linear-gradient(145deg, #0f3d2e 0%, #072218 100%)', accent: '#5fc098' },
  { grad: 'linear-gradient(145deg, #3a1a5c 0%, #1e0d30 100%)', accent: '#a285d4' },
  { grad: 'linear-gradient(145deg, #8B6340 0%, #5c3e1e 100%)', accent: '#d4ad7d' },
  { grad: 'linear-gradient(145deg, #6b1e2e 0%, #3d111a 100%)', accent: '#d4647a' },
  { grad: 'linear-gradient(145deg, #1a1f5c 0%, #0f1238 100%)', accent: '#7e85d4' },
  { grad: 'linear-gradient(145deg, #1e6b4d 0%, #0f4030 100%)', accent: '#5fd49a' },
  { grad: 'linear-gradient(145deg, #1e5f7a 0%, #0f3a4d 100%)', accent: '#5fb8d4' },
  { grad: 'linear-gradient(145deg, #5c4a18 0%, #3a2e0f 100%)', accent: '#d4be5f' },
  { grad: 'linear-gradient(145deg, #5c1818 0%, #3a0f0f 100%)', accent: '#d47878' },
];

const RECITERS = RECITERS_RAW.map((r, i) => ({ ...r, ...PALETTE[i % PALETTE.length] }));
type ReciterFull = typeof RECITERS[number];

type Phase = 'reciters' | 'range' | 'compare';

const ayahUrl = (folder: string, surah: number, ayah: number) =>
  `https://everyayah.com/data/${folder}/${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;

/* ───────────── Decorative pattern ───────────── */
function PatternBg() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="vc-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="white" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#vc-pattern)" />
    </svg>
  );
}

/* Ornamental arch frame for the surah card hero */
function OrnamentalArch({ accent = '#C19A6B' }: { accent?: string }) {
  return (
    <svg viewBox="0 0 200 80" className="absolute inset-x-0 top-0 w-full" preserveAspectRatio="none" style={{ height: 64 }}>
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,80 L0,40 Q0,0 40,0 L60,0 Q80,0 80,20 Q80,40 100,40 Q120,40 120,20 Q120,0 140,0 L160,0 Q200,0 200,40 L200,80 Z" fill="url(#arch-grad)" />
      <path d="M0,40 Q0,0 40,0 L60,0 Q80,0 80,20 Q80,40 100,40 Q120,40 120,20 Q120,0 140,0 L160,0 Q200,0 200,40" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

/* ───────────── Surah picker bottom sheet ───────────── */
function SurahPickerSheet({
  selected, onSelect, onClose,
}: { selected: number; onSelect: (s: number) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const list = Array.from({ length: 114 }, (_, i) => i + 1).filter(n =>
    !search || SURAH_NAMES[n]?.includes(search) || String(n).includes(search)
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl pt-4 shadow-2xl"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>اختر السورة</h3>
            <button onClick={onClose} className="p-1.5 rounded-full bg-secondary" data-testid="button-close-surah-picker">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن سورة..." dir="rtl"
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
              data-testid="input-search-surah"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <div className="space-y-1.5">
            {list.map(n => {
              const isSel = selected === n;
              const isMakki = MAKKI_SURAHS.has(n);
              return (
                <button
                  key={n} onClick={() => { onSelect(n); onClose(); }}
                  data-testid={`surah-option-${n}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${
                    isSel ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/60 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    {n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ fontFamily: '"Amiri", serif' }}>{SURAH_NAMES[n]}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: isMakki ? 'rgba(193,154,107,0.15)' : 'rgba(94,155,212,0.15)',
                          color: isMakki ? '#a07d4f' : '#3a7eb5',
                          fontFamily: '"Tajawal", sans-serif',
                        }}
                      >
                        {isMakki ? 'مكية' : 'مدنية'}
                      </span>
                      <span className="text-[10px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {SURAH_AYAH_COUNT[n]} آية
                      </span>
                    </div>
                  </div>
                  {isSel && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
            {list.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                لا توجد نتائج
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────── Range slider (custom dual handle) ───────────── */
function RangeBar({
  total, from, to, onChange,
}: { total: number; from: number; to: number; onChange: (from: number, to: number) => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ which: 'from' | 'to' | null }>({ which: null });

  const fromPct = ((from - 1) / Math.max(1, total - 1)) * 100;
  const toPct = ((to - 1) / Math.max(1, total - 1)) * 100;

  const valueFromPosition = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    // RTL: rightmost = position 1 (start), leftmost = position total
    const xFromRight = rect.right - clientX;
    const pct = Math.max(0, Math.min(1, xFromRight / rect.width));
    return Math.round(1 + pct * (total - 1));
  }, [total]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const w = dragRef.current.which;
      if (!w) return;
      const v = valueFromPosition(e.clientX);
      if (w === 'from') onChange(Math.min(v, to), to);
      else onChange(from, Math.max(v, from));
    };
    const up = () => { dragRef.current.which = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [from, to, onChange, valueFromPosition]);

  return (
    <div className="relative pt-7 pb-4 select-none" style={{ touchAction: 'none' }}>
      <div
        ref={trackRef}
        className="relative h-2.5 rounded-full bg-secondary mx-2"
        onPointerDown={(e) => {
          // Tap on track: move the nearest handle
          const v = valueFromPosition(e.clientX);
          const distFrom = Math.abs(v - from);
          const distTo = Math.abs(v - to);
          if (distFrom <= distTo) {
            dragRef.current.which = 'from';
            onChange(Math.min(v, to), to);
          } else {
            dragRef.current.which = 'to';
            onChange(from, Math.max(v, from));
          }
        }}
      >
        {/* Selected portion (RTL: from is on the right) */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            right: `${fromPct}%`,
            width: `${toPct - fromPct}%`,
            background: 'linear-gradient(to left, #C19A6B, #d4b08a)',
            boxShadow: '0 0 12px rgba(193,154,107,0.4)',
          }}
        />
        {/* From handle */}
        <button
          aria-label="من آية"
          data-testid="range-handle-from"
          onPointerDown={(e) => { e.stopPropagation(); dragRef.current.which = 'from'; }}
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border-[3px] border-primary shadow-lg flex items-center justify-center"
          style={{ right: `calc(${fromPct}% - 12px)`, touchAction: 'none' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        {/* To handle */}
        <button
          aria-label="إلى آية"
          data-testid="range-handle-to"
          onPointerDown={(e) => { e.stopPropagation(); dragRef.current.which = 'to'; }}
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border-[3px] border-primary shadow-lg flex items-center justify-center"
          style={{ right: `calc(${toPct}% - 12px)`, touchAction: 'none' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        {/* Value labels above handles */}
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground"
          style={{ right: `calc(${fromPct}% - 12px)`, transform: 'translateX(50%)', fontVariantNumeric: 'tabular-nums' }}
        >
          {from}
        </div>
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground"
          style={{ right: `calc(${toPct}% - 12px)`, transform: 'translateX(50%)', fontVariantNumeric: 'tabular-nums' }}
        >
          {to}
        </div>
      </div>
      {/* Min/max labels under track */}
      <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
        <span>{total}</span>
        <span>1</span>
      </div>
    </div>
  );
}

/* Stepper kept compact for the from/to micro-adjust */
function MiniStepper({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (v: number) => void; label: string;
}) {
  return (
    <div className="bg-secondary/60 border border-border rounded-2xl p-2.5 flex-1">
      <p className="text-[10px] text-muted-foreground mb-1 font-medium text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>{label}</p>
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          data-testid={`stepper-dec-${label}`}
          className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground disabled:opacity-30 transition-all active:scale-90 text-sm"
        >−</button>
        <span
          className="font-bold text-base text-primary tabular-nums"
          style={{ fontFamily: '"Tajawal", sans-serif', fontVariantNumeric: 'tabular-nums' }}
          data-testid={`stepper-value-${label}`}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          data-testid={`stepper-inc-${label}`}
          className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground disabled:opacity-30 transition-all active:scale-90 text-sm"
        >+</button>
      </div>
    </div>
  );
}

/* ───────────── Comparison Card ───────────── */
function ComparisonCard({
  reciter, surahNum, fromAyah, toAyah,
  isActive, isPaused, currentAyah, progress,
  onPlay, onPause,
  isCompact,
}: {
  reciter: ReciterFull;
  surahNum: number; fromAyah: number; toAyah: number;
  isActive: boolean; isPaused: boolean;
  currentAyah: number | null; progress: number;
  onPlay: () => void; onPause: () => void;
  isCompact: boolean;
}) {
  const totalAyahs = toAyah - fromAyah + 1;
  const completedInRange = currentAyah ? currentAyah - fromAyah : 0;
  const isPlaying = isActive && !isPaused;

  return (
    <motion.div
      layout
      animate={
        isActive
          ? { scale: 1, boxShadow: `0 0 0 2px ${reciter.accent}, 0 12px 40px ${reciter.accent}55` }
          : { scale: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }
      }
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="relative rounded-3xl overflow-hidden bg-card border border-border flex flex-col"
      style={{ minHeight: isCompact ? 280 : 320 }}
      data-testid={`card-reciter-${reciter.id}`}
    >
      {/* Decorative top: gradient + initial + pattern, fades into card body */}
      <div
        className="relative flex-shrink-0"
        style={{ height: isCompact ? 140 : 170, background: reciter.grad }}
      >
        <PatternBg />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />

        {/* Country pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
          <img
            src={`https://flagcdn.com/w40/${reciter.flag}.png`}
            alt={reciter.country}
            className="w-3.5 h-2.5 rounded-sm object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[9px] text-white/85 font-medium" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {reciter.country}
          </span>
        </div>

        {/* Photo or Calligraphic initial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={isPlaying ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
            className="relative flex items-center justify-center"
          >
            <div
              className="absolute rounded-full"
              style={{
                width: (isCompact ? 78 : 100) + 14, height: (isCompact ? 78 : 100) + 14,
                border: `2px dashed ${reciter.accent}`, opacity: 0.45,
              }}
            />
            {RECITER_PHOTOS[reciter.id] ? (
              <div
                className="rounded-full overflow-hidden"
                style={{
                  width: isCompact ? 78 : 100, height: isCompact ? 78 : 100,
                  border: `2.5px solid ${reciter.accent}88`,
                  boxShadow: `0 8px 32px ${reciter.accent}66`,
                }}
              >
                <img
                  src={RECITER_PHOTOS[reciter.id]}
                  alt={reciter.name}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="rounded-full flex items-center justify-center backdrop-blur-sm"
                style={{
                  width: isCompact ? 78 : 100, height: isCompact ? 78 : 100,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  boxShadow: `0 8px 32px ${reciter.accent}66, inset 0 0 24px rgba(255,255,255,0.08)`,
                }}
              >
                <span
                  className="font-bold leading-none"
                  style={{
                    fontFamily: '"Amiri", serif',
                    fontSize: isCompact ? 44 : 56,
                    color: '#fff',
                    textShadow: `0 2px 12px ${reciter.accent}99, 0 0 24px rgba(255,255,255,0.3)`,
                  }}
                >
                  {reciter.initial}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '55%',
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--card)) 100%)',
          }}
        />
      </div>

      {/* Body: info + play */}
      <div className="flex-1 flex flex-col px-3 pt-1 pb-3 -mt-2 relative z-10">
        <div className="text-center mb-2">
          <p
            className="font-bold leading-tight text-foreground truncate"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              fontSize: isCompact ? 12 : 14,
            }}
            data-testid={`text-reciter-name-${reciter.id}`}
          >
            {isCompact ? reciter.shortName : reciter.name}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <p
              className="text-muted-foreground"
              style={{
                fontFamily: '"Amiri", serif',
                fontSize: isCompact ? 11 : 13,
              }}
            >
              {SURAH_NAMES[surahNum]}
            </p>
            <span className="text-muted-foreground/50 text-[10px]">•</span>
            <p
              className="text-muted-foreground"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: isCompact ? 10 : 11,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalAyahs} آية
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 mb-2 min-h-[16px]">
          {isActive && currentAyah ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${reciter.accent}25`,
                color: reciter.accent,
                fontFamily: '"Tajawal", sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}
              data-testid={`text-current-ayah-${reciter.id}`}
            >
              آية {currentAyah} ({completedInRange + 1}/{totalAyahs})
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {fromAyah} ← {toAyah}
            </span>
          )}
        </div>

        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${isActive ? Math.min(100, (completedInRange / totalAyahs) * 100 + (progress * (1 / totalAyahs) * 100)) : 0}%`,
              background: `linear-gradient(to left, ${reciter.accent}, ${reciter.accent}aa)`,
            }}
          />
        </div>

        <button
          onClick={isPlaying ? onPause : onPlay}
          data-testid={`button-play-${reciter.id}`}
          className="mt-auto mx-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${reciter.accent}, ${reciter.accent}cc)`
              : 'linear-gradient(135deg, #C19A6B, #8a6a3a)',
            boxShadow: isActive ? `0 8px 24px ${reciter.accent}77` : '0 6px 18px rgba(193,154,107,0.45)',
          }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ───────────── Main Page ───────────── */
export function VoiceComparison() {
  const audio = useAudio();
  const [phase, setPhase] = useState<Phase>('reciters');
  const [selected, setSelected] = useState<string[]>([]);
  const [reciterSearch, setReciterSearch] = useState('');
  const [surahNum, setSurahNum] = useState<number>(1);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(1);
  const [showSurahPicker, setShowSurahPicker] = useState(false);

  useEffect(() => { audio.stop(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stateRef = useRef({ activeIdx: null as number | null, currentAyah: null as number | null });

  useEffect(() => { stateRef.current = { activeIdx, currentAyah }; }, [activeIdx, currentAyah]);

  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  const selectedReciters = useMemo(
    () => selected.map(id => RECITERS.find(r => r.id === id)!).filter(Boolean),
    [selected]
  );

  const maxAyahs = SURAH_AYAH_COUNT[surahNum] ?? 1;
  const isMakki = MAKKI_SURAHS.has(surahNum);

  useEffect(() => {
    setFromAyah(1);
    setToAyah(Math.min(7, maxAyahs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNum]);

  useEffect(() => {
    if (toAyah < fromAyah) setToAyah(fromAyah);
  }, [fromAyah, toAyah]);

  const toggleReciter = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  };

  const filteredReciters = useMemo(
    () => RECITERS.filter(r =>
      !reciterSearch ||
      r.name.includes(reciterSearch) ||
      r.shortName.includes(reciterSearch) ||
      r.country.includes(reciterSearch)
    ),
    [reciterSearch]
  );

  /* ──────── Audio engine ──────── */
  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.onended = null;
    el.onloadeddata = null;
    el.ontimeupdate = null;
    el.onwaiting = null;
    el.oncanplay = null;
    el.onerror = null;
    el.pause();
    el.removeAttribute('src');
    el.load();
  }, []);

  const playAyah = useCallback((cardIdx: number, ayahNum: number) => {
    const el = audioRef.current;
    if (!el) return;
    const reciter = selectedReciters[cardIdx];
    if (!reciter) return;

    el.onended = null;
    el.onloadeddata = null;
    el.ontimeupdate = null;
    el.onwaiting = null;
    el.oncanplay = null;
    el.onerror = null;
    el.pause();

    setActiveIdx(cardIdx);
    setCurrentAyah(ayahNum);
    setProgress(0);
    setIsLoading(true);
    setIsPaused(false);

    el.src = ayahUrl(reciter.folder, surahNum, ayahNum);
    el.load();

    el.oncanplay = () => setIsLoading(false);
    el.onwaiting = () => setIsLoading(true);
    el.ontimeupdate = () => {
      if (el.duration && !Number.isNaN(el.duration)) setProgress(el.currentTime / el.duration);
    };
    el.onerror = () => handleEnded();
    el.onended = () => handleEnded();

    el.play().catch(() => setIsLoading(false));

    function handleEnded() {
      const { activeIdx: ai } = stateRef.current;
      const cIdx = ai ?? cardIdx;
      const nextAyah = ayahNum + 1;
      if (nextAyah <= toAyah) {
        playAyah(cIdx, nextAyah);
      } else {
        const nextCard = cIdx + 1;
        if (nextCard < selectedReciters.length) {
          playAyah(nextCard, fromAyah);
        } else {
          stopAudio();
          setActiveIdx(null);
          setCurrentAyah(null);
          setProgress(0);
          setIsLoading(false);
          setIsPaused(false);
        }
      }
    }
  }, [selectedReciters, surahNum, fromAyah, toAyah, stopAudio]);

  const handlePlayCard = useCallback((cardIdx: number) => {
    const el = audioRef.current;
    if (activeIdx === cardIdx && isPaused && el && el.src && !el.ended) {
      el.play().catch(() => {});
      setIsPaused(false);
      return;
    }
    playAyah(cardIdx, fromAyah);
  }, [activeIdx, isPaused, fromAyah, playAyah]);

  const handlePauseCard = useCallback(() => {
    const el = audioRef.current;
    if (el) { el.pause(); setIsPaused(true); }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPause = () => setIsLoading(false);
    const onPlay = () => setIsLoading(false);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  const handleReset = () => {
    stopAudio();
    setActiveIdx(null);
    setCurrentAyah(null);
    setProgress(0);
    setIsLoading(false);
    setIsPaused(false);
  };

  /* ──────── Phase 1: Choose reciters ──────── */
  if (phase === 'reciters') {
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border">
          <Link href="/more">
            <button className="p-2 bg-secondary rounded-full" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>مقارنة الأصوات</h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              اختر من {MIN_SELECT} إلى {MAX_SELECT} قراء للمقارنة
            </p>
          </div>
        </header>

        <div className="px-4 py-3 bg-card/40 border-b border-border space-y-2.5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={reciterSearch}
              onChange={e => setReciterSearch(e.target.value)}
              placeholder="ابحث عن قارئ أو دولة..."
              dir="rtl"
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
              data-testid="input-search-reciter"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 space-x-reverse">
                {Array.from({ length: MAX_SELECT }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < selected.length
                        ? 'bg-primary text-primary-foreground border-card'
                        : 'bg-secondary text-muted-foreground/50 border-card'
                    }`}
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {i < selected.length ? <Check className="w-3 h-3" /> : ''}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <span className="font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{selected.length}</span>
                <span className="text-muted-foreground/60"> / {MAX_SELECT}</span>
              </span>
            </div>
            <button
              disabled={selected.length < MIN_SELECT}
              onClick={() => setPhase('range')}
              data-testid="button-next-to-range"
              className="px-5 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selected.length >= MIN_SELECT ? 'linear-gradient(135deg, #C19A6B, #8a6a3a)' : 'hsl(var(--secondary))',
                color: selected.length >= MIN_SELECT ? '#fff' : 'hsl(var(--muted-foreground))',
                fontFamily: '"Tajawal", sans-serif',
              }}
            >
              التالي
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pb-24">
          <div className="grid grid-cols-2 gap-2.5">
            {filteredReciters.map(r => {
              const isSel = selected.includes(r.id);
              const idxInSel = selected.indexOf(r.id);
              const atMax = selected.length >= MAX_SELECT && !isSel;
              return (
                <button
                  key={r.id}
                  onClick={() => toggleReciter(r.id)}
                  data-testid={`button-toggle-${r.id}`}
                  disabled={atMax}
                  className={`relative rounded-2xl overflow-hidden transition-all border-2 ${
                    isSel ? 'border-primary' : 'border-transparent'
                  } ${atMax ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                  style={{ minHeight: 130 }}
                >
                  <div className="relative h-16" style={{ background: r.grad }}>
                    <PatternBg />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {RECITER_PHOTOS[r.id] ? (
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                          style={{
                            border: '2px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}
                        >
                          <img
                            src={RECITER_PHOTOS[r.id]}
                            alt={r.name}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                          style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1.5px solid rgba(255,255,255,0.25)',
                          }}
                        >
                          <span className="font-bold text-xl text-white" style={{ fontFamily: '"Amiri", serif' }}>{r.initial}</span>
                        </div>
                      )}
                    </div>
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px] shadow-md"
                        style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {idxInSel + 1}
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <img
                        src={`https://flagcdn.com/w40/${r.flag}.png`}
                        alt={r.country}
                        className="w-3 h-2 rounded-sm object-cover"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                  <div className="bg-card px-2 py-2 text-center">
                    <p className="font-bold text-[13px] text-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {r.shortName}
                    </p>
                    {r.style ? (
                      <p className="text-[9px] text-primary/80 mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {r.style}
                      </p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {r.country}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filteredReciters.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              لم يتم العثور على قارئ بهذا الاسم
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ──────── Phase 2: Choose surah & range ──────── */
  if (phase === 'range') {
    const presets = [
      { label: 'كل السورة', from: 1, to: maxAyahs },
      { label: 'أول ١٠', from: 1, to: Math.min(10, maxAyahs) },
      { label: 'أول ٥', from: 1, to: Math.min(5, maxAyahs) },
      { label: 'آخر ١٠', from: Math.max(1, maxAyahs - 9), to: maxAyahs },
    ];
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border flex-shrink-0">
          <button onClick={() => setPhase('reciters')} className="p-2 bg-secondary rounded-full" data-testid="button-back-to-reciters">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>السورة والآيات</h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {selectedReciters.length} قراء جاهزون للمقارنة
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-28">
          {/* Selected reciter chips strip */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {selectedReciters.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 flex-shrink-0"
                style={{ background: `${r.accent}20`, border: `1px solid ${r.accent}50` }}
              >
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: `1.5px solid ${r.accent}70` }}
                >
                  {RECITER_PHOTOS[r.id] ? (
                    <img
                      src={RECITER_PHOTOS[r.id]}
                      alt={r.name}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-sm"
                      style={{ background: r.grad, color: '#fff', fontFamily: '"Amiri", serif' }}
                    >
                      {r.initial}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-foreground whitespace-nowrap" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {i + 1}. {r.shortName}
                </span>
              </div>
            ))}
          </div>

          {/* SURAH HERO CARD */}
          <button
            onClick={() => setShowSurahPicker(true)}
            data-testid="button-open-surah-picker"
            className="relative w-full overflow-hidden rounded-3xl bg-card border border-border shadow-md mb-5 transition-all hover:shadow-lg active:scale-[0.99] block"
          >
            <div className="relative h-32" style={{ background: 'linear-gradient(135deg, #2C1E16 0%, #4a3220 50%, #2C1E16 100%)' }}>
              <OrnamentalArch accent="#d4ad7d" />
              <PatternBg />
              {/* Surah number badge */}
              <div className="absolute top-3 right-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #e8c499, #C19A6B 70%)',
                    boxShadow: '0 4px 12px rgba(193,154,107,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <span className="font-bold text-base text-white" style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {surahNum}
                  </span>
                </div>
              </div>
              {/* Surah name */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <p className="text-[11px] text-white/60 mb-1 font-medium tracking-wider" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  ﴾ سورة ﴿
                </p>
                <p className="font-bold text-3xl text-white" style={{ fontFamily: '"Amiri", serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {SURAH_NAMES[surahNum]}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: isMakki ? 'rgba(193,154,107,0.15)' : 'rgba(94,155,212,0.15)',
                    color: isMakki ? '#a07d4f' : '#3a7eb5',
                    fontFamily: '"Tajawal", sans-serif',
                  }}
                >
                  {isMakki ? 'مكية' : 'مدنية'}
                </span>
                <span className="text-[11px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  • <span className="font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{maxAyahs}</span> آية
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <BookOpen className="w-3.5 h-3.5" />
                تغيير السورة
              </span>
            </div>
          </button>

          {/* AYAH RANGE CARD */}
          <div className="rounded-3xl bg-card border border-border shadow-md p-4 mb-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                نطاق الآيات
              </h3>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(193,154,107,0.15)', color: '#a07d4f', fontFamily: '"Tajawal", sans-serif', fontVariantNumeric: 'tabular-nums' }}
              >
                {toAyah - fromAyah + 1} آية محددة
              </span>
            </div>

            <RangeBar
              total={maxAyahs}
              from={fromAyah}
              to={toAyah}
              onChange={(f, t) => { setFromAyah(f); setToAyah(t); }}
            />

            <div className="flex items-center gap-2 mt-1">
              <MiniStepper label="من آية" value={fromAyah} min={1} max={toAyah} onChange={setFromAyah} />
              <div className="flex-shrink-0 text-muted-foreground/40 text-xs font-bold">←</div>
              <MiniStepper label="إلى آية" value={toAyah} min={fromAyah} max={maxAyahs} onChange={setToAyah} />
            </div>

            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
              {presets.map(p => {
                const active = fromAyah === p.from && toAyah === p.to;
                return (
                  <button
                    key={p.label}
                    onClick={() => { setFromAyah(p.from); setToAyah(p.to); }}
                    data-testid={`preset-${p.label}`}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setPhase('compare')}
            data-testid="button-start-compare"
            className="w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #8a6a3a)',
              color: '#fff',
              fontFamily: '"Tajawal", sans-serif',
              boxShadow: '0 8px 24px rgba(193,154,107,0.35)',
            }}
          >
            <Play className="w-5 h-5 fill-white" />
            ابدأ المقارنة
          </button>
        </div>

        <AnimatePresence>
          {showSurahPicker && (
            <SurahPickerSheet selected={surahNum} onSelect={setSurahNum} onClose={() => setShowSurahPicker(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ──────── Phase 3: Compare ──────── */
  const n = selectedReciters.length;
  // Layout: 2→2cols×1row, 3→3cols×1row, 4→2cols×2rows, 5→3cols, 6→3cols×2rows
  const gridClass = n === 2
    ? 'grid-cols-2'
    : n === 3
      ? 'grid-cols-3'
      : n === 4
        ? 'grid-cols-2'
        : 'grid-cols-3';
  const isCompact = n >= 3;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border flex-shrink-0">
        <button
          onClick={() => { handleReset(); setPhase('range'); }}
          className="p-2 bg-secondary rounded-full"
          data-testid="button-back-to-range"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-right">
          <h1 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>مقارنة الأصوات</h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
            {SURAH_NAMES[surahNum]} • من {fromAyah} إلى {toAyah}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="p-2 bg-secondary rounded-full"
          title="إعادة"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 p-3 pb-24 overflow-y-auto">
        <div className={`grid gap-2.5 ${gridClass}`}>
          {selectedReciters.map((r, i) => (
            <ComparisonCard
              key={r.id}
              reciter={r}
              surahNum={surahNum}
              fromAyah={fromAyah}
              toAyah={toAyah}
              isActive={activeIdx === i}
              isPaused={activeIdx === i ? isPaused : false}
              currentAyah={activeIdx === i ? currentAyah : null}
              progress={activeIdx === i ? progress : 0}
              onPlay={() => handlePlayCard(i)}
              onPause={handlePauseCard}
              isCompact={isCompact}
            />
          ))}
        </div>

        <div className="mt-4 mx-1 bg-primary/5 border border-primary/15 rounded-2xl px-3 py-2.5 flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>i</div>
          <p className="text-[11px] text-muted-foreground leading-snug" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            اضغط زر التشغيل في أي بطاقة. عند انتهاء قراءة قارئ، يبدأ التالي تلقائياً للمقارنة.
          </p>
        </div>
      </div>
    </div>
  );
}
