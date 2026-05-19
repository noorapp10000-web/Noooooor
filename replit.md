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
| `/voice-comparison` | مقارنة التلاوة |
| `/hifz-test` | اختبار الحفظ |
| `/speed-reader` | القراءة السريعة |

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
