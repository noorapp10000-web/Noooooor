import { useState } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Mail, Lock, Eye, EyeOff, ChevronRight,
  LogIn, UserPlus,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { auth, rtdb } from '@/lib/firebase';
import { initUserSync, saveProfileToRTDB, type UserProfile } from '@/lib/rtdb';

interface LoginProps {
  onComplete: () => void;
}

type Step =
  | 'welcome'
  | 'signup-email' | 'signup-password' | 'signup-city'
  | 'login-email'  | 'login-password'
  | 'city-picker';

function InputField({
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
  onEnter,
  icon,
  trailing,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative w-full rounded-2xl transition-all duration-200"
      style={{
        background: focused ? '#fff' : 'rgba(255,255,255,0.8)',
        border: focused ? '1.5px solid #C19A6B' : '1.5px solid rgba(139,99,64,0.25)',
        boxShadow: focused ? '0 0 0 3px rgba(193,154,107,0.15)' : '0 1px 4px rgba(93,48,16,0.08)',
      }}
    >
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: focused ? '#C19A6B' : 'rgba(139,99,64,0.45)' }}>
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent outline-none py-4"
        style={{
          fontFamily: '"Tajawal", sans-serif',
          fontSize: '1rem',
          color: '#3D2007',
          paddingRight: icon ? '3rem' : '1.25rem',
          paddingLeft: trailing ? '3rem' : '1.25rem',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
      {trailing && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  );
}

function CityPicker({
  govId,
  onSelect,
}: {
  govId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.65)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 8px rgba(93,48,16,0.06)' }}
    >
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
                  background: selected
                    ? 'linear-gradient(135deg,rgba(193,154,107,0.28),rgba(193,154,107,0.1))'
                    : 'rgba(255,255,255,0.6)',
                  border: selected
                    ? '1.5px solid rgba(193,154,107,0.7)'
                    : '1.5px solid rgba(139,99,64,0.12)',
                  boxShadow: selected ? '0 0 12px rgba(193,154,107,0.2)' : 'none',
                }}
              >
                <div
                  className="w-11 h-8 rounded-md overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(139,99,64,0.08)' }}
                >
                  <img
                    src={gov.flag}
                    alt={gov.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold leading-tight text-center"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    color: selected ? '#8B6340' : '#7A4F28',
                  }}
                >
                  {gov.name}
                </span>
                {selected && (
                  <div
                    className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#C19A6B' }}
                  >
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

function ErrorBadge({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 text-sm text-center flex items-center justify-center gap-2"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontFamily: '"Tajawal", sans-serif', color: '#f87171' }}
    >
      {msg}
    </motion.div>
  );
}

function SuccessBadge({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 text-sm text-center flex items-center justify-center gap-2"
      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}
    >
      {msg}
    </motion.div>
  );
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':       return 'هذا البريد الإلكتروني مستخدم بالفعل';
    case 'auth/invalid-email':              return 'البريد الإلكتروني غير صحيح';
    case 'auth/weak-password':              return 'كلمة السر ضعيفة جداً (٦ أحرف على الأقل)';
    case 'auth/user-not-found':             return 'لا يوجد حساب بهذا البريد الإلكتروني';
    case 'auth/wrong-password':             return 'كلمة السر غير صحيحة';
    case 'auth/invalid-credential':         return 'البريد الإلكتروني أو كلمة السر غير صحيحة';
    case 'auth/too-many-requests':          return 'محاولات كثيرة، حاول مرة أخرى لاحقاً';
    case 'auth/network-request-failed':     return 'تحقق من اتصال الإنترنت وحاول مجدداً';
    case 'auth/popup-closed-by-user':       return 'تم إغلاق نافذة الدخول';
    case 'auth/cancelled-popup-request':    return 'تم إلغاء الطلب';
    case 'auth/popup-blocked':              return 'البراوزر حجب النافذة المنبثقة، سمح لها من الإعدادات';
    case 'auth/account-exists-with-different-credential':
      return 'هذا البريد مسجّل بطريقة دخول أخرى';
    default:                                return 'حدث خطأ، حاول مرة أخرى';
  }
}

async function finalizeUserProfile(
  uid: string,
  displayName: string,
  userEmail: string,
  photo: string,
  selectedGovId: string,
): Promise<void> {
  const gov = EGYPT_GOVERNORATES.find((g: { id: string }) => g.id === selectedGovId);
  if (!gov) throw new Error('Governorate not found');

  const profile: UserProfile = {
    uid,
    name: displayName.trim() || userEmail.split('@')[0],
    email: userEmail,
    photo,
    governorateId: selectedGovId,
    governorateName: gov.name,
    lat: gov.lat,
    lng: gov.lng,
    joinedAt: Date.now(),
  };

  await initUserSync(uid);
  await saveProfileToRTDB(uid, profile);
}

export function Login({ onComplete }: LoginProps) {
  const [step, setStep]           = useState<Step>('welcome');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [govId, setGovId]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [pendingUid, setPendingUid]       = useState('');
  const [pendingName, setPendingName]     = useState('');
  const [pendingEmail, setPendingEmail]   = useState('');
  const [pendingPhoto, setPendingPhoto]   = useState('');

  const clearError = () => setError('');

  async function checkExistingProfile(uid: string): Promise<boolean> {
    try {
      const snap = await get(ref(rtdb, `users/${uid}/profile`));
      return snap.exists();
    } catch { return false; }
  }


  /* ── Email Signup ─────────────────────────────────────────── */
  const handleSignupCity = async (selectedGov: string) => {
    if (!selectedGov) return;
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await finalizeUserProfile(cred.user.uid, email.split('@')[0], email.trim(), '', selectedGov);
      onComplete();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapFirebaseError(code));
      setLoading(false);
    }
  };

  /* ── City picker for Google / returning login ─────────────── */
  const handleCityPicker = async (selectedGov: string) => {
    if (!selectedGov || !pendingUid) return;
    setLoading(true);
    setError('');
    try {
      await finalizeUserProfile(pendingUid, pendingName, pendingEmail, pendingPhoto, selectedGov);
      onComplete();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapFirebaseError(code));
      setLoading(false);
    }
  };

  /* ── Email Login ─────────────────────────────────────────── */
  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid  = cred.user.uid;

      const hasProfile = await checkExistingProfile(uid);
      if (hasProfile) {
        await initUserSync(uid);
        onComplete();
      } else {
        setPendingUid(uid);
        setPendingName(email.split('@')[0]);
        setPendingEmail(email.trim());
        setPendingPhoto('');
        setLoading(false);
        setStep('city-picker');
      }
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapFirebaseError(code));
      setLoading(false);
    }
  };

  const slide = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -16 },
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F8EDD8 0%, #EAD9B5 50%, #F5ECD0 100%)' }}
      dir="rtl"
    >
      {/* Subtle texture overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(193,154,107,0.18) 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,99,64,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="relative mx-auto mb-3 w-24 h-24">
            <div
              className="absolute -inset-2 rounded-[30px] opacity-30"
              style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(12px)' }}
            />
            <div
              className="absolute -inset-0.5 rounded-[26px]"
              style={{ background: 'linear-gradient(135deg, rgba(193,154,107,0.6), rgba(193,154,107,0.1), rgba(193,154,107,0.4))' }}
            />
            <div
              className="relative w-full h-full rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #F5E6CC, #E8D4A8)',
                zIndex: 1,
              }}
            >
              <img
                src="/logo.png"
                alt="شعار نور"
                className="w-full h-full object-contain"
                style={{ padding: '4px' }}
              />
            </div>
          </div>
          <h1
            className="text-3xl font-bold mt-1"
            style={{
              fontFamily: '"Amiri", serif',
              background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            نُور
          </h1>
          <p
            className="text-xs tracking-[0.25em] mt-0.5"
            style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
          >
            رفيقك الإسلامي الشامل
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ─── Welcome ─── */}
          {step === 'welcome' && (
            <motion.div key="welcome" {...slide} className="flex flex-col gap-3">

              {/* إنشاء حساب */}
              <button
                onClick={() => { clearError(); setStep('signup-email'); }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #8B6340 0%, #C19A6B 50%, #9a7048 100%)',
                  boxShadow: '0 6px 24px rgba(193,154,107,0.35)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.22)' }}
                >
                  <UserPlus size={22} className="text-white" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-white text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>إنشاء حساب جديد</p>
                  <p className="text-white/75 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>سجّل ببريدك الإلكتروني واحفظ بياناتك</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }}>
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* تسجيل دخول */}
              <button
                onClick={() => { clearError(); setStep('login-email'); }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.97]"
                style={{
                  background: 'rgba(193,154,107,0.1)',
                  border: '1.5px solid rgba(193,154,107,0.3)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(193,154,107,0.18)', border: '1.5px solid rgba(193,154,107,0.3)' }}
                >
                  <LogIn className="w-5 h-5" style={{ color: '#C19A6B' }} />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#5D3010' }}>تسجيل الدخول</p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>ادخل على حسابك الموجود</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.12)' }}>
                  <ChevronRight className="w-4 h-4" style={{ color: '#C19A6B' }} />
                </div>
              </button>

              {error && <ErrorBadge msg={error} />}

            </motion.div>
          )}

          {/* ─── Signup: Email ─── */}
          {step === 'signup-email' && (
            <motion.div key="signup-email" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('welcome'); }}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 12px rgba(93,48,16,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>إنشاء حساب جديد</h2>
                <p className="text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>أدخل بريدك الإلكتروني للمتابعة</p>
                <InputField
                  type="email"
                  value={email}
                  onChange={v => { setEmail(v); clearError(); }}
                  placeholder="البريد الإلكتروني..."
                  autoFocus
                  icon={<Mail className="w-4 h-4" />}
                  onEnter={() => email.trim() && setStep('signup-password')}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => email.trim() && setStep('signup-password')}
                disabled={!email.trim()}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Signup: Password ─── */}
          {step === 'signup-password' && (
            <motion.div key="signup-password" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('signup-email'); }}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 12px rgba(93,48,16,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>كلمة السر</h2>
                <p className="text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>اختر كلمة سر قوية لحسابك</p>
                <InputField
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={v => { setPassword(v); clearError(); }}
                  placeholder="كلمة السر (٦ أحرف على الأقل)..."
                  autoFocus
                  icon={<Lock className="w-4 h-4" />}
                  onEnter={() => password.length >= 6 && setStep('signup-city')}
                  trailing={
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ color: '#9B7043' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => password.length >= 6 && setStep('signup-city')}
                disabled={password.length < 6}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Signup: City ─── */}
          {step === 'signup-city' && (
            <motion.div key="signup-city" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('signup-password'); }}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>اختر محافظتك</h2>
                <p className="text-xs text-center mb-4" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>لضبط مواقيت الصلاة بدقة</p>
                <CityPicker govId={govId} onSelect={id => { setGovId(id); handleSignupCity(id); }} />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-5 h-5 border-2 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin" />
                  <span className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>جاري الحفظ...</span>
                </div>
              )}
              {error && <ErrorBadge msg={error} />}
            </motion.div>
          )}

          {/* ─── Login: Email ─── */}
          {step === 'login-email' && (
            <motion.div key="login-email" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('welcome'); }}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 12px rgba(93,48,16,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>تسجيل الدخول</h2>
                <p className="text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>أدخل بريدك الإلكتروني</p>
                <InputField
                  type="email"
                  value={email}
                  onChange={v => { setEmail(v); clearError(); }}
                  placeholder="البريد الإلكتروني..."
                  autoFocus
                  icon={<Mail className="w-4 h-4" />}
                  onEnter={() => email.trim() && setStep('login-password')}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => email.trim() && setStep('login-password')}
                disabled={!email.trim()}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Login: Password ─── */}
          {step === 'login-password' && (
            <motion.div key="login-password" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('login-email'); }}
                className="flex items-center gap-1.5 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(139,99,64,0.2)', boxShadow: '0 2px 12px rgba(93,48,16,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>كلمة السر</h2>
                <p className="text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>أدخل كلمة سر حسابك</p>
                <InputField
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={v => { setPassword(v); clearError(); }}
                  placeholder="كلمة السر..."
                  autoFocus
                  icon={<Lock className="w-4 h-4" />}
                  onEnter={handleLogin}
                  trailing={
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ color: '#9B7043' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={handleLogin}
                disabled={loading || !password}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1a0e00]/30 border-t-[#1a0e00] rounded-full animate-spin" />
                    <span>جاري الدخول...</span>
                  </div>
                ) : 'دخول'}
              </button>
            </motion.div>
          )}

          {/* ─── City Picker (Google / first login) ─── */}
          {step === 'city-picker' && (
            <motion.div key="city-picker" {...slide} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}>اختر محافظتك</h2>
                <p className="text-xs text-center mb-4" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>لضبط مواقيت الصلاة بدقة</p>
                <CityPicker govId={govId} onSelect={id => { setGovId(id); handleCityPicker(id); }} />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-5 h-5 border-2 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin" />
                  <span className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}>جاري الحفظ...</span>
                </div>
              )}
              {error && <ErrorBadge msg={error} />}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
