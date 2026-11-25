import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useTutorial } from './TutorialMascotContext';

function getMascotSrc(): string {
  try {
    const uid = localStorage.getItem('noor_uid');
    if (!uid) return '/mascot.png';
    const raw = localStorage.getItem(`noor_rtdb_cache_${uid}`);
    if (!raw) return '/mascot.png';
    const data = JSON.parse(raw) as { profile?: { gender?: string } };
    return data?.profile?.gender === 'female' ? '/mascot-female.png' : '/mascot.png';
  } catch {
    return '/mascot.png';
  }
}

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

  '/more': `صفحة اكتشف ✨
كل مميزات نور مقسّمة لأربعة أقسام:
• 🕌 العبادة — الصلاة، الوضوء، القبلة، السنن
• 📖 القرآن — القرّاء، اختبار الحفظ، التدبّر، الأسماء الحسنى
• 📚 العلم — الأحاديث، قصص الأنبياء، التاريخ، المسابقات
• 📻 استمع وشاهد — الإذاعات والقنوات المباشرة
🔎 استخدم خانة البحث لتصل لأي ميزة فورًا`,

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

  '/learn-prayer': `تعلم الصلاة خطوة بخطوة 🕌

• الصلاة 14 خطوة من النية حتى التسليم
• كل خطوة فيها:
  — النص العربي الكامل بالتشكيل
  — النطق بالحروف اللاتينية
  — شرح الحركة والوضعية
• الأحمر = ركن (واجب) / الذهبي = سنة
• اضغط على أي خطوة في القائمة للقفز إليها`,

  '/wudu': `دليل الوضوء الكامل 💧

• الوضوء 10 خطوات مرتّبة
• كل خطوة محددة بـ:
  — فرض (لازم) أو سنة (مستحب) أو مستحب
  — عدد مرات الغسل
  — نقاط عملية للتنفيذ الصحيح
• في الأسفل: دعاء الفراغ من الوضوء كاملاً`,
};

/* ─────────────────────────────────────────────────────────────
   الـ Component الرئيسي
───────────────────────────────────────────────────────────── */
export function TutorialMascot() {
  const [location] = useLocation();
  const { showTutorial, hide, visible, message } = useTutorial();
  const [mascotSrc, setMascotSrc] = useState(getMascotSrc);

  useEffect(() => {
    setMascotSrc(getMascotSrc());
  }, [location]);

  useEffect(() => {
    const msg = ROUTE_MESSAGES[location];
    if (msg) {
      const t = setTimeout(() => showTutorial('route:' + location, msg), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location, showTutorial]);

  const lines   = message.split('\n');
  const title   = (lines[0] ?? '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
  const body    = lines.slice(1).join('\n').trim();
  const [open, setOpen] = useState(false);
  const enabled = typeof localStorage !== 'undefined' && localStorage.getItem('noor_tips_enabled') !== '0';

  // Tip auto-hides after 7s unless the user opened it
  useEffect(() => {
    setOpen(false);
    if (!visible) return;
    const t = setTimeout(() => { if (!open) hide(); }, 7000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message]);

  if (!enabled) return null;

  const ff = '"IBM Plex Sans Arabic", "Tajawal", sans-serif';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tip"
          className="fixed z-[9998] pointer-events-auto"
          style={{ bottom: 96, left: 12, right: 12, maxWidth: 480, marginInline: 'auto' }}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          dir="rtl"
        >
          <div className="nr-glass rounded-3xl overflow-hidden" style={{ border: '1px solid hsl(38 62% 60% / .35)' }}>
            <div className="flex items-center gap-3 p-2.5 pe-3" onClick={() => body && setOpen(o => !o)}>
              <div className="flex-shrink-0 w-11 h-11 overflow-hidden" style={{ borderRadius: '999px 999px 12px 12px / 22px 22px 12px 12px', background: 'linear-gradient(180deg,#1d6b56,#0b2a24)', border: '1px solid hsl(38 62% 60% / .4)' }}>
                <img src={mascotSrc} alt="مرشد نور" className="w-full h-full object-cover object-top" draggable={false} />
              </div>
              <p className="flex-1 min-w-0 text-[12.5px] font-bold truncate" style={{ fontFamily: ff, color: '#F2E3C2' }}>{title}</p>
              {body && <span className="text-[11px] text-primary font-semibold">{open ? 'إخفاء' : 'التفاصيل'}</span>}
              <button aria-label="إغلاق" onClick={e => { e.stopPropagation(); hide(); }} className="w-7 h-7 rounded-full flex items-center justify-center text-[13px]" style={{ background: 'hsl(0 0% 100% / .08)', color: '#C9A979' }}>✕</button>
            </div>
            {open && body && (
              <div className="px-4 pb-3 max-h-[38vh] overflow-y-auto">
                <p className="text-[11.5px] leading-[1.9] whitespace-pre-line" style={{ fontFamily: ff, color: 'rgba(242,234,216,.85)' }}>{body}</p>
                <button
                  onClick={() => { localStorage.setItem('noor_tips_enabled', '0'); hide(); }}
                  className="mt-2 text-[11px] underline" style={{ color: '#C9A979', fontFamily: ff }}
                >إيقاف النصائح نهائيًا (يمكن تفعيلها من الإعدادات)</button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
