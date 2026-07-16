import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, BookOpen, Search, X, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';

type ProphetMeta = {
  id: string;
  name: string;
  title: string;
  order: number;
  color: string;
  quranCount: number;
};

type ProphetEvent = {
  id: number;
  prophet: string;
  title: string;
  text: string;
};

const DHIKR = 'لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِّأُولِي الْأَلْبَابِ ۝ يوسف: 111';

function EventSheet({
  item,
  onClose,
  dark,
}: {
  item: ProphetEvent | null;
  onClose: () => void;
  dark: boolean;
}) {
  useEffect(() => {
    if (item) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!item) return null;

  const bg = dark ? '#1a1208' : '#fdfbf0';
  const border = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.25)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      dir="rtl"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col"
        style={{ background: bg, maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: 'rgba(193,154,107,0.4)' }} />
        <div
          className="flex items-center justify-between px-5 pb-3 border-b flex-shrink-0"
          style={{ borderColor: border }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <X size={16} className="text-[#C19A6B]" />
          </button>
          <div className="flex items-center gap-2">
            <Star size={13} className="text-[#C19A6B]" />
            <span
              className="text-xs text-[#8B6B3D]"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            >
              قصص الأنبياء
            </span>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">
          <h2
            className="text-lg font-bold mb-4 leading-relaxed"
            style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}
          >
            {item.title}
          </h2>
          <p
            className="text-sm leading-loose"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              color: dark ? '#b0956a' : '#6D4C41',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
          >
            {item.text}
          </p>
        </div>
      </div>
    </div>
  );
}

const EventCard = ({
  item,
  dark,
  cardBg,
  border,
  onSelect,
}: {
  item: ProphetEvent;
  dark: boolean;
  cardBg: string;
  border: string;
  onSelect: (i: ProphetEvent) => void;
}) => {
  const handleClick = useCallback(() => onSelect(item), [item, onSelect]);
  return (
    <button
      onClick={handleClick}
      className="w-full text-right p-4 rounded-2xl flex items-start gap-3 active:scale-[0.99] transition-transform"
      style={{ background: cardBg, border: `1px solid ${border}` }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug mb-1.5"
          style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}
        >
          {item.title}
        </p>
        {item.text && (
          <p
            className="text-xs mt-1 line-clamp-2"
            style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#7a6040' : '#A08060' }}
          >
            {item.text.substring(0, 120)}...
          </p>
        )}
      </div>
      <ChevronLeft size={16} className="text-[#C19A6B]/50 flex-shrink-0 mt-1" />
    </button>
  );
};

export function ProphetStories() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [prophets, setProphets] = useState<ProphetMeta[]>([]);
  const [selectedProphet, setSelectedProphet] = useState<ProphetMeta | null>(null);
  const [events, setEvents] = useState<ProphetEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeItem, setActiveItem] = useState<ProphetEvent | null>(null);

  useEffect(() => {
    fetch('/data/prophets-meta.json')
      .then(r => r.json())
      .then((d: ProphetMeta[]) => {
        const sorted = [...d].sort((a, b) => a.order - b.order);
        setProphets(sorted);
        setSelectedProphet(sorted[0]);
        setMetaLoading(false);
      })
      .catch(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProphet) return;
    setLoading(true);
    setEvents([]);
    setSearch('');
    fetch(`/data/prophet-${selectedProphet.id}.json`)
      .then(r => r.json())
      .then((d: ProphetEvent[]) => {
        setEvents(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedProphet]);

  const filtered = search.trim()
    ? events.filter(e => e.title.includes(search.trim()) || e.text.includes(search.trim()))
    : events;

  const handleSelect = useCallback((item: ProphetEvent) => setActiveItem(item), []);

  const handleProphetChange = (p: ProphetMeta) => {
    if (p.id === selectedProphet?.id) return;
    setSelectedProphet(p);
    setSearch('');
  };

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const textPrimary = dark ? '#d4b483' : '#5D4037';
  const textSec = dark ? '#8B6B3D' : '#9E7B4A';

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: bg }}>

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto mb-3">
          <button
            onClick={() => navigate('/more')}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}
            >
              قصص الأنبياء
            </h1>
            <p className="text-xs truncate" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              {metaLoading ? 'جارٍ التحميل...' : `ابن كثير • تحقيق د. مصطفى عبد الواحد`}
            </p>
          </div>
          <BookOpen size={22} className="text-[#C19A6B] flex-shrink-0" />
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C19A6B]/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في القصة..."
            className="w-full pr-9 pl-4 py-2.5 rounded-2xl text-sm outline-none"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: dark ? '#1a1208' : '#f5edd8',
              color: textPrimary,
              border: `1px solid ${border}`,
            }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">

        {/* Prophet tabs */}
        {!metaLoading && (
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {prophets.map(p => (
              <button
                key={p.id}
                onClick={() => handleProphetChange(p)}
                className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  background: selectedProphet?.id === p.id
                    ? p.color
                    : (dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)'),
                  color: selectedProphet?.id === p.id ? '#fff' : (dark ? '#C19A6B' : '#8B6B3D'),
                  border: selectedProphet?.id === p.id ? 'none' : `1px solid ${border}`,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Prophet subtitle */}
        {!loading && selectedProphet && (
          <div className="mb-3 px-1 flex items-center justify-between flex-wrap gap-1">
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              {selectedProphet.title}
            </p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              ذُكر في القرآن {selectedProphet.quranCount} مرة
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {(loading || metaLoading) && (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !metaLoading && filtered.length === 0 && (
          <div className="text-center py-16 opacity-50">
            <BookOpen size={32} className="text-[#C19A6B] mx-auto mb-3" />
            <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#C19A6B' : '#8B6B3D' }}>
              لا توجد نتائج
            </p>
          </div>
        )}

        {/* Events list */}
        <div className="flex flex-col gap-2.5">
          {filtered.map(item => (
            <EventCard
              key={item.id}
              item={item}
              dark={dark}
              cardBg={cardBg}
              border={border}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Footer ayah */}
        {!loading && filtered.length > 0 && (
          <div className="mt-8 mb-4 text-center px-4">
            <div
              className="h-px mb-4"
              style={{ background: `linear-gradient(to left, transparent, ${border}, transparent)` }}
            />
            <p
              className="text-sm leading-loose"
              style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}
            >
              {DHIKR}
            </p>
          </div>
        )}
      </div>

      <EventSheet item={activeItem} onClose={() => setActiveItem(null)} dark={dark} />
    </div>
  );
}
