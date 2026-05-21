import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ChevronRight, RotateCcw, CheckCircle, Award, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { SURAH_NAMES } from '@/lib/constants';
import { useUserSetting } from '@/hooks/use-user-setting';

const SURAH_AYAH_COUNT: Record<number, number> = {
  1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,
  11:123,12:111,13:43,14:52,15:99,16:128,17:111,18:110,19:98,20:135,
  21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,30:60,
  31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,
  41:54,42:53,43:89,44:59,45:37,46:35,47:38,48:29,49:18,50:45,
  51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,60:13,
  61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,
  71:28,72:28,73:20,74:56,75:40,76:31,77:50,78:40,79:46,80:42,
  81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,
  91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,
  101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,
  111:5,112:4,113:5,114:6,
};

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

type WordStatus = 'pending' | 'correct' | 'wrong' | 'current';

interface AyahResult {
  verseKey: string;
  text: string;
  words: string[];
  wordStatuses: WordStatus[];
  done: boolean;
}

const isNative = Capacitor.isNativePlatform();

let SpeechRecognitionPlugin: any = null;
if (isNative) {
  import('@capacitor-community/speech-recognition')
    .then(m => { SpeechRecognitionPlugin = m.SpeechRecognition; })
    .catch(() => {});
}

function matchTranscriptToAyah(transcript: string, ayah: AyahResult): AyahResult {
  const recognized = tokenize(normalizeArabic(transcript));
  const expected = ayah.words.map(w => normalizeArabic(w));
  const statuses: WordStatus[] = ayah.words.map(() => 'pending');

  let ri = 0;
  for (let ei = 0; ei < expected.length; ei++) {
    if (ri >= recognized.length) {
      statuses[ei] = ei === ri ? 'current' : 'pending';
      continue;
    }
    if (recognized[ri] === expected[ei]) {
      statuses[ei] = 'correct';
    } else {
      const ahead = recognized.slice(ri, ri + 5);
      const found = ahead.indexOf(expected[ei]);
      if (found !== -1) {
        statuses[ei] = 'correct';
        ri += found;
      } else {
        statuses[ei] = 'wrong';
      }
    }
    ri++;
  }
  const firstPending = statuses.indexOf('pending');
  if (firstPending !== -1) statuses[firstPending] = 'current';
  return { ...ayah, wordStatuses: statuses };
}

function WordSpan({ word, status, dark }: { word: string; status: WordStatus; dark: boolean }) {
  const colors: Record<WordStatus, string> = {
    correct: '#22c55e',
    wrong:   '#ef4444',
    current: '#C19A6B',
    pending: dark ? 'rgba(232,216,176,0.55)' : 'rgba(61,42,14,0.55)',
  };
  const bg: Record<WordStatus, string> = {
    correct: 'rgba(34,197,94,0.12)',
    wrong:   'rgba(239,68,68,0.12)',
    current: 'rgba(193,154,107,0.18)',
    pending: 'transparent',
  };
  return (
    <motion.span
      layout
      animate={{ color: colors[status], backgroundColor: bg[status] }}
      transition={{ duration: 0.25 }}
      className="inline-block rounded-md px-1 mx-0.5 my-0.5"
      style={{
        fontFamily: '"Scheherazade New","Amiri Quran","Amiri",serif',
        fontSize: '1.45rem',
        lineHeight: 2.2,
        direction: 'rtl',
        fontWeight: status === 'current' ? 700 : 400,
      }}
    >
      {word}
    </motion.span>
  );
}

function ScoreRing({ score, dark }: { score: number; dark: boolean }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#C19A6B' : '#ef4444';
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none"
        stroke={dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.15)'} strokeWidth="8" />
      <motion.circle cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <text x="55" y="59" textAnchor="middle"
        style={{ fontFamily: '"Tajawal",sans-serif', fontSize: 18, fontWeight: 700, fill: color }}>
        {score}%
      </text>
    </svg>
  );
}

export function QuranRecitation() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [surah, setSurah] = useState(18);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(10);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ayahs, setAyahs] = useState<AyahResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showText, setShowText] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);
  const [permError, setPermError] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentIdxRef = useRef(0);
  const isMounted = useRef(true);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const maxAyah = SURAH_AYAH_COUNT[surah] ?? 1;

  const handleSurahChange = (v: number) => {
    const max = SURAH_AYAH_COUNT[v] ?? 1;
    setSurah(v);
    setFromAyah(1);
    setToAyah(Math.min(10, max));
  };

  const loadAyahs = useCallback(async (s: number, from: number, to: number) => {
    const res = await fetch('/data/quran-uthmani-full.json');
    const data: { id: number; verse_key: string; text_uthmani: string }[] = await res.json();
    return data
      .filter(v => {
        const [sv, av] = v.verse_key.split(':').map(Number);
        return sv === s && av >= from && av <= to;
      })
      .map((v, i) => {
        const text = v.text_uthmani.replace(/^\uFEFF/, '').trim();
        const words = tokenize(text);
        const wordStatuses: WordStatus[] = words.map((_, wi) => (i === 0 && wi === 0 ? 'current' : 'pending'));
        return { verseKey: v.verse_key, text, words, wordStatuses, done: false };
      });
  }, []);

  const handleStart = async () => {
    setLoading(true);
    const data = await loadAyahs(surah, fromAyah, toAyah);
    setAyahs(data);
    setCurrentIdx(0);
    setSessionDone(false);
    setLiveTranscript('');
    setPermError(false);
    setLoading(false);
    setStarted(true);
  };

  const stopListening = useCallback(async () => {
    setIsListening(false);
    if (isNative && SpeechRecognitionPlugin) {
      try {
        await SpeechRecognitionPlugin.stop();
        SpeechRecognitionPlugin.removeAllListeners();
      } catch {}
    } else {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) { await stopListening(); return; }
    setLiveTranscript('');
    setPermError(false);

    if (isNative && SpeechRecognitionPlugin) {
      const { speechRecognition } = await SpeechRecognitionPlugin.checkPermissions().catch(() => ({ speechRecognition: 'denied' }));
      if (speechRecognition !== 'granted') {
        const res = await SpeechRecognitionPlugin.requestPermissions().catch(() => ({ speechRecognition: 'denied' }));
        if (res.speechRecognition !== 'granted') { setPermError(true); return; }
      }
      setIsListening(true);
      try {
        await SpeechRecognitionPlugin.start({ language: 'ar-SA', maxResults: 5, partialResults: true, popup: false, preferOffline: true });
        SpeechRecognitionPlugin.addListener('partialResults', (d: { matches: string[] }) => {
          if (!isMounted.current) return;
          const t = d.matches?.[0] ?? '';
          setLiveTranscript(t);
          setAyahs(prev => {
            const idx = currentIdxRef.current;
            const updated = [...prev];
            updated[idx] = matchTranscriptToAyah(t, updated[idx]);
            return updated;
          });
        });
      } catch { setIsListening(false); }
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { setPermError(true); return; }
      const rec = new SR();
      rec.lang = 'ar-SA';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        if (!isMounted.current) return;
        let t = '';
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
        t = t.trim();
        setLiveTranscript(t);
        setAyahs(prev => {
          const idx = currentIdxRef.current;
          const updated = [...prev];
          updated[idx] = matchTranscriptToAyah(t, updated[idx]);
          return updated;
        });
      };
      rec.onerror = () => { if (isMounted.current) setIsListening(false); };
      rec.onend = () => { if (isMounted.current) setIsListening(false); };
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    }
  }, [isListening, stopListening]);

  const handleNextAyah = useCallback(async () => {
    await stopListening();
    setLiveTranscript('');
    let nextIdx = -1;
    setAyahs(prev => {
      const updated = [...prev];
      const cur = { ...updated[currentIdxRef.current] };
      cur.wordStatuses = cur.wordStatuses.map(s => (s === 'pending' || s === 'current' ? 'wrong' : s));
      cur.done = true;
      updated[currentIdxRef.current] = cur;
      nextIdx = currentIdxRef.current + 1;
      if (nextIdx < updated.length) {
        const next = { ...updated[nextIdx] };
        next.wordStatuses = next.words.map((_, i) => (i === 0 ? 'current' : 'pending'));
        updated[nextIdx] = next;
      }
      return updated;
    });
    setTimeout(() => {
      const next = currentIdxRef.current + 1;
      if (next >= ayahs.length) {
        setSessionDone(true);
      } else {
        setCurrentIdx(next);
      }
    }, 50);
  }, [ayahs.length, stopListening]);

  useEffect(() => {
    return () => {
      if (isNative && SpeechRecognitionPlugin) {
        SpeechRecognitionPlugin.stop().catch(() => {});
        SpeechRecognitionPlugin.removeAllListeners();
      } else {
        recognitionRef.current?.stop();
      }
    };
  }, []);

  const gold = '#C19A6B';
  const bg = dark ? '#0f0c07' : '#fdfbf0';
  const cardBg = dark ? '#1a1208' : '#ffffff';
  const border = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.25)';
  const textColor = dark ? '#e8d8b0' : '#3d2a0e';
  const mutedColor = dark ? 'rgba(232,216,176,0.45)' : 'rgba(61,42,14,0.4)';

  const totalWords = ayahs.reduce((s, a) => s + a.words.length, 0);
  const correctWords = ayahs.reduce((s, a) => s + a.wordStatuses.filter(w => w === 'correct').length, 0);
  const wrongWords = ayahs.reduce((s, a) => s + a.wordStatuses.filter(w => w === 'wrong').length, 0);
  const score = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

  /* ── SETUP SCREEN ── */
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: bg, direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={() => navigate('/quran')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)', color: gold }}>
            <ArrowRight size={18} />
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
            تسميع القرآن الكريم
          </h1>
        </div>

        <div className="flex-1 flex flex-col gap-4 px-4 pt-2 pb-8">
          {/* Icon */}
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)' }}>
              <Mic size={36} color="#fff" />
            </div>
            <p className="text-base font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
              اختار السورة والآيات
            </p>
            <p className="text-sm mt-1 text-center" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
              ثم اضغط ابدأ واقرأ بصوتك — التطبيق يصحح لك كلمة بكلمة
            </p>
          </div>

          {/* Surah select */}
          <div className="rounded-2xl border p-4" style={{ background: cardBg, borderColor: border }}>
            <label className="text-sm font-bold mb-2 block" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
              السورة
            </label>
            <select
              value={surah}
              onChange={e => handleSurahChange(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2.5 text-base outline-none"
              style={{
                fontFamily: '"Tajawal",sans-serif',
                background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.07)',
                border: `1px solid ${border}`,
                color: textColor,
                direction: 'rtl',
              }}
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}. {SURAH_NAMES[n]}</option>
              ))}
            </select>
          </div>

          {/* Ayah range */}
          <div className="rounded-2xl border p-4 flex gap-3" style={{ background: cardBg, borderColor: border }}>
            <div className="flex-1">
              <label className="text-sm font-bold mb-2 block" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                من الآية
              </label>
              <select
                value={fromAyah}
                onChange={e => {
                  const v = Number(e.target.value);
                  setFromAyah(v);
                  if (toAyah < v) setToAyah(v);
                }}
                className="w-full rounded-xl px-3 py-2.5 text-base outline-none"
                style={{ fontFamily: '"Tajawal",sans-serif', background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.07)', border: `1px solid ${border}`, color: textColor }}
              >
                {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold mb-2 block" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                إلى الآية
              </label>
              <select
                value={toAyah}
                onChange={e => setToAyah(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-base outline-none"
                style={{ fontFamily: '"Tajawal",sans-serif', background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.07)', border: `1px solid ${border}`, color: textColor }}
              >
                {Array.from({ length: maxAyah - fromAyah + 1 }, (_, i) => fromAyah + i).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl border p-4 flex items-start gap-3"
            style={{ background: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)', borderColor: 'rgba(193,154,107,0.2)' }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <div>
              <p className="text-sm font-bold mb-1" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
                تعليمات الاستخدام
              </p>
              <p className="text-xs leading-relaxed" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                اقرأ الآية بصوت واضح — التطبيق يلوّن كل كلمة:<br />
                🟢 صح &nbsp;&nbsp; 🔴 غلط &nbsp;&nbsp; 🟡 الكلمة الحالية<br />
                اضغط "التالية" للانتقال للآية التالية.
              </p>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-opacity active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #a07a4a)',
              color: '#fff',
              fontFamily: '"Tajawal",sans-serif',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'جاري التحميل...' : 'ابدأ التسميع ←'}
          </button>
        </div>
      </div>
    );
  }

  /* ── RESULTS SCREEN ── */
  if (sessionDone) {
    return (
      <div className="min-h-screen flex flex-col pb-8" style={{ background: bg, direction: 'rtl' }}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={() => { setStarted(false); setSessionDone(false); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)', color: gold }}>
            <RotateCcw size={16} />
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
            نتيجة التسميع
          </h1>
        </div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center py-6 mx-4 rounded-3xl mb-4"
          style={{ background: cardBg, border: `1px solid ${border}` }}
        >
          <ScoreRing score={score} dark={dark} />
          <p className="mt-3 text-2xl font-black" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
            {score >= 80 ? 'ممتاز! 🌟' : score >= 60 ? 'جيد جداً 👍' : score >= 40 ? 'يحتاج مراجعة 📖' : 'تحتاج تدريب أكثر 💪'}
          </p>
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{correctWords}</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>كلمة صح</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{wrongWords}</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>كلمة غلط</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: gold }}>{totalWords}</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>إجمالي</p>
            </div>
          </div>
        </motion.div>

        {/* Ayah breakdown */}
        <div className="px-4 flex flex-col gap-3">
          <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
            تفاصيل الآيات
          </p>
          {ayahs.map((ayah, idx) => {
            const cor = ayah.wordStatuses.filter(s => s === 'correct').length;
            const wrn = ayah.wordStatuses.filter(s => s === 'wrong').length;
            const [, av] = ayah.verseKey.split(':');
            return (
              <div key={ayah.verseKey} className="rounded-2xl border p-4"
                style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: gold }}>
                    آية {av}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <span style={{ color: '#22c55e' }}>✓{cor}</span>
                    <span style={{ color: '#ef4444' }}>✗{wrn}</span>
                  </div>
                </div>
                <p className="leading-loose flex flex-wrap" style={{ direction: 'rtl' }}>
                  {ayah.words.map((w, wi) => (
                    <WordSpan key={wi} word={w} status={ayah.wordStatuses[wi]} dark={dark} />
                  ))}
                </p>
              </div>
            );
          })}
        </div>

        {/* Retry buttons */}
        <div className="px-4 mt-6 flex gap-3">
          <button
            onClick={() => { setStarted(false); setSessionDone(false); }}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'rgba(193,154,107,0.12)', color: gold, fontFamily: '"Tajawal",sans-serif' }}
          >
            ← تغيير الآيات
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', fontFamily: '"Tajawal",sans-serif' }}
          >
            إعادة التسميع
          </button>
        </div>
      </div>
    );
  }

  /* ── SESSION SCREEN ── */
  const currentAyah = ayahs[currentIdx];
  const [, ayahNum] = (currentAyah?.verseKey ?? ':').split(':');

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: bg, direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => { stopListening(); setStarted(false); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)', color: gold }}>
            <ArrowRight size={18} />
          </button>
          <div>
            <p className="font-bold text-base leading-tight" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
              {SURAH_NAMES[surah]}
            </p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
              آية {fromAyah} — {toAyah}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowText(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.1)', color: gold }}>
            {showText ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <div className="rounded-full px-3 py-1"
            style={{ background: 'rgba(193,154,107,0.12)', fontFamily: '"Tajawal",sans-serif', fontSize: 13, color: gold, fontWeight: 700 }}>
            {currentIdx + 1} / {ayahs.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(193,154,107,0.15)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #C19A6B, #a07a4a)' }}
          animate={{ width: `${((currentIdx) / ayahs.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Ayahs list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {/* Done ayahs (above current) */}
        {ayahs.slice(0, currentIdx).map((ayah) => {
          const [, av] = ayah.verseKey.split(':');
          const cor = ayah.wordStatuses.filter(s => s === 'correct').length;
          const tot = ayah.words.length;
          return (
            <div key={ayah.verseKey} className="rounded-2xl border p-3 opacity-60"
              style={{ background: cardBg, borderColor: border }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: gold }}>آية {av}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} color="#22c55e" />
                  <span className="text-xs" style={{ color: '#22c55e', fontFamily: '"Tajawal",sans-serif' }}>{cor}/{tot}</span>
                </div>
              </div>
              <p className="leading-loose flex flex-wrap text-sm" style={{ direction: 'rtl' }}>
                {ayah.words.map((w, wi) => (
                  <WordSpan key={wi} word={w} status={ayah.wordStatuses[wi]} dark={dark} />
                ))}
              </p>
            </div>
          );
        })}

        {/* Current ayah */}
        {currentAyah && (
          <motion.div
            key={currentAyah.verseKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 p-4 shadow-lg"
            style={{
              background: cardBg,
              borderColor: isListening ? '#C19A6B' : border,
              boxShadow: isListening ? '0 0 0 3px rgba(193,154,107,0.15)' : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: gold }}>
                الآية {ayahNum}
              </span>
              {isListening && (
                <motion.div className="flex items-center gap-1.5"
                  animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal",sans-serif', color: '#ef4444' }}>يستمع...</span>
                </motion.div>
              )}
            </div>

            {showText ? (
              <p className="leading-loose flex flex-wrap" style={{ direction: 'rtl' }}>
                {currentAyah.words.map((w, wi) => (
                  <WordSpan key={wi} word={w} status={currentAyah.wordStatuses[wi]} dark={dark} />
                ))}
              </p>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                  النص مخفي — اقرأ من حفظك
                </p>
              </div>
            )}

            {/* Live transcript */}
            {liveTranscript !== '' && (
              <div className="mt-3 rounded-xl px-3 py-2"
                style={{ background: 'rgba(193,154,107,0.08)', border: '1px solid rgba(193,154,107,0.15)' }}>
                <p className="text-xs mb-0.5" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>تعرفت على:</p>
                <p className="text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor, direction: 'rtl' }}>
                  {liveTranscript}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Upcoming ayahs */}
        {ayahs.slice(currentIdx + 1, currentIdx + 3).map((ayah) => {
          const [, av] = ayah.verseKey.split(':');
          return (
            <div key={ayah.verseKey} className="rounded-2xl border p-3 opacity-30"
              style={{ background: cardBg, borderColor: border }}>
              <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal",sans-serif', color: gold }}>آية {av}</p>
              <p className="text-base leading-loose" style={{ fontFamily: '"Scheherazade New","Amiri",serif', color: textColor, direction: 'rtl' }}>
                {ayah.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Permission error */}
      {permError && (
        <div className="mx-4 mb-2 rounded-xl px-4 py-3 text-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: '#ef4444' }}>
            {isNative
              ? 'يجب السماح للتطبيق باستخدام الميكروفون من إعدادات الجهاز'
              : 'متصفحك لا يدعم التعرف على الصوت — يعمل بالكامل على APK الأندرويد'}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 pb-6 pt-2 flex gap-3 flex-shrink-0">
        {/* Mic button */}
        <motion.button
          onPointerDown={() => { try { navigator.vibrate?.(15); } catch (_) {} }}
          onClick={startListening}
          whileTap={{ scale: 0.93 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #C19A6B, #a07a4a)',
            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.35)' : '0 4px 16px rgba(193,154,107,0.3)',
          }}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <MicOff size={24} color="#fff" />
              </motion.div>
            ) : (
              <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Mic size={24} color="#fff" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Next ayah button */}
        <button
          onClick={handleNextAyah}
          className="flex-1 h-16 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.1)',
            border: `1.5px solid ${border}`,
            color: gold,
            fontFamily: '"Tajawal",sans-serif',
          }}
        >
          {currentIdx + 1 >= ayahs.length ? (
            <><Award size={18} /> عرض النتيجة</>
          ) : (
            <>الآية التالية <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
