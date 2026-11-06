import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Lightbulb, BookOpen, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, ChipTabs, GoldBadge, SkeletonList, EmptyState, FooterAyah, EightStar, arNum } from '@/components/noor/kit';
import { normalizeArabic } from '@/lib/arabic-utils';
import { cn } from '@/lib/utils';

type ProphetMeta = { id: string; name: string; title: string; order: number; color: string; quranCount: number };
type ProphetEvent = { id: number; prophet: string; title: string; text: string };

/* Lessons drawn from the Quranic narratives of each prophet */
const LESSONS: Record<string, string[]> = {
  adam: ['التوبة الصادقة تمحو الذنب، فالله يقبل من رجع إليه', 'الكِبر والحسد أول معصية عُصي الله بها', 'فضل العلم؛ فقد كرّم الله آدم بتعليمه الأسماء كلها'],
  idris: ['الصدق والعلم رفعة في الدنيا والآخرة', 'الصبر على الطاعة طريق إلى المكانة العلية'],
  nuh: ['الصبر الطويل في الدعوة إلى الله دون يأس', 'النجاة بالإيمان والعمل لا بالنسب والقرابة', 'الأخذ بالأسباب مع التوكل كما صنع السفينة'],
  hud: ['القوة المادية لا تغني عن الإيمان شيئاً', 'الاستغفار سبب لنزول الخير والقوة'],
  saleh: ['آيات الله نعمة يجب تعظيمها لا الاعتداء عليها', 'عاقبة الطغيان والجحود وخيمة'],
  ibrahim: ['التوحيد الخالص والتسليم الكامل لأمر الله', 'اليقين بالله في أشد المواقف كالإلقاء في النار', 'بر الأبناء وطاعتهم لله كما في قصة إسماعيل'],
  lut: ['إنكار المنكر واجب وإن كثر فاعلوه', 'الطهارة والعفة سبيل النجاة'],
  ismail: ['الاستجابة لأمر الله والصبر على البلاء', 'بر الوالدين وصدق الوعد'],
  ishaq: ['البشارة من الله تأتي بعد الصبر', 'الذرية الصالحة نعمة تستحق الشكر'],
  yaqub: ['الصبر الجميل عند المصيبة', 'حسن الظن بالله وعدم اليأس من روحه'],
  yusuf: ['الصبر على البلاء يعقبه التمكين', 'العفة ومراقبة الله في السر', 'العفو عند المقدرة والإحسان إلى من أساء'],
  ayyub: ['الصبر على المرض والابتلاء مع دوام الذكر', 'الدعاء بأدب: «أني مسني الضر وأنت أرحم الراحمين»'],
  shuayb: ['الأمانة في البيع والوفاء في الكيل والميزان', 'الإصلاح ما استطعت مع التوكل على الله'],
  musa: ['الثقة بالله عند الشدائد: «كلا إن معي ربي سيهدين»', 'مواجهة الظلم بالحق والحكمة', 'طلب العلم والتواضع له كما في قصته مع الخضر'],
  harun: ['التعاون على البر والتقوى وسند الأخ لأخيه', 'الحلم والحكمة في معالجة الفتن'],
  dhulkifl: ['الوفاء بالعهد والصبر على القيام بالحق'],
  dawud: ['الإنابة والرجوع إلى الله', 'فضل العمل باليد والأكل من كسبها', 'الحكم بالعدل بين الناس'],
  sulayman: ['شكر النعمة: «هذا من فضل ربي ليبلوني أأشكر أم أكفر»', 'الحكمة في القيادة والعدل مع الرعية'],
  ilyas: ['الثبات على التوحيد ومواجهة عبادة الأوثان'],
  alyasa: ['الاستمرار في حمل رسالة الحق بعد السابقين'],
  yunus: ['لا ملجأ من الله إلا إليه', 'فضل التسبيح والدعاء في الكرب: «لا إله إلا أنت سبحانك إني كنت من الظالمين»'],
  zakariyya: ['الإلحاح في الدعاء وعدم اليأس مهما طال الزمن', 'الدعاء الخفي من آداب الطلب'],
  yahya: ['البر بالوالدين والقوة في الحق منذ الصغر', 'الحنان والزكاة والتقوى صفات أهل الصلاح'],
  isa: ['قدرة الله المطلقة في الخلق', 'الرحمة والزهد والدعوة بالحسنى', 'بشارته بالنبي محمد ﷺ'],
};
const GENERIC_LESSONS = ['الصبر والثقة بالله في كل حال', 'الدعوة إلى الله بالحكمة والموعظة الحسنة', 'الأنبياء قدوتنا في الأخلاق والعبادة'];

const CATEGORY_OF: Record<string, string> = {
  adam: 'بداية البشرية', idris: 'بداية البشرية', nuh: 'بداية البشرية',
  hud: 'الأمم البائدة', saleh: 'الأمم البائدة', shuayb: 'الأمم البائدة', lut: 'الأمم البائدة',
  ibrahim: 'آل إبراهيم', ismail: 'آل إبراهيم', ishaq: 'آل إبراهيم', yaqub: 'آل إبراهيم', yusuf: 'آل إبراهيم',
  ayyub: 'الصبر والدعوة', dhulkifl: 'الصبر والدعوة', yunus: 'الصبر والدعوة', ilyas: 'الصبر والدعوة', alyasa: 'الصبر والدعوة',
  musa: 'أنبياء بني إسرائيل', harun: 'أنبياء بني إسرائيل', dawud: 'أنبياء بني إسرائيل', sulayman: 'أنبياء بني إسرائيل',
  zakariyya: 'أنبياء بني إسرائيل', yahya: 'أنبياء بني إسرائيل', isa: 'أنبياء بني إسرائيل',
};
function storyCategory(id: string): string { return CATEGORY_OF[id] ?? 'قصص الأنبياء'; }

function StoryReader({ prophet, onClose }: { prophet: ProphetMeta; onClose: () => void }) {
  const [events, setEvents] = useState<ProphetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [view, setView] = useState<'read' | 'chapters' | 'lessons'>('read');
  const [search, setSearch] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/prophet-${prophet.id}.json`)
      .then(r => r.json())
      .then((d: ProphetEvent[]) => { setEvents(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [prophet.id]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [chapter, view]);

  const lessons = LESSONS[prophet.id] ?? GENERIC_LESSONS;
  const q = normalizeArabic(search.trim());
  const matches = q ? events.map((e, i) => ({ e, i })).filter(({ e }) => normalizeArabic(e.title + ' ' + e.text).includes(q)) : [];
  const cur = events[chapter];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" dir="rtl">
      <PageHeader title={`قصة ${prophet.name} عليه السلام`} subtitle={`${prophet.title} · ذُكر في القرآن ${arNum(prophet.quranCount)} مرة`} back={onClose} icon="star">
        <ChipTabs<'read' | 'chapters' | 'lessons'>
          value={view}
          onChange={setView}
          items={[
            { id: 'read', label: 'القراءة', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'chapters', label: `الفصول (${arNum(events.length)})`, icon: <ListOrdered className="w-4 h-4" /> },
            { id: 'lessons', label: 'العِبر والدروس', icon: <Lightbulb className="w-4 h-4" /> },
          ]}
        />
      </PageHeader>

      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 pb-32">
          {loading && <SkeletonList rows={3} h="h-32" />}

          {!loading && view === 'read' && cur && (
            <AnimatePresence mode="wait">
              <motion.article key={chapter} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                className="noor-card rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <EightStar n={chapter + 1} size={40} active />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">الفصل {arNum(chapter + 1)} من {arNum(events.length)}</p>
                    <h2 className="font-bold text-lg text-primary leading-snug">{cur.title}</h2>
                  </div>
                </div>
                <div className="hairline-gold mb-4" />
                <p className="font-serif text-[1.08rem] leading-[2.2] text-foreground/90 whitespace-pre-line">{cur.text}</p>
              </motion.article>
            </AnimatePresence>
          )}

          {!loading && view === 'chapters' && (
            <>
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في فصول القصة..." className="noor-input" />
                {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"><X className="w-4 h-4" /></button>}
              </div>
              <ol className="relative border-r-2 border-primary/20 mr-4 space-y-3">
                {(q ? matches : events.map((e, i) => ({ e, i }))).map(({ e, i }) => (
                  <li key={e.id} className="relative pr-6">
                    <span className={cn('absolute -right-[9px] top-4 w-4 h-4 rounded-full border-2', i === chapter ? 'bg-gradient-gold border-primary' : 'bg-background border-primary/40')} />
                    <button onClick={() => { setChapter(i); setView('read'); }} className={cn('press w-full text-right noor-card rounded-2xl p-3.5', i === chapter && 'noor-card-active')}>
                      <p className="text-[11px] text-muted-foreground">الفصل {arNum(i + 1)}</p>
                      <p className="font-bold text-sm text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.text.slice(0, 140)}</p>
                    </button>
                  </li>
                ))}
              </ol>
              {q && matches.length === 0 && <EmptyState title="لا توجد نتائج" icon="star" />}
            </>
          )}

          {!loading && view === 'lessons' && (
            <div className="space-y-3">
              <div className="noor-card-hero rounded-3xl p-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 noor-pattern" />
                <Lightbulb className="w-8 h-8 text-primary mx-auto mb-2 relative" />
                <p className="relative font-bold text-foreground">عِبر ودروس مستفادة</p>
                <p className="relative text-xs text-muted-foreground mt-1">من قصة {prophet.name} عليه السلام</p>
              </div>
              {lessons.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="noor-card rounded-2xl p-4 flex items-start gap-3">
                  <EightStar n={i + 1} size={32} />
                  <p className="flex-1 text-[15px] leading-relaxed text-foreground/90">{l}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && view === 'read' && events.length > 0 && (
        <div className="flex-shrink-0 px-4 pt-3 border-t border-primary/10 glass" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-lg mx-auto">
            <div className="h-1 rounded-full bg-primary/10 overflow-hidden mb-3">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${((chapter + 1) / events.length) * 100}%`, marginRight: 0 }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setChapter(c => Math.max(0, c - 1))} disabled={chapter === 0}
                className="press w-14 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => (chapter < events.length - 1 ? setChapter(c => c + 1) : setView('lessons'))}
                className="press flex-1 h-12 rounded-2xl noor-btn-gold text-sm">
                {chapter < events.length - 1 ? `التالي: ${events[chapter + 1]?.title ?? ''}` : 'العِبر والدروس'}
              </button>
              <button onClick={() => setChapter(c => Math.min(events.length - 1, c + 1))} disabled={chapter >= events.length - 1}
                className="press w-14 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center disabled:opacity-30">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProphetStories() {
  const [prophets, setProphets] = useState<ProphetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<ProphetMeta | null>(null);
  const [filter, setFilter] = useState('الكل');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/prophets-meta.json')
      .then(r => r.json())
      .then((d: ProphetMeta[]) => { setProphets([...d].sort((a, b) => a.order - b.order)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['الكل', ...Array.from(new Set(prophets.map(p => storyCategory(p.id))))], [prophets]);
  const q = normalizeArabic(search.trim());
  const shown = prophets.filter(p => (filter === 'الكل' || storyCategory(p.id) === filter) && (!q || normalizeArabic(p.name + p.title).includes(q)));

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <PageHeader title="قصص الأنبياء" subtitle="ابن كثير · تحقيق د. مصطفى عبد الواحد" icon="star">
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن نبي..." className="noor-input" />
          {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"><X className="w-4 h-4" /></button>}
        </div>
        <ChipTabs items={categories.map(c => ({ id: c, label: c }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Horizontal interactive timeline */}
        {!loading && prophets.length > 0 && (
          <div className="no-scrollbar -mx-4 px-4 overflow-x-auto mb-6">
            <div className="relative flex items-start gap-1 min-w-max pt-2 pb-1">
              <div className="absolute top-[26px] right-0 left-0 h-[2px] bg-gradient-to-l from-primary/60 via-primary/30 to-primary/5" />
              {prophets.map(p => (
                <button key={p.id} onClick={() => setOpen(p)} className="press relative flex flex-col items-center w-16">
                  <span className="relative z-10 w-12 h-12 rounded-full noor-emerald-orb flex items-center justify-center">
                    <span className="font-quran text-sm text-gold-gradient leading-none">{p.name}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1.5">{arNum(p.order)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <SkeletonList rows={5} h="h-24" />}
        {!loading && shown.length === 0 && <EmptyState title="لا توجد نتائج" />}

        <div className="grid grid-cols-1 gap-3">
          {shown.map((p, i) => (
            <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
              onClick={() => setOpen(p)}
              className="press relative w-full text-right noor-card rounded-3xl p-4 flex items-center gap-4 overflow-hidden">
              <div className="relative w-16 h-16 rounded-2xl noor-card-hero flex items-center justify-center flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 noor-pattern" />
                <span className="relative font-quran text-xl text-gold-gradient">{p.name}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-foreground">{p.name} <span className="text-primary text-sm">عليه السلام</span></p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <GoldBadge>{storyCategory(p.id)}</GoldBadge>
                  <GoldBadge tone="emerald">ذُكر {arNum(p.quranCount)} مرة</GoldBadge>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-primary/50 flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        <FooterAyah text="لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِّأُولِي الْأَلْبَابِ" source="يوسف: ١١١" />
      </div>

      {open && <StoryReader prophet={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
