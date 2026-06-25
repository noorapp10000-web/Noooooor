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
  img: string;
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
    img: '/images/wudu/step-01-niyyah.webp',
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
    img: '/images/wudu/step-02-hands.webp',
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
    img: '/images/wudu/step-03-mouth.webp',
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
    img: '/images/wudu/step-04-nose.webp',
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
    img: '/images/wudu/step-05-face.webp',
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
    img: '/images/wudu/step-06-arms.webp',
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
    img: '/images/wudu/step-07-head.webp',
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
    img: '/images/wudu/step-08-ears.webp',
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
    img: '/images/wudu/step-09-feet.webp',
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
    img: '/images/wudu/step-10-dua.webp',
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

  const bg        = dark ? '#0d1117' : '#f0f8ff';
  const cardBg    = dark ? '#161b22' : '#ffffff';
  const border    = dark ? 'rgba(96,184,212,0.18)' : 'rgba(96,184,212,0.25)';
  const textColor  = dark ? '#e0f0f8' : '#1a3a4a';
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

            {/* Character image */}
            <div className="relative flex items-end justify-center overflow-hidden"
              style={{
                height: 220,
                background: dark
                  ? 'linear-gradient(160deg, #1a2e3a 0%, #0d1f2a 100%)'
                  : 'linear-gradient(160deg, #dff2fb 0%, #b8e4f5 100%)',
              }}>
              {/* Decorative water circle */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-48 h-48 rounded-full"
                  style={{ background: 'radial-gradient(circle, #60B8D4 0%, transparent 70%)' }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.img}
                  src={current.img}
                  alt={current.title}
                  className="h-52 object-contain object-bottom relative z-10 drop-shadow-lg"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {/* Step badge */}
              <div className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shadow-lg"
                style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
                {step + 1}
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
          style={{
            background: completed.has(step) ? '#16a34a' : 'linear-gradient(135deg,#60B8D4,#3a8fa8)',
            fontFamily: '"Tajawal",sans-serif',
          }}>
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
