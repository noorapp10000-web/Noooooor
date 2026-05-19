import { useRef, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, Image, Upload, X, Type, Layers, CheckCircle, RefreshCw, Download, FolderOpen, HardDrive, Bell, BellOff } from 'lucide-react';

import { motion } from 'framer-motion';
import { useAppSettings, PRESET_BACKGROUNDS } from '@/contexts/AppSettingsContext';
import { useUserSetting } from '@/hooks/use-user-setting';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { flushRTDB, exportAllData, importAllData, getProfileCache } from '@/lib/rtdb';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  reschedulePrayerNotifications,
  rescheduleDailyNotifications,
  scheduleAllNotifications,
} from '@/lib/notifications';

// Hours available for daily notification: 1م (13) .. 9م (21)
const DAILY_HOURS = [
  { label: '1م',  hour: 13 },
  { label: '2م',  hour: 14 },
  { label: '3م',  hour: 15 },
  { label: '4م',  hour: 16 },
  { label: '5م',  hour: 17 },
  { label: '6م',  hour: 18 },
  { label: '7م',  hour: 19 },
  { label: '8م',  hour: 20 },
  { label: '9م',  hour: 21 },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0"
      style={{ background: on ? 'linear-gradient(135deg, #7B5EA7, #5B3E8A)' : 'rgba(150,150,150,0.25)' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ right: on ? '2px' : 'calc(100% - 22px)' }}
      />
    </button>
  );
}

function NotificationSection({
  sectionBg, borderColor, textColor, subText,
}: { sectionBg: string; borderColor: string; textColor: string; subText: string }) {
  const isNative = Capacitor.isNativePlatform();
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Daily settings
  const [dailyEnabled, setDailyEnabled] = useUserSetting<string>('notif_daily', 'on');
  const [dailyHour, setDailyHour]       = useUserSetting<string>('notif_daily_hour', '17');

  // Prayer on/off — all default 'on' (enabled on first install)
  const [fajrOn,    setFajrOn]    = useUserSetting<string>('notif_fajr',    'on');
  const [dhuhrOn,   setDhuhrOn]   = useUserSetting<string>('notif_dhuhr',   'on');
  const [asrOn,     setAsrOn]     = useUserSetting<string>('notif_asr',     'on');
  const [maghribOn, setMaghribOn] = useUserSetting<string>('notif_maghrib', 'on');
  const [ishaOn,    setIshaOn]    = useUserSetting<string>('notif_isha',    'on');

  const prayerSettings = [
    { id: 'fajr',    name: 'الفجر',  enabled: fajrOn,    setEnabled: setFajrOn    },
    { id: 'dhuhr',   name: 'الظهر',  enabled: dhuhrOn,   setEnabled: setDhuhrOn   },
    { id: 'asr',     name: 'العصر',  enabled: asrOn,     setEnabled: setAsrOn     },
    { id: 'maghrib', name: 'المغرب', enabled: maghribOn, setEnabled: setMaghribOn },
    { id: 'isha',    name: 'العشاء', enabled: ishaOn,    setEnabled: setIshaOn    },
  ];

  useEffect(() => {
    if (!isNative) return;
    checkNotificationPermission().then(setPermGranted);
  }, [isNative]);

  async function handleRequestPermission() {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setPermGranted(granted);
    setRequesting(false);
    if (granted) {
      const profile = getProfileCache();
      if (profile?.lat && profile?.lng) {
        await scheduleAllNotifications(profile.lat, profile.lng);
      }
    }
  }

  function handlePrayerToggle(setter: (v: string) => void, current: string) {
    const next = current === 'on' ? 'off' : 'on';
    setter(next);
    if (permGranted) {
      const profile = getProfileCache();
      if (profile?.lat && profile?.lng) {
        setTimeout(() => reschedulePrayerNotifications(profile.lat, profile.lng), 300);
      }
    }
  }

  function handleDailyToggle() {
    const next = dailyEnabled === 'on' ? 'off' : 'on';
    setDailyEnabled(next);
    if (permGranted) setTimeout(() => rescheduleDailyNotifications(), 300);
  }

  function handleHourSelect(hour: number) {
    setDailyHour(String(hour));
    if (permGranted) setTimeout(() => rescheduleDailyNotifications(), 300);
  }

  const selectedHour = parseInt(dailyHour, 10) || 17;

  if (!isNative) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="rounded-2xl p-4"
        style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(145deg, #7B5EA7, #5B3E8A)' }}>
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>الاشعارات</p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>متاحة على تطبيق الاندرويد فقط</p>
          </div>
        </div>
        <p className="text-xs text-center py-2" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
          الاشعارات تعمل على النسخة المثبتة (APK)
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      className="rounded-2xl p-4 space-y-4"
      style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, #7B5EA7, #5B3E8A)' }}>
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>الاشعارات</p>
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
            مجدولة لمدة 35 يوم — تعمل بدون نت وبدون انترنت
          </p>
        </div>
      </div>

      {/* Permission Banner */}
      {permGranted === false && (
        <button
          onClick={handleRequestPermission}
          disabled={requesting}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            {requesting
              ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#ef4444' }} />
              : <BellOff className="w-4 h-4" style={{ color: '#ef4444' }} />}
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}>
              {requesting ? 'جاري طلب الاذن...' : 'اذن الاشعارات مطلوب'}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
              اضغط هنا للسماح للتطبيق بارسال الاشعارات
            </p>
          </div>
        </button>
      )}

      {permGranted === true && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}>
            الاشعارات مفعّلة ومجدولة بنجاح
          </p>
        </div>
      )}

      {/* ── Prayer Notifications ── */}
      <div>
        <p className="text-xs font-bold mb-2 px-1" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
          اشعارات الصلاة — قبل 20 دقيقة، قبل 10 دقائق، عند الاذان
        </p>
        <div className="space-y-2">
          {prayerSettings.map(prayer => (
            <div
              key={prayer.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(193,154,107,0.06)', border: `1px solid ${borderColor}` }}
            >
              <p className="font-bold text-sm flex-1" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>
                {prayer.name}
              </p>
              <Toggle
                on={prayer.enabled === 'on'}
                onToggle={() => handlePrayerToggle(prayer.setEnabled, prayer.enabled)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Notification ── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
            الاشعار اليومي — اية او حديث او ذكر
          </p>
          <Toggle on={dailyEnabled === 'on'} onToggle={handleDailyToggle} />
        </div>

        {dailyEnabled === 'on' && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(193,154,107,0.06)', border: `1px solid ${borderColor}` }}>
            <p className="text-xs mb-2.5 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
              اختر الساعة التي تريد استقبال الاشعار فيها يومياً
            </p>
            <div className="grid grid-cols-9 gap-1">
              {DAILY_HOURS.map(({ label, hour }) => {
                const isSelected = selectedHour === hour;
                return (
                  <button
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    className="flex items-center justify-center rounded-lg py-2 transition-all active:scale-95"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #7B5EA7, #5B3E8A)'
                        : 'rgba(193,154,107,0.08)',
                      border: `1.5px solid ${isSelected ? '#7B5EA7' : borderColor}`,
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{
                        fontFamily: '"Tajawal", sans-serif',
                        color: isSelected ? '#fff' : subText,
                        fontSize: '10px',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-2.5 text-center font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#7B5EA7' }}>
              سيصلك الاشعار كل يوم الساعة {DAILY_HOURS.find(h => h.hour === selectedHour)?.label} بالضبط
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
        الاشعارات مجدولة محليا — تشتغل حتى لو التطبيق مقفول
      </p>
    </motion.div>
  );
}

function BackupSection({ sectionBg, borderColor, textColor, subText }: { sectionBg: string; borderColor: string; textColor: string; subText: string }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  async function buildBackup(): Promise<{ json: string; fileName: string }> {
    await flushRTDB();
    const json = exportAllData();
    const fileName = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;
    return { json, fileName };
  }

  async function handleExport() {
    setSaving(true);
    setSavedPath(null);
    try {
      const { json, fileName } = await buildBackup();

      if (Capacitor.isNativePlatform()) {
        let written = false;
        try {
          await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: json,
            directory: Directory.ExternalStorage,
            encoding: Encoding.UTF8,
            recursive: true,
          } as Parameters<typeof Filesystem.writeFile>[0]);
          setSavedPath(`التنزيلات — ${fileName}`);
          written = true;
        } catch { }

        if (!written) {
          try {
            await Filesystem.writeFile({
              path: fileName,
              data: json,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });
            setSavedPath(`المستندات — ${fileName}`);
            written = true;
          } catch { }
        }

        if (!written) {
          const writeResult = await Filesystem.writeFile({
            path: fileName,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });
          await Share.share({
            title: 'نسخة احتياطية - نور',
            url: writeResult.uri,
            dialogTitle: 'احفظ النسخة الاحتياطية',
          });
        }

        setSaveDone(true);
        setTimeout(() => { setSaveDone(false); setSavedPath(null); }, 7000);
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSavedPath(fileName);
        setSaveDone(true);
        setTimeout(() => { setSaveDone(false); setSavedPath(null); }, 4000);
      }
    } catch { }
    finally { setSaving(false); }
  }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
      className="rounded-2xl p-4"
      style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, #C19A6B, #8B5E3C)' }}>
          <HardDrive className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>النسخة الاحتياطية</p>
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>صدّر أو استعِد بياناتك على جهازك</p>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={handleExport} disabled={saving}
          className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.97] disabled:opacity-60"
          style={{ background: saveDone ? 'rgba(34,197,94,0.1)' : 'rgba(193,154,107,0.08)', border: `1.5px solid ${saveDone ? 'rgba(34,197,94,0.35)' : 'rgba(193,154,107,0.25)'}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: saveDone ? 'rgba(34,197,94,0.15)' : 'rgba(193,154,107,0.12)' }}>
            {saveDone ? <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} /> : <Download className="w-5 h-5" style={{ color: '#C19A6B' }} />}
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: saveDone ? '#22c55e' : textColor }}>
              {saving ? 'جاري التصدير...' : saveDone ? 'تم التصدير' : (Capacitor.isNativePlatform() ? 'تصدير ومشاركة النسخة' : 'تصدير النسخة الاحتياطية')}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: saveDone && savedPath ? '#22c55e' : subText }}>
              {savedPath ? `تم الحفظ في: ${savedPath}` : (Capacitor.isNativePlatform() ? 'يحفظ مباشرة في مجلد التنزيلات' : 'تنزيل ملف noor-backup.json')}
            </p>
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
    </motion.div>
  );
}

export function Settings() {
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const { bgType, bgPreset, bgCustom, appFontScale, hasBg, cardOpacity, setBgType, setBgPreset, setBgCustom, setAppFontScale, setCardOpacity } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        {/* Notification Section */}
        <NotificationSection sectionBg={sectionBg} borderColor={borderColor} textColor={textColor} subText={subText} />

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

        {/* Background */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
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
