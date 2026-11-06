import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Star, CheckCircle2, Circle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, ChipTabs, ProgressRing, SkeletonList, FooterAyah, GoldBadge, arNum } from '@/components/noor/kit';
import { getSunnahDone, toggleSunnahDone } from '@/lib/stats';
import { vibrateLight } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type SunnahItem = {
  id: string;
  title: string;
  hadith: string;
  source: string;
  description: string;
  reward: string;
};

type SunnahData = {
  categories: { id: string; label: string; icon: string }[];
  content: Record<string, Record<string, SunnahItem[]>>;
};

/* Forgotten (abandoned) sunnahs — authentic narrations with their sources */
const FORGOTTEN: SunnahItem[] = [
  { id: 'f-siwak', title: 'السواك عند كل صلاة', hadith: 'لولا أن أشق على أمتي لأمرتهم بالسواك عند كل صلاة', source: 'متفق عليه', description: 'استعمل السواك قبل كل صلاة وعند الوضوء وعند الاستيقاظ.', reward: 'مطهرة للفم مرضاة للرب' },
  { id: 'f-duha', title: 'صلاة الضحى', hadith: 'يصبح على كل سلامى من أحدكم صدقة… ويجزئ من ذلك ركعتان يركعهما من الضحى', source: 'رواه مسلم', description: 'صلِّ ركعتين أو أكثر بعد ارتفاع الشمس قيد رمح إلى قبيل الظهر.', reward: 'تجزئ عن صدقة كل مفاصل الجسد' },
  { id: 'f-wudu-rakaat', title: 'ركعتان بعد الوضوء', hadith: 'من توضأ نحو وضوئي هذا ثم صلى ركعتين لا يحدث فيهما نفسه غفر له ما تقدم من ذنبه', source: 'متفق عليه', description: 'بعد إتمام الوضوء صلِّ ركعتين بخشوع وحضور قلب.', reward: 'مغفرة ما تقدم من الذنب' },
  { id: 'f-adhan-dua', title: 'الدعاء بين الأذان والإقامة', hadith: 'الدعاء لا يُرد بين الأذان والإقامة', source: 'رواه أبو داود والترمذي', description: 'اغتنم الوقت بين الأذان والإقامة بالدعاء لنفسك ولمن تحب.', reward: 'وقت إجابة' },
  { id: 'f-tahiyya', title: 'تحية المسجد', hadith: 'إذا دخل أحدكم المسجد فلا يجلس حتى يصلي ركعتين', source: 'متفق عليه', description: 'إذا دخلت المسجد فصلِّ ركعتين قبل أن تجلس.', reward: 'اتباع هدي النبي ﷺ وتعظيم بيوت الله' },
  { id: 'f-salam', title: 'إفشاء السلام', hadith: 'أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام بينكم', source: 'رواه مسلم', description: 'ابدأ بالسلام على من عرفت ومن لم تعرف.', reward: 'سبب للمحبة ودخول الجنة' },
  { id: 'f-takbir', title: 'التكبير عند الصعود والتسبيح عند النزول', hadith: 'كنا إذا صعدنا كبّرنا، وإذا نزلنا سبّحنا', source: 'رواه البخاري', description: 'قل «الله أكبر» إذا صعدت درجاً أو مرتفعاً، و«سبحان الله» إذا نزلت.', reward: 'ذكر دائم في كل حال' },
  { id: 'f-three-days', title: 'صيام ثلاثة أيام من كل شهر', hadith: 'صوم ثلاثة أيام من كل شهر صوم الدهر كله', source: 'متفق عليه', description: 'صُم ثلاثة أيام من كل شهر، والأفضل الأيام البيض ١٣ و١٤ و١٥.', reward: 'كأجر صيام الدهر' },
  { id: 'f-lick', title: 'لعق الأصابع بعد الطعام', hadith: 'إذا أكل أحدكم طعاماً فلا يمسح يده حتى يلعقها أو يُلعقها', source: 'متفق عليه', description: 'قبل غسل اليد أو مسحها التقط ما بقي من الطعام على الأصابع.', reward: 'إدراك البركة في الطعام' },
];

type TabId = 'forgotten' | 'daily' | 'prayer' | 'sleep' | 'food';

const TABS: { id: TabId; label: string }[] = [
  { id: 'forgotten', label: 'المهجورة' },
  { id: 'daily', label: 'اليومية' },
  { id: 'prayer', label: 'سنن الصلاة' },
  { id: 'sleep', label: 'النوم' },
  { id: 'food', label: 'الطعام' },
];

/** Map each tab to sections in sunnah.json: [contentKey, subcategory] pairs. */
const TAB_SECTIONS: Record<Exclude<TabId, 'forgotten'>, [string, string | null][]> = {
  daily: [['عام', 'الاستيقاظ'], ['عام', 'الخلاء'], ['عام', 'الوضوء'], ['عام', 'اللباس'], ['عام', 'المنزل'], ['عام', 'التعاملات'], ['عام', 'الأخلاق'], ['عام', 'أدعية'], ['الأذكار', null], ['السفر', null]],
  prayer: [['المسجد', null]],
  sleep: [['النوم', null]],
  food: [['عام', 'الطعام'], ['عام', 'الشراب']],
};

function SunnahCard({ item, done, onToggle }: { item: SunnahItem; done: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout className={cn('rounded-3xl overflow-hidden noor-card', done && 'noor-card-active')}>
      <div className="flex items-start gap-3 p-4">
        <button onClick={() => setExpanded(e => !e)} className="flex-1 min-w-0 text-right">
          <p className="font-bold text-[15px] leading-snug text-foreground">{item.title}</p>
          {!expanded && <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">{item.description}</p>}
        </button>
        <button onClick={() => setExpanded(e => !e)} aria-label="التفاصيل" className="press w-8 h-8 rounded-full flex items-center justify-center text-primary/70">
          <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-3 space-y-3 border-t border-primary/10 pt-3">
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15">
                <p className="font-serif text-[15px] leading-loose text-foreground/90">«{item.hadith}»</p>
                <div className="mt-2"><GoldBadge>{item.source}</GoldBadge></div>
              </div>
              <div>
                <p className="text-xs font-bold mb-1 text-primary">كيف تطبّقها</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald/10 border border-emerald/25">
                <Star className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm font-bold text-foreground/90">{item.reward}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-4">
        <button onClick={onToggle}
          className={cn('press w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all', done ? 'noor-btn-emerald' : 'noor-btn-ghost')}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          {done ? 'طبّقتها اليوم — تقبّل الله' : 'طبّقتها اليوم'}
        </button>
      </div>
    </motion.div>
  );
}

export function Sunnah() {
  const [data, setData] = useState<SunnahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('forgotten');
  const [done, setDone] = useState<Record<string, boolean>>(() => getSunnahDone());

  useEffect(() => {
    fetch('/data/sunnah.json')
      .then(r => r.json())
      .then((d: SunnahData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    if (tab === 'forgotten') return [{ title: 'سنن مهجورة أحيِها', items: FORGOTTEN }];
    if (!data) return [];
    const out: { title: string; items: SunnahItem[] }[] = [];
    for (const [key, sub] of TAB_SECTIONS[tab]) {
      const block = data.content[key];
      if (!block) continue;
      if (sub) { if (block[sub]?.length) out.push({ title: sub, items: block[sub] }); }
      else for (const [k, v] of Object.entries(block)) if (v?.length) out.push({ title: k, items: v });
    }
    return out;
  }, [tab, data]);

  const tabItems = groups.flatMap(g => g.items);
  const doneInTab = tabItems.filter(i => done[i.id]).length;
  const doneToday = Object.keys(done).length;

  const toggle = (id: string) => {
    vibrateLight().catch(() => {});
    setDone(toggleSunnahDone(id));
  };

  return (
    <div className="min-h-screen pb-32" dir="rtl">
      <PageHeader title="سنن النبي ﷺ" subtitle="اقتداءً بهدي المصطفى ﷺ — أحيِ سنة كل يوم" icon="mosque">
        <ChipTabs<TabId> items={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Daily progress */}
        <div className="noor-card-hero rounded-3xl p-4 mb-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 noor-pattern" />
          <ProgressRing value={tabItems.length ? doneInTab / tabItems.length : 0} size={70} stroke={6}>
            <span className="text-sm font-black text-gold-gradient tabular-nums">{arNum(doneInTab)}/{arNum(tabItems.length)}</span>
          </ProgressRing>
          <div className="relative flex-1">
            <p className="font-bold text-foreground">إنجازك اليوم</p>
            <p className="text-xs text-muted-foreground mt-0.5">طبّقت {arNum(doneToday)} سنة اليوم في جميع الأقسام</p>
            {doneToday >= 5 && <div className="mt-2"><GoldBadge><Flame className="w-3 h-3" /> محيي السنن</GoldBadge></div>}
          </div>
        </div>

        {loading && tab !== 'forgotten' ? (
          <SkeletonList rows={4} />
        ) : (
          <div className="space-y-6">
            {groups.map(g => (
              <section key={g.title}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-gold" />
                  <h2 className="font-bold text-primary">{g.title}</h2>
                  <span className="text-[11px] text-muted-foreground">({arNum(g.items.length)})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {g.items.map(item => (
                    <SunnahCard key={item.id} item={item} done={!!done[item.id]} onToggle={() => toggle(item.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <FooterAyah text="لَّقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ" source="الأحزاب: ٢١" />
      </div>
    </div>
  );
}
