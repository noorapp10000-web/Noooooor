# نور — تطبيق إسلامي شامل

تطبيق إسلامي متكامل مبني بـ React + Vite + Express في pnpm monorepo.

## البنية العامة

### `artifacts/noor/` — الواجهة الأمامية
- React + Vite + TypeScript
- المدخل: `artifacts/noor/src/main.tsx`
- البناء: `artifacts/noor/dist/public/`
- لا lazy loading — كل الصفحات تُحمَّل معاً عند البدء لتنقل سلس

### `artifacts/api-server/` — الخادم الخلفي
- Express + TypeScript
- يخدم فقط: `/health`، `/audio-proxy`، `/download`
- بدون قاعدة بيانات معقدة — فقط تحقق من الاتصال

### `lib/db/` — اتصال قاعدة البيانات
- Drizzle ORM + PostgreSQL
- Schema فارغ حالياً (لا جداول نشطة)

### `scripts/` — سكريبتات التشغيل
- `dev.sh` — الـ workflow الرئيسي: Vite + API server
- `proxy.js` — بروكسي HTTP

## الصفحات (22 صفحة)

| المسار | الصفحة |
|--------|---------|
| `/` | الرئيسية — مواقيت الصلاة + المتتبع اليومي |
| `/quran` | القرآن الكريم — قارئ + تفسير + بحث |
| `/azkar` | الأذكار — صباح/مساء/يومية |
| `/tasbih` | التسبيح الرقمي |
| `/ranking` | إحصائياتي |
| `/more` | المزيد |
| `/settings` | الإعدادات |
| `/asma` | أسماء الله الحسنى |
| `/reciters` | القراء وتشغيل الصوت |
| `/radio` | الإذاعات الإسلامية |
| `/qibla` | بوصلة القبلة |
| `/hadith` | الأحاديث الشريفة |
| `/history` | التاريخ الإسلامي |
| `/prophets` | قصص الأنبياء |
| `/quizzes` | الاختبارات الإسلامية |
| `/sunnah` | السنة النبوية |
| `/tv` | التلفزيون الإسلامي |
| `/hifz-test` | اختبار الحفظ |
| `/speed-reader` | القراءة السريعة |
| `/learn-prayer` | تعلم الصلاة — 14 خطوة بالنص والتشكيل |
| `/wudu` | دليل الوضوء — 10 خطوات مع التفريق بين الفرض والسنة |

## البيانات المحلية (offline-first)
كل البيانات الكبيرة في `artifacts/noor/public/data/`:
- `quran-uthmani-full.json` — نص القرآن الكريم
- `quran-search.json` — فهرس البحث (6236 آية)
- `tafsir-muyassar.json` — تفسير ميسر
- `hadith-*.json` — 6 كتب حديث محلياً
- `history-*.json` — أحداث تاريخية إسلامية
- `quizzes.json` — 5820 سؤال
- `sunnah.json` — السنن النبوية

## التشغيل في Replit

```bash
# الـ workflow الرئيسي: "Start application"
bash scripts/dev.sh
```

- Vite dev server على port 5000
- API server على port 3001
- بدون Firebase، بدون خوادم خارجية

## iOS — بناء التطبيق ورفعه على App Store

### الميزات حسب المنصة

| الميزة | أندرويد | iOS |
|--------|---------|-----|
| ويدجت الشاشة الرئيسية | ✅ | ❌ (أندرويد فقط) |
| حارس الصلاة (Accessibility Overlay) | ✅ | ❌ (أندرويد فقط) |
| تحسين البطارية (BatteryOpt) | ✅ | ❌ (أندرويد فقط) |
| تحكم الإشعارات (AudioBridge) | ✅ | ❌ (MediaSession كافٍ) |
| إشعارات الصلاة | ✅ | ✅ |
| بوصلة القبلة | ✅ | ✅ |
| تشغيل القرآن | ✅ | ✅ |
| الأذكار والتسبيح | ✅ | ✅ |
| التحميل والمشاركة | ✅ | ✅ |

### خطوات البناء على macOS

```bash
# 1. المرة الأولى فقط
bash scripts/ios-build.sh setup

# 2. بعد كل تعديل كود
bash scripts/ios-build.sh sync

# 3. فتح Xcode
bash scripts/ios-build.sh open
```

### إعداد Xcode (مطلوب يدوياً)

1. **Signing & Capabilities** → أضف: `Background Modes` → فعّل `Audio, AirPlay, and Picture in Picture`
2. **Signing & Capabilities** → أضف: `Push Notifications`
3. **iOS Bundle ID**: `com.noorapp10000.noor`
4. **Privacy Manifest**: أضف `ios-config/PrivacyInfo.xcprivacy` عبر File → Add Files to App

### صلاحيات Info.plist (تُضاف تلقائياً بـ ios-setup.sh)

- `NSLocationWhenInUseUsageDescription` — لبوصلة القبلة ومواقيت الصلاة
- `NSLocationAlwaysAndWhenInUseUsageDescription` — للإشعارات مع الموقع
- `NSSpeechRecognitionUsageDescription` — للتعرف على الصوت
- `NSMicrophoneUsageDescription` — للميكروفون
- `UIBackgroundModes: audio` — لتشغيل القرآن في الخلفية

## APIs المتبقية (صوت فقط)
- `GET /audio-proxy?url=` — بروكسي صوت من everyayah.com / mp3quran.net
- `GET /download?url=&filename=` — تحميل MP3

## نظام الألوان
- **اللون الرئيسي**: `#C19A6B` (ذهبي/عنبري)
- **الخطوط**: `Tajawal` للنص، `Amiri` / `Scheherazade New` للخط العربي
- **المود**: فاتح/داكن — CSS variables

## التفضيلات
- الكود نظيف وواضح بدون تعليقات زائدة
- لا lazy loading — كل الصفحات تُحمَّل مع بعض
- offline-first — كل البيانات محلية
- لا Firebase — بيانات المستخدم على الجهاز فقط
