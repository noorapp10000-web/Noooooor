# برومت: تنفيذ ميزة Export بيانات المستخدم من Firebase إلى ملف JSON

---

## المطلوب منك

أضف زرار **"تصدير بياناتي"** في صفحة الإعدادات أو البروفايل في الموقع.
عند الضغط عليه:
1. يجيب **كل** بيانات المستخدم الحالي من Firebase Realtime Database
2. يحولها لملف JSON كامل
3. يبدأ التحميل **إجبارياً** في المتصفح (مش بيفتح تاب جديد — بيتحمل مباشرةً)

---

## بيانات المستخدم اللي المفروض تتصدر

المستخدم متسجل عن طريق **Firebase Auth**.
كل بياناته محفوظة في **Firebase Realtime Database** تحت المسار:

```
/users/{uid}/
```

اجيب **كل** الـ nodes الموجودة تحت `uid` هذا المستخدم بدون استثناء، بما فيها:

- `profile` — الاسم، الصورة، تاريخ التسجيل، أي معلومات شخصية
- `settings` — إعدادات التطبيق (الثيم، الخط، طريقة حساب الصلاة، المدينة/الموقع، اللغة، إلخ)
- `prayers` — سجل مواقيت الصلاة والتتبع اليومي (أي صلوات صلاها، المواظبة، إلخ)
- `azkar` — أذكار الصباح والمساء والأذكار اليومية وسجل إتمامها
- `tasbih` — عدادات التسبيح لكل يوم
- `quran` — الإشارات المرجعية (bookmarks)، آخر موقع قراءة، السور المكتملة، تقدم الحفظ
- `hadith` — الأحاديث المحفوظة أو المفضلة
- `quiz` — نتائج الاختبارات والأسئلة وتاريخ الأداء
- `hifz` — تقدم الحفظ والمراجعة
- `history` — أي سجل تاريخي للنشاط داخل التطبيق
- أي node أخرى موجودة تحت الـ uid — اجلبها كلها

---

## شكل ملف الـ JSON الناتج

```json
{
  "exportedAt": "2026-05-20T10:30:00.000Z",
  "appVersion": "نور",
  "uid": "abc123xyz",
  "email": "user@example.com",
  "displayName": "اسم المستخدم",
  "data": {
    "profile": { ... },
    "settings": { ... },
    "prayers": { ... },
    "azkar": { ... },
    "tasbih": { ... },
    "quran": { ... },
    "hadith": { ... },
    "quiz": { ... },
    "hifz": { ... },
    "history": { ... }
  }
}
```

- `exportedAt` → وقت التصدير ISO string
- `appVersion` → ثابت "نور"
- `uid` → من `auth.currentUser.uid`
- `email` → من `auth.currentUser.email`
- `displayName` → من `auth.currentUser.displayName` أو من `data.profile.name`
- `data` → **كل** الـ snapshot من `/users/{uid}/` كما هي بدون تعديل

---

## كود التحميل الإجباري (Forced Download)

استخدم هذه الطريقة بالظبط لتحميل الملف — لا تفتح تاب جديد ولا تستخدم `window.open`:

```javascript
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

اسم الملف يكون: `noor-backup-{YYYY-MM-DD}.json`
مثال: `noor-backup-2026-05-20.json`

---

## كود جلب البيانات من Firebase

```javascript
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

async function exportUserData() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }

  const db = getDatabase();
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  const userData = snapshot.val();

  const exportData = {
    exportedAt: new Date().toISOString(),
    appVersion: 'نور',
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || userData?.profile?.name || '',
    data: userData,
  };

  const today = new Date().toISOString().split('T')[0];
  downloadJSON(exportData, `noor-backup-${today}.json`);
}
```

---

## UX الزرار

- نص الزرار: **"تصدير بياناتي 📥"** أو **"تحميل نسخة احتياطية"**
- أثناء التحميل من Firebase: اعرض loading spinner أو غير نص الزرار لـ "جاري التصدير..."
- بعد نجاح التحميل: رسالة نجاح صغيرة مثل toast أو snackbar
- في حالة خطأ: رسالة واضحة للمستخدم

---

## ملاحظات مهمة

- **لا تعدل أي شيء آخر في المشروع** — المطلوب فقط إضافة زرار Export وكوده
- **لا تحذف أي بيانات** — هذا export للقراءة فقط، بدون أي write أو delete
- **لا تفلتر البيانات** — اجلب كل الـ snapshot كما هي، حتى لو فيها nodes فارغة
- إذا كان الـ path في Firebase مختلف عن `/users/{uid}/`، اتبع الـ structure الموجود في المشروع
- إذا كان فيه بيانات في **Firestore** كمان إلى جانب Realtime Database، اجلبها وضمها في `data` كمان تحت مفتاح `firestore: { ... }`

---

## النتيجة المتوقعة

المستخدم يضغط الزرار → المتصفح يحمل ملف `noor-backup-2026-05-20.json` تلقائياً → الملف يحتوي على كل بياناته الكاملة جاهزة للاستيراد في تطبيق نور.
