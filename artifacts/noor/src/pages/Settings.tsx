import { useRef, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, Image, Upload, X, Type, Layers, Bell, BellOff, CheckCircle, RefreshCw, Download, FolderOpen, HardDrive, Cloud, CloudUpload, CloudDownload, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSettings, PRESET_BACKGROUNDS } from '@/contexts/AppSettingsContext';
import { useUserSetting } from '@/hooks/use-user-setting';
import {
  getNotificationSettings, saveNotificationSettings,
  cancelAllPrayerNotifications, type NotificationSettings, type PrayerKey,
} from '@/lib/notifications';
import { requestAllPermissionsOnce, resetPermissionsFlag } from '@/lib/permissions';
import { Capacitor } from '@capacitor/core';
import { flushRTDB, exportAllData, importAllData } from '@/lib/rtdb';
import {
  uploadToDrive, downloadFromDrive, getDriveEmail, clearDriveToken,
} from '@/lib/google-drive';

const PRAYER_LIST: { key: PrayerKey; name: string }[] = [
  { key: 'Fajr', name: 'الفجر' }, { key: 'Sunrise', name: 'الشروق' },
  { key: 'Dhuhr', name: 'الظهر' }, { key: 'Asr', name: 'العصر' },
  { key: 'Maghrib', name: 'المغرب' }, { key: 'Isha', name: 'العشاء' },
];

const MINUTES_OPTIONS = [
  { value: 0, label: 'عند الأذان' }, { value: 5, label: 'قبل 5 دق' },
  { value: 10, label: 'قبل 10 دق' }, { value: 15, label: 'قبل 15 دق' },
  { value: 20, label: 'قبل 20 دق' },
];

function NativeOnlyNote({ subText }: { subText: string }) {
  return (
    <p className="text-xs text-center py-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
      ⚠️ الإشعارات متاحة في تطبيق الموبايل فقط
    </p>
  );
}

function ToggleSwitch({ enabled, onToggle, accentColor = '#C19A6B' }: { enabled: boolean; onToggle: () => void; accentColor?: string }) {
  return (
    <button onClick={onToggle} className="relative flex-shrink-0 transition-all"
      style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? accentColor : 'rgba(120,120,120,0.3)', transition: 'background 0.25s' }}>
      <span className="absolute top-[3px] rounded-full bg-white shadow-sm"
        style={{ width: 18, height: 18, left: enabled ? 23 : 3, transition: 'left 0.25s' }} />
    </button>
  );
}

type DriveStatus = 'idle' | 'loading' | 'done' | 'error';

function BackupSection({ sectionBg, borderColor, textColor, subText }: { sectionBg: string; borderColor: string; textColor: string; subText: string }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const [driveEmail, setDriveEmail] = useState<string | null>(() => getDriveEmail());
  const [driveUpload, setDriveUpload] = useState<DriveStatus>('idle');
  const [driveDownload, setDriveDownload] = useState<DriveStatus>('idle');
  const [driveMsg, setDriveMsg] = useState('');

  /* ── Local export ── */
  async function handleExport() {
    setSaving(true);
    await flushRTDB();
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaving(false);
    setSaveDone(true);
    setTimeout(() => setSaveDone(false), 3000);
  }

  /* ── Local import ── */
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importAllData(text);
      setImportResult({ ok: result.success, msg: result.success ? 'تم استعادة البيانات — جاري التحديث...' : (result.error ?? 'خطأ غير معروف') });
      setImporting(false);
      if (result.success) setTimeout(() => window.location.reload(), 1800);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ── Drive upload ── */
  async function handleDriveUpload() {
    setDriveUpload('loading');
    setDriveMsg('');
    try {
      await flushRTDB();
      const json = exportAllData();
      const { isNew } = await uploadToDrive(json);
      setDriveEmail(getDriveEmail());
      setDriveMsg(isNew ? 'تم رفع النسخة الاحتياطية على Google Drive ✓' : 'تم تحديث النسخة الاحتياطية على Google Drive ✓');
      setDriveUpload('done');
      setTimeout(() => setDriveUpload('idle'), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'drive_api_not_enabled') {
        setDriveMsg('يجب تفعيل Google Drive API أولاً — اضغط هنا لتفعيله');
      } else if (msg.includes('popup') || msg.includes('closed')) {
        setDriveMsg('أُغلقت نافذة تسجيل الدخول');
      } else {
        setDriveMsg('فشل رفع البيانات: ' + msg);
      }
      setDriveUpload('error');
      setTimeout(() => setDriveUpload('idle'), 5000);
    }
  }

  /* ── Drive download ── */
  async function handleDriveDownload() {
    setDriveDownload('loading');
    setDriveMsg('');
    try {
      const json = await downloadFromDrive();
      if (!json) {
        setDriveMsg('لا توجد نسخة احتياطية على Google Drive بعد');
        setDriveDownload('error');
        setTimeout(() => setDriveDownload('idle'), 4000);
        return;
      }
      setDriveEmail(getDriveEmail());
      const result = importAllData(json);
      if (result.success) {
        setDriveMsg('تم استعادة البيانات من Google Drive ✓ — جاري التحديث...');
        setDriveDownload('done');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setDriveMsg('الملف تالف: ' + (result.error ?? 'خطأ'));
        setDriveDownload('error');
        setTimeout(() => setDriveDownload('idle'), 5000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDriveMsg(msg.includes('popup') ? 'أُغلقت نافذة تسجيل الدخول' : 'فشل التنزيل: ' + msg);
      setDriveDownload('error');
      setTimeout(() => setDriveDownload('idle'), 5000);
    }
  }

  function handleDriveSignOut() {
    clearDriveToken();
    setDriveEmail(null);
    setDriveMsg('');
    setDriveUpload('idle');
    setDriveDownload('idle');
  }

  const driveConnected = !!driveEmail;
  const driveError = driveMsg && (driveUpload === 'error' || driveDownload === 'error');
  const driveDone = driveMsg && (driveUpload === 'done' || driveDownload === 'done');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
      className="rounded-2xl p-4"
      style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, #3B82F6, #1D4ED8)' }}>
          <HardDrive className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>النسخة الاحتياطية</p>
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>صدّر أو استعِد بياناتك</p>
        </div>
      </div>

      {/* ─── Local File ─── */}
      <p className="text-xs font-bold mb-2 mt-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
        📂 حفظ على الجهاز
      </p>
      <div className="space-y-2 mb-4">
        <button onClick={handleExport} disabled={saving}
          className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{ background: saveDone ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.08)', border: `1.5px solid ${saveDone ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.25)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: saveDone ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.12)' }}>
            {saveDone ? <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} /> : <Download className="w-5 h-5" style={{ color: '#3B82F6' }} />}
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: saveDone ? '#22c55e' : textColor }}>
              {saving ? 'جاري التصدير...' : saveDone ? 'تم التصدير ✓' : 'تصدير إلى ملف'}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>تنزيل ملف noor-backup.json</p>
          </div>
        </button>

        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
        <button onClick={() => importRef.current?.click()} disabled={importing}
          className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{ background: importResult?.ok ? 'rgba(34,197,94,0.1)' : importResult?.ok === false ? 'rgba(239,68,68,0.08)' : 'rgba(193,154,107,0.08)', border: `1.5px solid ${importResult?.ok ? 'rgba(34,197,94,0.35)' : importResult?.ok === false ? 'rgba(239,68,68,0.25)' : 'rgba(193,154,107,0.25)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: importResult?.ok ? 'rgba(34,197,94,0.15)' : importResult?.ok === false ? 'rgba(239,68,68,0.1)' : 'rgba(193,154,107,0.12)' }}>
            {importing ? <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#C19A6B' }} /> : importResult?.ok ? <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} /> : <FolderOpen className="w-5 h-5" style={{ color: '#C19A6B' }} />}
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: importResult?.ok ? '#22c55e' : importResult?.ok === false ? '#ef4444' : textColor }}>
              {importing ? 'جاري الاستعادة...' : importResult ? importResult.msg : 'استعادة من ملف'}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اختر ملف نسخة احتياطية سابق</p>
          </div>
        </button>
      </div>

      {/* ─── Google Drive ─── */}
      <div style={{ height: 1, background: borderColor, marginBottom: 12 }} />
      <div className="flex items-center gap-2 mb-2">
        <Cloud className="w-4 h-4" style={{ color: '#4285F4' }} />
        <p className="text-xs font-bold flex-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
          Google Drive — نسخ سحابية
        </p>
        {driveConnected && (
          <button onClick={handleDriveSignOut} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: '"Tajawal", sans-serif' }}>
            <LogOut className="w-3 h-3" />
            تسجيل خروج
          </button>
        )}
      </div>

      {driveConnected && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#4285F4' }}>
            <span className="text-white font-bold" style={{ fontSize: 11 }}>
              {driveEmail?.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-bold flex-1 truncate" style={{ color: '#4285F4', fontFamily: '"Tajawal", sans-serif', direction: 'ltr' }}>
            {driveEmail}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Upload */}
        <button onClick={handleDriveUpload} disabled={driveUpload === 'loading' || driveDownload === 'loading'}
          className="rounded-xl p-3 flex flex-col items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{ background: driveUpload === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(66,133,244,0.08)', border: `1.5px solid ${driveUpload === 'done' ? 'rgba(34,197,94,0.35)' : 'rgba(66,133,244,0.25)'}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: driveUpload === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(66,133,244,0.12)' }}>
            {driveUpload === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#4285F4' }} /> : driveUpload === 'done' ? <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} /> : <CloudUpload className="w-4 h-4" style={{ color: '#4285F4' }} />}
          </div>
          <p className="text-xs font-bold text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: driveUpload === 'done' ? '#22c55e' : textColor }}>
            {driveUpload === 'loading' ? 'جاري الرفع...' : 'رفع نسخة'}
          </p>
        </button>

        {/* Download */}
        <button onClick={handleDriveDownload} disabled={driveUpload === 'loading' || driveDownload === 'loading'}
          className="rounded-xl p-3 flex flex-col items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{ background: driveDownload === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(66,133,244,0.08)', border: `1.5px solid ${driveDownload === 'done' ? 'rgba(34,197,94,0.35)' : 'rgba(66,133,244,0.25)'}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: driveDownload === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(66,133,244,0.12)' }}>
            {driveDownload === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#4285F4' }} /> : driveDownload === 'done' ? <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} /> : <CloudDownload className="w-4 h-4" style={{ color: '#4285F4' }} />}
          </div>
          <p className="text-xs font-bold text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: driveDownload === 'done' ? '#22c55e' : textColor }}>
            {driveDownload === 'loading' ? 'جاري التنزيل...' : 'استعادة'}
          </p>
        </button>
      </div>

      {/* Drive message */}
      <AnimatePresence>
        {driveMsg && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-2 px-3 py-2 rounded-xl text-xs text-center"
            style={{ background: driveError ? 'rgba(239,68,68,0.08)' : driveDone ? 'rgba(34,197,94,0.08)' : 'rgba(66,133,244,0.08)', color: driveError ? '#ef4444' : driveDone ? '#22c55e' : '#4285F4', fontFamily: '"Tajawal", sans-serif' }}>
            {driveMsg.includes('تفعيل Google Drive API') ? (
              <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com?project=noooooor-app"
                target="_blank" rel="noopener noreferrer"
                className="underline font-bold"
                style={{ color: '#ef4444' }}>
                {driveMsg}
              </a>
            ) : driveMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-center mt-3" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
        📌 عند الضغط سيفتح نافذة تسجيل دخول Google — اختر حسابك
      </p>
    </motion.div>
  );
}

export function Settings() {
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const { bgType, bgPreset, bgCustom, appFontScale, hasBg, cardOpacity, setBgType, setBgPreset, setBgCustom, setAppFontScale, setCardOpacity } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    saveNotificationSettings(notifSettings);
    window.dispatchEvent(new CustomEvent('noor:notif-settings-changed'));
  }, [notifSettings]);

  function setEnabled(val: boolean) { setNotifSettings(s => ({ ...s, enabled: val })); if (!val) cancelAllPrayerNotifications(); }
  function setMinutesBefore(val: number) { setNotifSettings(s => ({ ...s, minutesBefore: val })); }
  function togglePrayer(key: PrayerKey) { setNotifSettings(s => ({ ...s, prayers: { ...s.prayers, [key]: !s.prayers[key] } })); }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const result = ev.target?.result as string; setBgCustom(result); setBgType('custom'); };
    reader.readAsDataURL(file);
  };

  const sectionBg = hasBg ? (dark ? 'rgba(10,8,4,0.88)' : 'rgba(253,251,245,0.92)') : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(193,154,107,0.06)');
  const borderColor = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.3)';
  const textColor = dark ? '#e8d9b8' : '#2C1E16';
  const subText = dark ? 'rgba(232,217,184,0.55)' : '#8B5E3C';
  const pageBg = hasBg ? 'transparent' : (dark ? '#0f0c07' : '#FDFBF5');

  const fontLabels = ['صغير', 'عادي', 'كبير', 'أكبر'];
  const fontValues = [0.85, 1, 1.15, 1.3];

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: pageBg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 flex items-center gap-3"
        style={{ background: dark ? 'rgba(15,12,7,0.95)' : 'rgba(253,251,245,0.95)', borderBottom: `1px solid ${borderColor}`, backdropFilter: 'blur(12px)' }}>
        <Link href="/more">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)', border: `1px solid ${borderColor}` }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
          </button>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>الخصائص</h1>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

        {/* Font Size */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-4" style={{ background: sectionBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, #C19A6B, #8B5E3C)' }}>
              <Type className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>حجم الخط</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اضبط حجم النصوص في التطبيق</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>أ</span>
            <div className="flex-1 relative">
              <input type="range" min={0} max={3} step={1}
                value={fontValues.indexOf(appFontScale) === -1 ? 1 : fontValues.indexOf(appFontScale)}
                onChange={e => setAppFontScale(fontValues[Number(e.target.value)])}
                className="w-full accent-[#C19A6B]" style={{ height: 4 }} />
            </div>
            <span className="text-lg font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>أ</span>
          </div>
          <div className="flex justify-between px-1">
            {fontLabels.map((label, i) => (
              <button key={i} onClick={() => setAppFontScale(fontValues[i])} className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ fontFamily: '"Tajawal", sans-serif', background: appFontScale === fontValues[i] ? '#C19A6B' : 'rgba(193,154,107,0.1)', color: appFontScale === fontValues[i] ? '#0f0c07' : subText, fontWeight: appFontScale === fontValues[i] ? 700 : 400 }}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(193,154,107,0.08)', border: `1px solid ${borderColor}` }}>
            <p style={{ fontFamily: '"Tajawal", sans-serif', color: textColor, fontSize: `${14 * appFontScale}px`, lineHeight: 1.8 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-xs mt-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>معاينة الحجم</p>
          </div>
        </motion.div>

        {/* Card Opacity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4" style={{ background: sectionBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, #7B5EA7, #5B3E8A)' }}>
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>شفافية الخانات</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اضبط مستوى شفافية خانات التطبيق</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>شفاف</span>
            <div className="flex-1 relative">
              <input type="range" min={0} max={100} step={1} value={Math.round(cardOpacity * 100)}
                onChange={e => setCardOpacity(Number(e.target.value) / 100)} className="w-full accent-[#7B5EA7]" style={{ height: 4 }} />
            </div>
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>صلب</span>
          </div>
          <div className="mt-3 p-3 rounded-xl text-center" style={{ background: 'rgba(123,94,167,0.08)', border: `1px solid ${borderColor}` }}>
            <div className="rounded-xl p-3 border mb-2" style={{ background: dark ? `hsl(20 18% 12% / ${cardOpacity})` : `hsl(0 0% 100% / ${cardOpacity})`, border: `1px solid ${borderColor}` }}>
              <p className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>معاينة الخانة</p>
              <p className="text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>هكذا ستبدو خانات التطبيق</p>
            </div>
            <p className="text-xs" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>الشفافية: {Math.round(cardOpacity * 100)}%</p>
          </div>
        </motion.div>

        {/* Prayer Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-4" style={{ background: sectionBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, #2ecc71, #1a7a44)' }}>
              {notifSettings.enabled ? <Bell className="w-4 h-4 text-white" /> : <BellOff className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>إشعارات الصلاة</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>تنبيه قبل كل صلاة بدون نت</p>
            </div>
            <ToggleSwitch enabled={notifSettings.enabled} onToggle={() => setEnabled(!notifSettings.enabled)} accentColor="#2ecc71" />
          </div>
          {!isNative && <NativeOnlyNote subText={subText} />}
          {notifSettings.enabled && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>وقت الإشعار</p>
                <div className="flex flex-wrap gap-2">
                  {MINUTES_OPTIONS.map(opt => {
                    const selected = notifSettings.minutesBefore === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setMinutesBefore(opt.value)}
                        className="text-xs px-3 py-1.5 rounded-xl transition-all font-bold"
                        style={{ fontFamily: '"Tajawal", sans-serif', background: selected ? '#2ecc71' : 'rgba(46,204,113,0.1)', color: selected ? '#fff' : subText, border: `1.5px solid ${selected ? '#2ecc71' : 'transparent'}` }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ height: 1, background: borderColor }} />
              <div>
                <p className="text-xs font-bold mb-3" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>اختر الصلوات التي تريد تنبيهها</p>
                <div className="space-y-2.5">
                  {PRAYER_LIST.map(prayer => {
                    const enabled = notifSettings.prayers[prayer.key];
                    return (
                      <div key={prayer.key} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                        style={{ background: enabled ? 'rgba(46,204,113,0.08)' : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), border: `1px solid ${enabled ? 'rgba(46,204,113,0.3)' : borderColor}` }}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: enabled ? textColor : subText }}>{prayer.name}</span>
                        </div>
                        <ToggleSwitch enabled={enabled} onToggle={() => togglePrayer(prayer.key)} accentColor="#2ecc71" />
                      </div>
                    );
                  })}
                </div>
              </div>
              {isNative && (
                <button onClick={() => { resetPermissionsFlag(); requestAllPermissionsOnce(); }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)' }}>
                  🔔 طلب إذن الإشعارات مجدداً
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Background */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-4" style={{ background: sectionBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, #4a6fa5, #2d4a7a)' }}>
              <Image className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>خلفية التطبيق</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اختر خلفية تملأ شاشة التطبيق</p>
            </div>
          </div>

          <button onClick={() => setBgType('none')} className="w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all"
            style={{ background: bgType === 'none' ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.05)', border: `1.5px solid ${bgType === 'none' ? '#C19A6B' : borderColor}` }}>
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: dark ? '#1c1408' : '#F7EDD6', border: `1px solid ${borderColor}` }}>
              <X className="w-5 h-5" style={{ color: '#C19A6B' }} />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>بدون خلفية</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>الوضع الافتراضي للتطبيق</p>
            </div>
            {bgType === 'none' && (
              <div className="mr-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </button>

          <p className="text-xs font-bold mb-2" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>صور إسلامية مقترحة</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_BACKGROUNDS.map((bg) => {
              const isSelected = bgType === 'preset' && bgPreset === bg.id;
              return (
                <button key={bg.id} onClick={() => { setBgPreset(bg.id); setBgType('preset'); }}
                  className="relative rounded-xl overflow-hidden transition-all"
                  style={{ aspectRatio: '9/14', border: `2.5px solid ${isSelected ? '#C19A6B' : 'transparent'}`, boxShadow: isSelected ? '0 0 0 1px #C19A6B' : 'none' }}>
                  <img src={bg.src} alt={bg.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                  <p className="absolute bottom-1 right-0 left-0 text-center text-[10px] text-white font-bold leading-tight px-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>{bg.label}</p>
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold mb-2" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>أو اختر من معرض صورك</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {bgCustom && bgType === 'custom' ? (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 120 }}>
              <img src={bgCustom} alt="خلفية مخصصة" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <button onClick={() => { fileInputRef.current?.click(); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: 'rgba(193,154,107,0.8)', fontFamily: '"Tajawal", sans-serif' }}>تغيير الصورة</button>
              </div>
              <button onClick={() => { setBgType('none'); setBgCustom(''); }}
                className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: 'rgba(193,154,107,0.05)', border: `1.5px dashed ${borderColor}` }}>
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.1)' }}>
                <Upload className="w-5 h-5" style={{ color: '#C19A6B' }} />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>اختر صورة من معرضك</p>
                <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>JPG, PNG, WEBP مدعومة</p>
              </div>
            </button>
          )}
        </motion.div>

        {/* Backup Section */}
        <BackupSection sectionBg={sectionBg} borderColor={borderColor} textColor={textColor} subText={subText} />

        {/* Note */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl p-3 text-center" style={{ background: 'rgba(193,154,107,0.06)', border: `1px solid ${borderColor}` }}>
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
            تُطبَّق التغييرات فوراً على التطبيق كله
          </p>
        </motion.div>

      </div>
    </div>
  );
}
