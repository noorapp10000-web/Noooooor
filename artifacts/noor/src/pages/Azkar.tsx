import { useState } from 'react';
import { Check, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { getTodayKey, cn } from '@/lib/utils';
import { HISN_CATEGORIES, HISN_ITEMS, type HisnCategory } from '@/lib/hisnData';
import { queueAzkarSync, getCacheValue, getCurrentUid } from '@/lib/rtdb';
import { getOrCreateLocalUid } from '@/lib/rtdb';

/* ── Ornament ────────────────────────────────────*/
function IslamicOrnament() {
  return (
    <svg viewBox="0 0 120 20" className="w-full opacity-30" preserveAspectRatio="xMidYMid meet">
      <g fill="currentColor">
        <polygon points="60,2 63,8 70,8 64,12 66,19 60,15 54,19 56,12 50,8 57,8" opacity="0.8"/>
        <polygon points="20,10 22,14 26,14 23,16 24,20 20,18 16,20 17,16 14,14 18,14" opacity="0.5" transform="scale(0.7) translate(14,0)"/>
        <polygon points="100,10 102,14 106,14 103,16 104,20 100,18 96,20 97,16 94,14 98,14" opacity="0.5" transform="scale(0.7) translate(-14,0)"/>
        <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="80" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <circle cx="42" cy="10" r="1.5" opacity="0.5"/>
        <circle cx="78" cy="10" r="1.5" opacity="0.5"/>
      </g>
    </svg>
  );
}

/* ── Card ────────────────────────────────────────*/
function IslamicCard({ children, isDone }: { children: ReactNode; isDone: boolean }) {
  return (
    <div className={cn(
      'relative rounded-3xl p-5 shadow-sm transition-all duration-500 overflow-hidden',
      isDone ? 'border-2 border-green-500/40 bg-green-50/20 dark:bg-green-900/10'
             : 'border-2 border-[#C19A6B]/20 bg-card',
    )}>
      {(['top-2 right-2 ', 'top-2 left-2 scaleX(-1)', 'bottom-2 right-2 scaleY(-1)', 'bottom-2 left-2 scale(-1)'] as const).map((pos, i) => {
        const [p1, p2, t] = pos.split(' ');
        return (
          <svg key={i} className={`absolute ${p1} ${p2} w-8 h-8 opacity-10 text-[#C19A6B]`} viewBox="0 0 40 40" fill="currentColor" style={{ transform: t }}>
            <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
            <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      })}
      {children}
    </div>
  );
}

/* ── Reset dialog ────────────────────────────────*/
function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}/>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
      >
        <svg width="32" height="32" viewBox="0 0 40 40" className="mx-auto mb-3 text-primary opacity-60">
          <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" fill="currentColor"/>
        </svg>
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تصفير الأذكار</h3>
        <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          هل تريد تصفير هذا القسم لليوم؟
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', color: '#fff', fontFamily: '"Tajawal", sans-serif' }}>تصفير</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Items view ──────────────────────────────────*/
function ItemsView({ category, onBack }: { category: HisnCategory; onBack: () => void }) {
  const todayKey = getTodayKey();
  const [progress, setProgress] = useState<Record<number, number>>(() =>
    getCacheValue<Record<number, number>>(`azkar/${todayKey}/${category.id}`, {})
  );
  const [showReset, setShowReset] = useState(false);

  const items = HISN_ITEMS[category.id] ?? [];
  const totalDone = items.filter(z => (progress[z.id] ?? 0) >= z.count).length;
  const allDone = items.length > 0 && totalDone === items.length;

  const handleTap = (id: number, max: number) => {
    setProgress(prev => {
      const cur = prev[id] ?? 0;
      if (cur >= max) return prev;
      const next = { ...prev, [id]: cur + 1 };
      const uid = getCurrentUid() || getOrCreateLocalUid();
      if (uid) queueAzkarSync(uid, category.id, next);
      return next;
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showReset && (
          <ResetDialog
            onConfirm={() => {
              setProgress({});
              setShowReset(false);
              const uid = getCurrentUid() || getOrCreateLocalUid();
              if (uid) queueAzkarSync(uid, category.id, {});
            }}
            onCancel={() => setShowReset(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          <ChevronRight className="w-5 h-5"/>
          الأقسام
        </button>
        <button onClick={() => setShowReset(true)} className="p-2 bg-secondary text-primary rounded-full">
          <RotateCcw className="w-4 h-4"/>
        </button>
      </div>

      <h1 className="text-xl font-bold mb-3 text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {category.title}
      </h1>

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-4 bg-card rounded-2xl px-4 py-2.5 border border-[#C19A6B]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(totalDone / items.length) * 100}%` }}/>
            </div>
            <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{totalDone}/{items.length}</span>
          </div>
          {allDone && (
            <span className="text-green-600 text-sm font-bold flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              <Check className="w-4 h-4"/>أحسنت!
            </span>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          لا توجد أذكار في هذا القسم.
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const cur = progress[item.id] ?? 0;
            const isDone = cur >= item.count;
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ delay: idx * 0.02, duration: 0.25 }}>
                <IslamicCard isDone={isDone}>
                  <div className="text-[#C19A6B] mb-3"><IslamicOrnament/></div>

                  <p className="text-lg leading-loose whitespace-pre-wrap text-center mb-1"
                    style={{ fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif' }}>
                    {item.text}
                  </p>

                  <div className="text-[#C19A6B] mt-2 mb-4"><IslamicOrnament/></div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {isDone
                        ? <span className="text-green-600 font-bold">✓ مكتمل</span>
                        : <span>متبقي: <strong>{item.count - cur}</strong> / {item.count}</span>
                      }
                    </div>
                    <button
                      onClick={() => handleTap(item.id, item.count)}
                      disabled={isDone}
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-md',
                        isDone ? 'bg-green-500 text-white scale-105 shadow-green-500/30 cursor-not-allowed'
                               : 'text-primary-foreground hover:scale-105 active:scale-95 cursor-pointer'
                      )}
                      style={!isDone ? { background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', boxShadow: '0 4px 15px rgba(193,154,107,0.4)' } : {}}
                    >
                      {isDone ? <Check className="w-7 h-7"/> : <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.count - cur}</span>}
                    </button>
                  </div>

                  <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className={cn('h-full transition-all duration-500 rounded-full', isDone ? 'bg-green-500' : 'bg-primary')}
                      style={{ width: `${Math.min((cur / item.count) * 100, 100)}%` }}/>
                  </div>
                </IslamicCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Islamic 8-point star background watermark ───*/
function IslamicWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute"
      style={{
        width: 90, height: 90,
        bottom: -18, left: -18,
        opacity: 0.055,
        pointerEvents: 'none',
      }}
    >
      <g fill="#C19A6B">
        <polygon points="50,5 58,35 88,35 65,55 73,85 50,68 27,85 35,55 12,35 42,35"/>
        <polygon points="50,5 58,35 88,35 65,55 73,85 50,68 27,85 35,55 12,35 42,35"
          transform="rotate(22.5 50 50)"/>
      </g>
      <circle cx="50" cy="50" r="15" fill="none" stroke="#C19A6B" strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="#C19A6B" strokeWidth="0.6"/>
    </svg>
  );
}

/* ── Small ornamental divider ─────────────────────*/
function OrnaDivider() {
  return (
    <div className="flex items-center justify-center gap-1 my-1.5">
      <div className="h-px w-5" style={{ background: 'rgba(193,154,107,0.35)' }}/>
      <svg width="8" height="8" viewBox="0 0 20 20" style={{ opacity: 0.6 }}>
        <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7" fill="#C19A6B"/>
      </svg>
      <div className="h-px w-5" style={{ background: 'rgba(193,154,107,0.35)' }}/>
    </div>
  );
}

/* ── Category card ───────────────────────────────*/
function CategoryCard({
  cat, idx, onSelect, todayKey,
}: {
  cat: HisnCategory;
  idx: number;
  onSelect: (c: HisnCategory) => void;
  todayKey: string;
}) {
  // Read azkar progress from RTDB cache
  const prog = getCacheValue<Record<number, number>>(`azkar/${todayKey}/${cat.id}`, {});
  const items = HISN_ITEMS[cat.id] ?? [];
  const done = items.filter(z => (prog[z.id] ?? 0) >= z.count).length;
  const allDone = items.length > 0 && done === items.length;
  const pct = items.length > 0 ? (done / items.length) * 100 : 0;
  const hasDone = done > 0 && !allDone;

  const borderColor = allDone
    ? 'rgba(34,197,94,0.4)'
    : hasDone
    ? 'rgba(193,154,107,0.55)'
    : 'rgba(193,154,107,0.18)';

  const topAccent = allDone
    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
    : 'linear-gradient(90deg, #C19A6B 0%, #e8c99a 50%, #C19A6B 100%)';

  return (
    <motion.button
      onClick={() => onSelect(cat)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.01, duration: 0.22, ease: 'easeOut' }}
      className="relative flex flex-col rounded-2xl overflow-hidden text-center hover-elevate"
      style={{
        border: `1.5px solid ${borderColor}`,
        background: allDone
          ? 'linear-gradient(160deg, rgba(34,197,94,0.07) 0%, var(--color-card) 100%)'
          : 'var(--color-card)',
        minHeight: 120,
      }}
    >
      {/* Golden top accent stripe */}
      <div className="w-full h-0.5 flex-shrink-0" style={{ background: topAccent }}/>

      {/* Watermark star in corner */}
      <IslamicWatermark/>

      {/* Done badge */}
      {allDone && (
        <div
          className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}
        >
          <Check className="w-3 h-3 text-white"/>
        </div>
      )}

      {/* In-progress count dot */}
      {hasDone && (
        <div
          className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.2)', border: '1px solid rgba(193,154,107,0.4)' }}
        >
          <span className="text-[8px] font-bold" style={{ color: '#C19A6B' }}>{done}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-2.5 py-3">
        <OrnaDivider/>

        <p
          className="font-bold text-foreground leading-snug mt-1"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            fontSize: cat.title.length > 16 ? '0.68rem' : cat.title.length > 11 ? '0.75rem' : '0.85rem',
            lineHeight: 1.5,
            direction: 'rtl',
          }}
        >
          {cat.title}
        </p>

        {items.length > 0 && (
          <p
            className="mt-1.5 text-[10px] font-semibold"
            style={{
              color: allDone ? '#22c55e' : 'rgba(193,154,107,0.75)',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            {allDone ? 'مكتمل' : `${items.length} ذكر`}
          </p>
        )}
      </div>

      {/* Progress bar at very bottom */}
      <div className="w-full h-1 flex-shrink-0" style={{ background: 'rgba(193,154,107,0.08)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
              : 'linear-gradient(90deg, #C19A6B, #e8c99a)',
          }}
        />
      </div>
    </motion.button>
  );
}

/* ── Categories grid ─────────────────────────────*/
function CategoriesView({ onSelect }: { onSelect: (cat: HisnCategory) => void }) {
  const todayKey = getTodayKey();

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <svg width="14" height="14" viewBox="0 0 20 20" style={{ opacity: 0.5 }}>
            <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7" fill="#C19A6B"/>
          </svg>
          <h1 className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            الأذكار والأدعية
          </h1>
          <svg width="14" height="14" viewBox="0 0 20 20" style={{ opacity: 0.5 }}>
            <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7" fill="#C19A6B"/>
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          من حصن المسلم — تتجدد الأذكار تلقائياً كل يوم
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {HISN_CATEGORIES.map((cat, idx) => (
          <CategoryCard key={cat.id} cat={cat} idx={idx} onSelect={onSelect} todayKey={todayKey}/>
        ))}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────*/
export function Azkar() {
  const [selected, setSelected] = useState<HisnCategory | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div key="items"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}>
          <ItemsView category={selected} onBack={() => setSelected(null)}/>
        </motion.div>
      ) : (
        <motion.div key="cats"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
          <CategoriesView onSelect={setSelected}/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
