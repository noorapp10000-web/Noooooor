# دليل نشر تطبيق نور على Google Play Store

## معلومات التطبيق الأساسية

| الحقل | القيمة |
|-------|--------|
| **اسم التطبيق** | نور — Noor |
| **Package ID** | `com.noor.app` |
| **Min SDK** | 22 (Android 5.1 Lollipop) |
| **Target SDK** | 34 (Android 14) |
| **versionCode** | 1 (يزيد مع كل إصدار جديد) |
| **versionName** | 2.2 |

---

## الخطوة 1 — إنشاء ملف التوقيع (Keystore)

**مهم جداً: احتفظ بملف الـ Keystore في مكان آمن. إذا فقدته لن تستطيع تحديث التطبيق أبداً.**

### إنشاء keystore جديد
```bash
keytool -genkey -v \
  -keystore noor-release.keystore \
  -alias noor \
  -keyalg RSA \
  -keysize 2048 \
  -validity 25000 \
  -dname "CN=Noor App, OU=Mobile, O=Noor, L=Cairo, S=Cairo, C=EG"
```
سيطلب منك كلمة مرور — احتفظ بها.

### تحويل الـ keystore لـ Base64 (للـ GitHub Actions)
```bash
# Linux / macOS
base64 -w 0 noor-release.keystore > keystore.base64.txt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("noor-release.keystore")) | Out-File keystore.base64.txt
```

### إضافة الـ Secrets في GitHub
اذهب إلى: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | القيمة |
|-------------|--------|
| `KEYSTORE_BASE64` | محتوى ملف `keystore.base64.txt` |
| `KEY_ALIAS` | `noor` |
| `KEY_PASSWORD` | كلمة المرور التي أدخلتها |
| `STORE_PASSWORD` | نفس كلمة المرور |

---

## الخطوة 2 — بناء ملفات الإصدار (Release)

في GitHub Actions → Workflows → **Build Noor Android (APK + AAB)** → Run workflow:
- `version` = رقم الإصدار (مثل 2.3)
- `build_type` = **release**

ستحصل على ملفين:
- `noor-v2.x-release-signed-apk` — للتوزيع المباشر
- `noor-v2.x-release-signed-aab` — **هذا الملف الذي يُرفع على Play Store**

---

## الخطوة 3 — إنشاء حساب Google Play Console

1. اذهب إلى [play.google.com/console](https://play.google.com/console)
2. ادفع رسوم التسجيل: **25 دولار** (مرة واحدة فقط)
3. أكمل معلومات المطور

---

## الخطوة 4 — إنشاء التطبيق في Play Console

1. **Create app**
2. اختر:
   - App name: `نور - Noor`
   - Default language: `Arabic - ar`
   - App or game: `App`
   - Free or paid: `Free`
3. وافق على إعلانات المطور

---

## الخطوة 5 — معلومات القائمة (Store Listing)

### العنوان القصير (30 حرف)
```
نور — رفيقك الإسلامي
```

### الوصف القصير (80 حرف)
```
القرآن الكريم، مواقيت الصلاة، الأذكار، الأحاديث، القبلة — كل شيء في مكان واحد
```

### الوصف الكامل (4000 حرف كحد أقصى)
```
نور هو تطبيقك الإسلامي الشامل — صاحبك الروحي في كل وقت ومكان.

🕌 القرآن الكريم
• قراءة كاملة بالخط العثماني
• تفسير ميسّر لكل آية
• بحث في 6236 آية
• استماع لأكثر من 40 قارئاً
• وضع الحفظ واختبار الحفظ
• القراءة السريعة

🕐 مواقيت الصلاة
• أوقات دقيقة حسب موقعك
• تنبيهات الأذان
• متتبع الصلوات اليومية
• اتجاه القبلة الدقيق

📿 الأذكار والتسبيح
• أذكار الصباح والمساء
• أذكار يومية متنوعة
• مسبحة رقمية

📖 الأحاديث الشريفة
• 6 كتب حديث كاملة (صحيح البخاري، مسلم، أبو داود، الترمذي، ابن ماجه، النسائي)
• بحث في آلاف الأحاديث

📚 مزيد من المحتوى
• قصص الأنبياء عليهم السلام
• التاريخ الإسلامي
• أسماء الله الحسنى
• السنة النبوية
• اختبارات إسلامية (5820 سؤال)
• الإذاعات الإسلامية
• التلفزيون الإسلامي

✅ مميزات التطبيق
• يعمل بدون إنترنت (offline-first)
• سريع ومتجاوب
• دعم الوضع الليلي
• واجهة عربية أصيلة
• بدون إعلانات مزعجة
• بياناتك تُحفظ على جهازك فقط

نور — رفيقك الإسلامي الشامل 🌙
```

---

## الخطوة 6 — الأصول المرئية المطلوبة

| النوع | الأبعاد | ملاحظات |
|-------|---------|---------|
| **App icon** | 512×512 px PNG | بدون زوايا مستديرة — Play يضيفها |
| **Feature graphic** | 1024×500 px | صورة ترويجية للتطبيق |
| **Screenshots** | min 320px max 3840px | مطلوب 2-8 صور على الأقل |
| **Phone screenshots** | 16:9 أو 9:16 | صور شاشة من الجهاز |

### لقطات الشاشة المقترحة
1. الشاشة الرئيسية (مواقيت الصلاة)
2. القرآن الكريم
3. الأذكار
4. الأحاديث
5. القبلة
6. التسبيح

---

## الخطوة 7 — تصنيف المحتوى (Content Rating)

عند ملء استبيان تصنيف المحتوى:
- **Category**: Reference / Religion
- الإجابة بـ "لا" على:
  - العنف ✓
  - المحتوى الجنسي ✓
  - المقامرة ✓
  - الكحول أو التبغ ✓
- الإجابة بـ "نعم" على:
  - الموقع الجغرافي (لمواقيت الصلاة والقبلة) ✓

**التصنيف المتوقع: Everyone (الجميع)** — مناسب لجميع الأعمار

---

## الخطوة 8 — سياسة الخصوصية (مطلوبة)

يجب أن يكون لديك رابط لسياسة الخصوصية. نموذج مبسط:

```
سياسة الخصوصية — تطبيق نور

تطبيق نور لا يجمع أي بيانات شخصية من المستخدمين.
- جميع البيانات تُحفظ محلياً على جهازك فقط
- لا يتم إرسال أي معلومات لخوادم خارجية
- لا نستخدم أي أدوات تتبع أو تحليل
- الموقع الجغرافي يُستخدم فقط لحساب مواقيت الصلاة واتجاه القبلة محلياً

للاستفسار: [بريدك الإلكتروني]
```

---

## الخطوة 9 — رفع الـ AAB

1. في Play Console → **Release** → **Production** (أو Internal Testing للاختبار أولاً)
2. **Create new release**
3. ارفع ملف الـ `*.aab` (Android App Bundle)
4. أضف ملاحظات الإصدار:

```
الإصدار 2.2:
- تحسينات في الأداء
- إصلاح بعض الأخطاء
- تحسين واجهة المستخدم
```

5. **Review release** → **Start rollout to Production**

---

## الخطوة 10 — ملاحظات مهمة قبل الرفع

### ✅ قائمة تدقيق قبل النشر
- [ ] ملف الـ AAB موقّع بالـ Keystore الصحيح
- [ ] `versionCode` أكبر من الإصدار السابق (ابدأ من 1)
- [ ] `versionName` واضح ومنطقي (مثل "2.2")
- [ ] أيقونة التطبيق 512×512 PNG
- [ ] Feature graphic 1024×500 مُصمَّم
- [ ] 2-8 لقطة شاشة مُرفقة
- [ ] رابط سياسة الخصوصية صالح
- [ ] الوصف باللغة العربية مكتوب
- [ ] تصنيف المحتوى مكتمل

### ⚠️ تحذيرات مهمة
1. **لا تفقد ملف الـ Keystore أبداً** — بدونه لن تستطيع تحديث التطبيق
2. **versionCode يجب أن يزيد** مع كل إصدار جديد (لا يمكن إنزاله)
3. **مراجعة Google** تستغرق 1-7 أيام للإصدار الأول
4. إذا اخترت **Play App Signing** (موصى به)، سيحتفظ Google بنسخة من الـ Keystore كضمان

---

## أدوات مفيدة

| الأداة | الرابط |
|--------|--------|
| Play Console | https://play.google.com/console |
| App Icon Generator | https://makeappicon.com |
| Feature Graphic Maker | https://www.norio.be/android-feature-graphic-generator |
| APK Analyzer | https://appetize.io |
| Android Asset Studio | https://romannurik.github.io/AndroidAssetStudio |

---

## معلومات بناء GitHub Actions

| الـ Workflow | الوصف | الملف |
|-------------|--------|-------|
| Build Noor Android | APK + AAB + توقيع | `.github/workflows/build-android.yml` |
| Build Noor Windows EXE | ملف تثبيت Windows | `.github/workflows/build-exe.yml` |

### GitHub Secrets المطلوبة للـ Release
```
KEYSTORE_BASE64   ← keystore مشفر بـ base64
KEY_ALIAS         ← اسم المفتاح (noor)
KEY_PASSWORD      ← كلمة مرور المفتاح
STORE_PASSWORD    ← كلمة مرور الـ keystore
```
