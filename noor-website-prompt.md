# برومت لـ Replit Agent — مشروع موقع نور

---

## السياق العام

أنا شغّال على موقع نور (Islamic companion website) مبني بـ React + Firebase.
الموقع يستخدم Firebase لكل حاجة (Auth, Firestore, RTDB) وده مش هيتغير.
عندي تطبيق موبايل (APK) منفصل يشتغل بـ localStorage فقط (بدون Firebase للـ auth).

**المطلوب: إضافة 3 ميزات للموقع بدون المساس بأي كود Firebase موجود.**

---

## الميزة الأولى: Export / Import (حفظ واستعادة البيانات)

### تنسيق الملف (مهم جداً — يجب أن يكون متوافقاً مع التطبيق)

```json
{
  "uid": "...",
  "exportedAt": "ISO date string",
  "data": {
    "profile": { "name": "...", "governorate": "..." },
    "settings/theme": "light",
    "azkar/morning": { "count": 3, "done": false },
    "tasbih/total": 120
  }
}
```

المفتاح `data` هو كائن مسطّح (flat object) حيث كل مفتاح هو مسار البيانات وكل قيمة هي البيانات نفسها.
هذا التنسيق نفسه المستخدم في التطبيق (localStorage-based).

### آلية عمل Export في الموقع

1. اجمع بيانات المستخدم من Firestore/RTDB (كل بياناته الشخصية: التسبيح، الأذكار، القرآن، إلخ)
2. حوّلها إلى التنسيق أعلاه
3. نزّل الملف باسم `noor-backup-YYYY-MM-DD.json`

### آلية عمل Import في الموقع

1. المستخدم يختار ملف JSON
2. التحقق من صحة الملف (له مفتاح `data` و `uid`)
3. ادفع البيانات إلى Firestore/RTDB للمستخدم الحالي
4. أعِد تحميل الصفحة

### مكان الإضافة

أضف قسم "النسخة الاحتياطية" في صفحة الإعدادات (Settings) بأزرار:
- "تصدير إلى ملف" → يُنزّل JSON
- "استعادة من ملف" → يرفع JSON ويطبّق البيانات

---

## الميزة الثانية: نسخ احتياطية على Google Drive

### الأداة المستخدمة

استخدم Firebase Google Sign-In مع إضافة scope إضافي لـ Drive:

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

async function getGoogleDriveToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error('فشل الحصول على صلاحية Google Drive');
  return credential.accessToken;
}
```

**ملاحظة:** إذا ظهر خطأ 403 بسبب Drive API، أضف رابطاً مباشراً لتفعيله:
`https://console.cloud.google.com/apis/library/drive.googleapis.com`

### اسم الملف على Drive

`noor-backup.json` (نفس الاسم دايماً، يُحدَّث وليس مكرَّر)

### عمليات Drive API

```typescript
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

// البحث عن ملف موجود
async function findBackupFile(token: string): Promise<string | null> {
  const q = encodeURIComponent("name='noor-backup.json' and trashed=false");
  const res = await fetch(`${DRIVE_FILES_API}?q=${q}&fields=files(id)&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

// رفع أو تحديث الملف (multipart upload)
async function uploadOrUpdateFile(token: string, content: string): Promise<void> {
  const metadata = { name: 'noor-backup.json', mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const existingId = await findBackupFile(token);
  if (existingId) {
    await fetch(`${DRIVE_UPLOAD_API}/${existingId}?uploadType=multipart`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: form
    });
  } else {
    await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
    });
  }
}

// تنزيل الملف
async function downloadFile(token: string): Promise<string | null> {
  const fileId = await findBackupFile(token);
  if (!fileId) return null;
  const res = await fetch(`${DRIVE_FILES_API}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.text();
}
```

### الأزرار في صفحة الإعدادات

في قسم "Google Drive" أضف:
- زر "رفع نسخة إلى Drive" → `getGoogleDriveToken()` ثم `uploadOrUpdateFile()`
- زر "استعادة من Drive" → `getGoogleDriveToken()` ثم `downloadFile()` ثم `importAllData()`
- عرض email المستخدم المتصل بعد تسجيل الدخول
- زر "تسجيل خروج من Drive" يمسح الـ token فقط (لا يؤثر على Firebase Auth الأساسي)

---

## الميزة الثالثة: تسجيل الدخول بـ Google Drive في صفحة الـ Onboarding

### الفكرة

في صفحة التسجيل/الـ onboarding (حيث يدخل المستخدم اسمه للمرة الأولى)، أضف زر:

**"ربط حساب Google Drive لاستعادة بياناتي"**

### السيناريو الكامل

```
1. المستخدم يفتح الموقع للمرة الأولى
2. يظهر له نموذج: "أهلاً بك في نور — أدخل اسمك"
3. تحت النموذج: زر "أو سجّل دخول بـ Google Drive لاستعادة بياناتك"
4. عند الضغط:
   a. Firebase Google Sign-In مع drive.file scope
   b. بعد النجاح: البحث عن noor-backup.json في Drive
   c. إذا وُجد الملف → "وجدنا نسخة احتياطية! هل تريد استعادتها؟" (confirm dialog)
   d. إذا وافق → importAllData(json) → reload
   e. إذا لم يوجد ملف → تابع onboarding عادي مع حفظ Drive token للمستيقبل
5. بعد الإعداد الأول: عند دخول الموقع مجدداً يكون Drive connected تلقائياً
```

### كود مقترح للـ onboarding component

```tsx
// في صفحة الـ onboarding
const [driveChecking, setDriveChecking] = useState(false);
const [driveFound, setDriveFound] = useState<string | null>(null); // JSON content

async function handleDriveLogin() {
  setDriveChecking(true);
  try {
    const token = await getGoogleDriveToken();
    const json = await downloadFile(token);
    if (json) {
      setDriveFound(json);
      // اعرض للمستخدم: "وجدنا نسخة احتياطية، هل تستعيدها؟"
    } else {
      // لا توجد نسخة، أكمل التسجيل العادي
      completeOnboarding();
    }
  } catch (e) {
    console.error(e);
  }
  setDriveChecking(false);
}

function handleRestoreFromDrive() {
  if (!driveFound) return;
  importAllData(driveFound); // تطبيق البيانات
  window.location.reload();
}
```

---

## ملاحظات تقنية مهمة

### تنسيق الملف — شرح مفصل

الملف يجب أن يكون بهذا الشكل بالضبط حتى يعمل مع التطبيق أيضاً:

```json
{
  "uid": "firebase-uid-or-local-uid",
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "data": {
    "profile": { "name": "أحمد", "governorate": "القاهرة" },
    "settings/theme": "dark",
    "azkar/morning/count": 5,
    "tasbih/total": 250,
    "quran/lastRead": { "surah": 2, "ayah": 100 },
    "hifz/progress": { ... }
  }
}
```

- المفاتيح في `data` تستخدم `/` كفاصل للمسار (مثل localStorage keys)
- القيم يمكن أن تكون أي نوع (string, number, object, boolean)
- الـ `uid` يجب أن يكون uid المستخدم الحالي عند export

### الـ importAllData function

```typescript
function importAllData(json: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, error: 'تنسيق الملف غير صحيح' };
    }
    // ادفع كل مفتاح من data إلى Firestore/RTDB للمستخدم الحالي
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    
    // مثال: دفع البيانات إلى RTDB
    const updates: Record<string, unknown> = {};
    for (const [path, value] of Object.entries(parsed.data)) {
      updates[`users/${userId}/${path}`] = value;
    }
    // await update(ref(database), updates);
    
    return { success: true };
  } catch {
    return { success: false, error: 'الملف تالف أو غير صالح' };
  }
}
```

### تصميم الـ UI

- استخدم نفس تصميم الموقع الحالي (ألوان Firebase، fonts، إلخ)
- أضف أيقونة Google Drive (SVG أو من lucide-react: `Cloud`)
- الأزرار تكون disabled أثناء التحميل مع spinner
- اعرض رسالة نجاح/خطأ واضحة بالعربي
- في صفحة الـ onboarding: الزر يكون بارز وواضح تحت فورم الاسم

### ترتيب التنفيذ المقترح

1. أنشئ ملف `lib/google-drive.ts` بكل دوال Drive
2. أنشئ ملف `lib/backup.ts` بدوال `exportAllData` و `importAllData`
3. حدّث صفحة الإعدادات بقسم النسخ الاحتياطية
4. حدّث صفحة الـ onboarding بزر Google Drive
5. تأكد من أن Firebase Google Auth يطلب drive.file scope

---

## ما يجب عدم تغييره

- لا تلمس Firebase Auth الأساسي (Google Sign-In للدخول للموقع)
- لا تلمس Firestore collections الحالية (leaderboard، rankings، إلخ)
- لا تلمس أي كود Firebase موجود إلا بإضافة `addScope` فقط
- الموقع يبقى يعتمد على Firebase بالكامل كما هو

---

## ملخص ما يُنفَّذ

| الميزة | الوصف |
|--------|--------|
| Export محلي | تنزيل noor-backup.json من الموقع |
| Import محلي | رفع ملف واستعادة البيانات |
| Drive Backup | رفع/تنزيل noor-backup.json على Google Drive |
| Drive Login | تسجيل الدخول بـ Google Drive في صفحة التسجيل + استعادة تلقائية |

الملف المُصدَّر من الموقع يعمل على التطبيق، والملف المُصدَّر من التطبيق يعمل على الموقع.
