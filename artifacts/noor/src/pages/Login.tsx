import { useState, useRef, useTransition } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, ChevronRight, MapPin, FolderOpen, RefreshCw, CheckCircle } from 'lucide-react';
import { initUserSync, saveProfileToRTDB, getOrCreateLocalUid, importAllData, type UserProfile } from '@/lib/rtdb';

interface LoginProps { onComplete: () => void; }
type Step = 'name' | 'city';

// ─── Profanity Filter ──────────────────────────────────────────────────────────
const BLOCKED_PATTERNS = [
  // Arabic offensive / sexual / blasphemous words — comprehensive
  /كس|كوس|كوسه|طيز|طيزك|طيزه|زب|زبي|زبك|زبه|زباله|نيك|ينيك|تتناك|تنتاك|متناك|منيوك|اتناك|اتنيك|شرموطه?|عاهره?|قحبه?|قحاب|بتاع\s*كس|شاذ|لواط|لوطي|مخنث|خنيث|خنثى|عرص|عرصه|عراصي|مص\s*زب|مص\s*كس|بظر|كلبه?|كلاب|حيوان\s*جنسي|مبناك|يلعن|يلعن\s*(امك|ابوك|دينك|ربك)|كسم|كسمك|كسمه|كسمها|كسمهم|كسمكم|يخرب\s*بيتك|ابن\s*(كلب|شرموطه?|قحبه?|عاهره?|حمار|زانيه?)|هبل|أهبل|مجنون\s*جنس|تسحق|سحاق|سحاقيه?|بورن|إباحي|جنسي\s*صريح|زانيه?|زاني|فاجره?|فاسق|فاحشه?|الفاحشه|عهر|داعر|داعره?|منحل|خايب|خايبه?|عيل\s*وسخ|وسخ|وسخه?|تفو|اللعنه?|ملعون|قذر|قذره?|عفن|نجس|ديوث|قواد|قوادين|قواده?|بيضان|نياك|نياكه?|مص\s*الأير|الأير|أير|أيره|تعبان\s*جنسي|منتهك|مغتصب|اغتصب|اغتصاب|إباحيه?|فيلم\s*سكس|سكس|خبل|خبله?|خبلاء/i,

  // Blasphemy / religious insults
  /يلعن\s*(الله|الدين|ربنا|النبي|الإسلام|القرآن)|لعنة\s*(الله|الدين)|اللعنة\s*على|كافر\s*خبيث|الله\s*وسخ|ربنا\s*(وسخ|بيهبل)/i,

  // English offensive / sexual / slurs — comprehensive
  /\b(fuck(?:ing|er|ed|s|tard)?|shit(?:ty|ter|s)?|bitch(?:es|ing)?|cunt(?:s)?|dick(?:head|s)?|pussy(?:ies)?|cock(?:sucker|s)?|ass(?:hole|wipe|hat|es)?|whore(?:s)?|slut(?:ty|s)?|bastard(?:s)?|nigger(?:s)?|nigga(?:s)?|faggot(?:s)?|fag(?:s)?|retard(?:ed|s)?|rape(?:d|r|s|ist)?|porn(?:o|ographic|ography)?|sex(?:ting|ual)?|nude(?:s)?|naked|boob(?:s)?|penis|vagina|tits?|titties|dildo(?:s)?|vibrator|masturbat(?:e|ion|ing)|jerk(?:ing)?\s*off|jack(?:ing)?\s*off|cum(?:shot|ming)?|orgasm|erotic|xxx|blowjob|handjob|rimjob|anal(?:\s*sex)?|fetish|bondage|bdsm|hentai|incest|pedophil(?:e|ia)|necrophil(?:e|ia)|bestiality|zoophil(?:e|ia)|hooker|escort\s*sex|prostitut(?:e|ion)|wank(?:er|ing)?|spunk|jizz|semen|clitoris|labia|scrotum|testicl(?:e|es)|anus|butthole|taint|twat|snatch|gash|minge|dong|schlong|boner|erection|horny|aroused|kinky|naughty\s*sex|dirty\s*talk|sexting|nudes\s*send|send\s*nudes|onlyfans|stripper|camgirl|sugar\s*daddy|pedo|kiddie\s*porn|child\s*porn|cp\s*porn|loli|shota|rape\s*fantasy|snuff|gore\s*porn|scat|watersport\s*sex|piss\s*sex|shit\s*sex|vomit\s*sex|choke\s*sex|necro|necrophilia|zoophilia|beastiality|torture\s*porn|slur|kike(?:s)?|spic(?:s)?|chink(?:s)?|gook(?:s)?|towelhead|sandnigger|wetback|cracker(?:s)?|redneck\s*slur|white\s*trash|trailer\s*trash|dago|wop|hymie|raghead|camel\s*jockey|porch\s*monkey|jungle\s*bunny|cotton\s*picker|coon(?:s)?|jap(?:s)?|gypsy\s*slur|tranny|shemale|heshe|it\s*slur|retard|mongoloid|spaz|tard|moron\s*offensive|imbecile\s*offensive|idiot\s*offensive|dumb(?:ass)?|dumbfuck|dipshit|goddamn|motherfuck(?:er|ing)?|son\s*of\s*a\s*bitch|piece\s*of\s*shit|go\s*to\s*hell|eat\s*shit|eat\s*a\s*dick|suck\s*my|lick\s*my|kiss\s*my\s*ass|up\s*yours|screw\s*you\s*offensive|piss\s*off|pissed\s*off|bollocks|tosser|wanker|twat(?:s)?|bloody\s*hell\s*offensive|arsehole|arse(?:s)?|bugger(?:ing)?|shag(?:ging)?|snog(?:ging)?\s*sexual|knob(?:head)?|bellend|prick(?:s)?|minge|slag(?:s)?|scrubber|trollop|harlot|strumpet|floozy|tart\s*offensive|hussy|bimbo\s*offensive|bitch\s*ass|punk\s*ass|douchebag|douche(?:bag)?|scumbag|sleazebag|creep(?:s)?|pervert(?:s)?|perv(?:s)?|molest(?:er|ation)?|grope(?:r|ing)?|harass\s*sexual)\b/i,
];

function isProfane(name: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(name));
}

function CityPicker({ govId, onSelect }: { govId: string; onSelect: (id: string) => void }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.65)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 8px rgba(93,48,16,0.06)' }}>
      <div className="overflow-y-auto" style={{ maxHeight: '44vh' }}>
        <div className="grid grid-cols-3 gap-2 p-3">
          {EGYPT_GOVERNORATES.map(gov => {
            const selected = govId === gov.id;
            return (
              <motion.button
                key={gov.id}
                onClick={() => onSelect(gov.id)}
                whileTap={{ scale: 0.93 }}
                className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 pt-2.5 transition-all duration-200"
                style={{
                  background: selected ? 'linear-gradient(135deg,rgba(193,154,107,0.28),rgba(193,154,107,0.1))' : 'rgba(255,255,255,0.6)',
                  border: selected ? '1.5px solid rgba(193,154,107,0.7)' : '1.5px solid rgba(139,99,64,0.12)',
                  boxShadow: selected ? '0 0 12px rgba(193,154,107,0.2)' : 'none',
                }}
              >
                <div className="w-11 h-8 rounded-md overflow-hidden flex items-center justify-center" style={{ background: 'rgba(139,99,64,0.08)' }}>
                  <img src={gov.flag} alt={gov.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <span className="text-[10px] font-bold leading-tight text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: selected ? '#8B6340' : '#7A4F28' }}>
                  {gov.name}
                </span>
                {selected && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Login({ onComplete }: LoginProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [govId, setGovId] = useState('');
  const [focused, setFocused] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importAllData(text);
      setImportResult({ ok: result.success, msg: result.success ? 'تم استعادة البيانات ✓' : (result.error ?? 'خطأ غير معروف') });
      setImporting(false);
      if (result.success) setTimeout(() => { onComplete(); }, 1600);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleNameNext() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(() => {
      if (isProfane(trimmed)) {
        setNameError('هذا الاسم غير مقبول، الرجاء اختيار اسم مناسب');
        return;
      }
      setNameError('');
      setStep('city');
    });
  }

  const slide = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.26 },
  };

  const BTN_GOLD = {
    background: 'linear-gradient(135deg, #C19A6B 0%, #d4aa7d 50%, #b8894f 100%)',
    color: '#1a0e00',
    fontFamily: '"Tajawal", sans-serif',
    boxShadow: '0 4px 24px rgba(193,154,107,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
    fontWeight: 700,
    fontSize: '1rem',
  } as const;

  function handleCitySelect(id: string) {
    setGovId(id);
    const gov = EGYPT_GOVERNORATES.find(g => g.id === id);
    if (!gov) return;

    const uid = getOrCreateLocalUid();
    const profile: UserProfile = {
      uid,
      name: name.trim() || 'ذاكر',
      email: '',
      photo: '',
      governorateId: gov.id,
      governorateName: gov.name,
      lat: gov.lat,
      lng: gov.lng,
      joinedAt: Date.now(),
    };

    initUserSync(uid);
    saveProfileToRTDB(uid, profile);

    document.documentElement.classList.remove('dark');

    onComplete();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F8EDD8 0%, #EAD9B5 50%, #F5ECD0 100%)' }}
      dir="rtl"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(193,154,107,0.18) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,99,64,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-8">
          <div className="relative mx-auto mb-3 w-24 h-24">
            <div className="absolute -inset-2 rounded-[30px] opacity-30" style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(12px)' }} />
            <div className="absolute -inset-0.5 rounded-[26px]" style={{ background: 'linear-gradient(135deg, rgba(193,154,107,0.6), rgba(193,154,107,0.1), rgba(193,154,107,0.4))' }} />
            <div className="relative w-full h-full rounded-3xl overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #F5E6CC, #E8D4A8)', zIndex: 1 }}>
              <img src="/logo.png" alt="شعار نور" className="w-full h-full object-contain" style={{ padding: '4px' }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mt-1" style={{ fontFamily: '"Amiri", serif', background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            نُور
          </h1>
          <p className="text-xs tracking-[0.25em] mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>
            رفيقك الإسلامي الشامل
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Step 1: Name */}
          {step === 'name' && (
            <motion.div key="name" {...slide} className="flex flex-col gap-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 12px rgba(93,48,16,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>أهلاً بك في نور</h2>
                <p className="text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>اكتب اسمك للبدء</p>

                <div
                  className="relative w-full rounded-2xl transition-all duration-200"
                  style={{
                    background: focused ? '#fff' : 'rgba(255,255,255,0.8)',
                    border: nameError ? '1.5px solid #ef4444' : focused ? '1.5px solid #C19A6B' : '1.5px solid rgba(139,99,64,0.25)',
                    boxShadow: nameError ? '0 0 0 3px rgba(239,68,68,0.1)' : focused ? '0 0 0 3px rgba(193,154,107,0.15)' : '0 1px 4px rgba(93,48,16,0.08)',
                  }}
                >
                  <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: nameError ? '#ef4444' : focused ? '#C19A6B' : 'rgba(139,99,64,0.45)' }}>
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); if (nameError) setNameError(''); }}
                    placeholder="اسمك..."
                    autoFocus
                    maxLength={30}
                    className="w-full bg-transparent outline-none py-4"
                    style={{ fontFamily: '"Tajawal", sans-serif', fontSize: '1rem', color: '#3D2007', paddingRight: '3rem', paddingLeft: '1.25rem' }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && name.trim() && handleNameNext()}
                  />
                </div>

                {/* Profanity error */}
                {nameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs mt-2 text-center font-bold"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}
                  >
                    ⚠️ {nameError}
                  </motion.p>
                )}
              </div>

              <button
                onClick={handleNameNext}
                disabled={!name.trim() || isPending}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={BTN_GOLD}
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                التالي
              </button>

              {/* Import backup */}
              <input ref={importRef} type="file" accept="*" className="hidden" onChange={handleImportFile} />
              <button
                onClick={() => importRef.current?.click()}
                disabled={importing}
                className="w-full py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: importResult?.ok ? 'rgba(34,197,94,0.1)' : importResult?.ok === false ? 'rgba(239,68,68,0.08)' : 'rgba(193,154,107,0.1)',
                  border: `1.5px solid ${importResult?.ok ? 'rgba(34,197,94,0.35)' : importResult?.ok === false ? 'rgba(239,68,68,0.3)' : 'rgba(193,154,107,0.3)'}`,
                  color: importResult?.ok ? '#16a34a' : importResult?.ok === false ? '#ef4444' : '#8B6340',
                  fontFamily: '"Tajawal", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : importResult?.ok ? <CheckCircle className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                {importing ? 'جاري الاستعادة...' : importResult ? importResult.msg : 'استعادة من نسخة احتياطية'}
              </button>

              <p className="text-center text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: 'rgba(155,112,67,0.6)' }}>
                بياناتك محفوظة على جهازك فقط — لا حاجة لإنترنت
              </p>
            </motion.div>
          )}

          {/* Step 2: City */}
          {step === 'city' && (
            <motion.div key="city" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => setStep('name')}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" style={{ color: '#C19A6B' }} />
                  <h2 className="text-lg font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>
                    اختر محافظتك
                  </h2>
                </div>
                <p className="text-xs mb-4 mr-6" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>
                  لضبط مواقيت الصلاة بدقة — تقدر تغيرها لاحقاً
                </p>
                <CityPicker govId={govId} onSelect={handleCitySelect} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
