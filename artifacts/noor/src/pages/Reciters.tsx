import { useState, useEffect } from 'react';
import { useReciters } from '@/hooks/use-api';
import { ArrowLeft, Search, ChevronRight, Download, Heart, Star, Loader2, X, WifiOff } from 'lucide-react';
import { Link } from 'wouter';
import { useAudio } from '@/contexts/AudioContext';
import { SURAH_NAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getOrCreateLocalUid } from '@/lib/rtdb';
import { getSettingCache, queueRTDBUpdate, getCurrentUid } from '@/lib/rtdb';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { useTheme } from 'next-themes';

type FavoriteReciter = {
  key: string;
  reciterId: string;
  name: string;
  server: string;
  moshafName: string;
  country?: string;
};

type FavoritesMap = Record<string, FavoriteReciter>;

type FavoriteSurah = {
  surahNum: number;
  surahName: string;
  reciterId: string;
  reciterName: string;
  serverUrl: string;
};

type FavoriteSurahsMap = Record<number, FavoriteSurah>;

function favKey(reciterId: string | number, moshafIdx: number): string {
  return `${reciterId}-${moshafIdx}`;
}

function loadFavorites(): FavoritesMap {
  const raw = getSettingCache<FavoritesMap | null>('favorite_reciters', null);
  return raw ?? {};
}

function saveFavorites(next: FavoritesMap) {
  const uid = getCurrentUid() || getOrCreateLocalUid();
  if (!uid) return;
  queueRTDBUpdate(uid, { 'settings/favorite_reciters': next });
}

function loadFavoriteSurahs(): FavoriteSurahsMap {
  const raw = getSettingCache<FavoriteSurahsMap | null>('favorite_surahs', null);
  return raw ?? {};
}

function saveFavoriteSurahs(next: FavoriteSurahsMap) {
  const uid = getCurrentUid() || getOrCreateLocalUid();
  if (!uid) return;
  queueRTDBUpdate(uid, { 'settings/favorite_surahs': next });
}

type Phase = 'reciters' | 'surahs' | 'player';

const SURAH_AYAHS: Record<number, number> = {
  1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,
  16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,
  30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,
  45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,
  60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,
  75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,
  90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,
  105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6,
};

// Country name → ISO 2-letter code (lowercase, for flagcdn.com)
const COUNTRY_CODES: Record<string, string> = {
  'مصر': 'eg', 'EG': 'eg', 'Egypt': 'eg',
  'المملكة العربية السعودية': 'sa', 'السعودية': 'sa', 'SA': 'sa', 'Saudi Arabia': 'sa',
  'الكويت': 'kw', 'KW': 'kw', 'Kuwait': 'kw',
  'الإمارات': 'ae', 'الإمارات العربية المتحدة': 'ae', 'AE': 'ae', 'UAE': 'ae',
  'قطر': 'qa', 'QA': 'qa', 'Qatar': 'qa',
  'البحرين': 'bh', 'BH': 'bh', 'Bahrain': 'bh',
  'عمان': 'om', 'OM': 'om', 'Oman': 'om',
  'اليمن': 'ye', 'YE': 'ye', 'Yemen': 'ye',
  'سوريا': 'sy', 'SY': 'sy', 'Syria': 'sy',
  'ليبيا': 'ly', 'LY': 'ly', 'Libya': 'ly',
  'تونس': 'tn', 'TN': 'tn', 'Tunisia': 'tn',
  'الجزائر': 'dz', 'DZ': 'dz', 'Algeria': 'dz',
  'المغرب': 'ma', 'MA': 'ma', 'Morocco': 'ma',
  'السودان': 'sd', 'SD': 'sd', 'Sudan': 'sd',
  'العراق': 'iq', 'IQ': 'iq', 'Iraq': 'iq',
  'الأردن': 'jo', 'JO': 'jo', 'Jordan': 'jo',
  'فلسطين': 'ps', 'PS': 'ps', 'Palestine': 'ps',
  'لبنان': 'lb', 'LB': 'lb', 'Lebanon': 'lb',
  'موريتانيا': 'mr', 'MR': 'mr', 'Mauritania': 'mr',
  'باكستان': 'pk', 'PK': 'pk', 'Pakistan': 'pk',
  'تركيا': 'tr', 'TR': 'tr', 'Turkey': 'tr',
  'ماليزيا': 'my', 'MY': 'my', 'Malaysia': 'my',
  'إندونيسيا': 'id', 'ID': 'id', 'Indonesia': 'id',
  'نيجيريا': 'ng', 'NG': 'ng', 'Nigeria': 'ng',
  'الصومال': 'so', 'SO': 'so', 'Somalia': 'so',
  'غامبيا': 'gm', 'GM': 'gm', 'Gambia': 'gm',
  'السنغال': 'sn', 'SN': 'sn', 'Senegal': 'sn',
  'ليبيريا': 'lr', 'LR': 'lr', 'Liberia': 'lr',
  'غانا': 'gh', 'GH': 'gh', 'Ghana': 'gh',
  'تنزانيا': 'tz', 'TZ': 'tz', 'Tanzania': 'tz',
  'إثيوبيا': 'et', 'ET': 'et', 'Ethiopia': 'et',
  'كندا': 'ca', 'CA': 'ca', 'Canada': 'ca',
  'الولايات المتحدة': 'us', 'US': 'us', 'USA': 'us', 'United States': 'us',
  'بريطانيا': 'gb', 'GB': 'gb', 'United Kingdom': 'gb',
  'فرنسا': 'fr', 'FR': 'fr', 'France': 'fr',
  'غينيا': 'gn', 'Guinea': 'gn',
  'روسيا': 'ru', 'Russia': 'ru',
  'ميانمار': 'mm', 'Myanmar': 'mm',
  'أفغانستان': 'af', 'Afghanistan': 'af',
  'قيرغيزستان': 'kg', 'Kyrgyzstan': 'kg',
};

// Reciter ID → ISO 2-letter code — verified for all 238 reciters from mp3quran.net
const RECITER_ID_CODES: Record<number, string> = {
  // السعودية
  1: 'sa', 2: 'sa', 3: 'sa', 4: 'sa', 5: 'sa', 6: 'sa',
  19: 'sa', 20: 'sa', 21: 'sa', 23: 'sa', 29: 'sa', 30: 'sa',
  31: 'sa', 32: 'sa', 34: 'sa', 35: 'sa', 40: 'sa', 41: 'sa',
  42: 'sa', 43: 'sa', 49: 'sa', 54: 'sa', 56: 'sa', 57: 'sa',
  58: 'sa', 59: 'sa', 60: 'sa', 61: 'sa', 62: 'sa', 66: 'sa',
  67: 'sa', 68: 'sa', 69: 'sa', 73: 'sa', 74: 'sa', 76: 'sa',
  79: 'sa', 82: 'sa', 85: 'sa', 87: 'sa', 88: 'sa', 89: 'sa',
  91: 'sa', 92: 'sa', 93: 'sa', 97: 'sa', 102: 'sa', 105: 'sa',
  107: 'sa', 108: 'sa', 109: 'sa', 110: 'sa', 116: 'sa', 135: 'sa',
  136: 'sa', 139: 'sa', 160: 'sa', 162: 'sa', 164: 'sa', 165: 'sa',
  166: 'sa', 167: 'sa', 178: 'sa', 181: 'sa', 197: 'sa', 198: 'sa',
  204: 'sa', 205: 'sa', 212: 'sa', 217: 'sa', 218: 'sa', 226: 'sa',
  230: 'sa', 236: 'sa', 240: 'sa', 243: 'sa', 244: 'sa', 245: 'sa',
  247: 'sa', 250: 'sa', 251: 'sa', 252: 'sa', 254: 'sa', 255: 'sa',
  257: 'sa', 259: 'sa', 260: 'sa', 263: 'sa', 285: 'sa', 290: 'sa',
  300: 'sa', 303: 'sa', 304: 'sa', 307: 'sa',
  21136: 'sa', 21183: 'sa', 21184: 'sa', 21187: 'sa', 21188: 'sa',
  21191: 'sa', 21193: 'sa',
  // مصر
  7: 'eg', 8: 'eg', 9: 'eg', 11: 'eg', 15: 'eg', 22: 'eg',
  36: 'eg', 37: 'eg', 39: 'eg', 48: 'eg', 50: 'eg', 51: 'eg',
  106: 'eg', 111: 'eg', 112: 'eg', 118: 'eg', 121: 'eg', 125: 'eg',
  150: 'eg', 151: 'eg', 203: 'eg', 241: 'eg', 253: 'eg', 267: 'eg',
  277: 'eg', 278: 'eg', 287: 'eg',
  // الكويت
  44: 'kw', 55: 'kw', 83: 'kw', 86: 'kw', 94: 'kw', 100: 'kw',
  123: 'kw', 202: 'kw', 231: 'kw', 248: 'kw', 301: 'kw', 306: 'kw',
  // المغرب
  12: 'ma', 16: 'ma', 63: 'ma', 80: 'ma', 126: 'ma', 208: 'ma',
  264: 'ma', 281: 'ma', 305: 'ma', 21148: 'ma', 21181: 'ma',
  // الجزائر
  14: 'dz', 26: 'dz', 27: 'dz', 28: 'dz', 81: 'dz', 129: 'dz',
  137: 'dz', 227: 'dz',
  // تونس
  96: 'tn', 163: 'tn', 201: 'tn', 207: 'tn', 265: 'tn',
  // الإمارات
  24: 'ae', 46: 'ae', 84: 'ae', 95: 'ae',
  // اليمن
  10: 'ye', 219: 'ye', 225: 'ye', 246: 'ye', 21182: 'ye', 21197: 'ye',
  // السودان
  13: 'sd', 18: 'sd', 98: 'sd', 138: 'sd', 188: 'sd', 191: 'sd',
  192: 'sd', 211: 'sd', 279: 'sd', 286: 'sd',
  // العراق
  38: 'iq', 90: 'iq', 104: 'iq', 127: 'iq', 209: 'iq', 221: 'iq', 268: 'iq',
  // لبنان
  17: 'lb',
  // ليبيا
  159: 'ly',
  // إندونيسيا
  128: 'id', 153: 'id',
  // ماليزيا
  154: 'my', 183: 'my', 184: 'my', 185: 'my', 189: 'my',
  // باكستان
  64: 'pk', 71: 'pk', 206: 'pk', 216: 'pk', 229: 'pk',
  // كندا
  25: 'ca',
  // سوريا
  149: 'sy', 237: 'sy',
  // نيجيريا
  161: 'ng', 193: 'ng',
  // فلسطين
  256: 'ps', 273: 'ps', 274: 'ps',
  // قطر
  77: 'qa', 302: 'qa',
  // غينيا
  70: 'gn', 275: 'gn',
  // الصومال
  194: 'so',
  // الأردن
  152: 'jo',
  // موريتانيا
  47: 'mr', 115: 'mr', 134: 'mr', 190: 'mr', 271: 'mr', 280: 'mr', 284: 'mr',
  // السنغال
  187: 'sn', 288: 'sn',
  // أفغانستان
  272: 'af', 282: 'af', 283: 'af', 289: 'af',
  // روسيا (داغستان)
  33: 'ru',
  // ميانمار (أراكان / الروهينغا)
  72: 'mm', 228: 'mm',
  // إثيوبيا
  21186: 'et',
  // قيرغيزستان
  21196: 'kg',
};

function getCountryCode(country?: string, name?: string, id?: string | number): string | null {
  // 1. Try ID-based lookup (most reliable)
  if (id !== undefined) {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const code = RECITER_ID_CODES[numId];
    if (code) return code;
  }
  // 2. Try country field from API
  if (country) {
    const code = COUNTRY_CODES[country] ?? COUNTRY_CODES[country.trim()];
    if (code) return code;
  }
  return null;
}

function FlagImg({ code, className = '', style = {} }: { code: string | null; className?: string; style?: React.CSSProperties }) {
  if (!code) {
    return (
      <div className={`flex items-center justify-center bg-primary/10 ${className}`} style={style}>
        <span className="text-xl">🌍</span>
      </div>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
      alt={code}
      className={`object-cover ${className}`}
      style={style}
      onError={e => {
        const el = e.currentTarget.parentElement;
        if (el) el.innerHTML = '<span style="font-size:1.25rem">🌍</span>';
      }}
    />
  );
}

// Beautiful Islamic geometric disc for the player
function IslamicDisc({ isPlaying, surahName }: { isPlaying?: boolean; surahName?: string }) {
  const star8 = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? 62 : 36;
    const angle = (i * 22.5 - 90) * Math.PI / 180;
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
  }).join(' ');

  const star12 = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 === 0 ? 80 : 72;
    const angle = (i * 15 - 90) * Math.PI / 180;
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={isPlaying ? { animation: 'spin 12s linear infinite' } : {}}
    >
      <defs>
        <radialGradient id="discGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2e2008" />
          <stop offset="100%" stopColor="#0f0a03" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx="100" cy="100" r="100" fill="url(#discGrad)" />

      {/* Outer rings */}
      <circle cx="100" cy="100" r="97" fill="none" stroke="#C19A6B" strokeWidth="1.5" opacity="0.4" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#C19A6B" strokeWidth="0.5" opacity="0.2" />

      {/* 24 tick marks on outer band */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i * 15 - 90) * Math.PI / 180;
        const long = i % 6 === 0;
        const r1 = 90, r2 = long ? 97 : 94;
        return (
          <line key={i}
            x1={100 + r1 * Math.cos(angle)} y1={100 + r1 * Math.sin(angle)}
            x2={100 + r2 * Math.cos(angle)} y2={100 + r2 * Math.sin(angle)}
            stroke="#C19A6B" strokeWidth={long ? 2 : 1} opacity={long ? 0.7 : 0.35}
            strokeLinecap="round"
          />
        );
      })}

      {/* 12-point outer star */}
      <polygon points={star12} fill="rgba(193,154,107,0.07)" stroke="#C19A6B" strokeWidth="1" opacity="0.4" />

      {/* Two overlapping squares (Islamic geometric base) */}
      <rect x="37" y="37" width="126" height="126" transform="rotate(0,100,100)"
        fill="none" stroke="#C19A6B" strokeWidth="0.7" opacity="0.18" />
      <rect x="37" y="37" width="126" height="126" transform="rotate(45,100,100)"
        fill="none" stroke="#C19A6B" strokeWidth="0.7" opacity="0.18" />


      {/* 4 lines crossing (Islamic cross pattern) */}
      {[0, 45, 90, 135].map(deg => {
        const a = deg * Math.PI / 180;
        return (
          <line key={deg}
            x1={100 + 36 * Math.cos(a)} y1={100 + 36 * Math.sin(a)}
            x2={100 - 36 * Math.cos(a)} y2={100 - 36 * Math.sin(a)}
            stroke="#C19A6B" strokeWidth="0.5" opacity="0.2"
          />
        );
      })}

      {/* Inner circle with glow */}
      <circle cx="100" cy="100" r="30" fill="rgba(193,154,107,0.15)" stroke="#C19A6B" strokeWidth="1.5" opacity="0.8" />
      <circle cx="100" cy="100" r="22" fill="rgba(193,154,107,0.08)" stroke="#C19A6B" strokeWidth="1" opacity="0.5" />

      {/* Arabesque petals (8 small arcs around center) */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 - 90) * Math.PI / 180;
        const cx2 = 100 + 22 * Math.cos(angle);
        const cy2 = 100 + 22 * Math.sin(angle);
        return (
          <ellipse key={i} cx={cx2} cy={cy2} rx="5" ry="8"
            transform={`rotate(${i * 45}, ${cx2}, ${cy2})`}
            fill="rgba(193,154,107,0.2)" stroke="#C19A6B" strokeWidth="0.7" opacity="0.6"
          />
        );
      })}

      {/* Surah name in center */}
      {surahName && (
        <text x="100" y="100" textAnchor="middle" dominantBaseline="middle"
          style={{
            fontFamily: '"Amiri Quran", "Amiri", serif',
            fontSize: surahName.length <= 3 ? '24px' : surahName.length <= 5 ? '20px' : '16px',
            fill: '#d4b483',
            fontWeight: 'bold',
          }}>
          {surahName}
        </text>
      )}
    </svg>
  );
}

function fmtTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export function Reciters() {
  const { data: reciters, isLoading, isError } = useReciters();
  const audio = useAudio();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState<Phase>('reciters');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedReciter, setSelectedReciter] = useState<{
    id: string; name: string; server: string; moshafName: string; country?: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<FavoritesMap>(() => loadFavorites());
  const [favoriteSurahs, setFavoriteSurahs] = useState<FavoriteSurahsMap>(() => loadFavoriteSurahs());

  const isFav = (rid: string | number, mi: number) => !!favorites[favKey(rid, mi)];
  const isFavSurah = (surahNum: number) => !!favoriteSurahs[surahNum];

  const toggleFav = (r: any, moshaf: any, mi: number) => {
    const k = favKey(r.id, mi);
    setFavorites(prev => {
      const next = { ...prev };
      if (next[k]) {
        delete next[k];
      } else {
        next[k] = {
          key: k,
          reciterId: String(r.id),
          name: r.name,
          server: moshaf.server,
          moshafName: moshaf.name,
          country: r.country,
        };
      }
      saveFavorites(next);
      return next;
    });
  };

  const toggleFavSurah = () => {
    if (!audio.surahNum) return;
    const num = audio.surahNum;
    setFavoriteSurahs(prev => {
      const next = { ...prev };
      if (next[num]) {
        delete next[num];
      } else {
        next[num] = {
          surahNum: num,
          surahName: audio.surahName,
          reciterId: audio.reciterId,
          reciterName: audio.reciterName,
          serverUrl: audio.serverUrl,
        };
      }
      saveFavoriteSurahs(next);
      return next;
    });
  };

  const favoritesList = Object.values(favorites);
  const favoriteSurahsList = Object.values(favoriteSurahs).sort((a, b) => a.surahNum - b.surahNum);

  // On mount: if audio is already playing, jump straight to player
  useEffect(() => {
    if (audio.surahNum && audio.reciterId && audio.reciterName && audio.serverUrl) {
      setSelectedReciter({
        id: audio.reciterId,
        name: audio.reciterName,
        server: audio.serverUrl,
        moshafName: '',
        country: undefined,
      });
      setPhase('player');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = reciters?.filter((r: any) =>
    r.name.includes(search) || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectReciter = (r: any, moshaf: any) => {
    setSelectedReciter({ id: r.id, name: r.name, server: moshaf.server, moshafName: moshaf.name, country: r.country });
    setPhase('surahs');
  };

  const playSurah = (surahNum: number) => {
    if (!selectedReciter) return;
    const surahName = SURAH_NAMES[surahNum] ?? `سورة ${surahNum}`;
    audio.play({ reciterId: selectedReciter.id, reciterName: selectedReciter.name, serverUrl: selectedReciter.server, surahNum, surahName });
    setPhase('player');
  };

  const directMp3 = audio.serverUrl && audio.surahNum
    ? `${audio.serverUrl}${audio.surahNum.toString().padStart(3, '0')}.mp3`
    : null;

  const mp3Filename = audio.surahName && audio.reciterName
    ? `${audio.surahName} - ${audio.reciterName}.mp3`
    : 'surah.mp3';

  const handleDownload = async () => {
    if (!directMp3 || isDownloading) return;

    // فحص الاتصال بالإنترنت
    if (!navigator.onLine) {
      toast({
        title: 'لا يوجد اتصال بالإنترنت',
        description: 'تحقق من اتصالك بالإنترنت وحاول مجدداً',
        variant: 'destructive',
      });
      return;
    }

    if (Capacitor.isNativePlatform()) {
      // ── Capacitor Android/iOS: تحميل مع شريط تقدم ──────────────────
      setIsDownloading(true);
      setDownloadProgress(0);
      toast({ title: 'جاري التحميل...', description: `سورة ${audio.surahName || ''} - ${audio.reciterName}` });
      try {
        const response = await fetch(directMp3);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // قراءة البيانات مع تتبع التقدم
        const contentLength = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body!.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            setDownloadProgress(Math.round((received / contentLength) * 100));
          }
        }

        setDownloadProgress(95);

        // تجميع الأجزاء
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }

        // تحويل إلى base64 بطريقة فعّالة للملفات الكبيرة
        const CHUNK = 8192;
        let binary = '';
        for (let i = 0; i < merged.length; i += CHUNK) {
          binary += String.fromCharCode(...merged.subarray(i, i + CHUNK));
        }
        const base64 = btoa(binary);

        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: `نور/${mp3Filename}`,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });

        setDownloadProgress(100);
        toast({
          title: '✅ تم التحميل بنجاح',
          description: `حُفظت في المستندات / نور / ${mp3Filename}`,
        });
      } catch (err: any) {
        console.error('[Download]', err);
        const isOffline = !navigator.onLine || err?.message?.includes('Failed to fetch');
        toast({
          title: 'خطأ في التحميل',
          description: isOffline ? 'تحقق من اتصالك بالإنترنت وحاول مجدداً' : 'حدث خطأ أثناء التحميل، حاول مجدداً',
          variant: 'destructive',
        });
      } finally {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    } else {
      // ── متصفح الويب: استخدام endpoint التحميل ───────────────────────────
      const origin = window.location?.origin ?? '';
      const downloadUrl = `${origin}/api/download?url=${encodeURIComponent(directMp3)}&filename=${encodeURIComponent(mp3Filename)}`;
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = mp3Filename;
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
      toast({
        title: 'بدأ التحميل',
        description: `جاري تحميل سورة ${audio.surahName || ''}...`,
      });
    }
  };

  // ── PHASE: Reciters ──────────────────────────────────────────────────────
  if (phase === 'reciters') {
    return (
      <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0">
          <Link href="/more">
            <button className="p-2 bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>القراء والاستماع</h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{reciters?.length ?? 0} قارئ</p>
          </div>
        </div>

        <div className="p-4 border-b border-border bg-card flex-shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن قارئ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-2xl py-3 pr-10 pl-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-muted-foreground font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>جاري تحميل القراء...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif' }}>لا يوجد اتصال بالإنترنت</p>
                <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تحقق من اتصالك وأعد تحميل الصفحة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {/* ── السور المفضلة ──────────────────────────────── */}
              {favoriteSurahsList.length > 0 && search.trim() === '' && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    <h2 className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      السور المفضلة
                    </h2>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      ({favoriteSurahsList.length})
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {favoriteSurahsList.map(fs => (
                      <div
                        key={`favs-${fs.surahNum}`}
                        className="w-full bg-red-500/5 p-4 rounded-2xl border border-red-500/20 shadow-sm flex items-center justify-between"
                        data-testid={`fav-surah-row-${fs.surahNum}`}
                      >
                        <button
                          onClick={() => {
                            setSelectedReciter({
                              id: fs.reciterId,
                              name: fs.reciterName,
                              server: fs.serverUrl,
                              moshafName: '',
                              country: undefined,
                            });
                            const sName = SURAH_NAMES[fs.surahNum] ?? `سورة ${fs.surahNum}`;
                            audio.play({ reciterId: fs.reciterId, reciterName: fs.reciterName, serverUrl: fs.serverUrl, surahNum: fs.surahNum, surahName: sName });
                            setPhase('player');
                          }}
                          className="flex-1 flex items-center gap-3 text-right"
                        >
                          <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                            {fs.surahNum}
                          </div>
                          <div>
                            <p className="font-bold" style={{ fontFamily: '"Amiri", serif' }}>{fs.surahName}</p>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{fs.reciterName}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setFavoriteSurahs(prev => {
                              const next = { ...prev };
                              delete next[fs.surahNum];
                              saveFavoriteSurahs(next);
                              return next;
                            });
                          }}
                          className="p-2 rounded-full hover:bg-red-500/10 transition-colors"
                          data-testid={`button-unfav-surah-${fs.surahNum}`}
                          title="إزالة من المفضلة"
                        >
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── القراء المفضلين ──────────────────────────────── */}
              {favoritesList.length > 0 && search.trim() === '' && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <h2 className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      القراء المفضلين
                    </h2>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      ({favoritesList.length})
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {favoritesList.map(fav => (
                      <div
                        key={`fav-${fav.key}`}
                        className="w-full bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-sm flex items-center justify-between"
                        data-testid={`fav-row-${fav.key}`}
                      >
                        <button
                          onClick={() => {
                            setSelectedReciter({
                              id: fav.reciterId,
                              name: fav.name,
                              server: fav.server,
                              moshafName: fav.moshafName,
                              country: fav.country,
                            });
                            setPhase('surahs');
                          }}
                          className="flex-1 flex items-center gap-3 text-right"
                        >
                          <div>
                            <p className="font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>{fav.name}</p>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                              {fav.moshafName}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => {
                              const next = { ...prev };
                              delete next[fav.key];
                              saveFavorites(next);
                              return next;
                            });
                          }}
                          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                          data-testid={`button-unfav-${fav.key}`}
                          title="إزالة من المفضلة"
                        >
                          <Heart className="w-5 h-5 fill-primary text-primary" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <h2 className="font-bold text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      كل القراء
                    </h2>
                  </div>
                </div>
              )}

              {filtered?.map((r: any) =>
                (r.moshaf ?? []).filter((m: any) => !!m.server).map((moshaf: any, mi: number) => {
                  const fav = isFav(r.id, mi);
                  return (
                    <div
                      key={`${r.id}-${mi}`}
                      className="w-full bg-card hover:bg-secondary/50 p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between transition-colors"
                    >
                      <button
                        onClick={() => selectReciter(r, moshaf)}
                        className="flex-1 flex items-center gap-3 text-right"
                        data-testid={`button-reciter-${r.id}-${mi}`}
                      >
                        <div>
                          <p className="font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>{r.name}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                            {moshaf.name}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFav(r, moshaf, mi);
                          }}
                          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                          data-testid={`button-fav-${r.id}-${mi}`}
                          title={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                        >
                          <Heart
                            className={cn(
                              'w-5 h-5 transition-all',
                              fav ? 'fill-primary text-primary' : 'text-muted-foreground'
                            )}
                          />
                        </button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: Surahs ────────────────────────────────────────────────────────
  if (phase === 'surahs') {
    return (
      <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0">
          <button onClick={() => setPhase('reciters')} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div>
              <h1 className="font-bold text-lg leading-tight" style={{ fontFamily: '"Tajawal", sans-serif' }}>{selectedReciter?.name}</h1>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{selectedReciter?.moshafName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2 pb-6">
            {Array.from({ length: 114 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => playSurah(num)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right',
                  audio.surahNum === num && audio.reciterId === selectedReciter?.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-border hover:bg-secondary/50'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {num}
                </div>
                <div className="flex-1">
                  <p className="font-bold" style={{ fontFamily: '"Amiri", serif' }}>{SURAH_NAMES[num]}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{SURAH_AYAHS[num] ?? '?'} آية</p>
                </div>
                {audio.surahNum === num && audio.reciterId === selectedReciter?.id && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(b => (
                      <div key={b} className="w-1 bg-primary rounded-full animate-bounce" style={{ height: `${8 + b * 4}px`, animationDelay: `${b * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: Full Player ────────────────────────────────────────────────────
  const progress = audio.duration ? audio.currentTime / audio.duration : 0;

  const playerBg = isDark
    ? 'linear-gradient(160deg, #0d0b07 0%, #1a1308 50%, #0d0b07 100%)'
    : 'linear-gradient(160deg, #f5ede0 0%, #ede0cc 50%, #f5ede0 100%)';
  const playerTextMain  = isDark ? '#e8d9b8' : '#2d1f08';
  const playerTextSub   = isDark ? 'rgba(193,154,107,0.7)' : 'rgba(120,80,30,0.85)';
  const playerTextTime  = isDark ? 'rgba(193,154,107,0.5)' : 'rgba(120,80,30,0.55)';
  const playerBtn       = isDark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.2)';
  const playerBtnBorder = isDark ? '1px solid rgba(193,154,107,0.2)' : '1px solid rgba(193,154,107,0.35)';
  const playerTrack     = isDark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.25)';

  const favSurah = audio.surahNum ? isFavSurah(audio.surahNum) : false;

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto" dir="rtl"
      style={{ background: playerBg }}>

      {/* Spin animation keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">

        {/* زر رجوع للسور */}
        <button onClick={() => setPhase('surahs')} className="p-2 rounded-full" style={{ background: playerBtn, border: playerBtnBorder }}>
          <ArrowLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>

        <p className="text-sm font-bold" style={{ color: playerTextSub, fontFamily: '"Tajawal", sans-serif' }}>قيد التشغيل</p>

        {/* زر الإغلاق الكامل (يوقف الصوت ويخفي الشريط) */}
        <button
          onClick={() => { audio.stop(); setPhase('reciters'); }}
          className="p-2 rounded-full transition-all"
          style={{ background: playerBtn, border: playerBtnBorder }}
          title="إيقاف وإغلاق"
          data-testid="button-close-player"
        >
          <X className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>
      </div>

      {/* Islamic Geometric Disc */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <div className="w-full h-full rounded-full overflow-hidden" style={{ boxShadow: isDark ? '0 8px 50px rgba(193,154,107,0.35), 0 0 0 2px rgba(193,154,107,0.2)' : '0 8px 50px rgba(193,154,107,0.25), 0 0 0 2px rgba(193,154,107,0.3)' }}>
            <IslamicDisc isPlaying={audio.isPlaying} surahName={audio.surahName} />
          </div>
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at 35% 25%, rgba(193,154,107,0.08) 0%, transparent 60%)' }} />
        </div>

        {/* Reciter info + زر التحميل + زر القلب */}
        <div className="text-center w-full">
          <h2 className="text-2xl font-bold" style={{ fontFamily: '"Amiri", serif', color: playerTextMain }}>سورة {audio.surahName}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p style={{ fontFamily: '"Tajawal", sans-serif', color: playerTextSub }}>{audio.reciterName}</p>
          </div>

          {/* أزرار التحميل والقلب تحت اسم القارئ */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {/* زر القلب لحفظ السورة في المفضلة */}
            {audio.surahNum && (
              <button
                onClick={toggleFavSurah}
                className="p-2.5 rounded-full transition-all"
                style={{ background: playerBtn, border: playerBtnBorder }}
                title={favSurah ? 'إزالة من المفضلة' : 'إضافة السورة للمفضلة'}
                data-testid="button-fav-surah"
              >
                <Heart
                  className="w-5 h-5 transition-all"
                  style={{ color: favSurah ? '#ef4444' : '#C19A6B', fill: favSurah ? '#ef4444' : 'transparent' }}
                />
              </button>
            )}

            {/* زر التحميل */}
            {directMp3 ? (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2.5 rounded-full transition-all flex items-center justify-center"
                style={{ background: playerBtn, border: playerBtnBorder, opacity: isDownloading ? 0.7 : 1 }}
                title="تحميل السورة"
                data-testid="button-download-surah"
              >
                {isDownloading
                  ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C19A6B' }} />
                  : <Download className="w-5 h-5" style={{ color: '#C19A6B' }} />
                }
              </button>
            ) : (
              <div className="p-2.5 rounded-full opacity-30" style={{ background: playerBtn, border: playerBtnBorder }}>
                <Download className="w-5 h-5" style={{ color: '#C19A6B' }} />
              </div>
            )}
          </div>

          {/* شريط تقدم التحميل */}
          {isDownloading && downloadProgress > 0 && (
            <div className="mt-3 px-4">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: playerTrack }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%`, background: 'linear-gradient(to right, #C19A6B, #8a6a3a)' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: playerTextTime, fontFamily: '"Tajawal", sans-serif' }}>
                {downloadProgress < 100 ? `جاري التحميل ${downloadProgress}%...` : 'اكتمل التحميل ✓'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-16">
        {/* ── Progress bar (RTL: fills right → left) ── */}
        <div
          className="w-full h-2 rounded-full mb-2 cursor-pointer relative overflow-hidden"
          style={{ background: playerTrack }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            audio.seek(1 - (e.clientX - rect.left) / rect.width);
          }}
        >
          <div
            className="absolute top-0 right-0 h-full rounded-full transition-all duration-300 relative"
            style={{ width: `${progress * 100}%`, background: 'linear-gradient(to left, #C19A6B, #8a6a3a)' }}
          >
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md"
              style={{ background: '#C19A6B', boxShadow: '0 0 8px rgba(193,154,107,0.6)' }}
            />
          </div>
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs mb-6" style={{ color: playerTextTime, fontFamily: '"Tajawal", sans-serif' }}>
          <span>{fmtTime(audio.duration)}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(audio.currentTime)}</span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { if (audio.surahNum && audio.surahNum > 1) { const n = audio.surahNum - 1; audio.play({ reciterId: audio.reciterId, reciterName: audio.reciterName, serverUrl: audio.serverUrl, surahNum: n, surahName: SURAH_NAMES[n] ?? '' }); } }}
            className="p-4 rounded-full transition-all"
            style={{ background: playerBtn, border: playerBtnBorder }}
            disabled={!audio.surahNum || audio.surahNum <= 1}
          >
            <svg viewBox="0 0 24 24" fill="#C19A6B" className="w-6 h-6"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
          </button>

          <button
            onClick={audio.togglePlay}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #C19A6B, #7a5020)', boxShadow: '0 0 30px rgba(193,154,107,0.4)' }}
          >
            {audio.isLoading ? (
              <div className="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : audio.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button
            onClick={() => { if (audio.surahNum && audio.surahNum < 114) { const n = audio.surahNum + 1; audio.play({ reciterId: audio.reciterId, reciterName: audio.reciterName, serverUrl: audio.serverUrl, surahNum: n, surahName: SURAH_NAMES[n] ?? '' }); } }}
            className="p-4 rounded-full transition-all"
            style={{ background: playerBtn, border: playerBtnBorder }}
            disabled={!audio.surahNum || audio.surahNum >= 114}
          >
            <svg viewBox="0 0 24 24" fill="#C19A6B" className="w-6 h-6"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
