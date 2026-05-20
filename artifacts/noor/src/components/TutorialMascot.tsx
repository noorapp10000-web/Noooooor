import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useTutorial } from './TutorialMascotContext';

/* ─────────────────────────────────────────────────────────────
   رسائل تفصيلية لكل صفحة رئيسية
───────────────────────────────────────────────────────────── */
const ROUTE_MESSAGES: Record<string, string> = {
  '/': `أهلاً بك في نُور، رفيقك الإسلامي! 🌙

هنا تلاقي كل حاجة في يومك الديني:
• مواقيت الصلاة الخمس بتوقيت دقيق لمحافظتك
• عداد تنازلي للصلاة القادمة ⏰
• آية اليوم من القرآن الكريم 🌿
• متتبع العبادات: سجّل صلاتك وقرآنك وأذكارك يومياً ✅

💡 اضغط على اسم محافظتك عشان تعدّلها في أي وقت!`,

  '/quran': `القرآن الكريم — كامل بدون إنترنت 📖

• اختار أي سورة من القائمة للقراءة الفورية
• 🔍 زر البحث: ابحث في أي كلمة في القرآن كلّه
• الجزء / الحزب: ابدأ القراءة من جزء بعينه مباشرة
• 🎧 تبويب "قارئ": استمع لكبار القراء بجودة عالية
• 📕 تبويب "مصاحف": حمّل مصاحف مصورة للقراءة

اضغط على أي سورة عشان تبدأ القراءة! ✨`,

  '/azkar': `أذكار السنة النبوية الشريفة 🤲

• 🌅 الصباح: أذكار الصباح الواجبة قبل الزوال
• 🌆 المساء: أذكار المساء من العصر للمغرب
• 📿 يومية: أذكار النوم، الاستيقاظ، الأكل، الدخول والخروج

اضغط على أي قسم عشان تبدأ بالذكر!`,

  '/tasbih': `المسبحة الرقمية 📿

• اضغط على الدائرة الكبيرة للتسبيح
• اختار: سبحان الله / الحمد لله / الله أكبر / لا إله إلا الله
• 🔄 زر الإعادة يصفّر العداد من جديد
• الجهاز يهتزّ عند الوصول للعدد المحدد 📳
• الإجمالي في الأسفل يجمع كل تسبيحاتك في الجلسة`,

  '/ranking': `إحصائياتك وإنجازاتك! 🏆

• شوف صلواتك المسجّلة وقراءتك وأذكارك
• الشارات: اكسب شارات بالمواظبة على العبادات 🏅
• المقارنة: تابع مستواك مقارنةً بالأيام السابقة
• كل يوم مواظبة بيزودك نقاط ورصيد ✨`,

  '/more': `المزيد من المحتوى الإسلامي ✨

من هنا تقدر تدخل على:
• أسماء الله الحسنى — القراء — الإذاعات
• التاريخ الإسلامي — قصص الأنبياء
• الاختبارات — السنة النبوية — والمزيد!

📴 كل التطبيق يشتغل بدون إنترنت بعد التحميل`,

  '/settings': `إعدادات التطبيق ⚙️

• 🌙 الثيم: اختار الوضع الفاتح أو الداكن
• 🔔 الإشعارات: فعّل أذان الصلاة التلقائي
• 🎨 الخلفية: اختار خلفية جميلة للتطبيق
• 🔤 الخط: عدّل حجم الخط حسب راحتك
• 💾 النسخ الاحتياطي: احفظ بياناتك واسترجعها`,

  '/asma': `أسماء الله الحسنى التسعة والتسعين 💎

• اضغط على أي اسم لتفتح معناه وفضله كاملاً
• كل اسم معاه شرح لغوي ودليل من القرآن أو السنة
• الأسماء مُصنّفة وسهل التنقل بينها
• 💡 احفظ اسماً في اليوم لتتقرب أكثر من الله`,

  '/reciters': `القراء وتشغيل التلاوة 🎙️

• اختار القارئ اللي بتحبه من القائمة
• ثم اختار أي سورة تريد سماعها
• ▶ تشغيل، ⏸ إيقاف مؤقت، ⏭ السورة التالية
• التلاوة تشتغل في الخلفية حتى لو قفّلت التطبيق 🎵
• يمكن تحميل السور للاستماع بدون إنترنت ⬇️`,

  '/radio': `الإذاعات الإسلامية المباشرة 📻

• اضغط على أي إذاعة لتشغيل البث الحي فوراً
• البث يشتغل في الخلفية مع المشغّل الصغير أسفل الشاشة
• اضغط مرة تانية على الإذاعة لإيقافها
• 📡 البث المباشر بيحتاج اتصال إنترنت جيد`,

  '/qibla': `بوصلة القبلة 🧭

• وجّه الجهاز للأمام وامسكه في وضع أفقي
• السهم الذهبي يشير دائماً نحو الكعبة المشرفة
• الرقم يوضح الدرجة باتجاه الشمال المغناطيسي
• ⚠️ لو البوصلة غير دقيقة: بعّد عن الأجهزة والمعادن
• اضغط "حدد موقعي" لتحديث الاتجاه بدقة أعلى`,

  '/hadith': `أحاديث النبي ﷺ من الكتب الستة 📜

• صحيح البخاري، مسلم، والكتب الستة كلها هنا
• اختار أي كتاب لتصفّح أحاديثه
• 🔍 تبويب "بحث": ابحث في كل الأحاديث دفعة واحدة
• كل حديث ممكن تنسخه أو تشاركه بسهولة
• 📴 كل الأحاديث محفوظة بدون إنترنت`,

  '/history': `التاريخ الإسلامي عبر العصور 🕌

• الأحداث مرتبة زمنياً من صدر الإسلام لليوم
• كل حدث بيوضح: التاريخ، المكان، والتفاصيل الكاملة
• فلتر بالفئة: خلفاء، معارك، علماء، حضارة وغيرها
• اضغط على أي حدث لقراءة قصته الكاملة 📖`,

  '/prophets': `قصص الأنبياء عليهم السلام 🌟

• من سيدنا آدم حتى خاتم الأنبياء محمد ﷺ
• كل نبي بقصته الكاملة والعبر المستخلصة
• النصوص مستخرجة من القرآن الكريم والتفاسير الموثوقة
• 💡 اقرأ قصة في اليوم وتدبّر معانيها`,

  '/quizzes': `اختبر معلوماتك الإسلامية! 🎯

• اختار التصنيف: قرآن، حديث، تاريخ، فقه، سيرة
• كل تصنيف فيه مواضيع ومستويات مختلفة
• المستويات: سهل — متوسط — صعب
• كل جلسة = 20 سؤال منتقى بعناية
• 🏆 حظ سعيد، وتذكر: العلم عبادة!`,

  '/sunnah': `السنة النبوية في حياتنا اليومية ☀️

• آداب وسنن: النوم، الأكل، الشرب، الدخول والخروج
• كل سنة معاها الحديث الشريف ومصدره الموثوق
• 💡 التزم بسنة جديدة كل يوم وتقرّب من النبي ﷺ
• الأجر الكبير في الأشياء الصغيرة اليومية 🌿`,

  '/tv': `التلفزيون الإسلامي المباشر 📺

• قنوات إسلامية من مصر والعالم العربي
• اضغط على أي قناة لمشاهدة البث المباشر
• يدخل في وضع ملء الشاشة تلقائياً
• 📡 بيحتاج اتصال إنترنت مستقر للبث الجيد`,

  '/voice-comparison': `مقارنة التلاوة 🎤

• سجّل صوتك وأنت تتلو أي آية
• التطبيق بيقارن نطقك بصوت قارئ محترف
• ابدأ بالسور القصيرة وتدرّج نحو الأطول
• 💡 الممارسة المنتظمة هي سر التجويد الصحيح
• أداة قيّمة لتحسين الأداء والمخارج والأحكام`,

  '/hifz-test': `اختبار الحفظ! 🧠

• اختار السورة أو الجزء اللي حافظه
• التطبيق يعطيك بداية الآية وأنت تكمّلها
• كل إجابة صح بتزود نقاطك وتقيّم حفظك 🌟
• ابدأ بالجزء الأخير إذا كنت في المرحلة الأولى
• 💡 الاختبار اليومي هو أقوى وسيلة للثبات على الحفظ`,

  '/speed-reader': `القراءة السريعة للقرآن ⚡

• التطبيق يعرض الآيات بإيقاع منتظم قابل للضبط
• ابدأ بسرعة بطيئة وزوّدها تدريجياً
• مفيد جداً لمن يريد ختم القرآن في وقت قصير
• ⚠️ السرعة المثلى: ما تُمكّنك من الفهم والتدبّر معاً`,
};

/* ─────────────────────────────────────────────────────────────
   الـ Component الرئيسي
───────────────────────────────────────────────────────────── */
export function TutorialMascot() {
  const [location] = useLocation();
  const { showTutorial, hide, visible, message } = useTutorial();

  /* trigger route-level tutorial */
  useEffect(() => {
    const msg = ROUTE_MESSAGES[location];
    if (msg) {
      const t = setTimeout(() => showTutorial('route:' + location, msg), 700);
      return () => clearTimeout(t);
    }
  }, [location, showTutorial]);

  const lines = message.split('\n');
  const title = lines[0] ?? '';
  const body  = lines.slice(1).join('\n').trim();

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* invisible full-screen overlay — tap anywhere to dismiss */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[9997]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hide}
          />

          {/* mascot + bubble */}
          <motion.div
            key="mascot"
            className="fixed bottom-16 right-0 z-[9998] flex flex-row items-end pointer-events-none"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* ── Bubble ── */}
            <motion.div
              className="relative mb-16 mr-[-4px] pointer-events-auto"
              style={{ maxWidth: 260 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* bubble body */}
              <div
                className="rounded-2xl px-4 pt-3 pb-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #fffef9 0%, #fef6e0 100%)',
                  border: '1.5px solid rgba(193,154,107,0.5)',
                  boxShadow:
                    '0 10px 40px rgba(193,154,107,0.25), 0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                {/* shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at top right, rgba(255,228,130,0.18) 0%, transparent 65%)',
                  }}
                />

                {/* title */}
                <p
                  className="font-bold text-[13.5px] leading-snug mb-1.5"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    color: '#3d2a0e',
                    direction: 'rtl',
                    textAlign: 'right',
                  }}
                >
                  {title}
                </p>

                {/* body */}
                {body && (
                  <p
                    className="text-[11.5px] leading-[1.75] whitespace-pre-line"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      color: '#6b4d22',
                      direction: 'rtl',
                      textAlign: 'right',
                    }}
                  >
                    {body}
                  </p>
                )}

                {/* dismiss hint */}
                <p
                  className="text-[9.5px] mt-2 opacity-50 text-center"
                  style={{ fontFamily: '"Tajawal", sans-serif', color: '#8a6030' }}
                >
                  اضغط في أي مكان للإغلاق
                </p>
              </div>

              {/* Right-pointing tail — points toward mascot hand */}
              {/* outer border tail */}
              <div
                className="absolute"
                style={{
                  right: -11,
                  bottom: 36,
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderLeft: '12px solid rgba(193,154,107,0.5)',
                }}
              />
              {/* inner fill tail */}
              <div
                className="absolute"
                style={{
                  right: -9,
                  bottom: 37,
                  width: 0,
                  height: 0,
                  borderTop: '9px solid transparent',
                  borderBottom: '9px solid transparent',
                  borderLeft: '10px solid #fef6e0',
                }}
              />
            </motion.div>

            {/* ── Mascot image ── */}
            <motion.img
              src="/mascot.png"
              alt="مرشد نور"
              className="flex-shrink-0"
              style={{
                width: 140,
                height: 'auto',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.22))',
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
