# برومت لـ Replit Agent — موقع تطبيق نور (v2.3)

---

## السياق العام

تطبيق **Noor** (نور) هو Islamic companion app متاح كـ:
- **تطبيق Android (APK)** — مبني بـ React + Vite + Capacitor، يعمل بـ localStorage بالكامل، بدون نت
- **موقع ويب** — نفس الكود تقريباً لكن يستخدم Firebase (Auth, Firestore, RTDB)

الـ package ID: `com.noor.app` | AppName على الموبايل: `Noor`

---

## استراتيجية النسخ الاحتياطي (مهم جداً)

### لا يوجد Google Drive

النسخ الاحتياطي **محلي فقط** — لا يوجد Google Drive integration على الإطلاق.

**الخيارات المتاحة:**
| الإجراء | التطبيق | الموقع |
|---------|---------|--------|
| تصدير | يحفظ `noor-backup.json` في التخزين الخارجي | يُنزّل `noor-backup.json` للمتصفح |
| مشاركة | Native Share Sheet (واتساب / بريد / Drive / إلخ) | `navigator.share` أو تنزيل |
| استعادة | اختيار ملف JSON محلي | اختيار ملف JSON محلي |

---

## تنسيق ملف النسخة الاحتياطية

يجب أن يكون التنسيق **هذا بالضبط** حتى يكون متوافقاً بين الموقع والتطبيق:

```json
{
  "uid": "firebase-uid-or-local-uid",
  "exportedAt": "2025-05-14T10:30:00.000Z",
  "data": {
    "profile": { "name": "أحمد", "governorate": "القاهرة", "lat": 30.0444, "lng": 31.2357 },
    "settings/theme": "dark",
    "settings/font_scale": 1,
    "azkar/morning": { "count": 5, "done": true, "date": "2025-05-14" },
    "azkar/evening": { "count": 0, "done": false, "date": "2025-05-14" },
    "tasbih/total": 250,
    "quran/bookmark": { "surah": 2, "ayah": 100 },
    "prayers/2025-05-14": { "Fajr": true, "Dhuhr": false, "Asr": true, "Maghrib": true, "Isha": false }
  }
}
```

**القواعد:**
- مفاتيح `data` تستخدم `/` كفاصل للمسار (نفس مفاتيح localStorage في التطبيق)
- القيم أي نوع (string, number, object, boolean, null)
- `uid` = Firebase UID في الموقع، أو `local_${timestamp}` في التطبيق
- الملف المُصدَّر من الموقع يعمل في التطبيق، والعكس صحيح

---

## الميزة الأولى: Export / Import (محلي فقط)

### Export في الموقع

```typescript
// lib/backup.ts
import { auth } from './firebase';
import { get, ref } from 'firebase/database';
import { database } from './firebase';

export async function exportAllData(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول');

  // جلب كل بيانات المستخدم من RTDB
  const snapshot = await get(ref(database, `users/${uid}`));
  const raw = snapshot.val() ?? {};

  // تسطيح البيانات إلى flat object
  const flat: Record<string, unknown> = {};
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}/${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        flatten(v as Record<string, unknown>, key);
      } else {
        flat[key] = v;
      }
    }
  }
  flatten(raw);

  const backup = {
    uid,
    exportedAt: new Date().toISOString(),
    data: flat,
  };

  return JSON.stringify(backup, null, 2);
}

export function downloadBackup(json: string): void {
  const fileName = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### Import في الموقع

```typescript
// lib/backup.ts (تابع)
import { update, ref } from 'firebase/database';

export async function importAllData(json: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, error: 'تنسيق الملف غير صحيح' };
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    // بناء object للـ update
    const updates: Record<string, unknown> = {};
    for (const [path, value] of Object.entries(parsed.data)) {
      updates[`users/${uid}/${path.replace(/\//g, '/')}`] = value;
    }

    await update(ref(database), updates);
    return { success: true };
  } catch (e) {
    return { success: false, error: 'الملف تالف أو غير صالح' };
  }
}
```

### UI في صفحة الإعدادات

أضف قسم "النسخة الاحتياطية" بثلاثة أزرار:

```tsx
// في صفحة Settings
async function handleExport() {
  const json = await exportAllData();
  downloadBackup(json);
}

async function handleShare() {
  const json = await exportAllData();
  const fileName = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;
  const file = new File([json], fileName, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'نسخة احتياطية - Noor' });
  } else {
    downloadBackup(json); // fallback
  }
}
```

**الأزرار الثلاثة:**
- `تصدير إلى ملف` → `handleExport()` — تنزيل noor-backup.json
- `مشاركة النسخة الاحتياطية` → `handleShare()` — Web Share API أو تنزيل
- `استعادة من ملف` → `<input type="file">` → `importAllData()` → `reload()`

---

## الميزة الثانية: استعادة في صفحة الـ Onboarding

في صفحة التسجيل/الترحيب (حيث يدخل المستخدم اسمه للمرة الأولى)، أضف زر:

**"استعادة من نسخة احتياطية"** → يفتح `<input type="file">` → `importAllData()` → `reload()`

```tsx
// في صفحة Login / Onboarding
<div className="mt-4">
  <input
    type="file"
    accept=".json,application/json"
    className="hidden"
    ref={importRef}
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = await importAllData(text);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    }}
  />
  <button
    onClick={() => importRef.current?.click()}
    className="w-full border rounded-xl p-3 text-sm"
  >
    📂 استعادة من نسخة احتياطية
  </button>
  <p className="text-xs text-center mt-2 opacity-60">
    بياناتك محفوظة على جهازك — لا حاجة لإنترنت
  </p>
</div>
```

---

## مواقيت الصلاة (بدون API)

مواقيت الصلاة في الموقع يجب أن تعمل **بالكامل offline** باستخدام مكتبة **adhan.js** (الطريقة المصرية):

```typescript
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';

function getPrayerTimes(lat: number, lng: number, date = new Date()) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian(); // هيئة المساحة المصرية
  const pt = new PrayerTimes(coords, date, params);

  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

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
1. احسب بـ adhan.js فوراً (لا انتظار)
2. احفظ في localStorage بمفتاح `noor_pt_{lat}_{lng}_{YYYY-MM-DD}`
3. اجلب من الـ API (aladhan.com) في الخلفية فقط للحصول على التاريخ الهجري
4. لو الـ API أجاب → حدّث localStorage بالتاريخ الهجري

**المحافظات المصرية وإحداثياتها:** استخدم نفس `EGYPT_GOVERNORATES` الموجود في `artifacts/noor/src/lib/constants.ts`

---

## الإشعارات

الإشعارات في الموقع (browser) تختلف عن الموبايل:

```typescript
// طلب إذن الإشعارات في المتصفح
async function requestBrowserNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// جدولة إشعار صلاة
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

## مزامنة البيانات بين الموقع والتطبيق

| البيانات | الموقع | التطبيق |
|---------|--------|---------|
| الملف الشخصي | Firebase RTDB | localStorage |
| التسبيح | Firebase RTDB + Firestore | localStorage |
| الأذكار | Firebase RTDB | localStorage |
| التقدم في القرآن | Firebase RTDB | localStorage |
| الصلوات | Firebase RTDB | localStorage |
| الإعدادات | Firebase RTDB | localStorage |

**المزامنة:** عبر ملف `noor-backup.json` فقط (Export من أحدهما → Import في الآخر).

---

## الميزات الرئيسية للتطبيق (v2.3)

| الميزة | الوصف |
|--------|--------|
| القرآن الكريم | قارئ مع تفسير ميسر وبحث عربي كامل (6236 آية) |
| الأحاديث | 6 كتب (34532 حديث) مع بحث عربي وتظليل النتائج |
| مواقيت الصلاة | adhan.js (بدون نت) + تاريخ هجري من API |
| الإشعارات | `@capacitor/local-notifications` — بدون نت تماماً |
| الأذكار | صباح/مساء مع تتبع التقدم |
| التسبيح | عداد رقمي مع مزامنة Firebase |
| القبلة | بوصلة ذكية |
| التاريخ الإسلامي | 4975 حدث في 5 حقب |
| الاختبارات | 5820 سؤال في 6 تخصصات |
| الإذاعات والقنوات | بث مباشر (HLS) |
| النسخ الاحتياطي | محلي فقط + مشاركة عبر Share Sheet |

---

## ما يجب عدم تغييره في الموقع

- لا تلمس Firebase Auth (Google Sign-In)
- لا تلمس Firestore collections الحالية (leaderboard، sohbaLeaderboard)
- لا تضف أي Google Drive scope أو Drive API
- الموقع يبقى يعتمد على Firebase كما هو
- تنسيق ملف الـ backup يبقى كما هو (متوافق مع التطبيق)

---

## تصميم الـ UI

- **الخط الرئيسي:** `"Tajawal", sans-serif` (نصوص) + `"Amiri"` (عربي كلاسيكي)
- **اللون الأساسي:** `#C19A6B` (ذهبي/عنبري)
- **الخلفية الفاتحة:** `#FDFBF5`
- **الخلفية الداكنة:** `#0f0c07`
- **الاتجاه:** `dir="rtl"` على كل الصفحات
- الأزرار تكون `disabled` أثناء التحميل مع spinner
- رسائل نجاح/خطأ واضحة بالعربي
- أيقونات من `lucide-react` (Download, Upload, Share2, FolderOpen, HardDrive)

---

## ملخص ما يُنفَّذ في الموقع

| الميزة | الوصف | الأولوية |
|--------|--------|---------|
| Export محلي | تنزيل noor-backup.json | عالية |
| Import محلي | رفع ملف واستعادة البيانات | عالية |
| مشاركة النسخة | Web Share API أو تنزيل | متوسطة |
| Import في Onboarding | زر استعادة في صفحة الترحيب | عالية |
| مواقيت الصلاة | adhan.js offline-first | عالية |
| إشعارات المتصفح | Notification API (محدودة) | منخفضة |

**لا يوجد Google Drive — النسخ الاحتياطي محلي فقط.**
