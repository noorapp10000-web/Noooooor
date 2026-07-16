import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, BookOpen, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSetting } from '@/hooks/use-user-setting';

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

const CAT_GRADIENTS: Record<string, string> = {
  general: 'linear-gradient(135deg,#1b4332,#0d2b1e)',
  mosque:  'linear-gradient(135deg,#1e3a6e,#0f2040)',
  adhkar:  'linear-gradient(135deg,#4a2040,#2a1030)',
  sleep:   'linear-gradient(135deg,#0f2d4d,#071828)',
  travel:  'linear-gradient(135deg,#6b3a0f,#3d2008)',
};

const CAT_CONTENT_KEY: Record<string, string> = {
  general: 'عام',
  mosque:  'المسجد',
  adhkar:  'الأذكار',
  sleep:   'النوم',
  travel:  'السفر',
};

function SunnahCard({ item, dark }: { item: SunnahItem; dark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const cardBg = dark ? '#1a1208' : '#fff';

  return (
    <motion.div layout className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-right p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>
            {item.title}
          </p>
          {!expanded && (
            <p className="text-xs mt-1 line-clamp-1" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#7a6040' : '#9E7B4A' }}>
              {item.description}
            </p>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#C19A6B] flex-shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-[#C19A6B]/60 flex-shrink-0 mt-0.5" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
              {/* Hadith */}
              <div className="mt-3 p-3 rounded-xl" style={{ background: dark ? 'rgba(193,154,107,0.07)' : 'rgba(193,154,107,0.08)' }}>
                <p className="text-sm leading-relaxed italic" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#C19A6B' : '#8B6B3D' }}>
                  «{item.hadith}»
                </p>
                <p className="text-xs mt-2 text-right" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>
                  — {item.source}
                </p>
              </div>
              {/* Description */}
              <div>
                <p className="text-xs font-bold mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>كيف تطبّقها</p>
                <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#b0956a' : '#6D4C41' }}>{item.description}</p>
              </div>
              {/* Reward */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(193,154,107,0.1)' }}>
                <Star size={14} className="text-[#C19A6B] flex-shrink-0" />
                <p className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#8B6340' }}>{item.reward}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Sunnah() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [data, setData] = useState<SunnahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('general');
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/sunnah.json')
      .then(r => r.json())
      .then((d: SunnahData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';

  const contentKey = CAT_CONTENT_KEY[activeCat] ?? '';
  const subcats = data ? Object.keys(data.content[contentKey] ?? {}) : [];

  const handleCatChange = (id: string) => {
    setActiveCat(id);
    setActiveSubcat(null);
  };

  const items: SunnahItem[] = activeSubcat && data ? (data.content[contentKey][activeSubcat] ?? []) : [];

  return (
    <div className="min-h-screen pb-32" dir="rtl" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto mb-3">
          <button onClick={() => navigate('/more')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.12)' }}>
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>سنن النبي ﷺ</h1>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>اقتداءً بهدي المصطفى ﷺ</p>
          </div>
          <BookOpen size={22} className="text-[#C19A6B]" />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {data?.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCatChange(cat.id)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: activeCat === cat.id ? CAT_GRADIENTS[cat.id] : (dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)'),
                color: activeCat === cat.id ? '#fff' : (dark ? '#C19A6B' : '#8B6B3D'),
                border: activeCat === cat.id ? 'none' : `1px solid ${border}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }} />)}
          </div>
        )}

        {!loading && !activeSubcat && (
          <div className="flex flex-col gap-2.5">
            {subcats.map(sub => {
              const count = data?.content[contentKey][sub]?.length ?? 0;
              return (
                <motion.button
                  key={sub}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSubcat(sub)}
                  className="w-full text-right p-4 rounded-2xl flex items-center justify-between"
                  style={{ background: dark ? '#1a1208' : '#fff', border: `1px solid ${border}` }}
                >
                  <div>
                    <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>{sub}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>{count} سنة</p>
                  </div>
                  <ChevronLeft size={18} className="text-[#C19A6B]/60" />
                </motion.button>
              );
            })}
          </div>
        )}

        {!loading && activeSubcat && (
          <>
            <button
              onClick={() => setActiveSubcat(null)}
              className="flex items-center gap-2 mb-4"
            >
              <ChevronLeft size={16} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
              <span className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>{activeSubcat}</span>
            </button>
            <div className="flex flex-col gap-2.5">
              {items.map(item => (
                <SunnahCard key={item.id} item={item} dark={dark} />
              ))}
            </div>
            <div className="mt-8 mb-4 text-center px-2">
              <div className="h-px mb-4" style={{ background: `linear-gradient(to left, transparent, rgba(193,154,107,0.3), transparent)` }} />
              <p className="text-sm leading-loose" style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}>
                مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ ۝ متفق عليه
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
