import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLocation } from 'wouter';

const STORAGE_PREFIX = 'noor_mascot_seen_';

const TUTORIALS: Record<string, string> = {
  '/':
    'أهلاً بك في نُور! 🌙\nهنا تلاقي مواقيت الصلاة، آية اليوم، وتتابع يومك الإسلامي.',
  '/quran':
    'هنا تقدر تقرأ القرآن الكريم 📖\nاضغط على أي سورة، واستمع للتلاوة، واشوف التفسير لأي آية.',
  '/azkar':
    'أذكار الصباح والمساء والأذكار اليومية 🤲\nاضغط على الذكر كل مرة تقوله عشان تعده.',
  '/tasbih':
    'المسبحة الرقمية 📿\nاضغط في أي مكان على الشاشة عشان تسبح وتحمد وتكبر.',
  '/ranking':
    'إحصائياتك وإنجازاتك 🏆\nشوف مين الأكثر التزاماً وتابع تقدمك اليومي.',
  '/more':
    'المزيد من المحتوى الإسلامي ✨\nاكتشف كل خصائص التطبيق من هنا.',
  '/settings':
    'الإعدادات ⚙️\nاضبط الثيم والإشعارات والخصائص زي ما يناسبك.',
  '/asma':
    'أسماء الله الحسنى التسعة والتسعين 💎\nاضغط على أي اسم عشان تشوف معناه وفضله.',
  '/reciters':
    'استمع للقرآن بصوت كبار القراء 🎙️\nاختار القارئ اللي بتحبه وشغّل أي سورة.',
  '/radio':
    'إذاعات إسلامية مباشرة 📻\nاستمع لبث القرآن الكريم والمحاضرات الإسلامية.',
  '/qibla':
    'بوصلة القبلة 🧭\nوجّه الجهاز وسيرشدك السهم نحو الكعبة المشرفة.',
  '/hadith':
    'أحاديث النبي ﷺ 📜\nتصفح الكتب الستة وابحث في أي حديث بسهولة.',
  '/history':
    'التاريخ الإسلامي 🕌\nتعرف على أهم الأحداث والشخصيات على مر العصور.',
  '/prophets':
    'قصص الأنبياء عليهم السلام 🌟\nاقرأ سيرهم واستفد من العبر والدروس.',
  '/quizzes':
    'اختبر معلوماتك الإسلامية 🎯\nمسابقات متنوعة في القرآن والحديث والتاريخ.',
  '/sunnah':
    'السنة النبوية ☀️\nتعلم آداب الإسلام وعبادات السنة في حياتك اليومية.',
  '/tv':
    'التلفزيون الإسلامي 📺\nشاهد قنوات إسلامية مباشرة ومحاضرات دينية.',
  '/voice-comparison':
    'مقارنة التلاوة 🎤\nقارن صوتك بصوت القراء وطور مستواك في التجويد.',
  '/hifz-test':
    'اختبار الحفظ 🧠\nاختبر نفسك في حفظ القرآن آية بآية وسورة بسورة.',
  '/speed-reader':
    'القراءة السريعة ⚡\nتدرب على تلاوة القرآن بسرعة ودقة لختمه في وقت أقل.',
};

export function TutorialMascot() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timer) clearTimeout(timer);
  }, [timer]);

  useEffect(() => {
    const key = STORAGE_PREFIX + location;
    if (localStorage.getItem(key)) return;

    const text = TUTORIALS[location];
    if (!text) return;

    localStorage.setItem(key, '1');
    setMessage(text);

    const showDelay = setTimeout(() => {
      setVisible(true);
      const hideDelay = setTimeout(() => setVisible(false), 7000);
      setTimer(hideDelay);
    }, 600);

    return () => {
      clearTimeout(showDelay);
    };
  }, [location]);

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  const lines = message.split('\n');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={location}
          className="fixed bottom-20 left-2 z-[9999] flex flex-col items-end select-none"
          style={{ maxWidth: 260 }}
          initial={{ opacity: 0, y: 40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={dismiss}
        >
          {/* ── Speech Bubble ── */}
          <motion.div
            className="relative mb-[-4px] ml-10"
            initial={{ opacity: 0, scale: 0.7, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 360, damping: 26 }}
          >
            <div
              className="relative rounded-2xl px-4 py-3 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #fffdf7 0%, #fef6e4 100%)',
                border: '1.5px solid rgba(193,154,107,0.45)',
                boxShadow:
                  '0 8px 32px rgba(193,154,107,0.22), 0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {/* Close button */}
              <button
                className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(193,154,107,0.25)' }}
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
              >
                <X size={10} strokeWidth={2.5} style={{ color: '#7a5c2e' }} />
              </button>

              {/* Shimmer accent top-right */}
              <div
                className="absolute top-0 right-0 w-14 h-14 rounded-2xl opacity-30 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at top right, rgba(255,220,120,0.6) 0%, transparent 70%)',
                }}
              />

              {/* Text */}
              <p
                className="text-sm leading-relaxed font-medium pr-2"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  color: '#4a3520',
                  direction: 'rtl',
                  textAlign: 'right',
                  whiteSpace: 'pre-line',
                }}
              >
                {lines[0]}
                {lines[1] && (
                  <>
                    {'\n'}
                    <span style={{ color: '#7a5c2e', fontWeight: 400, fontSize: '0.78rem' }}>
                      {lines[1]}
                    </span>
                  </>
                )}
              </p>

              {/* Progress bar — shows how long until auto-dismiss */}
              <div
                className="mt-2 h-0.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(193,154,107,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #C19A6B, #e8c98a)' }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 7, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Bubble tail — points down-right toward mascot */}
            <div
              className="absolute -bottom-[9px] right-10"
              style={{
                width: 0,
                height: 0,
                borderLeft: '9px solid transparent',
                borderRight: '9px solid transparent',
                borderTop: '10px solid rgba(193,154,107,0.45)',
              }}
            />
            <div
              className="absolute -bottom-[7px] right-[42px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '8px solid #fef6e4',
              }}
            />
          </motion.div>

          {/* ── Mascot image ── */}
          <motion.img
            src="/mascot.png"
            alt="مرشد نور"
            className="w-20 h-20 object-contain drop-shadow-xl"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
