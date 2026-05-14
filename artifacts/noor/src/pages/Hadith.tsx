import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* ── Book definitions ── */
const BOOKS = [
  { slug: 'sahih-bukhari',  name: 'صحيح البخاري',   iconBg: '#8B1A1A' },
  { slug: 'sahih-muslim',   name: 'صحيح مسلم',      iconBg: '#1A3A7A' },
  { slug: 'al-tirmidhi',   name: 'جامع الترمذي',    iconBg: '#1C2F6E' },
  { slug: 'abu-dawood',    name: 'سنن أبي داود',    iconBg: '#6B3010' },
  { slug: 'ibn-e-majah',   name: 'سنن ابن ماجه',    iconBg: '#7A5010' },
  { slug: 'sunan-nasai',   name: 'سنن النسائي',     iconBg: '#9B1515' },
];

type Book = typeof BOOKS[0];

/* Local file format: [{n: hadithNumber, t: arabicText}] */
interface LocalHadith { n: number; t: string; }

const bookCache = new Map<string, LocalHadith[]>();

async function loadBook(slug: string): Promise<LocalHadith[]> {
  if (bookCache.has(slug)) return bookCache.get(slug)!;
  const res = await fetch(`/data/hadith-${slug}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: LocalHadith[] = await res.json();
  bookCache.set(slug, data);
  return data;
}

/* Arabic normalization for search */
function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const PAGE_SIZE = 10;
const SEARCH_LIMIT = 50;

/* ── Book SVG ── */
function BookSvg() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="5" y="8" width="13" height="24" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <rect x="22" y="8" width="13" height="24" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <line x1="18" y1="8" x2="18" y2="32" stroke="white" strokeWidth="2"/>
      <line x1="22" y1="8" x2="22" y2="32" stroke="white" strokeWidth="2"/>
      <line x1="8" y1="14" x2="15" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="15" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="15" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="14" x2="32" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Single Hadith card ── */
function HadithCard({
  hadith,
  book,
  highlighted = false,
  snippet,
}: {
  hadith: LocalHadith;
  book: Book;
  highlighted?: boolean;
  snippet?: string;
}) {
  const isDark = useDarkMode();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: highlighted
          ? isDark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.1)'
          : isDark ? 'rgba(193,154,107,0.04)' : 'rgba(193,154,107,0.03)',
        border: `1px solid rgba(193,154,107,${highlighted ? (isDark ? '0.45' : '0.4') : (isDark ? '0.18' : '0.2')})`,
        boxShadow: highlighted ? '0 0 0 2px rgba(193,154,107,0.25)' : 'none',
      }}
    >
      <div className="h-[3px] w-full" style={{ background: book.iconBg, opacity: isDark ? 0.8 : 0.7 }} />
      <div className="p-4">
        <div
          className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
          style={{
            background: isDark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.12)',
            border: `1px solid rgba(193,154,107,${isDark ? '0.35' : '0.3'})`,
            color: isDark ? '#E8C98A' : '#7A4F1E',
            fontFamily: '"Tajawal", sans-serif',
          }}
        >
          حديث {hadith.n.toLocaleString('ar-EG')}
        </div>
        <p
          className="text-sm text-right"
          style={{
            fontFamily: '"Amiri", serif',
            lineHeight: '2.2rem',
            color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(30,20,10,0.88)',
          }}
        >
          {snippet ? <HighlightedText text={hadith.t} snippet={snippet} isDark={isDark} /> : hadith.t}
        </p>
      </div>
    </div>
  );
}

/* Highlight search snippet in text — position-aware normalization mapping */
function HighlightedText({ text, snippet, isDark }: { text: string; snippet: string; isDark: boolean }) {
  const normSnippet = normalizeArabic(snippet);
  if (!normSnippet) return <>{text}</>;

  // Build normToOrig: for each index in normalized text, which orig char does it come from?
  const normToOrig: number[] = [];
  let ni = 0;
  for (let oi = 0; oi < text.length; oi++) {
    const nc = normalizeArabic(text[oi]);
    for (let k = 0; k < nc.length; k++) normToOrig[ni + k] = oi;
    ni += nc.length;
  }
  normToOrig[ni] = text.length;

  const normText = normalizeArabic(text);
  const idx = normText.indexOf(normSnippet);
  if (idx === -1) return <>{text}</>;

  const origStart = normToOrig[idx] ?? 0;
  const origEnd = (normToOrig[idx + normSnippet.length] ?? text.length);

  if (origStart >= origEnd) return <>{text}</>;

  return (
    <>
      {text.slice(0, origStart)}
      <mark style={{ background: 'rgba(193,154,107,0.35)', color: isDark ? '#e8c98a' : '#5a3800', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(origStart, origEnd)}
      </mark>
      {text.slice(origEnd)}
    </>
  );
}

/* ── Search results ── */
function SearchResults({
  query,
  book,
  onOpenBook,
}: {
  query: string;
  book: Book | null;
  onOpenBook: (b: Book, hadithNum: number) => void;
}) {
  const isDark = useDarkMode();
  const [results, setResults] = useState<Array<{ hadith: LocalHadith; book: Book }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const norm = normalizeArabic(query);
    if (!norm) { setResults([]); return; }

    setLoading(true);
    const books = book ? [book] : BOOKS;
    const collected: Array<{ hadith: LocalHadith; book: Book }> = [];

    Promise.allSettled(
      books.map(b => loadBook(b.slug).then(hadiths => ({ hadiths, b })))
    ).then(settled => {
      for (const r of settled) {
        if (r.status !== 'fulfilled') continue;
        const { hadiths, b } = r.value;
        for (const h of hadiths) {
          if (collected.length >= SEARCH_LIMIT) break;
          if (normalizeArabic(h.t).includes(norm)) {
            collected.push({ hadith: h, book: b });
          }
        }
        if (collected.length >= SEARCH_LIMIT) break;
      }
      setResults(collected);
      setLoading(false);
    });
  }, [query, book]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-12">
      <div className="w-5 h-5 border-2 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin" />
      <span style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B', fontSize: 14 }}>يبحث...</span>
    </div>
  );

  if (!query.trim()) return null;

  if (results.length === 0) return (
    <div className="py-12 text-center">
      <p style={{ fontFamily: '"Tajawal", sans-serif', color: isDark ? 'rgba(193,154,107,0.5)' : 'rgba(100,60,20,0.5)', fontSize: 14 }}>
        لا توجد نتائج لـ «{query}»
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-right px-1" style={{ fontFamily: '"Tajawal", sans-serif', color: isDark ? 'rgba(193,154,107,0.5)' : 'rgba(100,60,20,0.5)' }}>
        {results.length}{results.length >= SEARCH_LIMIT ? '+' : ''} نتيجة
      </p>
      {results.map(({ hadith, book: b }, i) => (
        <button
          key={i}
          onClick={() => onOpenBook(b, hadith.n)}
          className="w-full text-right"
        >
          {!book && (
            <div className="flex items-center gap-2 px-1 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.iconBg }} />
              <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: b.iconBg }}>{b.name}</span>
            </div>
          )}
          <HadithCard hadith={hadith} book={b} snippet={query} />
        </button>
      ))}
    </div>
  );
}

/* ── Hadith reader (local) ── */
function HadithReader({
  book,
  onBack,
  initialHadithNum,
}: {
  book: Book;
  onBack: () => void;
  initialHadithNum?: number;
}) {
  const isDark = useDarkMode();
  const [hadiths, setHadiths] = useState<LocalHadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [highlightNum, setHighlightNum] = useState<number | undefined>(initialHadithNum);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadBook(book.slug)
      .then(data => {
        setHadiths(data);
        setLoading(false);
        if (initialHadithNum) {
          const idx = data.findIndex(h => h.n === initialHadithNum);
          if (idx !== -1) {
            const p = Math.floor(idx / PAGE_SIZE) + 1;
            setPage(p);
          }
        }
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [book.slug, initialHadithNum]);

  const totalPages = Math.max(1, Math.ceil(hadiths.length / PAGE_SIZE));
  const pageHadiths = hadiths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goToPage = (p: number) => { setPage(p); setHighlightNum(undefined); scrollToTop(); };

  return (
    <div dir="rtl">
      {/* Reader header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 bg-secondary rounded-xl hover-elevate" data-testid="button-hadith-back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {book.name}
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')} • {hadiths.length.toLocaleString('ar-EG')} حديث
          </p>
        </div>
        <button
          onClick={() => setSearchMode(s => !s)}
          className="p-2 rounded-xl transition-all"
          style={{
            background: searchMode ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.08)',
            border: '1px solid rgba(193,154,107,0.25)',
          }}
          data-testid="button-hadith-search"
        >
          <Search className="w-4 h-4 text-[#C19A6B]" />
        </button>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{
                background: isDark ? 'rgba(193,154,107,0.06)' : 'rgba(255,255,255,0.8)',
                border: '1.5px solid rgba(193,154,107,0.3)',
              }}
            >
              <Search className="w-4 h-4 flex-shrink-0 text-[#C19A6B]" />
              <input
                autoFocus
                type="text"
                placeholder="ابحث في الكتاب..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontFamily: '"Tajawal", sans-serif', color: isDark ? '#e8d9b8' : '#2C1E16' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-[#C19A6B]" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search results */}
      {searchMode && searchQuery && (
        <SearchResults
          query={searchQuery}
          book={book}
          onOpenBook={(b, num) => {
            setSearchMode(false);
            setSearchQuery('');
            const idx = hadiths.findIndex(h => h.n === num);
            if (idx !== -1) {
              const p = Math.floor(idx / PAGE_SIZE) + 1;
              setPage(p);
              setHighlightNum(num);
            }
          }}
        />
      )}

      {/* Regular content */}
      {!(searchMode && searchQuery) && (
        <>
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(193,154,107,0.04)', border: '1px solid rgba(193,154,107,0.15)' }}>
                  <div className="h-3 rounded-full w-1/4 mb-3" style={{ background: 'rgba(193,154,107,0.12)' }} />
                  <div className="space-y-2">
                    {[1, 0.83, 0.9].map((w, j) => (
                      <div key={j} className="h-3 rounded-full" style={{ background: 'rgba(193,154,107,0.08)', width: `${w * 100}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 text-center">
              <p className="text-destructive text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                حدث خطأ: {error}
              </p>
            </div>
          )}

          {!loading && !error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {pageHadiths.map(h => (
                  <HadithCard
                    key={h.n}
                    hadith={h}
                    book={book}
                    highlighted={highlightNum !== undefined && h.n === highlightNum}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
                data-testid="button-hadith-next"
              >
                <ChevronRight className="w-4 h-4" />
                التالي
              </button>
              <span className="text-xs text-muted-foreground whitespace-nowrap px-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {page} / {totalPages.toLocaleString('ar-EG')}
              </span>
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
                data-testid="button-hadith-prev"
              >
                السابق
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Book list ── */
function BookList({ onSelect }: { onSelect: (b: Book) => void }) {
  const isDark = useDarkMode();
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {BOOKS.map((book, i) => (
        <motion.button
          key={book.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(book)}
          className="w-full text-right bg-card border border-border rounded-2xl overflow-hidden hover-elevate"
          data-testid={`button-book-${book.slug}`}
        >
          <div className="p-4 flex items-center gap-4">
            <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-base text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {book.name}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: book.iconBg, fontFamily: '"Tajawal", sans-serif', opacity: 0.9 }}>
                {isDark ? '…' : 'اضغط للقراءة'}
              </p>
            </div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: book.iconBg }}>
              <BookSvg />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ── Global Search ── */
function GlobalSearch({ onOpenBook }: { onOpenBook: (b: Book, hadithNum: number) => void }) {
  const isDark = useDarkMode();
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  return (
    <div dir="rtl">
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
        style={{
          background: isDark ? 'rgba(193,154,107,0.06)' : 'rgba(255,255,255,0.8)',
          border: '1.5px solid rgba(193,154,107,0.3)',
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0 text-[#C19A6B]" />
        <input
          autoFocus
          type="text"
          placeholder="ابحث في كل الكتب..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-right"
          style={{ fontFamily: '"Tajawal", sans-serif', color: isDark ? '#e8d9b8' : '#2C1E16' }}
        />
        {query && <button onClick={() => setQuery('')}><X className="w-4 h-4 text-[#C19A6B]" /></button>}
      </div>

      {/* Book filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setSelectedBook(null)}
          className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: !selectedBook ? '#C19A6B' : 'rgba(193,154,107,0.1)',
            color: !selectedBook ? '#fff' : (isDark ? '#C19A6B' : '#7A4F1E'),
          }}
        >
          الكل
        </button>
        {BOOKS.map(b => (
          <button
            key={b.slug}
            onClick={() => setSelectedBook(sb => sb?.slug === b.slug ? null : b)}
            className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: selectedBook?.slug === b.slug ? b.iconBg : 'rgba(193,154,107,0.1)',
              color: selectedBook?.slug === b.slug ? '#fff' : (isDark ? '#C19A6B' : '#7A4F1E'),
            }}
          >
            {b.name.replace('صحيح ', '').replace('سنن ', '').replace('جامع ', '')}
          </button>
        ))}
      </div>

      <SearchResults query={query} book={selectedBook} onOpenBook={onOpenBook} />
    </div>
  );
}

/* ── Main page ── */
export function Hadith() {
  const [selected, setSelected] = useState<Book | null>(null);
  const [initHadithNum, setInitHadithNum] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<'books' | 'search'>('books');
  const isDark = useDarkMode();

  const openBook = useCallback((b: Book, hadithNum?: number) => {
    setSelected(b);
    setInitHadithNum(hadithNum);
    setTab('books');
  }, []);

  const handleBack = () => {
    setSelected(null);
    setInitHadithNum(undefined);
  };

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0 sticky top-0 z-50">
        {selected ? (
          <button onClick={handleBack} className="p-2 bg-secondary rounded-full hover-elevate" data-testid="button-back-to-books">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/more">
            <button className="p-2 bg-secondary rounded-full hover-elevate" data-testid="button-nav-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {selected ? selected.name : 'الأحاديث الشريفة'}
          </h1>
          {!selected && (
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              كتب الحديث الكبرى
            </p>
          )}
        </div>
      </div>

      {/* Tabs (only when no book selected) */}
      {!selected && (
        <div
          className="flex border-b border-border px-4 pt-1"
          style={{ background: isDark ? 'rgba(15,12,7,0.95)' : 'rgba(253,251,245,0.95)' }}
        >
          {([['books', <BookOpen className="w-4 h-4" />, 'الكتب'], ['search', <Search className="w-4 h-4" />, 'البحث']] as const).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t as 'books' | 'search')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-all border-b-2"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                borderColor: tab === t ? '#C19A6B' : 'transparent',
                color: tab === t ? '#C19A6B' : (isDark ? 'rgba(193,154,107,0.5)' : 'rgba(100,60,20,0.5)'),
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.slug} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <HadithReader book={selected} onBack={handleBack} initialHadithNum={initHadithNum} />
              </motion.div>
            ) : tab === 'books' ? (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-5 text-center">
                  <p className="text-2xl font-black text-primary" style={{ fontFamily: '"Amiri", serif' }}>
                    الأحاديث النبوية الشريفة
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    اختر كتاباً للقراءة
                  </p>
                </div>
                <BookList onSelect={b => openBook(b)} />
                <div className="mt-6 mb-4 text-center px-2">
                  <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
                  <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
                    إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى ۝ متفق عليه
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlobalSearch onOpenBook={openBook} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
