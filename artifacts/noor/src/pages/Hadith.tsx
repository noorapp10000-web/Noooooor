import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTutorial } from '@/components/TutorialMascotContext';
import { ChevronLeft, ChevronRight, Search, X, Copy, Share2, Heart, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeArabic } from '@/lib/arabic-utils';
import { PageHeader, ChipTabs, GoldBadge, EmptyState, SkeletonList, Spinner, FooterAyah, NoorImg, arNum } from '@/components/noor/kit';
import { shareText, copyText } from '@/lib/share';
import { useUserSetting } from '@/hooks/use-user-setting';
import { cn } from '@/lib/utils';

/* ── Book definitions ── */
const BOOKS = [
  { slug: 'sahih-bukhari', name: 'صحيح البخاري', author: 'الإمام محمد بن إسماعيل البخاري', grade: 'أصح الكتب بعد القرآن', count: 7580 },
  { slug: 'sahih-muslim', name: 'صحيح مسلم', author: 'الإمام مسلم بن الحجاج', grade: 'من الصحيحين', count: 7360 },
  { slug: 'al-tirmidhi', name: 'جامع الترمذي', author: 'الإمام أبو عيسى الترمذي', grade: 'من الكتب الستة', count: 3924 },
  { slug: 'abu-dawood', name: 'سنن أبي داود', author: 'الإمام أبو داود السجستاني', grade: 'من الكتب الستة', count: 5272 },
  { slug: 'ibn-e-majah', name: 'سنن ابن ماجه', author: 'الإمام ابن ماجه القزويني', grade: 'من الكتب الستة', count: 4338 },
  { slug: 'sunan-nasai', name: 'سنن النسائي', author: 'الإمام أحمد بن شعيب النسائي', grade: 'من الكتب الستة', count: 5679 },
];

type Book = typeof BOOKS[0];
interface LocalHadith { n: number; t: string; }
type Fav = { slug: string; n: number; t: string };

const bookCache = new Map<string, LocalHadith[]>();
async function loadBook(slug: string): Promise<LocalHadith[]> {
  if (bookCache.has(slug)) return bookCache.get(slug)!;
  const res = await fetch(`/data/hadith-${slug}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: LocalHadith[] = await res.json();
  bookCache.set(slug, data);
  return data;
}

const PAGE_SIZE = 10;
const SEARCH_LIMIT = 50;

/** Split a narration into its chain (sanad) and its text (matn). */
function splitHadith(raw: string): { sanad: string; matn: string } {
  const t = raw.replace(/\u200f/g, '').replace(/\s+/g, ' ').trim();
  const q = t.search(/["«]/);
  if (q > 20 && q < t.length - 10) {
    const sanad = t.slice(0, q).trim();
    const matn = t.slice(q).replace(/^["«]\s*/, '').replace(/\s*["»]\s*\.?\s*$/, '').replace(/"\s*\./g, '').replace(/"/g, '').trim();
    return { sanad, matn };
  }
  const m = t.match(/^(.{20,}?(?:قَالَ|قال)\s+رَسُولُ\s+اللَّهِ\s+صلى الله عليه وسلم)\s*(.+)$/);
  if (m) return { sanad: m[1], matn: m[2] };
  return { sanad: '', matn: t.replace(/"/g, '') };
}

/* Highlight search snippet — position-aware mapping over normalized text */
function HighlightedText({ text, snippet }: { text: string; snippet: string }) {
  const normSnippet = normalizeArabic(snippet);
  if (!normSnippet) return <>{text}</>;
  const normText = normalizeArabic(text);
  const matchIdx = normText.indexOf(normSnippet);
  if (matchIdx === -1) return <>{text}</>;
  type Pair = [number, string];
  const pairs: Pair[] = [];
  let prevWasSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[\u064B-\u065F\u0670]/.test(ch)) continue;
    if (/\s/.test(ch)) { if (!prevWasSpace) { pairs.push([i, ' ']); prevWasSpace = true; } continue; }
    prevWasSpace = false;
    let nc = ch;
    if (/[أإآ]/.test(ch)) nc = 'ا'; else if (ch === 'ة') nc = 'ه'; else if (ch === 'ى') nc = 'ي'; else nc = ch.toLowerCase();
    pairs.push([i, nc]);
  }
  let start = 0, end = pairs.length;
  while (start < end && pairs[start][1] === ' ') start++;
  while (end > start && pairs[end - 1][1] === ' ') end--;
  const final = pairs.slice(start, end);
  if (matchIdx >= final.length) return <>{text}</>;
  const origStart = final[matchIdx][0];
  const origEnd = matchIdx + normSnippet.length < final.length ? final[matchIdx + normSnippet.length][0] : text.length;
  if (origStart >= origEnd) return <>{text}</>;
  return (
    <>
      {text.slice(0, origStart)}
      <mark className="rounded px-0.5 bg-primary/30 text-gold-soft">{text.slice(origStart, origEnd)}</mark>
      {text.slice(origEnd)}
    </>
  );
}

/* ── Hadith card ── */
function HadithCard({ hadith, book, highlighted = false, snippet, isFav, onToggleFav }: {
  hadith: LocalHadith; book: Book; highlighted?: boolean; snippet?: string; isFav: boolean; onToggleFav: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showSanad, setShowSanad] = useState(false);
  const { sanad, matn } = useMemo(() => splitHadith(hadith.t), [hadith.t]);

  useEffect(() => {
    if (highlighted && ref.current) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }, [highlighted]);

  const full = `${matn}\n\n[${book.name} — حديث رقم ${hadith.n}]`;

  return (
    <div ref={ref} className={cn('rounded-3xl overflow-hidden noor-card', highlighted && 'noor-card-active')}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GoldBadge>{book.name} · {arNum(hadith.n)}</GoldBadge>
          <div className="flex-1" />
          <button onClick={e => { e.stopPropagation(); onToggleFav(); }} aria-label="المفضلة"
            className={cn('press w-8 h-8 rounded-full flex items-center justify-center', isFav ? 'noor-btn-gold' : 'noor-btn-ghost')}>
            <Heart className={cn('w-3.5 h-3.5', isFav && 'fill-current')} />
          </button>
          <button onClick={async e => { e.stopPropagation(); if (await copyText(full)) { setCopied(true); setTimeout(() => setCopied(false), 1600); } }}
            aria-label="نسخ" className={cn('press w-8 h-8 rounded-full flex items-center justify-center', copied ? 'noor-btn-emerald' : 'noor-btn-ghost')}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); shareText(full, 'مشاركة الحديث'); }} aria-label="مشاركة"
            className="press w-8 h-8 rounded-full flex items-center justify-center noor-btn-ghost">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {sanad && (
          <button onClick={e => { e.stopPropagation(); setShowSanad(s => !s); }} className="block w-full text-right mb-2">
            <p className={cn('text-[13px] leading-7 text-sanad font-serif', !showSanad && 'line-clamp-1')}>
              {snippet ? <HighlightedText text={sanad} snippet={snippet} /> : sanad}
            </p>
            <span className="text-[10px] text-primary/70">{showSanad ? 'إخفاء السند' : 'عرض السند كاملاً'}</span>
          </button>
        )}

        <p className="font-serif text-[1.12rem] leading-[2.15] text-foreground/95">
          {snippet ? <HighlightedText text={matn} snippet={snippet} /> : matn}
        </p>

        <div className="mt-3 pt-3 border-t border-primary/10 flex items-center gap-2">
          <NoorImg name="hadith" size={20} />
          <span className="text-[11px] text-muted-foreground">التخريج:</span>
          <GoldBadge>رواه {book.name.replace(/^(صحيح|سنن|جامع)\s/, '')} ({arNum(hadith.n)})</GoldBadge>
        </div>
      </div>
    </div>
  );
}

/* ── Live search ── */
function SearchResults({ query, book, onOpenBook, favs, toggleFav }: {
  query: string; book: Book | null; onOpenBook: (b: Book, n: number) => void; favs: Fav[]; toggleFav: (b: Book, h: LocalHadith) => void;
}) {
  const [results, setResults] = useState<Array<{ hadith: LocalHadith; book: Book }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const cancel = { c: false };
    const timer = setTimeout(async () => {
      const norm = normalizeArabic(query);
      if (!norm) { setResults([]); setLoading(false); return; }
      setResults([]);
      let total = 0;
      for (const b of book ? [book] : BOOKS) {
        if (total >= SEARCH_LIMIT || cancel.c) break;
        try {
          const hadiths = await loadBook(b.slug);
          const found: Array<{ hadith: LocalHadith; book: Book }> = [];
          for (let i = 0; i < hadiths.length; i++) {
            if (total >= SEARCH_LIMIT || cancel.c) break;
            if (normalizeArabic(hadiths[i].t).includes(norm)) { found.push({ hadith: hadiths[i], book: b }); total++; }
            if (i % 300 === 299) { await new Promise<void>(r => setTimeout(r, 0)); if (cancel.c) break; }
          }
          if (found.length && !cancel.c) setResults(prev => [...prev, ...found]);
        } catch { /* skip book */ }
      }
      if (!cancel.c) setLoading(false);
    }, 300);
    return () => { cancel.c = true; clearTimeout(timer); };
  }, [query, book]);

  if (!query.trim()) return <EmptyState icon="hadith" title="ابحث في الأحاديث" hint="اكتب كلمة من متن الحديث أو اسم راوٍ وستظهر النتائج فوراً" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        {loading && <Spinner className="w-4 h-4 border-2" />}
        <span>{arNum(results.length)}{results.length >= SEARCH_LIMIT ? '+' : ''} نتيجة</span>
      </div>
      {!loading && results.length === 0 && <EmptyState icon="hadith" title={`لا توجد نتائج لـ «${query}»`} />}
      {results.map(({ hadith, book: b }) => (
        <div key={`${b.slug}-${hadith.n}`} onClick={() => onOpenBook(b, hadith.n)} className="cursor-pointer">
          <HadithCard hadith={hadith} book={b} snippet={query}
            isFav={favs.some(f => f.slug === b.slug && f.n === hadith.n)} onToggleFav={() => toggleFav(b, hadith)} />
        </div>
      ))}
    </div>
  );
}

/* ── Reader ── */
function HadithReader({ book, initialHadithNum, favs, toggleFav }: {
  book: Book; initialHadithNum?: number; favs: Fav[]; toggleFav: (b: Book, h: LocalHadith) => void;
}) {
  const [hadiths, setHadiths] = useState<LocalHadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [highlightNum, setHighlightNum] = useState<number | undefined>(initialHadithNum);
  const [query, setQuery] = useState('');
  const [jump, setJump] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    loadBook(book.slug)
      .then(data => {
        setHadiths(data); setLoading(false);
        if (initialHadithNum) {
          const idx = data.findIndex(h => h.n === initialHadithNum);
          if (idx !== -1) setPage(Math.floor(idx / PAGE_SIZE) + 1);
        }
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [book.slug, initialHadithNum]);

  const totalPages = Math.max(1, Math.ceil(hadiths.length / PAGE_SIZE));
  const pageHadiths = hadiths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p: number) => { setPage(Math.min(totalPages, Math.max(1, p))); setHighlightNum(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const doJump = () => {
    const n = parseInt(jump, 10);
    const idx = hadiths.findIndex(h => h.n === n);
    if (idx !== -1) { setPage(Math.floor(idx / PAGE_SIZE) + 1); setHighlightNum(n); setJump(''); }
  };

  return (
    <div>
      <div className="noor-card-hero rounded-3xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 noor-pattern" />
        <div className="relative flex items-center gap-3">
          <NoorImg name="hadith" size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{book.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
            <p className="text-[11px] text-primary mt-0.5">{arNum(hadiths.length.toLocaleString('en'))} حديث · صفحة {arNum(page)} من {arNum(totalPages)}</p>
          </div>
        </div>
        <div className="relative flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث داخل الكتاب..." className="noor-input !py-2.5" />
            {query && <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"><X className="w-4 h-4" /></button>}
          </div>
          <input value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && doJump()}
            inputMode="numeric" placeholder="رقم" className="noor-input !w-20 !px-3 !py-2.5 text-center" />
        </div>
      </div>

      {query.trim() ? (
        <SearchResults query={query} book={book} favs={favs} toggleFav={toggleFav}
          onOpenBook={(_, num) => { setQuery(''); const idx = hadiths.findIndex(h => h.n === num); if (idx !== -1) { setPage(Math.floor(idx / PAGE_SIZE) + 1); setHighlightNum(num); } }} />
      ) : (
        <>
          {loading && <SkeletonList rows={4} h="h-40" />}
          {error && <div className="noor-danger border rounded-2xl p-4 text-center text-sm">تعذّر تحميل الكتاب: {error}</div>}
          {!loading && !error && (
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
                {pageHadiths.map(h => (
                  <HadithCard key={h.n} hadith={h} book={book} highlighted={highlightNum === h.n}
                    isFav={favs.some(f => f.slug === book.slug && f.n === h.n)} onToggleFav={() => toggleFav(book, h)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
          {!loading && totalPages > 1 && (
            <div className="flex items-center gap-3 mt-5">
              <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                className="press flex-1 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center gap-1 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" /> السابق
              </button>
              <span className="text-xs text-muted-foreground tabular-nums px-1">{arNum(page)} / {arNum(totalPages)}</span>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                className="press flex-1 h-12 rounded-2xl noor-btn-gold flex items-center justify-center gap-1 disabled:opacity-30">
                التالي <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type Tab = 'books' | 'search' | 'favs';

export function Hadith() {
  const [selected, setSelected] = useState<Book | null>(null);
  const [initHadithNum, setInitHadithNum] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('books');
  const [globalQuery, setGlobalQuery] = useState('');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [favs, setFavs] = useUserSetting<Fav[]>('hadith_favorites', []);
  const { showTutorial } = useTutorial();

  useEffect(() => {
    if (selected) {
      showTutorial('hadith:book:' + selected.slug,
        `أنت داخل ${selected.name}! 📜\n\n• السند يظهر بلون رمادي هادئ والمتن بخط واضح\n• 🔍 ابحث داخل الكتاب أو اكتب رقم الحديث للانتقال إليه\n• ❤️ أضف الحديث للمفضلة، 📋 انسخه، أو شاركه`);
    }
  }, [selected, showTutorial]);

  const toggleFav = useCallback((b: Book, h: LocalHadith) => {
    setFavs(prev => prev.some(f => f.slug === b.slug && f.n === h.n)
      ? prev.filter(f => !(f.slug === b.slug && f.n === h.n))
      : [{ slug: b.slug, n: h.n, t: h.t }, ...prev]);
  }, [setFavs]);

  const openBook = useCallback((b: Book, hadithNum?: number) => {
    setSelected(b); setInitHadithNum(hadithNum); setTab('books'); window.scrollTo({ top: 0 });
  }, []);

  const handleBack = () => { if (selected) { setSelected(null); setInitHadithNum(undefined); } };

  return (
    <div className="min-h-screen pb-28 max-w-lg mx-auto" dir="rtl">
      <PageHeader
        title={selected ? selected.name : 'الأحاديث الشريفة'}
        subtitle={selected ? selected.grade : 'الكتب الستة · أكثر من ٣٤ ألف حديث'}
        back={selected ? handleBack : '/more'}
        icon="hadith"
      >
        {!selected && (
          <ChipTabs<Tab> value={tab} onChange={setTab} items={[
            { id: 'books', label: 'الكتب', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'search', label: 'البحث', icon: <Search className="w-4 h-4" /> },
            { id: 'favs', label: `المفضلة${favs.length ? ` (${arNum(favs.length)})` : ''}`, icon: <Heart className="w-4 h-4" /> },
          ]} />
        )}
      </PageHeader>

      <div className="p-4">
        {selected ? (
          <HadithReader book={selected} initialHadithNum={initHadithNum} favs={favs} toggleFav={toggleFav} />
        ) : tab === 'books' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {BOOKS.map((book, i) => (
                <motion.button key={book.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => openBook(book)}
                  className={cn('press relative text-right rounded-3xl p-4 overflow-hidden min-h-[150px] flex flex-col', i < 2 ? 'noor-card-hero col-span-1' : 'noor-card')}>
                  <div className="absolute inset-0 noor-pattern" style={{ opacity: 0.07 }} />
                  <NoorImg name="hadith" size={42} className="relative mb-3" />
                  <p className="relative font-bold text-[15px] text-foreground leading-snug">{book.name}</p>
                  <p className="relative text-[10px] text-muted-foreground mt-1 line-clamp-2">{book.author}</p>
                  <div className="relative mt-auto pt-2"><GoldBadge>{arNum(book.count.toLocaleString('en'))} حديث</GoldBadge></div>
                </motion.button>
              ))}
            </div>
            <FooterAyah text="إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى" source="متفق عليه" />
          </>
        ) : tab === 'search' ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
              <input autoFocus value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} placeholder="ابحث في كل كتب الحديث..." className="noor-input" />
              {globalQuery && <button onClick={() => setGlobalQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"><X className="w-4 h-4" /></button>}
            </div>
            <ChipTabs className="mb-4" value={filterBook} onChange={setFilterBook}
              items={[{ id: 'all', label: 'الكل' }, ...BOOKS.map(b => ({ id: b.slug, label: b.name.replace(/^(صحيح|سنن|جامع)\s/, '') }))]} />
            <SearchResults query={globalQuery} book={BOOKS.find(b => b.slug === filterBook) ?? null} onOpenBook={openBook} favs={favs} toggleFav={toggleFav} />
          </>
        ) : (
          <div className="space-y-3">
            {favs.length === 0 && <EmptyState icon="hadith" title="لا توجد أحاديث مفضلة بعد" hint="اضغط على ❤️ في أي حديث لحفظه هنا" />}
            {favs.map(f => {
              const b = BOOKS.find(x => x.slug === f.slug) ?? BOOKS[0];
              return <HadithCard key={`${f.slug}-${f.n}`} hadith={{ n: f.n, t: f.t }} book={b} isFav onToggleFav={() => toggleFav(b, { n: f.n, t: f.t })} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
