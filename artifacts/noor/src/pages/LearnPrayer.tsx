import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, ChipTabs, GoldBadge, NoorImg, arNum } from '@/components/noor/kit';
import { StepTimeline, StepCard, StepControls, RulingList, KindBadge, type GuideStep, type StepKind } from '@/components/noor/StepGuide';
import { vibrateLight } from '@/lib/haptics';

/* ── Prayer time SVG icons ───────────────────────────────────── */
function FajrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 5C15.5 5 13.2 5.8 11.3 7.1C14.7 8.6 17 12 17 16C17 20 14.7 23.4 11.3 24.9C13.2 26.2 15.5 27 18 27C24.1 27 29 22.1 29 16C29 9.9 24.1 5 18 5Z" fill="rgba(255,255,255,0.95)"/>
      <circle cx="26" cy="8" r="1.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="30" cy="13" r="1" fill="rgba(255,255,255,0.55)"/>
      <circle cx="24" cy="5.5" r="0.9" fill="rgba(255,255,255,0.6)"/>
      <line x1="4" y1="31" x2="32" y2="31" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DuhrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="8" fill="rgba(255,255,255,0.95)"/>
      <line x1="18" y1="4" x2="18" y2="8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="28" x2="18" y2="32" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="8" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8.7" y1="8.7" x2="11.5" y2="11.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24.5" y1="24.5" x2="27.3" y2="27.3" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27.3" y1="8.7" x2="24.5" y2="11.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11.5" y1="24.5" x2="8.7" y2="27.3" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function AsrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="17" r="7" fill="rgba(255,255,255,0.95)"/>
      <line x1="18" y1="4" x2="18" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="17" x2="32" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8.7" y1="7.7" x2="11.5" y2="10.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27.3" y1="7.7" x2="24.5" y2="10.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="29" x2="32" y2="29" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 29 Q18 20 25 29" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
    </svg>
  );
}

function MaghribIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <clipPath id="maghrib-clip">
        <rect x="0" y="0" width="36" height="27"/>
      </clipPath>
      <circle cx="18" cy="27" r="10" fill="rgba(255,255,255,0.95)" clipPath="url(#maghrib-clip)"/>
      <line x1="18" y1="4" x2="18" y2="9" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="9" y2="18" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7.5" y1="8.5" x2="11" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28.5" y1="8.5" x2="25" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="27" x2="34" y2="27" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IshaIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="9" fill="rgba(255,255,255,0.9)"/>
      <circle cx="22" cy="14" r="5.5" fill="rgba(255,255,255,0.12)" stroke="none"/>
      <path d="M22 13C20.3 13 18.9 14.1 18.4 15.6C19.1 15.2 19.9 15.2 20.6 15.6C21.9 14.5 21.9 12.7 22 13Z" fill="rgba(0,0,0,0.2)"/>
      <circle cx="28" cy="8" r="1.3" fill="rgba(255,255,255,0.75)"/>
      <circle cx="9" cy="7" r="0.9" fill="rgba(255,255,255,0.6)"/>
      <circle cx="30" cy="22" r="1" fill="rgba(255,255,255,0.55)"/>
      <circle cx="6" cy="26" r="0.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="26" cy="28" r="1.1" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

/* ── Prayer steps data ─────────────────────────────────────── */
interface PrayerStep {
  id: number;
  title: string;
  position: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  note?: string;
  repetitions?: number;
  img: string;
  color: string;
}

const PRAYER_STEPS: PrayerStep[] = [
  {
    id: 1, title: 'النية', position: 'قيام',
    arabic: 'نويتُ أن أصلي',
    transliteration: 'Nawaytu an uṣallī',
    meaning: 'أنوي الصلاة بقلبك — ولا تُلفظ النية',
    note: 'النية محلها القلب فقط، ولا يشترط التلفظ بها',
    img: '/images/prayer/step-01-niyyah.webp', color: '#2d6a4f',
  },
  {
    id: 2, title: 'تكبيرة الإحرام', position: 'قيام — يرفع يديه',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    meaning: 'الله أكبر',
    note: 'يرفع يديه حذو منكبيه أو شحمتي أذنيه عند التكبير',
    img: '/images/prayer/step-02-takbir.webp', color: '#1F4A5A',
  },
  {
    id: 3, title: 'دعاء الاستفتاح', position: 'قيام — سنة',
    arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
    transliteration: 'Subḥānaka Allāhumma wa biḥamdik, wa tabāraka ismuk, wa taʿālā jadduk, wa lā ilāha ghayruk',
    meaning: 'سبحانك اللهم وبحمدك، وتبارك اسمك، وتعالى جدك، ولا إله غيرك',
    note: 'دعاء مستحب في أول كل صلاة — يُقرأ في السر',
    img: '/images/prayer/step-03-istiftah.webp', color: '#1F6B57',
  },
  {
    id: 4, title: 'التعوذ والبسملة', position: 'قيام',
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ۝ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Aʿūdhu billāhi min ash-shayṭān ir-rajīm · Bismillāh ir-Raḥmān ir-Raḥīm',
    meaning: 'أعوذ بالله من الشيطان الرجيم — بسم الله الرحمن الرحيم',
    note: 'يُقرأ سراً في الصلاة الجهرية وسراً في السرية',
    img: '/images/prayer/step-04-basmala.webp', color: '#7a3a1e',
  },
  {
    id: 5, title: 'قراءة الفاتحة', position: 'قيام — ركن',
    arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ مَٰلِكِ يَوْمِ ٱلدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ۝ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    transliteration: 'Al-ḥamdu lillāhi rabb il-ʿālamīn...',
    meaning: 'سورة الفاتحة كاملة — ركن من أركان الصلاة',
    note: 'لا صلاة لمن لم يقرأ بفاتحة الكتاب — ثم يقول: آمين',
    img: '/images/prayer/step-05-fatiha.webp', color: '#2d6a4f',
  },
  {
    id: 6, title: 'قراءة سورة قصيرة', position: 'قيام — سنة',
    arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
    transliteration: 'Qul huwa Allāhu aḥad...',
    meaning: 'سورة الإخلاص — مثال على السورة القصيرة',
    note: 'في الركعة الأولى والثانية فقط — يمكن قراءة أي سورة',
    img: '/images/prayer/step-06-surah.webp', color: '#1a5c5c',
  },
  {
    id: 7, title: 'الركوع', position: 'ركوع — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: 'Subḥāna Rabbiya al-ʿAẓīm',
    meaning: 'سبحان ربي العظيم',
    note: 'يكبّر عند الانحناء، ويضع يديه على ركبتيه، وتستوي ظهره',
    repetitions: 3,
    img: '/images/prayer/step-07-ruku.webp', color: '#1a5c5c',
  },
  {
    id: 8, title: 'الاعتدال من الركوع', position: 'قيام — ركن',
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا وَلَكَ الْحَمْدُ، حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    transliteration: 'Samiʿa Allāhu liman ḥamidah · Rabbanā wa laka al-ḥamd',
    meaning: 'سمع الله لمن حمده — ربنا ولك الحمد',
    note: 'يرفع من الركوع قائلاً «سمع الله لمن حمده» ثم يكمل الدعاء',
    img: '/images/prayer/step-08-itidal.webp', color: '#6b3a0f',
  },
  {
    id: 9, title: 'السجدة الأولى', position: 'سجود — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subḥāna Rabbiya al-Aʿlā',
    meaning: 'سبحان ربي الأعلى',
    note: 'يسجد على سبعة أعضاء: الجبهة+الأنف، الكفّان، الركبتان، أطراف القدمين',
    repetitions: 3,
    img: '/images/prayer/step-09-sujood1.webp', color: '#0F3D32',
  },
  {
    id: 10, title: 'الجلوس بين السجدتين', position: 'جلوس',
    arabic: 'رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي',
    transliteration: 'Rabb ighfir lī, Rabb ighfir lī',
    meaning: 'ربِّ اغفر لي',
    note: 'يجلس مفترشاً بين السجدتين ثم يسجد مرة ثانية',
    img: '/images/prayer/step-10-julus.webp', color: '#7a3a1e',
  },
  {
    id: 11, title: 'السجدة الثانية', position: 'سجود — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subḥāna Rabbiya al-Aʿlā',
    meaning: 'سبحان ربي الأعلى',
    note: 'ثم يقوم للركعة التالية مكبِّراً، ويفعل مثل ذلك في كل ركعة',
    repetitions: 3,
    img: '/images/prayer/step-11-sujood2.webp', color: '#0F3D32',
  },
  {
    id: 12, title: 'التشهد الأخير', position: 'جلوس — ركن',
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'At-taḥiyyātu lillāh waṣ-ṣalawātu waṭ-ṭayyibāt...',
    meaning: 'التحيات لله — يُرفع السبّابة عند الشهادة',
    note: 'في آخر ركعة يجلس جلسةً للتشهد ثم يُكمل الصلاة الإبراهيمية',
    img: '/images/prayer/step-12-tashahhud.webp', color: '#1e4d2b',
  },
  {
    id: 13, title: 'الصلاة الإبراهيمية', position: 'جلوس — بعد التشهد',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: 'Allāhumma ṣalli ʿalā Muḥammad wa ʿalā āli Muḥammad...',
    meaning: 'اللهم صلِّ على محمد وعلى آل محمد',
    note: 'ثم يتعوذ ويدعو بما شاء قبل التسليم',
    img: '/images/prayer/step-13-salawat.webp', color: '#0f3d2e',
  },
  {
    id: 14, title: 'التسليم', position: 'جلوس — ركن',
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    transliteration: 'As-salāmu ʿalaykum wa raḥmatullāh',
    meaning: 'السلام عليكم ورحمة الله',
    note: 'يلتفت يميناً ثم يساراً — وبهذا تنتهي الصلاة',
    img: '/images/prayer/step-14-tasleem.webp', color: '#5C3518',
  },
];

interface Prayer {
  name: string;
  rakaas: number;
  color: string;
  Icon: (props: { size?: number }) => React.ReactElement;
}

const PRAYERS: Prayer[] = [
  { name: 'الفجر',  rakaas: 2, color: '#1F4A5A', Icon: FajrIcon },
  { name: 'الظهر',  rakaas: 4, color: '#8B6340', Icon: DuhrIcon },
  { name: 'العصر',  rakaas: 4, color: '#7a3a1e', Icon: AsrIcon },
  { name: 'المغرب', rakaas: 3, color: '#6B3A2A', Icon: MaghribIcon },
  { name: 'العشاء', rakaas: 4, color: '#0C1C17', Icon: IshaIcon },
];


const STEPS: GuideStep[] = PRAYER_STEPS.map(s => ({
  id: s.id,
  title: s.title,
  subtitle: s.position.split(' — ')[0],
  kind: (s.position.includes('ركن') ? 'ركن' : s.position.includes('سنة') ? 'سنة' : undefined) as StepKind | undefined,
  arabic: s.arabic,
  transliteration: s.transliteration,
  meaning: s.meaning,
  note: s.note,
  repetitions: s.repetitions,
  img: s.img,
}));

const ARKAN = [
  { title: 'القيام مع القدرة', desc: 'في صلاة الفريضة' }, { title: 'تكبيرة الإحرام', desc: '«الله أكبر» لا يجزئ غيرها' },
  { title: 'قراءة الفاتحة', desc: 'في كل ركعة' }, { title: 'الركوع' }, { title: 'الرفع من الركوع' }, { title: 'الاعتدال قائماً' },
  { title: 'السجود على الأعضاء السبعة', desc: 'الجبهة مع الأنف، الكفان، الركبتان، أطراف القدمين' },
  { title: 'الرفع من السجود' }, { title: 'الجلوس بين السجدتين' }, { title: 'الطمأنينة في جميع الأركان' },
  { title: 'التشهد الأخير' }, { title: 'الجلوس للتشهد الأخير والتسليم' },
  { title: 'الصلاة على النبي ﷺ في التشهد الأخير' }, { title: 'الترتيب بين الأركان' }, { title: 'التسليم' },
];
const WAJIBAT = [
  { title: 'تكبيرات الانتقال', desc: 'جميع التكبيرات غير تكبيرة الإحرام' },
  { title: 'قول «سمع الله لمن حمده»', desc: 'للإمام والمنفرد' }, { title: 'قول «ربنا ولك الحمد»' },
  { title: '«سبحان ربي العظيم» مرة في الركوع' }, { title: '«سبحان ربي الأعلى» مرة في السجود' },
  { title: '«رب اغفر لي» بين السجدتين' }, { title: 'التشهد الأول' }, { title: 'الجلوس للتشهد الأول' },
];
const SUNAN = [
  { title: 'رفع اليدين', desc: 'عند تكبيرة الإحرام والركوع والرفع منه والقيام من التشهد الأول' },
  { title: 'وضع اليمنى على اليسرى', desc: 'على الصدر حال القيام' }, { title: 'النظر إلى موضع السجود' },
  { title: 'دعاء الاستفتاح' }, { title: 'التعوذ والبسملة' }, { title: 'التأمين بعد الفاتحة', desc: 'قول «آمين»' },
  { title: 'قراءة سورة بعد الفاتحة', desc: 'في الركعتين الأوليين' }, { title: 'الزيادة على تسبيحة واحدة', desc: 'في الركوع والسجود' },
  { title: 'الدعاء قبل التسليم' },
];
const MUBTILAT = [
  { title: 'ترك ركن أو شرط عمداً', desc: 'كترك الطهارة أو استقبال القبلة بلا عذر' }, { title: 'الكلام العمد', desc: 'بكلام الناس لغير مصلحة الصلاة' },
  { title: 'القهقهة', desc: 'الضحك بصوت' }, { title: 'الأكل والشرب عمداً' },
  { title: 'الحركة الكثيرة المتوالية', desc: 'لغير ضرورة' }, { title: 'انتقاض الوضوء أثناء الصلاة' },
  { title: 'كشف العورة عمداً' }, { title: 'زيادة ركن أو ركعة عمداً' },
];

type Tab = 'prayers' | 'arkan' | 'wajibat' | 'sunan' | 'mubtilat';

export function LearnPrayer() {
  const [tab, setTab] = useState<Tab>('prayers');
  const [selectedPrayer, setSelectedPrayer] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const total = STEPS.length;

  if (selectedPrayer === null) {
    return (
      <div className="min-h-screen pb-24" dir="rtl">
        <PageHeader title="تعلّم الصلاة" subtitle="صفة صلاة النبي ﷺ — دليل مصوّر خطوة بخطوة" icon="prayer">
          <ChipTabs<Tab> value={tab} onChange={setTab} items={[
            { id: 'prayers', label: 'الصلوات' }, { id: 'arkan', label: 'الأركان' }, { id: 'wajibat', label: 'الواجبات' },
            { id: 'sunan', label: 'السنن' }, { id: 'mubtilat', label: 'المبطلات' },
          ]} />
        </PageHeader>
        <div className="max-w-lg mx-auto px-4 pt-4">
          {tab === 'prayers' ? (
            <>
              <div className="noor-card-hero rounded-[28px] p-5 mb-5 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 noor-pattern" />
                <NoorImg name="prayer" size={64} className="relative" />
                <div className="relative">
                  <p className="font-black text-lg text-gold-gradient">«صلّوا كما رأيتموني أصلّي»</p>
                  <p className="text-xs text-muted-foreground mt-1">رواه البخاري — {arNum(total)} خطوة مصوّرة بالنص والتشكيل والشرح</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 px-1">اختر الصلاة — الخطوات واحدة وتتكرر بحسب عدد الركعات</p>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {PRAYERS.map((p, i) => (
                  <button key={p.name} onClick={() => { setSelectedPrayer(i); setStep(0); setDone(new Set()); }}
                    className="press noor-card rounded-3xl p-4 flex items-center gap-4 text-right">
                    <span className="w-12 h-12 rounded-2xl noor-gold-orb flex items-center justify-center"><p.Icon size={30} /></span>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-foreground">صلاة {p.name}</p>
                      <div className="flex gap-1 mt-1">{Array.from({ length: p.rakaas }).map((_, k) => <span key={k} className="w-5 h-1.5 rounded-full bg-gradient-gold" />)}</div>
                    </div>
                    <GoldBadge>{arNum(p.rakaas)} ركعات</GoldBadge>
                    <ChevronLeft className="w-5 h-5 text-primary/60" />
                  </button>
                ))}
              </div>
              <h3 className="font-bold text-primary mb-3 px-1">مراحل الصلاة</h3>
              <div className="flex flex-col gap-2">
                {STEPS.map((s, i) => (
                  <button key={s.id} onClick={() => { setSelectedPrayer(0); setStep(i); }} className="press noor-card rounded-2xl p-2.5 flex items-center gap-3 text-right">
                    <img src={s.img} alt="" className="w-11 h-11 rounded-xl object-cover object-top bg-secondary" />
                    <p className="flex-1 font-bold text-sm text-foreground">{arNum(i + 1)}. {s.title}</p>
                    <KindBadge kind={s.kind} />
                  </button>
                ))}
              </div>
            </>
          ) : tab === 'arkan' ? (
            <RulingList title="أركان الصلاة" intro="لا تصح الصلاة إلا بها، ولا تسقط عمداً ولا سهواً" items={ARKAN} />
          ) : tab === 'wajibat' ? (
            <RulingList title="واجبات الصلاة" intro="تبطل الصلاة بتركها عمداً، ويُجبر تركها سهواً بسجود السهو — على مذهب الحنابلة" items={WAJIBAT} tone="emerald" />
          ) : tab === 'sunan' ? (
            <RulingList title="سنن الصلاة" intro="يُثاب فاعلها ولا تبطل الصلاة بتركها" items={SUNAN} tone="emerald" />
          ) : (
            <RulingList title="مبطلات الصلاة" intro="ما يفسد الصلاة ويوجب إعادتها" items={MUBTILAT} tone="danger" />
          )}
        </div>
      </div>
    );
  }

  const prayer = PRAYERS[selectedPrayer];
  const current = STEPS[step];
  const next = () => {
    vibrateLight().catch(() => {});
    setDone(prev => new Set([...prev, step]));
    if (step < total - 1) setStep(s => s + 1); else setSelectedPrayer(null);
  };

  const handGuide = step === 11 ? (
    <div className="rounded-2xl p-4 mb-3 bg-primary/5 border border-primary/15">
      <p className="text-xs font-bold text-center mb-3 text-primary">وضع اليدين في التشهد</p>
      <div className="flex items-end justify-center gap-6">
                    {/* Right hand — fist with index finger extended ~45° */}
                    <div className="flex flex-col items-center gap-1">
                      <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
                        {/* Forearm */}
                        <rect x="28" y="58" width="24" height="28" rx="10" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        {/* Palm/fist body */}
                        <rect x="22" y="36" width="36" height="30" rx="12" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        {/* Thumb tucked on side */}
                        <path d="M22 50 Q14 48 14 42 Q14 37 20 37" stroke="#C8A070" strokeWidth="4" strokeLinecap="round" fill="none"/>
                        {/* Folded fingers hint (middle, ring, pinky) */}
                        <path d="M32 36 Q32 30 36 30" stroke="#C8A070" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M40 36 Q40 29 44 29" stroke="#C8A070" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M48 37 Q49 32 52 32" stroke="#C8A070" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                        {/* Index finger — extended at 45° upward-forward */}
                        <path d="M28 38 L14 18" stroke="#E8C9A0" strokeWidth="9" strokeLinecap="round"/>
                        <path d="M28 38 L14 18" stroke="#C8A070" strokeWidth="1.5" strokeLinecap="round"/>
                        {/* Fingertip */}
                        <circle cx="13" cy="17" r="4.5" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                      </svg>
                      <p className="text-[10px] font-bold text-center text-primary">
                        اليد اليمنى
                      </p>
                      <p className="text-[9px] text-center text-muted-foreground">
                        قبضة + سبابة ممتدة
                      </p>
                    </div>
                    {/* Left hand — flat open */}
                    <div className="flex flex-col items-center gap-1">
                      <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
                        {/* Forearm */}
                        <rect x="28" y="58" width="24" height="28" rx="10" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        {/* Palm flat */}
                        <rect x="18" y="28" width="44" height="32" rx="12" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        {/* Fingers extended flat */}
                        <rect x="20" y="14" width="8" height="16" rx="4" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        <rect x="31" y="11" width="8" height="19" rx="4" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        <rect x="42" y="12" width="8" height="18" rx="4" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        <rect x="52" y="15" width="7" height="15" rx="3.5" fill="#E8C9A0" stroke="#C8A070" strokeWidth="1.5"/>
                        {/* Thumb */}
                        <path d="M18 35 Q10 32 10 26 Q10 20 16 20" stroke="#C8A070" strokeWidth="4" strokeLinecap="round" fill="none"/>
                      </svg>
                      <p className="text-[10px] font-bold text-center text-primary">
                        اليد اليسرى
                      </p>
                      <p className="text-[9px] text-center text-muted-foreground">
                        مفتوحة مبسوطة
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-center mt-2 text-muted-foreground">كلتا اليدين على الفخذين — والسبابة اليمنى تُرفع عند التشهد</p>
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col h-[100dvh]" dir="rtl">
      <PageHeader title={`صلاة ${prayer.name}`} subtitle={`${arNum(prayer.rakaas)} ركعات · الخطوة ${arNum(step + 1)} من ${arNum(total)}`} back={() => setSelectedPrayer(null)} icon="prayer" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-6">
          <StepTimeline steps={STEPS} current={step} done={done} onSelect={setStep} />
          <div className="mt-3"><StepCard step={current} index={step} total={total} extra={handGuide} /></div>
        </div>
      </div>
      <StepControls index={step} total={total} done={done.has(step)}
        onPrev={() => setStep(s => Math.max(0, s - 1))} onSkip={() => setStep(s => Math.min(total - 1, s + 1))} onNext={next}
        nextLabel={step === total - 1 ? 'انتهت الصلاة ✓' : `التالي: ${STEPS[step + 1]?.title ?? ''}`} />
    </div>
  );
}
