import { useState } from 'react';
import { ASMA_HUSNA } from '@/lib/constants';
import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import { normalizeArabic } from '@/lib/arabic-utils';

export function Asma() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof ASMA_HUSNA[0] | null>(null);

  const normSearch = normalizeArabic(search);
  const filtered = ASMA_HUSNA.filter(a =>
    normalizeArabic(a.name).includes(normSearch) ||
    a.transliteration.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto" dir="rtl">
      <div className="pt-safe px-4 py-4 flex items-center gap-4 relative z-10 border-b border-border" style={{ background: 'hsl(168 32% 5% / .6)', backdropFilter: 'blur(16px)' }}>
        <Link href="/more" className="p-2 bg-secondary rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-xl flex-1">أسماء الله الحسنى</h1>
        <span className="text-sm text-muted-foreground bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">99 اسماً</span>
      </div>

      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن اسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border/50 rounded-xl py-2 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!search && (() => { const d = new Date(); const daily = filtered[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % filtered.length]; return daily ? (
          <button onClick={() => setSelected(daily)} className="relative w-full mb-4 rounded-3xl p-5 overflow-hidden text-center"
            style={{ background: 'linear-gradient(135deg, #123f35, #06201a)', border: '1px solid rgba(232,192,96,0.4)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}>
            <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'url(/images/islamic-pattern.webp)', backgroundSize: '150px' }} />
            <p className="relative text-[11px] font-bold mb-1" style={{ color: 'rgba(242,227,194,0.7)' }}>اسم اليوم · تأمّل معناه</p>
            <h2 className="relative text-5xl font-serif leading-relaxed" style={{ color: '#F7DC94', textShadow: '0 0 24px rgba(232,192,96,0.45)' }}>{daily.name}</h2>
            <p className="relative text-xs mt-1 line-clamp-2" style={{ color: 'rgba(242,234,216,0.8)' }}>{daily.meaning}</p>
          </button>) : null; })()}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {filtered.map((item) => (
            <button
              key={item.number}
              onClick={() => setSelected(item)}
              className="relative rounded-2xl p-4 text-center transition-all duration-200 active:scale-95" style={{ background: 'linear-gradient(160deg, hsl(165 24% 10% / .9), hsl(166 30% 6% / .9))', border: '1px solid rgba(232,192,96,0.18)', boxShadow: 'inset 0 1px 0 rgba(232,192,96,0.08), 0 8px 20px rgba(0,0,0,0.3)' }}
            >
              <div className="w-8 h-8 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center mx-auto mb-3 text-xs">
                {item.number}
              </div>
              <h2 className="text-[1.7rem] font-serif mb-1 leading-relaxed" style={{ background: 'linear-gradient(180deg,#F7DC94,#B8862F)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{item.name}</h2>
              <p className="text-xs text-muted-foreground">{item.transliteration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                {selected.number}
              </div>
              <h2 className="text-5xl font-serif text-primary leading-loose mb-2">{selected.name}</h2>
              <p className="text-muted-foreground font-medium">{selected.transliteration}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <p className="text-base leading-loose text-foreground text-right">{selected.meaning}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
