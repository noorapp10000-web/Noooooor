import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, ChipTabs, ProgressRing, arNum } from '@/components/noor/kit';
import { StepTimeline, StepCard, StepControls, RulingList, type GuideStep } from '@/components/noor/StepGuide';
import { vibrateLight } from '@/lib/haptics';

const WUDU_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'النية والبسملة',
    subtitle: 'الخطوة الأولى',
    kind: 'سنة',
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
    kind: 'سنة',
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
    kind: 'سنة',
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
    kind: 'سنة',
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
    kind: 'فرض',
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
    kind: 'فرض',
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
    kind: 'فرض',
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
    kind: 'سنة',
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
    kind: 'فرض',
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
    kind: 'مستحب',
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

const FARAID = [
  { title: 'النية', desc: 'محلها القلب، وهي شرط لصحة الوضوء عند جمهور العلماء' },
  { title: 'غسل الوجه', desc: 'من منابت شعر الرأس إلى أسفل الذقن ومن الأذن إلى الأذن، ومنه المضمضة والاستنشاق عند الحنابلة' },
  { title: 'غسل اليدين إلى المرفقين', desc: 'مع إدخال المرفقين في الغسل' },
  { title: 'مسح الرأس', desc: '«وَامْسَحُوا بِرُءُوسِكُمْ» — ومنه الأذنان عند الحنابلة' },
  { title: 'غسل الرجلين إلى الكعبين', desc: 'مع إدخال الكعبين في الغسل' },
  { title: 'الترتيب', desc: 'كما ذكرت الأعضاء في آية المائدة' },
  { title: 'الموالاة', desc: 'ألا يؤخر غسل عضو حتى يجف الذي قبله — عند المالكية والحنابلة' },
];
const SUNAN = [
  { title: 'التسمية في أوله' }, { title: 'السواك' }, { title: 'غسل الكفين ثلاثاً في أوله' },
  { title: 'المبالغة في المضمضة والاستنشاق', desc: 'لغير الصائم' }, { title: 'تخليل اللحية الكثيفة والأصابع' },
  { title: 'التيامن', desc: 'البدء باليمين قبل الشمال' }, { title: 'الغسلة الثانية والثالثة' },
  { title: 'مسح الأذنين' }, { title: 'الدعاء بعد الوضوء', desc: 'أشهد أن لا إله إلا الله وحده لا شريك له وأشهد أن محمداً عبده ورسوله' },
  { title: 'صلاة ركعتين بعده' },
];
const NAWAQID = [
  { title: 'الخارج من السبيلين', desc: 'كالبول والغائط والريح' },
  { title: 'زوال العقل', desc: 'بنوم مستغرق أو إغماء أو سكر' },
  { title: 'مس الفرج باليد بلا حائل', desc: 'عند جمهور العلماء' },
  { title: 'أكل لحم الإبل', desc: 'عند الحنابلة لحديث جابر بن سمرة في صحيح مسلم' },
  { title: 'خروج النجاسة الكثيرة من البدن', desc: 'كالدم الكثير عند الحنفية والحنابلة' },
  { title: 'الردة عن الإسلام', desc: 'أعاذنا الله منها' },
];

type Tab = 'steps' | 'faraid' | 'sunan' | 'nawaqid';

export function WuduGuide() {
  const [tab, setTab] = useState<Tab>('steps');
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const total = WUDU_STEPS.length;
  const current = WUDU_STEPS[step];
  const allDone = completed.size === total;

  const markDone = () => {
    vibrateLight().catch(() => {});
    setCompleted(prev => new Set([...prev, step]));
    if (step < total - 1) setStep(s => s + 1);
  };

  return (
    <div className="flex flex-col h-[100dvh]" dir="rtl">
      <PageHeader title="دليل الوضوء" subtitle="صفة وضوء النبي ﷺ خطوة بخطوة" icon="wudu"
        right={<ProgressRing value={completed.size / total} size={42} stroke={4}><span className="text-[10px] font-bold text-primary">{arNum(completed.size)}/{arNum(total)}</span></ProgressRing>}>
        <ChipTabs<Tab> value={tab} onChange={setTab} items={[
          { id: 'steps', label: 'الخطوات' }, { id: 'faraid', label: 'الفرائض' }, { id: 'sunan', label: 'السنن' }, { id: 'nawaqid', label: 'النواقض' },
        ]} />
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-6">
          {tab === 'steps' ? (
            <>
              <StepTimeline steps={WUDU_STEPS} current={step} done={completed} onSelect={setStep} />
              <div className="mt-3"><StepCard step={current} index={step} total={total} /></div>
              {allDone && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-3xl p-4 text-center noor-card-hero">
                  <p className="font-bold text-gold-gradient text-lg">أتممت الوضوء — تقبّل الله منك</p>
                  <p className="text-xs text-muted-foreground mt-1">«من توضأ فأحسن الوضوء خرجت خطاياه من جسده» — رواه مسلم</p>
                </motion.div>
              )}
            </>
          ) : tab === 'faraid' ? (
            <RulingList title="فرائض الوضوء" intro="ما لا يصح الوضوء إلا به، وأصلها قوله تعالى في سورة المائدة: «إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ…»" items={FARAID} />
          ) : tab === 'sunan' ? (
            <RulingList title="سنن الوضوء" intro="ما يُثاب فاعله ولا يبطل الوضوء بتركه" items={SUNAN} tone="emerald" />
          ) : (
            <RulingList title="نواقض الوضوء" intro="ما يُبطل الوضوء ويوجب إعادته — مع اختلاف يسير بين المذاهب" items={NAWAQID} tone="danger" />
          )}
        </div>
      </div>

      {tab === 'steps' && (
        <StepControls index={step} total={total} done={completed.has(step)}
          onPrev={() => setStep(s => Math.max(0, s - 1))} onSkip={() => setStep(s => Math.min(total - 1, s + 1))} onNext={markDone}
          nextLabel={completed.has(step) ? 'تمّت' : step === total - 1 ? 'إنهاء الوضوء' : 'تمّت — التالي'} />
      )}
    </div>
  );
}
