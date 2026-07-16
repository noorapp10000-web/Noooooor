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
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      <div className="pt-safe px-4 py-4 flex items-center gap-4 bg-card shadow-sm relative z-10 border-b border-border">
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
        <div className="grid grid-cols-2 gap-3 pb-8">
          {filtered.map((item) => (
            <button
              key={item.number}
              onClick={() => setSelected(item)}
              className="bg-card border border-border/50 rounded-2xl p-4 text-center shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-right"
            >
              <div className="w-8 h-8 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center mx-auto mb-3 text-xs">
                {item.number}
              </div>
              <h2 className="text-2xl font-serif text-primary mb-1 leading-relaxed">{item.name}</h2>
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
