import { useState, useEffect } from 'react';
import { useTutorial } from '@/components/TutorialMascotContext';
import { ChevronLeft, Award, CheckCircle, XCircle, Trophy, RotateCcw, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSetting } from '@/hooks/use-user-setting';

type Answer = { answer: string; t: number };
type Question = { id: number; q: string; answers: Answer[]; link?: string };
type LevelsData = { level1: Question[]; level2: Question[]; level3: Question[] };
type Topic = { name: string; slug: string; levelsData: LevelsData };
type Category = { id: number; arabicName: string; englishName: string; description: string; topics: Topic[] };
type QuizData = { description: string; mainCategories: Category[] };

type Screen = 'categories' | 'topics' | 'levels' | 'quiz' | 'results';

const CAT_GRADS: Record<number, string> = {
  1: 'linear-gradient(135deg,#1b4332,#0d2b1e)',
  2: 'linear-gradient(135deg,#1e3a6e,#0f2040)',
  3: 'linear-gradient(135deg,#4a2040,#2a1030)',
  4: 'linear-gradient(135deg,#6b3a0f,#3d2008)',
  5: 'linear-gradient(135deg,#3a1a5c,#1e0d30)',
  6: 'linear-gradient(135deg,#1a4a3a,#0d2b1e)',
};

const LEVEL_NAMES: Record<string, string> = {
  level1: 'المستوى الأول',
  level2: 'المستوى الثاني',
  level3: 'المستوى الثالث',
};

const LEVEL_COLORS: Record<string, string> = {
  level1: 'linear-gradient(135deg,#2d6a4f,#1b4332)',
  level2: 'linear-gradient(135deg,#1e4d7b,#0f2d4d)',
  level3: 'linear-gradient(135deg,#5c2d7a,#3a1a52)',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function IslamicQuizzes() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  const [screen, setScreen] = useState<Screen>('categories');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const { showTutorial } = useTutorial();

  useEffect(() => {
    if (screen === 'topics') {
      showTutorial('quiz:topics',
        `اختار الموضوع الأنسب لك! 📚\n\n• كل موضوع بيغطي جانب معين من المعرفة الإسلامية\n• اضغط على الموضوع اللي تريد الاختبار فيه\n• بعد الموضوع هتختار مستوى الصعوبة`
      );
    } else if (screen === 'levels') {
      showTutorial('quiz:levels',
        `اختار مستوى الصعوبة! 🎯\n\n• سهل: أسئلة بسيطة للمبتدئين\n• متوسط: تحدٍّ معقول للمتوسطين\n• صعب: للمتمكنين والراغبين في الاختبار الحقيقي 💪\n• كل مستوى = 20 سؤال منتقى بعناية`
      );
    } else if (screen === 'quiz') {
      showTutorial('quiz:playing',
        `الاختبار بدأ! 🎯\n\n• اقرأ السؤال جيداً قبل الاختيار\n• اضغط على الإجابة التي تعتقد أنها صحيحة\n• ✅ خضراء = إجابة صحيحة / ❌ حمراء = خطأ\n• لا يوجد وقت — خذ وقتك وفكّر بهدوء\n• في نهاية الجلسة تظهر نتيجتك الكاملة 🏆`
      );
    } else if (screen === 'results') {
      showTutorial('quiz:results',
        `انتهى الاختبار! 🏆\n\n• النتيجة تعكس مستواك في هذا الموضوع\n• يمكنك مراجعة الأسئلة والإجابات الصحيحة\n• اضغط "إعادة" للعب مرة أخرى بأسئلة مختلفة\n• 💡 كرّر الموضوع يومياً لتعزيز معلوماتك!`
      );
    }
  }, [screen, showTutorial]);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  useEffect(() => {
    fetch('/data/quizzes.json')
      .then(r => r.json())
      .then((d: QuizData) => { setQuizData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const textPrimary = dark ? '#d4b483' : '#5D4037';
  const textSec = dark ? '#8B6B3D' : '#9E7B4A';

  const startQuiz = (level: string) => {
    if (!selectedTopic) return;
    const qs = shuffle((selectedTopic.levelsData as any)[level] as Question[]).slice(0, 20);
    setQuestions(qs);
    setSelectedLevel(level);
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setScreen('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = questions[qIndex].answers[idx].t === 1;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, correct]);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setScreen('results');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
    }
  };

  const handleBack = () => {
    if (screen === 'topics') { setScreen('categories'); setSelectedCat(null); }
    else if (screen === 'levels') { setScreen('topics'); setSelectedTopic(null); }
    else if (screen === 'quiz' || screen === 'results') { setScreen('levels'); setSelected(null); }
    else navigate('/more');
  };

  const restartQuiz = () => {
    startQuiz(selectedLevel);
  };

  // Header title
  const headerTitle = screen === 'categories' ? 'الاختبارات الإسلامية'
    : screen === 'topics' ? selectedCat?.arabicName ?? ''
    : screen === 'levels' ? selectedTopic?.name ?? ''
    : screen === 'quiz' ? `${LEVEL_NAMES[selectedLevel]}`
    : 'نتيجتك';

  return (
    <div className="min-h-screen pb-32" dir="rtl" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={handleBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(193,154,107,0.12)' }}>
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>{headerTitle}</h1>
            {screen === 'quiz' && (
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                السؤال {qIndex + 1} من {questions.length}
              </p>
            )}
          </div>
          <Award size={22} className="text-[#C19A6B] flex-shrink-0" />
        </div>
        {/* Progress bar for quiz */}
        {screen === 'quiz' && (
          <div className="max-w-lg mx-auto mt-2">
            <div className="h-1.5 rounded-full" style={{ background: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#C19A6B,#8B6340)' }}
                animate={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }} />)}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Categories */}
          {screen === 'categories' && !loading && (
            <motion.div key="cats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <p className="text-xs mb-4 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                اختر التخصص الذي تريد اختبار معلوماتك فيه
              </p>
              <div className="grid grid-cols-2 gap-3">
                {quizData?.mainCategories.map(cat => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setSelectedCat(cat); setScreen('topics'); }}
                    className="rounded-2xl p-4 text-right flex flex-col justify-between min-h-[120px]"
                    style={{ background: CAT_GRADS[cat.id] }}
                  >
                    <span className="text-lg font-bold text-white" style={{ fontFamily: '"Tajawal", sans-serif' }}>{cat.arabicName}</span>
                    <span className="text-xs text-white/70 leading-snug mt-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {cat.topics.length} موضوع
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Topics */}
          {screen === 'topics' && selectedCat && (
            <motion.div key="topics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="mb-3 p-3 rounded-2xl" style={{ background: CAT_GRADS[selectedCat.id] }}>
                <p className="text-xs text-white/80 leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif' }}>{selectedCat.description}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {selectedCat.topics.map((topic, i) => (
                  <motion.button
                    key={topic.slug ?? i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedTopic(topic); setScreen('levels'); }}
                    className="w-full text-right p-4 rounded-2xl flex items-center justify-between"
                    style={{ background: cardBg, border: `1px solid ${border}` }}
                  >
                    <div>
                      <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>{topic.name}</p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>3 مستويات</p>
                    </div>
                    <ChevronLeft size={16} className="text-[#C19A6B]/60" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Levels */}
          {screen === 'levels' && selectedTopic && (
            <motion.div key="levels" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <p className="text-sm font-bold mb-4 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>اختر مستوى الاختبار</p>
              <div className="flex flex-col gap-3">
                {(['level1', 'level2', 'level3'] as const).map(lvl => {
                  const count = (selectedTopic.levelsData[lvl] ?? []).length;
                  return (
                    <motion.button
                      key={lvl}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => startQuiz(lvl)}
                      className="w-full text-right p-5 rounded-2xl"
                      style={{ background: LEVEL_COLORS[lvl] }}
                    >
                      <p className="font-bold text-lg text-white" style={{ fontFamily: '"Tajawal", sans-serif' }}>{LEVEL_NAMES[lvl]}</p>
                      <p className="text-sm text-white/70 mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {Math.min(count, 20)} سؤال • الإجابات من موقع الدرر السنية
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Quiz */}
          {screen === 'quiz' && questions.length > 0 && (
            <motion.div key={`quiz-${qIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Question */}
              <div className="p-5 rounded-2xl mb-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <p className="text-base font-bold leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
                  {questions[qIndex].q}
                </p>
              </div>

              {/* Answers */}
              <div className="flex flex-col gap-3">
                {questions[qIndex].answers.map((ans, idx) => {
                  const isCorrect = ans.t === 1;
                  let bg2 = cardBg;
                  let border2 = border;
                  let textColor = textPrimary;
                  if (selected !== null) {
                    if (isCorrect) { bg2 = 'rgba(34,197,94,0.12)'; border2 = 'rgba(34,197,94,0.5)'; textColor = dark ? '#4ade80' : '#166534'; }
                    else if (idx === selected) { bg2 = 'rgba(239,68,68,0.12)'; border2 = 'rgba(239,68,68,0.5)'; textColor = dark ? '#f87171' : '#991b1b'; }
                  }
                  return (
                    <motion.button
                      key={idx}
                      whileTap={selected === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(idx)}
                      className="w-full text-right p-4 rounded-2xl flex items-center justify-between transition-all"
                      style={{ background: bg2, border: `1.5px solid ${border2}`, cursor: selected !== null ? 'default' : 'pointer' }}
                    >
                      <p className="text-sm font-medium flex-1" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>
                        {ans.answer}
                      </p>
                      {selected !== null && isCorrect && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
                      {selected !== null && idx === selected && !isCorrect && <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-col gap-3">
                    {questions[qIndex].link && (
                      <a
                        href={questions[qIndex].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2"
                        style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A', fontSize: 12 }}
                      >
                        <ExternalLink size={12} />
                        <span>مصدر الإجابة - الدرر السنية</span>
                      </a>
                    )}
                    <button
                      onClick={handleNext}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base"
                      style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg,#8B6340,#C19A6B)' }}
                    >
                      {qIndex + 1 >= questions.length ? 'عرض النتيجة' : 'السؤال التالي'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Results */}
          {screen === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">

              {/* Correct / Wrong stats — above score */}
              <div className="flex gap-3 mb-5 mt-2">
                <div className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}>{score}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}>إجابات صحيحة</span>
                </div>
                <div className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}>{questions.length - score}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}>إجابات خاطئة</span>
                </div>
              </div>

              <div className="mb-6">
                <Trophy size={56} className="text-[#C19A6B] mx-auto mb-3" />
                <p className="text-3xl font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
                  {score} / {questions.length}
                </p>
                <p className="text-lg font-bold mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#C19A6B' : '#8B6340' }}>
                  {score === questions.length ? 'ممتاز! أحسنت' : score >= questions.length * 0.7 ? 'جيد جداً' : score >= questions.length * 0.5 ? 'جيد، استمر في التعلم' : 'لا بأس، حاول مجدداً'}
                </p>
                <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                  نسبة النجاح: {Math.round((score / questions.length) * 100)}٪
                </p>
              </div>

              {/* Answer summary bubbles */}
              <div className="flex justify-center gap-2 flex-wrap mb-8">
                {answers.map((correct, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: correct ? '#22c55e' : '#ef4444' }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={restartQuiz}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg,#8B6340,#C19A6B)' }}
                >
                  <RotateCcw size={18} />
                  أعد الاختبار
                </button>
                <button
                  onClick={() => setScreen('levels')}
                  className="w-full py-4 rounded-2xl font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: dark ? 'rgba(193,154,107,0.1)' : 'rgba(193,154,107,0.12)', color: dark ? '#C19A6B' : '#8B6340', border: `1px solid ${border}` }}
                >
                  اختر مستوى آخر
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {screen === 'categories' && !loading && (
          <div className="mt-8 mb-4 text-center px-2">
            <div className="h-px mb-4" style={{ background: `linear-gradient(to left, transparent, rgba(193,154,107,0.3), transparent)` }} />
            <p className="text-sm leading-loose" style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}>
              قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ ۝ الزمر: 9
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
