import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useTutorial } from './TutorialMascotContext';

/* ─────────────────────────────────────────────────────────────
   رسائل دقيقة — مبنية على محتوى الصفحات الفعلي
───────────────────────────────────────────────────────────── */
const ROUTE_MESSAGES: Record<string, string> = {

  '/': `أهلاً بك في نُور! 🌙

صفحتك الرئيسية تحتوي على:
• مواقيت الصلاة الخمس بتوقيت دقيق
• عداد تنازلي للصلاة القادمة ⏰
• آية اليوم تتغير كل يوم تلقائياً 🌿
• متتبع يومي: ✅ الصلوات • القرآن • الأذكار

💡 اضغط على اسم المحافظة فوق لتغييرها`,

  '/quran': `القرآن الكريم — كامل بلا إنترنت 📖

• اختار أي سورة من القائمة للقراءة
• زر 🔍 للبحث في أي كلمة بالقرآن كله
• تبويب "بالجزء": ابدأ من أي جزء مباشرة
• تبويب "بالحزب": ابدأ من أي حزب مباشرة
• 🎧 تبويب "قارئ": تلاوة بأصوات القراء
• 📕 تبويب "مصاحف": مصاحف مصورة للتحميل`,

  '/azkar': `أذكار السنة النبوية 🤲

• 🌅 الصباح: أذكار الصباح قبل الزوال
• 🌆 المساء: أذكار المساء بعد العصر
• 📿 اليومية: أذكار النوم والاستيقاظ والأكل والدخول

اضغط على أي قسم لتبدأ الذكر!`,

  '/tasbih': `السبحة الإلكترونية 📿

• اضغط في المنتصف لتسبّح — كل ضغطة = مرة
• اختار نوع الذكر من الأزرار في الأسفل:
  سبحان الله / الحمد لله / الله أكبر / لا إله إلا الله
• زر 📊 في الأعلى يعرض إحصائياتك لكل نوع
• زر ↺ يصفّر عداد النوع الحالي
• الجهاز يهتزّ لمّا تضغط 📳`,

  '/ranking': `إحصائيات عباداتك اليومية 🏆

• شبكة الأيام: كل مربع = يوم، واللون يعكس نشاطك
  (الأغمق = أكثر عبادات في ذلك اليوم)
• بطاقات الإحصاء:
  📿 إجمالي التسبيح اليومي
  📖 ختمات القرآن المكتملة
  🔥 سلسلة الأذكار المتواصلة
• اضغط على "عرض الكل" لرؤية كل الأيام`,

  '/more': `قائمة المزيد ✨

اضغط على أي خانة للدخول إليها:
• 📖 القراء — 📻 الإذاعات — 📺 التلفزيون
• 💎 أسماء الله — 📜 الأحاديث — ☀️ السنة
• 🕌 التاريخ — 🌟 الأنبياء — 🎯 الاختبارات
• 🧭 القبلة — 🎤 مقارنة التلاوة — 🧠 اختبار الحفظ
• زر المشاركة 📤 لنشر التطبيق على مواقع التواصل`,

  '/settings': `إعدادات التطبيق ⚙️

• 🌙 المظهر: الوضع الفاتح أو الداكن
• 🔔 الإشعارات: فعّل أذان كل صلاة على حدة
  وضبط وقت التذكير اليومي بالأذكار
• 🖼️ الخلفية: اختار من قوالب جاهزة أو ارفع صورتك
• 🔤 الخط: عدّل حجم خط القراءة
• 💾 التصدير/الاستيراد: احفظ بياناتك واسترجعها`,

  '/asma': `أسماء الله الحسنى — ٩٩ اسماً 💎

• اضغط على أي اسم لعرض معناه ودليله كاملاً
• كل اسم مع شرح لغوي وآية أو حديث يدل عليه
• الأسماء مرتبة ومصنّفة للتصفح السهل
• 💡 ردّد اسماً في اليوم وتقرّب به من الله`,

  '/reciters': `القراء وتشغيل التلاوة 🎙️

• اختار القارئ من القائمة
• اختار السورة ثم اضغط تشغيل ▶
• المشغّل الصغير يظهر أسفل الشاشة
• التلاوة تشتغل في الخلفية 🎵
• زر ⬇️ يحمّل السورة للاستماع بلا إنترنت`,

  '/radio': `الإذاعات الإسلامية المباشرة 📻

• اضغط على أي إذاعة لبدء البث فوراً
• البث يشتغل في الخلفية مع المشغّل الصغير
• اضغط مرة تانية لإيقاف البث
• 📡 يحتاج اتصال إنترنت جيد للبث`,

  '/qibla': `بوصلة القبلة 🧭

• امسك الجهاز أفقياً وحرّكه ببطء
• السهم الذهبي يشير نحو الكعبة المشرفة
• لو البوصلة غير دقيقة: حرّك الجهاز بشكل رقم 8 في الهواء
• زر 🔄 لإعادة معايرة البوصلة
• زر 📍 لإعادة تحديد موقعك الجغرافي`,

  '/hadith': `أحاديث النبي ﷺ من الكتب الستة 📜

• اختار أي كتاب لتصفّح أحاديثه
  (البخاري، مسلم، أبو داود، الترمذي، النسائي، ابن ماجه)
• تبويب "البحث": ابحث في كل الأحاديث دفعة واحدة
• اضغط على أي حديث لنسخه أو مشاركته
• كل الأحاديث محفوظة بلا إنترنت 📴`,

  '/history': `التاريخ الإسلامي 🕌

• الأحداث مرتبة زمنياً من فجر الإسلام لليوم
• كل حدث فيه: التاريخ الهجري والميلادي + التفاصيل
• فلتر حسب الفئة: خلفاء / معارك / علماء / حضارة
• اضغط على أي حدث لقراءة قصته كاملة`,

  '/prophets': `قصص الأنبياء عليهم السلام 🌟

• من سيدنا آدم عليه السلام حتى محمد ﷺ
• كل نبي بقصته الكاملة مع العبر والدروس
• النصوص مستخرجة من القرآن الكريم والتفاسير
• 💡 اقرأ قصة في اليوم وتدبّر فيها`,

  '/quizzes': `اختبار المعلومات الإسلامية 🎯

• اختار تصنيفاً: قرآن / حديث / تاريخ / فقه / سيرة
• داخل كل تصنيف: اختار الموضوع ثم المستوى
• المستويات: سهل — متوسط — صعب
• كل اختبار = 20 سؤال — مفيش وقت محدد
• في النهاية تشوف إجاباتك الصح والغلط`,

  '/sunnah': `السنن النبوية اليومية ☀️

التصنيفات المتاحة:
• 🌿 عام • 🕌 المسجد • 📿 الأذكار
• 🌙 النوم • ✈️ السفر

اضغط على أي سنة لتوسيعها وقراءة:
الحديث كاملاً + الشرح + فضل الالتزام بها`,

  '/tv': `التلفزيون الإسلامي 📺

• اضغط على أي قناة لمشاهدة البث المباشر
• يعمل في وضع ملء الشاشة تلقائياً
• 📡 يحتاج اتصال إنترنت مستقر`,

  '/voice-comparison': `مقارنة أصوات القراء 🎙️

المقارنة في ٣ خطوات:
١. اختار من ٢ إلى ٦ قراء من قائمة ٢٩ قارئاً
٢. اختار السورة ونطاق الآيات (من آية — إلى آية)
٣. اضغط ▶ على أي قارئ لتسمع تلاوته

• التلاوة تشتغل آية بآية تلقائياً حتى النهاية
• قارن المرتّل بالمجوّد بين القراء المختلفين
• الكل من عبد الباسط للعفاسي والسديس وغيرهم`,

  '/hifz-test': `اختبار الحفظ 🧠

• اختار السورة أو الأجزاء التي حفظتها
• التطبيق يعطيك بداية الآية وأنت تكملها
• ✅ كل إجابة صح = نقطة / ❌ خطأ = يظهر الصح
• ابدأ بجزء عمّ إذا كنت مبتدئاً
• الاختبار اليومي هو سر الثبات على الحفظ`,

  '/speed-reader': `القراءة السريعة للقرآن ⚡

• التطبيق يعرض الآيات بإيقاع منتظم
• زر + / − لضبط سرعة العرض
• مفيد جداً لمن يريد ختم القرآن بسرعة
• السرعة المثلى: ما تفهم معها وتتدبّر`,
};

/* ─────────────────────────────────────────────────────────────
   الـ Component الرئيسي
───────────────────────────────────────────────────────────── */
export function TutorialMascot() {
  const [location] = useLocation();
  const { showTutorial, hide, visible, message } = useTutorial();

  useEffect(() => {
    const msg = ROUTE_MESSAGES[location];
    if (msg) {
      const t = setTimeout(() => showTutorial('route:' + location, msg), 800);
      return () => clearTimeout(t);
    }
  }, [location, showTutorial]);

  const lines   = message.split('\n');
  const title   = lines[0] ?? '';
  const body    = lines.slice(1).join('\n').trim();

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* tap-anywhere overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[9997]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hide}
          />

          {/* mascot (left) + bubble (right) */}
          <motion.div
            key="mascot-wrap"
            className="fixed z-[9998] flex flex-row items-end pointer-events-none"
            style={{ bottom: 72, left: 0 }}
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* ── Mascot ── */}
            <motion.img
              src="/mascot.png"
              alt="مرشد نور"
              className="flex-shrink-0 select-none"
              style={{
                width: 138,
                height: 'auto',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.28))',
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            />

            {/* ── Bubble ── */}
            <motion.div
              className="relative pointer-events-auto"
              style={{ marginBottom: 52, marginLeft: -2, maxWidth: 248 }}
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.82, opacity: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 340, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              {/* left-pointing tail (toward mascot hand) */}
              <div
                className="absolute"
                style={{
                  left: -11,
                  bottom: 34,
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderRight: '12px solid rgba(193,154,107,0.5)',
                }}
              />
              <div
                className="absolute"
                style={{
                  left: -9,
                  bottom: 35,
                  width: 0,
                  height: 0,
                  borderTop: '9px solid transparent',
                  borderBottom: '9px solid transparent',
                  borderRight: '11px solid #fffef9',
                }}
              />

              {/* bubble body */}
              <div
                className="rounded-2xl px-4 pt-3 pb-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(150deg, #fffef9 0%, #fef3d6 100%)',
                  border: '1.5px solid rgba(193,154,107,0.45)',
                  boxShadow: '0 12px 40px rgba(193,154,107,0.22), 0 2px 8px rgba(0,0,0,0.07)',
                }}
              >
                {/* shimmer accent */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at top left, rgba(255,235,150,0.2) 0%, transparent 60%)',
                  }}
                />

                {/* title */}
                <p
                  className="font-black text-[13px] leading-snug mb-1.5 relative"
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
                    className="text-[11px] leading-[1.8] whitespace-pre-line relative"
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
                  className="text-[9px] mt-2 opacity-40 text-center relative"
                  style={{ fontFamily: '"Tajawal", sans-serif', color: '#8a6030' }}
                >
                  اضغط في أي مكان للمتابعة
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
