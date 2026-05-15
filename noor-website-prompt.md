# برومت لـ Replit Agent — موقع تطبيق نور (v2.4)

---

## السياق العام

تطبيق **Noor** (نور) هو Islamic companion app متاح كـ:
- **تطبيق Android (APK)** — مبني بـ React + Vite + Capacitor، يعمل بـ localStorage بالكامل، بدون نت، بدون Firebase
- **موقع ويب** — نفس الكود، يمكن تشغيله بدون Firebase أيضاً

الـ package ID: `com.noor.app` | AppName على الموبايل: `Noor`

---

## استراتيجية النسخ الاحتياطي (مهم جداً)

### لا يوجد Google Drive — النسخ الاحتياطي محلي فقط

**على Android (APK):**
- زر واحد فقط: **"تصدير ومشاركة النسخة"**
- يكتب الملف في `Directory.Cache` (لا يحتاج أذونات)
- ثم يفتح Native Share Sheet مباشرة — المستخدم يختار: حفظ في التنزيلات، واتساب، درايف، بريد...

**على الويب:**
- زر "تصدير النسخة الاحتياطية" → تنزيل `noor-backup.json` تلقائي مباشرة في المتصفح (Chrome وغيره)
- يستخدم `<a href="blob:..." download>` مع `a.click()` — لا يحتاج إذن، يبدأ التنزيل فوراً
- زر "استعادة من ملف" → `<input type="file">` → `importAllData()` → `reload()`

```typescript
// على Android — write to cache then share immediately
async function handleExport() {
  const json = exportAllData();
  const fileName = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (Capacitor.isNativePlatform()) {
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: 'نسخة احتياطية - نور',
      text: 'ملف النسخة الاحتياطية لتطبيق نور',
      url: writeResult.uri,
      dialogTitle: 'احفظ أو شارك النسخة الاحتياطية',
    });
  } else {
    // Web: browser download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }
}
```

---

## تنسيق ملف النسخة الاحتياطية (v3)

```json
{
  "_version": 3,
  "_exportedAt": "2025-05-14T10:30:00.000Z",
  "_uid": "local-uuid-or-firebase-uid",
  "_cache": {
    "profile": { "name": "أحمد", "governorateId": "cairo", "lat": 30.0444, "lng": 31.2357 },
    "settings": { "theme": "dark", "font_scale": 1 },
    "azkar": { "2025-05-14": { "1": { "0": 5 } } },
    "tasbih_totals": { "subhanallah": 250 },
    "daily_tracker": { "2025-05-14": { "prayers": { "Fajr": true }, "quranWird": false } }
  },
  "_localStorage": {
    "noor_uid": "...",
    "noor_pt_30.0444_31.2357_2025-05-14": "{...}",
    "noor_quran_bookmark": "..."
  }
}
```

**القواعد:**
- `_cache` = كل بيانات المستخدم (profile, settings, azkar, tasbih, quran, prayers...)
- `_localStorage` = كل مفاتيح `noor_*` في localStorage (مواقيت الصلاة المؤقتة، بوكماركات القرآن، إلخ)
- النسخة الاحتياطية تصدّر **كل شيء** — لا يُترك شيء

---

## دالة Export و Import

```typescript
// lib/rtdb.ts (المستخدمة في التطبيق)
export function exportAllData(): string {
  const uid = _currentUid || localStorage.getItem('noor_uid') || '';

  const allLS: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('noor_')) {
      const v = localStorage.getItem(k);
      if (v !== null) allLS[k] = v;
    }
  }

  return JSON.stringify({
    _version: 3,
    _exportedAt: new Date().toISOString(),
    _uid: uid,
    _cache: _cache,          // in-memory user data
    _localStorage: allLS,    // all noor_ localStorage keys
  }, null, 2);
}

export function importAllData(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data._cache || typeof data._cache !== 'object')
      return { success: false, error: 'ملف النسخة الاحتياطية غير صحيح' };

    const uid = _currentUid || localStorage.getItem('noor_uid') || getOrCreateLocalUid();
    _cache = data._cache;
    saveCache(uid);

    // Restore all noor_ localStorage keys
    for (const [k, v] of Object.entries((data._localStorage ?? data._extras ?? {}) as Record<string, string>)) {
      if (k !== 'noor_uid') localStorage.setItem(k, String(v));
    }

    return { success: true };
  } catch {
    return { success: false, error: 'تعذّر قراءة الملف — تأكد أنه ملف نور صحيح' };
  }
}
```

---

## الميزة: استعادة في صفحة الـ Onboarding

في صفحة التسجيل (أول مرة يفتح التطبيق)، أضف زر:

**"استعادة من نسخة احتياطية"** → يفتح `<input type="file">` → `importAllData()` → `reload()`

```tsx
<input
  type="file"
  accept=".json,application/json"
  className="hidden"
  ref={importRef}
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importAllData(ev.target?.result as string);
      if (result.success) window.location.reload();
      else alert(result.error);
    };
    reader.readAsText(file);
  }}
/>
<button onClick={() => importRef.current?.click()}>
  📂 استعادة من نسخة احتياطية
</button>
```

---

## مواقيت الصلاة — adhan.js فقط (بدون أي API)

مواقيت الصلاة تعمل **بالكامل offline** باستخدام **adhan.js فقط**. لا يوجد اتصال بأي API خارجي.

```typescript
// static import — مجمّع في الـ bundle دائماً (لا dynamic import)
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';

function computePrayerTimes(lat: number, lng: number, dateOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dateOffset);

  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian(); // هيئة المساحة المصرية
  const pt = new PrayerTimes(coords, d, params);

  const fmt = (date: Date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return {
    Fajr:    fmt(pt.fajr),
    Sunrise: fmt(pt.sunrise),
    Dhuhr:   fmt(pt.dhuhr),
    Asr:     fmt(pt.asr),
    Maghrib: fmt(pt.maghrib),
    Isha:    fmt(pt.isha),
  };
}
```

**استراتيجية التخزين المؤقت:**
1. تحقق من localStorage: مفتاح `noor_pt_{lat}_{lng}_{YYYY-MM-DD}`
2. إذا موجود → أرجعه فوراً (zero latency)
3. إذا غير موجود → احسب بـ adhan.js فوراً (synchronous, no network) → احفظ في localStorage

**لا يوجد API fallback — adhan.js يكفي تماماً ويعطي نتائج دقيقة.**

**المحافظات المصرية:** استخدم `EGYPT_GOVERNORATES` من `artifacts/noor/src/lib/constants.ts`

---

## Splash Screen

التطبيق يبدأ بـ Splash Screen يعرض:
- صورة قبة الصخرة بأثر Ken Burns (zoom out)
- تدرج مظلم من أسفل
- بعد ثانية: يظهر فاصل ذهبي + "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" بخط الأميري
- بعد ثانيتين: يظهر نص "رفيقك الإسلامي الشامل"
- بعد 4.6 ثانية: يختفي بـ blur transition

---

## الإشعارات

الإشعارات في الموقع (browser) تختلف عن الموبايل:

```typescript
async function requestBrowserNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function schedulePrayerNotification(prayerName: string, time: string, minutesBefore = 10) {
  const [h, m] = time.split(':').map(Number);
  const triggerTime = new Date();
  triggerTime.setHours(h, m - minutesBefore, 0, 0);
  const delay = triggerTime.getTime() - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    new Notification('🕌 تطبيق نُور', {
      body: `${prayerName} بعد ${minutesBefore} دقيقة`,
      icon: '/icons/icon-192.png',
    });
  }, delay);
}
```

**ملاحظة:** إشعارات المتصفح محدودة (لا تعمل لو أُغلق التاب). للإشعارات الحقيقية في الخلفية يجب استخدام APK فقط عبر `@capacitor/local-notifications`.

---

## البيانات — محلي فقط

| البيانات | التخزين |
|---------|---------|
| الملف الشخصي | localStorage (`noor_rtdb_cache_{uid}`) |
| التسبيح | localStorage |
| الأذكار | localStorage |
| التقدم في القرآن | localStorage |
| الصلوات | localStorage |
| الإعدادات | localStorage |
| مواقيت الصلاة | localStorage (memoized per day) |

**لا Firebase — لا Firestore — لا RTDB — كل شيء على الجهاز.**

---

## الميزات الرئيسية للتطبيق (v2.4)

| الميزة | الوصف |
|--------|--------|
| القرآن الكريم | قارئ مع تفسير ميسر وبحث عربي كامل (6236 آية) |
| الأحاديث | 6 كتب (34532 حديث) مع بحث عربي وتظليل النتائج |
| مواقيت الصلاة | adhan.js فقط (offline كامل، بدون API) |
| الإشعارات | `@capacitor/local-notifications` — بدون نت تماماً |
| الأذكار | صباح/مساء مع تتبع التقدم |
| التسبيح | عداد رقمي — localStorage فقط |
| القبلة | بوصلة ذكية |
| التاريخ الإسلامي | 4975 حدث في 5 حقب |
| الاختبارات | 5820 سؤال في 6 تخصصات |
| الإذاعات والقنوات | بث مباشر (HLS) |
| النسخ الاحتياطي | تصدير ومشاركة فورية عبر Share Sheet (Android) أو تنزيل (Web) |

---

## تصميم الـ UI

- **الخط الرئيسي:** `"Tajawal", sans-serif` (نصوص) + `"Amiri"/"Scheherazade New"` (عربي كلاسيكي)
- **اللون الأساسي:** `#C19A6B` (ذهبي/عنبري)
- **الخلفية الفاتحة:** `#FDFBF5`
- **الخلفية الداكنة:** `#0f0c07`
- **الاتجاه:** `dir="rtl"` على كل الصفحات
- الأزرار `disabled` أثناء التحميل مع spinner
- رسائل نجاح/خطأ واضحة بالعربي
- أيقونات من `lucide-react`

---

## ما يجب عدم تغييره

- لا تلمس منطق `initUserSyncFast` / `getProfileCache` / `queueRTDBUpdate` في `rtdb.ts`
- لا تضف أي Google Drive scope أو Drive API
- لا تستخدم `Directory.External` على Android (لا يعمل بدون أذونات على Android 10+)
- لا تستخدم `await import('adhan')` — استخدم static import دائماً حتى يُجمَّع في الـ bundle
- تنسيق ملف الـ backup يبقى متوافقاً مع v2 و v3

---

**لا يوجد Google Drive — لا Firebase — النسخ الاحتياطي محلي فقط — مواقيت الصلاة offline فقط.**
