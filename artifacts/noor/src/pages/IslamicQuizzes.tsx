import { useState, useEffect, useRef } from 'react';
import { useTutorial } from '@/components/TutorialMascotContext';
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw, ExternalLink, Timer, Layers } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, GoldBar, ProgressRing, SkeletonList, FooterAyah, NoorImg, GoldBadge, arNum } from '@/components/noor/kit';
import { recordQuizResult } from '@/lib/stats';
import { vibrateLight, vibrateReset } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Answer = { answer: string; t: number };
type Question = { id: number; q: string; answers: Answer[]; link?: string };
type LevelsData = { level1: Question[]; level2: Question[]; level3: Question[] };
type Topic = { name: string; slug: string; levelsData: LevelsData };
type Category = { id: number; arabicName: string; englishName: string; description: string; topics: Topic[] };
type QuizData = { description: string; mainCategories: Category[] };
type Screen = 'categories' | 'topics' | 'levels' | 'quiz' | 'results';
type LevelKey = keyof LevelsData;

const LEVELS: { id: LevelKey; name: string; hint: string }[] = [
  { id: 'level1', name: 'المستوى الأول', hint: 'أسئلة أساسية للمبتدئين' },
  { id: 'level2', name: 'المستوى الثاني', hint: 'تحدٍّ متوسط لمعلوماتك' },
  { id: 'level3', name: 'المستوى الثالث', hint: 'للمتمكنين وطلاب العلم' },
];
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function resultBadge(pct: number) {
  if (pct === 100) return { title: 'وسام العالِم', note: 'ما شاء الله! إجابات كاملة' };
  if (pct >= 80) return { title: 'وسام الذهب', note: 'أداء متميز، بارك الله فيك' };
  if (pct >= 60) return { title: 'وسام الفضة', note: 'جيد جداً، استمر في التعلم' };
  if (pct >= 40) return { title: 'وسام البرونز', note: 'بداية طيبة، راجع وحاول مجدداً' };
  return { title: 'طالب علم', note: 'لا بأس، العلم بالتعلّم' };
}

export function IslamicQuizzes() {
  const [, navigate] = useLocation();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('categories');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>('level1');
  const { showTutorial } = useTutorial();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/data/quizzes.json').then(r => r.json()).then((d: QuizData) => { setQuizData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (screen === 'quiz') showTutorial('quiz:playing', `الاختبار بدأ! 🎯\n\n• اقرأ السؤال جيداً ثم اختر إجابتك\n• ✅ الإجابة الصحيحة تتوهج بالأخضر و❌ الخاطئة بالأحمر\n• في النهاية تحصل على وسام بحسب نتيجتك 🏅`);
  }, [screen, showTutorial]);

  useEffect(() => {
    if (screen !== 'quiz') { if (tickRef.current) clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [screen, startedAt]);

  const startQuiz = (level: LevelKey) => {
    if (!selectedTopic) return;
    const qs = shuffle(selectedTopic.levelsData[level] ?? []).slice(0, 20).map(q => ({ ...q, answers: shuffle(q.answers) }));
    setQuestions(qs); setSelectedLevel(level); setQIndex(0); setSelected(null); setAnswers([]);
    setStartedAt(Date.now()); setElapsed(0); setScreen('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = questions[qIndex].answers[idx].t === 1;
    (correct ? vibrateLight() : vibrateReset()).catch(() => {});
    setAnswers(a => [...a, correct]);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      recordQuizResult(answers.filter(Boolean).length, questions.length);
      setScreen('results');
    } else { setQIndex(i => i + 1); setSelected(null); }
  };

  const handleBack = () => {
    if (screen === 'topics') { setScreen('categories'); setSelectedCat(null); }
    else if (screen === 'levels') { setScreen('topics'); setSelectedTopic(null); }
    else if (screen === 'quiz' || screen === 'results') { setScreen('levels'); setSelected(null); }
    else navigate('/more');
  };

  const score = answers.filter(Boolean).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const levelName = LEVELS.find(l => l.id === selectedLevel)?.name ?? '';
  const mm = `${arNum(Math.floor(elapsed / 60))}:${arNum(String(elapsed % 60).padStart(2, '0'))}`;

  const title = screen === 'categories' ? 'المسابقات الإسلامية' : screen === 'topics' ? selectedCat?.arabicName ?? '' : screen === 'levels' ? selectedTopic?.name ?? '' : screen === 'quiz' ? levelName : 'نتيجتك';
  const q = questions[qIndex];

  return (
    <div className="min-h-screen pb-32" dir="rtl">
      <PageHeader title={title} back={handleBack} icon="star"
        subtitle={screen === 'quiz' ? `السؤال ${arNum(qIndex + 1)} من ${arNum(questions.length)}` : screen === 'categories' ? 'اختبر معلوماتك واجمع الأوسمة' : undefined}
        right={screen === 'quiz' ? <GoldBadge><Timer className="w-3 h-3" /> {mm}</GoldBadge> : undefined}>
        {screen === 'quiz' && <GoldBar value={(qIndex + (selected !== null ? 1 : 0)) / Math.max(1, questions.length)} />}
      </PageHeader>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading && <SkeletonList rows={4} h="h-28" />}

        <AnimatePresence mode="wait">
          {screen === 'categories' && !loading && (
            <motion.div key="cats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-2 gap-3">
              {quizData?.mainCategories.map((cat, i) => (
                <motion.button key={cat.id} whileTap={{ scale: 0.96 }} onClick={() => { setSelectedCat(cat); setScreen('topics'); }}
                  className={cn('relative rounded-3xl p-4 text-right flex flex-col min-h-[140px] overflow-hidden', i % 3 === 0 ? 'noor-card-hero' : 'noor-card')}>
                  <div className="absolute inset-0 noor-pattern" style={{ opacity: 0.07 }} />
                  <NoorImg name={(['quran', 'hadith', 'mosque', 'star', 'prayer', 'dua'] as const)[i % 6]} size={38} className="relative mb-2" />
                  <span className="relative text-base font-bold text-foreground leading-snug">{cat.arabicName}</span>
                  <span className="relative mt-auto pt-2"><GoldBadge><Layers className="w-3 h-3" /> {arNum(cat.topics.length)} موضوع</GoldBadge></span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {screen === 'topics' && selectedCat && (
            <motion.div key="topics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="noor-card-hero rounded-3xl p-4 mb-4"><p className="text-xs text-foreground/80 leading-relaxed">{selectedCat.description}</p></div>
              <div className="flex flex-col gap-2.5">
                {selectedCat.topics.map((topic, i) => (
                  <motion.button key={topic.slug ?? i} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedTopic(topic); setScreen('levels'); }}
                    className="w-full text-right p-4 rounded-3xl noor-card flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl noor-emerald-orb flex items-center justify-center text-sm font-bold text-primary">{arNum(i + 1)}</span>
                    <div className="flex-1"><p className="font-bold text-sm text-foreground">{topic.name}</p><p className="text-[11px] text-muted-foreground mt-0.5">٣ مستويات</p></div>
                    <ChevronLeft className="w-4 h-4 text-primary/60" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'levels' && selectedTopic && (
            <motion.div key="levels" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col gap-3">
              {LEVELS.map((lvl, i) => {
                const count = Math.min(20, (selectedTopic.levelsData[lvl.id] ?? []).length);
                return (
                  <motion.button key={lvl.id} whileTap={{ scale: 0.97 }} onClick={() => startQuiz(lvl.id)} disabled={!count}
                    className={cn('w-full text-right p-5 rounded-3xl flex items-center gap-4 disabled:opacity-40', i === 0 ? 'noor-card' : i === 1 ? 'noor-card-hero' : 'noor-card noor-card-active')}>
                    <div className="flex gap-0.5">{[0, 1, 2].map(s => <span key={s} className={cn('w-2 h-6 rounded-full', s <= i ? 'bg-gradient-gold' : 'bg-primary/15')} />)}</div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-foreground">{lvl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lvl.hint} · {arNum(count)} سؤال</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-primary" />
                  </motion.button>
                );
              })}
              <p className="text-[11px] text-muted-foreground text-center mt-2">الإجابات موثّقة من موقع الدرر السنية</p>
            </motion.div>
          )}

          {screen === 'quiz' && q && (
            <motion.div key={`quiz-${qIndex}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="noor-card-hero rounded-3xl p-5 mb-5 relative overflow-hidden">
                <div className="absolute inset-0 noor-pattern" />
                <p className="relative text-[11px] text-primary font-bold mb-2">السؤال {arNum(qIndex + 1)}</p>
                <p className="relative text-[1.05rem] font-bold leading-relaxed text-foreground">{q.q}</p>
              </div>
              <div className="flex flex-col gap-3">
                {q.answers.map((ans, idx) => {
                  const isCorrect = ans.t === 1;
                  const state = selected === null ? 'idle' : isCorrect ? 'correct' : idx === selected ? 'wrong' : 'dim';
                  return (
                    <motion.button key={idx} whileTap={selected === null ? { scale: 0.98 } : {}} onClick={() => handleAnswer(idx)}
                      className={cn('w-full text-right p-4 rounded-2xl flex items-center gap-3 border transition-all noor-card',
                        state === 'correct' && 'noor-success noor-pop', state === 'wrong' && 'noor-danger noor-shake', state === 'dim' && 'opacity-45')}>
                      <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        state === 'correct' ? 'bg-success text-background' : state === 'wrong' ? 'bg-destructive text-foreground' : 'noor-emerald-orb text-primary')}>
                        {state === 'correct' ? <CheckCircle2 className="w-4 h-4" /> : state === 'wrong' ? <XCircle className="w-4 h-4" /> : LETTERS[idx]}
                      </span>
                      <p className="text-sm font-medium flex-1 text-foreground">{ans.answer}</p>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-col gap-3">
                    {q.link && (
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                        <ExternalLink className="w-3 h-3" /> مصدر الإجابة — الدرر السنية
                      </a>
                    )}
                    <button onClick={handleNext} className="press w-full h-14 rounded-2xl noor-btn-gold text-base">
                      {qIndex + 1 >= questions.length ? 'عرض النتيجة' : 'السؤال التالي'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {screen === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="noor-card-hero rounded-[28px] p-6 mb-5 relative overflow-hidden">
                <div className="absolute inset-0 noor-pattern" />
                <div className="relative mx-auto w-32 h-32 rounded-full noor-gold-orb flex items-center justify-center mb-4 noor-glow">
                  <ProgressRing value={pct / 100} size={112} stroke={6} track="hsl(26 50% 20% / .5)">
                    <div><p className="text-3xl font-black text-background tabular-nums leading-none">{arNum(pct)}٪</p></div>
                  </ProgressRing>
                </div>
                <p className="relative text-xl font-bold text-gold-gradient">{resultBadge(pct).title}</p>
                <p className="relative text-sm text-muted-foreground mt-1">{resultBadge(pct).note}</p>
                <div className="relative flex justify-center gap-2 mt-4">
                  <GoldBadge tone="emerald"><CheckCircle2 className="w-3 h-3" /> {arNum(score)} صحيحة</GoldBadge>
                  <GoldBadge tone="muted"><XCircle className="w-3 h-3" /> {arNum(questions.length - score)} خاطئة</GoldBadge>
                  <GoldBadge><Timer className="w-3 h-3" /> {mm}</GoldBadge>
                </div>
              </div>
              <div className="flex justify-center gap-2 flex-wrap mb-6">
                {answers.map((c, i) => (
                  <span key={i} className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', c ? 'bg-success/20 text-success border border-success/50' : 'bg-destructive/15 text-[hsl(0_80%_70%)] border border-destructive/50')}>{arNum(i + 1)}</span>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => startQuiz(selectedLevel)} className="press w-full h-14 rounded-2xl noor-btn-gold flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> أعد الاختبار</button>
                <button onClick={() => setScreen('levels')} className="press w-full h-14 rounded-2xl noor-btn-ghost">اختر مستوى آخر</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {screen === 'categories' && !loading && <FooterAyah text="قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ" source="الزمر: ٩" />}
      </div>
    </div>
  );
}
