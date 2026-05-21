import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';

interface WuduStep {
  id: number;
  title: string;
  subtitle: string;
  type: 'فرض' | 'سنة' | 'مستحب';
  arabic?: string;
  transliteration?: string;
  meaning?: string;
  points: string[];
  Illustration: () => JSX.Element;
}

/* ── SVG Illustrations ─────────────────────────────────────── */
function HandsIllustration() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="85" rx="40" ry="6" fill="rgba(193,154,107,0.15)" />
      {/* Left hand */}
      <rect x="22" y="40" width="22" height="32" rx="11" fill="#C4956A" />
      <rect x="22" y="30" width="7" height="22" rx="3.5" fill="#C4956A" />
      <rect x="30" y="27" width="7" height="22" rx="3.5" fill="#C4956A" />
      <rect x="38" y="30" width="6" height="20" rx="3" fill="#C4956A" />
      {/* Right hand */}
      <rect x="76" y="40" width="22" height="32" rx="11" fill="#C4956A" />
      <rect x="91" y="30" width="7" height="22" rx="3.5" fill="#C4956A" />
      <rect x="83" y="27" width="7" height="22" rx="3.5" fill="#C4956A" />
      <rect x="76" y="30" width="6" height="20" rx="3" fill="#C4956A" />
      {/* Water drops */}
      <ellipse cx="50" cy="22" rx="3" ry="4" fill="#60B8D4" opacity="0.8" />
      <ellipse cx="60" cy="18" rx="3" ry="4" fill="#60B8D4" opacity="0.9" />
      <ellipse cx="70" cy="22" rx="3" ry="4" fill="#60B8D4" opacity="0.8" />
    </svg>
  );
}

function FaceIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="95" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="50" r="34" fill="#C4956A" />
      <circle cx="60" cy="50" r="30" fill="#D4A574" />
      <circle cx="48" cy="44" r="4" fill="#5D3A1A" />
      <circle cx="72" cy="44" r="4" fill="#5D3A1A" />
      <path d="M50 62 Q60 70 70 62" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Water lines */}
      <path d="M30 30 Q26 38 30 46" stroke="#60B8D4" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M90 30 Q94 38 90 46" stroke="#60B8D4" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M44 18 Q40 24 44 30" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M76 18 Q80 24 76 30" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function MouthIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="95" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="50" r="34" fill="#C4956A" />
      <circle cx="60" cy="50" r="30" fill="#D4A574" />
      <circle cx="48" cy="44" r="4" fill="#5D3A1A" />
      <circle cx="72" cy="44" r="4" fill="#5D3A1A" />
      <path d="M46 63 Q60 76 74 63" stroke="#5D3A1A" strokeWidth="2" fill="#C47A5A" strokeLinecap="round" />
      <path d="M47 64 Q60 74 73 64" fill="#C47A5A" />
      {/* Water entering mouth */}
      <path d="M55 52 Q58 56 55 62" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M62 50 Q65 55 62 63" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function NoseIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="95" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="50" r="34" fill="#C4956A" />
      <circle cx="60" cy="50" r="30" fill="#D4A574" />
      <circle cx="48" cy="44" r="4" fill="#5D3A1A" />
      <circle cx="72" cy="44" r="4" fill="#5D3A1A" />
      <path d="M60 36 Q55 48 52 56 Q56 60 60 60 Q64 60 68 56 Q65 48 60 36Z" fill="#C4956A" />
      <ellipse cx="53" cy="56" rx="5" ry="3.5" fill="#A0724A" />
      <ellipse cx="67" cy="56" rx="5" ry="3.5" fill="#A0724A" />
      <path d="M50 38 Q46 44 50 52" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M70 38 Q74 44 70 52" stroke="#60B8D4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function ArmIllustration() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="88" rx="40" ry="5" fill="rgba(193,154,107,0.15)" />
      {/* Left arm extended */}
      <rect x="15" y="38" width="38" height="24" rx="12" fill="#C4956A" />
      <rect x="14" y="40" width="8" height="18" rx="4" fill="#B8845A" />
      {/* Right arm extended */}
      <rect x="67" y="38" width="38" height="24" rx="12" fill="#C4956A" />
      <rect x="98" y="40" width="8" height="18" rx="4" fill="#B8845A" />
      {/* Elbow marks */}
      <ellipse cx="42" cy="50" rx="6" ry="8" fill="#B8845A" opacity="0.5" />
      <ellipse cx="78" cy="50" rx="6" ry="8" fill="#B8845A" opacity="0.5" />
      {/* Water drops */}
      <ellipse cx="30" cy="70" rx="3" ry="4" fill="#60B8D4" opacity="0.85" />
      <ellipse cx="42" cy="74" rx="2.5" ry="3.5" fill="#60B8D4" opacity="0.7" />
      <ellipse cx="90" cy="70" rx="3" ry="4" fill="#60B8D4" opacity="0.85" />
      <ellipse cx="78" cy="74" rx="2.5" ry="3.5" fill="#60B8D4" opacity="0.7" />
    </svg>
  );
}

function HeadWipeIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="98" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="52" r="34" fill="#C4956A" />
      <circle cx="60" cy="52" r="30" fill="#D4A574" />
      {/* Hands on head */}
      <rect x="18" y="22" width="16" height="26" rx="8" fill="#C4956A" transform="rotate(-20 26 35)" />
      <rect x="86" y="22" width="16" height="26" rx="8" fill="#C4956A" transform="rotate(20 94 35)" />
      {/* Arrow showing wipe direction */}
      <path d="M35 28 Q60 20 85 28" stroke="#60B8D4" strokeWidth="2.5" fill="none" strokeLinecap="round" markerEnd="url(#arr)" opacity="0.9" />
      <circle cx="48" cy="46" r="4" fill="#5D3A1A" />
      <circle cx="72" cy="46" r="4" fill="#5D3A1A" />
      <path d="M50 64 Q60 72 70 64" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function EarIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="98" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="52" r="28" fill="#D4A574" />
      {/* Left ear */}
      <path d="M26 36 Q16 52 26 68" stroke="#C4956A" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M26 42 Q20 52 26 62" stroke="#B8845A" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Right ear */}
      <path d="M94 36 Q104 52 94 68" stroke="#C4956A" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M94 42 Q100 52 94 62" stroke="#B8845A" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Fingers wiping ears */}
      <circle cx="21" cy="52" r="5" fill="#C4956A" opacity="0.85" />
      <circle cx="99" cy="52" r="5" fill="#C4956A" opacity="0.85" />
      <ellipse cx="48" cy="46" r="4" fill="#5D3A1A" />
      <ellipse cx="72" cy="46" r="4" fill="#5D3A1A" />
    </svg>
  );
}

function FootIllustration() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="90" rx="44" ry="6" fill="rgba(193,154,107,0.15)" />
      {/* Left foot */}
      <ellipse cx="35" cy="72" rx="22" ry="12" fill="#C4956A" />
      <rect x="13" y="60" width="44" height="20" rx="10" fill="#C4956A" />
      <rect x="16" y="48" width="7" height="20" rx="3.5" fill="#C4956A" />
      <rect x="24" y="44" width="7" height="20" rx="3.5" fill="#C4956A" />
      <rect x="32" y="43" width="7" height="19" rx="3.5" fill="#C4956A" />
      <rect x="40" y="45" width="6" height="18" rx="3" fill="#C4956A" />
      <rect x="47" y="49" width="5" height="16" rx="2.5" fill="#C4956A" />
      {/* Water drops */}
      <ellipse cx="28" cy="84" rx="2.5" ry="3.5" fill="#60B8D4" opacity="0.8" />
      <ellipse cx="38" cy="86" rx="2" ry="3" fill="#60B8D4" opacity="0.7" />
      <ellipse cx="48" cy="84" rx="2.5" ry="3.5" fill="#60B8D4" opacity="0.8" />
    </svg>
  );
}

function DuaIllustration() {
  return (
    <svg viewBox="0 0 120 110" className="w-full h-full">
      <ellipse cx="60" cy="98" rx="35" ry="5" fill="rgba(193,154,107,0.15)" />
      {/* Person standing */}
      <circle cx="60" cy="24" r="14" fill="#C4956A" />
      <rect x="46" y="38" width="28" height="34" rx="10" fill="#C4956A" />
      {/* Hands raised in dua */}
      <rect x="22" y="36" width="24" height="12" rx="6" fill="#C4956A" transform="rotate(-30 34 42)" />
      <rect x="74" y="36" width="24" height="12" rx="6" fill="#C4956A" transform="rotate(30 86 42)" />
      {/* Stars/sparkles */}
      <circle cx="20" cy="24" r="3" fill="#F5C842" opacity="0.8" />
      <circle cx="100" cy="24" r="3" fill="#F5C842" opacity="0.8" />
      <circle cx="32" cy="14" r="2" fill="#F5C842" opacity="0.6" />
      <circle cx="88" cy="14" r="2" fill="#F5C842" opacity="0.6" />
      {/* Eyes */}
      <circle cx="55" cy="22" r="2.5" fill="#5D3A1A" />
      <circle cx="65" cy="22" r="2.5" fill="#5D3A1A" />
    </svg>
  );
}

const WUDU_STEPS: WuduStep[] = [
  {
    id: 1,
    title: 'النية والبسملة',
    subtitle: 'الخطوة الأولى',
    type: 'سنة',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    meaning: 'بسم الله',
    points: [
      'انوِ بقلبك أن تتطهر لأداء الصلاة أو رفع الحدث',
      'النية محلها القلب ولا تُلفظ',
      'قُل «بسم الله» قبل البدء',
    ],
    Illustration: HandsIllustration,
  },
  {
    id: 2,
    title: 'غسل الكفين',
    subtitle: 'ثلاث مرات',
    type: 'سنة',
    points: [
      'اغسل كلتا يديك حتى الرسغ ثلاث مرات',
      'أدخِل الماء بين الأصابع',
      'ابدأ باليمنى ثم اليسرى',
    ],
    Illustration: HandsIllustration,
  },
  {
    id: 3,
    title: 'المضمضة',
    subtitle: 'ثلاث مرات',
    type: 'سنة',
    points: [
      'خذ ماءً في فمك وحرّكه جيداً',
      'ثم أخرجه — ثلاث مرات',
      'يُستحب المبالغة في المضمضة في غير الصيام',
    ],
    Illustration: MouthIllustration,
  },
  {
    id: 4,
    title: 'الاستنشاق والاستنثار',
    subtitle: 'ثلاث مرات',
    type: 'سنة',
    points: [
      'الاستنشاق: شُدّ الماء للأنف باليد اليمنى',
      'الاستنثار: أخرج الماء من الأنف باليد اليسرى',
      'كرر ثلاث مرات',
    ],
    Illustration: NoseIllustration,
  },
  {
    id: 5,
    title: 'غسل الوجه',
    subtitle: 'ثلاث مرات — فرض',
    type: 'فرض',
    points: [
      'من منابت الشعر (الجبهة) إلى أسفل الذقن',
      'ومن الأذن اليمنى إلى الأذن اليسرى',
      'المسافة الطولية من قمة الجبهة للذقن، والعرضية بين الأذنين',
    ],
    Illustration: FaceIllustration,
  },
  {
    id: 6,
    title: 'غسل اليدين إلى المرفقين',
    subtitle: 'ثلاث مرات — فرض',
    type: 'فرض',
    points: [
      'ابدأ باليد اليمنى ثم اليسرى',
      'يشمل الغسل المرفق نفسه',
      'أدخِل الماء بين الأصابع',
    ],
    Illustration: ArmIllustration,
  },
  {
    id: 7,
    title: 'مسح الرأس',
    subtitle: 'مرة واحدة — فرض',
    type: 'فرض',
    arabic: 'يمسح من مقدمة الرأس إلى مؤخرته ثم يُعيد إلى المقدمة',
    points: [
      'امسح بيديك مبلولتين من مقدمة الرأس إلى مؤخرته',
      'ثم أعِد يديك إلى المقدمة مرةً واحدة',
      'يكفي مسح بعض الرأس عند الحنفية والشافعية',
    ],
    Illustration: HeadWipeIllustration,
  },
  {
    id: 8,
    title: 'مسح الأذنين',
    subtitle: 'مرة واحدة — سنة',
    type: 'سنة',
    points: [
      'أدخِل السبّابتين في صِماخ الأذنين',
      'وامسح بالإبهامين ظاهر الأذنين',
      'بنفس ماء مسح الرأس',
    ],
    Illustration: EarIllustration,
  },
  {
    id: 9,
    title: 'غسل القدمين',
    subtitle: 'ثلاث مرات — فرض',
    type: 'فرض',
    points: [
      'ابدأ بالقدم اليمنى ثم اليسرى',
      'يشمل الغسل الكعبين',
      'أدخِل الماء بين أصابع القدم بخنصر اليد اليسرى',
    ],
    Illustration: FootIllustration,
  },
  {
    id: 10,
    title: 'دعاء ما بعد الوضوء',
    subtitle: 'مستحب',
    type: 'مستحب',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Ash-hadu allā ilāha illallāh, wahdahu lā sharīka lah, wa ash-hadu anna Muhammadan ʿabduhu wa rasūluh',
    meaning: 'أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمداً عبده ورسوله',
    points: [
      'اقرأ هذا الدعاء بعد الانتهاء من الوضوء',
      '«اللهم اجعلني من التوابين واجعلني من المتطهرين»',
      'يُفضّل استقبال القبلة عند قراءة الدعاء',
    ],
    Illustration: DuaIllustration,
  },
];

const TYPE_COLOR: Record<string, string> = {
  'فرض':    '#ef4444',
  'سنة':    '#C19A6B',
  'مستحب': '#22c55e',
};

export function WuduGuide() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const current = WUDU_STEPS[step];
  const total = WUDU_STEPS.length;
  const progress = ((step + 1) / total) * 100;

  const bg       = dark ? '#0f0c07' : '#f0f8ff';
  const cardBg   = dark ? '#1a1208' : '#ffffff';
  const border   = dark ? 'rgba(96,184,212,0.18)' : 'rgba(96,184,212,0.25)';
  const textColor = dark ? '#e0f0f8' : '#1a3a4a';
  const mutedColor = dark ? 'rgba(224,240,248,0.5)' : 'rgba(26,58,74,0.5)';

  const markDone = () => {
    setCompleted(prev => new Set([...prev, step]));
    if (step < total - 1) setStep(s => s + 1);
  };

  const allDone = completed.size === total;

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: bg, direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
        <button onClick={() => navigate('/more')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(96,184,212,0.12)', color: '#60B8D4' }}>
          <ChevronRight size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
            دليل الوضوء
          </h1>
          <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
            {step + 1} / {total}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(96,184,212,0.1)', color: '#60B8D4', fontFamily: '"Tajawal",sans-serif' }}>
          {completed.size}/{total}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1.5 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: 'rgba(96,184,212,0.15)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #60B8D4, #3a8fa8)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }} />
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 py-3 flex-shrink-0">
        {WUDU_STEPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="rounded-full transition-all"
            style={{
              width: i === step ? 20 : 8,
              height: 8,
              background: completed.has(i) ? '#22c55e' : i === step ? '#60B8D4' : 'rgba(96,184,212,0.2)',
            }} />
        ))}
      </div>

      {/* Main card */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border overflow-hidden"
            style={{ background: cardBg, borderColor: border }}>

            {/* Illustration area */}
            <div className="flex items-center justify-center py-6"
              style={{ background: dark ? 'rgba(96,184,212,0.05)' : 'rgba(96,184,212,0.06)' }}>
              <div className="w-44 h-36">
                <current.Illustration />
              </div>
            </div>

            {/* Badge + Title */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: TYPE_COLOR[current.type] + '22',
                    color: TYPE_COLOR[current.type],
                    fontFamily: '"Tajawal",sans-serif',
                    border: `1px solid ${TYPE_COLOR[current.type]}44`,
                  }}>
                  {current.type}
                </span>
                <span className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                  {current.subtitle}
                </span>
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
                {current.title}
              </h2>
            </div>

            {/* Arabic text */}
            {current.arabic && (
              <div className="mx-5 mb-3 p-3 rounded-2xl"
                style={{ background: dark ? 'rgba(96,184,212,0.06)' : 'rgba(96,184,212,0.07)', border: `1px solid ${border}` }}>
                <p className="text-center leading-loose text-lg mb-1"
                  style={{ fontFamily: '"Scheherazade New","Amiri",serif', color: textColor, direction: 'rtl' }}>
                  {current.arabic}
                </p>
                {current.transliteration && (
                  <p className="text-center text-xs italic" style={{ color: mutedColor, fontFamily: 'sans-serif' }}>
                    {current.transliteration}
                  </p>
                )}
                {current.meaning && current.meaning !== current.arabic && (
                  <p className="text-center text-xs mt-1" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                    {current.meaning}
                  </p>
                )}
              </div>
            )}

            {/* Points */}
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              {current.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(96,184,212,0.15)', minWidth: 20 }}>
                    <span className="text-xs font-bold" style={{ color: '#60B8D4' }}>{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* All done banner */}
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl p-4 text-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <p className="text-2xl mb-1">✅</p>
            <p className="font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: '#16a34a' }}>
              أتممت الوضوء! تقبّل الله منك
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-6 pt-2 flex gap-3 flex-shrink-0">
        <button onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-opacity"
          style={{
            background: 'rgba(96,184,212,0.1)',
            border: `1.5px solid ${border}`,
            color: '#60B8D4',
            opacity: step === 0 ? 0.3 : 1,
          }}>
          <ChevronRight size={22} />
        </button>

        <button onClick={markDone}
          className="flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
          style={{ background: completed.has(step) ? '#16a34a' : 'linear-gradient(135deg,#60B8D4,#3a8fa8)', fontFamily: '"Tajawal",sans-serif' }}>
          {completed.has(step)
            ? <><CheckCircle size={18} /> تم</>
            : step === total - 1 ? 'إنهاء ✓' : 'التالي →'}
        </button>

        <button onClick={() => setStep(s => Math.min(total - 1, s + 1))}
          disabled={step === total - 1}
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-opacity"
          style={{
            background: 'rgba(96,184,212,0.1)',
            border: `1.5px solid ${border}`,
            color: '#60B8D4',
            opacity: step === total - 1 ? 0.3 : 1,
          }}>
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
}
