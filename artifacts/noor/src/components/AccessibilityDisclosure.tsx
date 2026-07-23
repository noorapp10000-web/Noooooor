import { ShieldCheck } from 'lucide-react';

export const ACCESSIBILITY_DISCLOSURE_RESPONSE_KEY =
  'noor_accessibility_disclosure_v2_response';

interface AccessibilityDisclosureProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function AccessibilityDisclosure({
  onAccept,
  onDecline,
}: AccessibilityDisclosureProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-disclosure-title"
      aria-describedby="accessibility-disclosure-description"
      dir="rtl"
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-5"
      style={{ background: 'rgba(0,0,0,0.72)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        style={{ color: '#1a1a1a', fontFamily: '"Tajawal", sans-serif' }}
      >
        <div className="mb-4 flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(145deg,#C19A6B,#8B5E3C)' }}
          >
            <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
        </div>

        <h2
          id="accessibility-disclosure-title"
          className="mb-2 text-center text-xl font-bold"
        >
          إفصاح استخدام خدمة إمكانية الوصول
        </h2>

        <p className="mb-4 text-center text-sm font-bold text-[#8B5E3C]">
          خدمة اختيارية لتشغيل ميزة «حارس أوقات الصلاة»
        </p>

        <div
          id="accessibility-disclosure-description"
          className="space-y-3 text-sm leading-7 text-[#333]"
        >
          <p>
            يصل تطبيق <strong>نور</strong> عبر خدمة إمكانية الوصول
            (AccessibilityService) إلى <strong>اسم وهوية التطبيق الظاهر على الشاشة</strong>.
          </p>
          <p>
            تُستخدم هذه المعلومة لحظيًا ومحليًا فقط لمعرفة أنك فتحت تطبيقًا آخر
            أثناء وقت الصلاة، ثم عرض شاشة تذكير الصلاة.
          </p>

          <div className="rounded-2xl bg-[#F7F0E7] p-4 text-[13px] leading-7 text-[#6F492F]">
            <p>• لا يقرأ نور محتوى التطبيقات أو النصوص أو كلمات المرور.</p>
            <p>• لا يحفظ أسماء التطبيقات التي تفتحها.</p>
            <p>• لا يرسل أو يشارك هذه المعلومة مع نور أو أي جهة أخرى.</p>
            <p>• يمكنك إيقاف الخدمة في أي وقت من إعدادات الجهاز.</p>
          </div>

          <p className="text-xs leading-6 text-[#666]">
            لن تُفتح إعدادات إمكانية الوصول ولن تعمل هذه الميزة إلا إذا اخترت
            «أوافق على الوصول والمتابعة».
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-xl border border-[#D8D8D8] bg-[#F7F7F7] px-3 py-3 text-sm font-bold text-[#444]"
          >
            لا أوافق
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-[1.35] rounded-xl px-3 py-3 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(145deg,#C19A6B,#8B5E3C)' }}
          >
            أوافق على الوصول والمتابعة
          </button>
        </div>
      </div>
    </div>
  );
}
