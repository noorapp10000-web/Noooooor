# نُور — تكامل ويدجت Android (المحدَّث)

## ما الذي يفعله هذا الويدجت؟

- عداد حي (ساعات:دقائق:ثوان) للصلاة القادمة
- **شريط تقدم الوقت** بين الصلاة السابقة والقادمة
- **التاريخ الهجري** (API 24+)
- **أيقونة الصلاة** (🌅🌤️☀️🌇🌙) قبل الاسم
- **اسم المدينة** في رأس الويدجت
- **3 أحجام** للويدجت (كبير / متوسط / صغير) — تلقائي حسب حجم الويدجت على الشاشة
- يعمل حتى لو التطبيق مقفول تماماً
- يتوقف عند إيقاف الشاشة لتوفير البطارية
- بيانات الصلاة مخزنة لـ 3 أيام قادمة

---

## الملفات

### Layout
| الملف | الاستخدام |
|--------|-----------|
| `res/layout/widget_prayer.xml` | **كبير** 4×3 — كل الميزات |
| `res/layout/widget_prayer_medium.xml` | **متوسط** 4×2 — بدون تاريخ هجري |
| `res/layout/widget_prayer_small.xml` | **صغير** 2×2 — اسم الصلاة + hh:mm فقط |

### Drawable
| الملف | الوصف |
|--------|--------|
| `res/drawable/widget_bg.xml` | خلفية glassmorphism داكنة |
| `res/drawable/widget_card_bg.xml` | بطاقة زجاجية شفافة |
| `res/drawable/widget_number_bg.xml` | خلفية أرقام العداد |
| `res/drawable/widget_progress.xml` | شريط التقدم الذهبي |

### Kotlin
| الملف | الوصف |
|--------|--------|
| `java/widget/PrayerWidgetService.kt` | Service رئيسي — كل منطق التحديث |
| `java/widget/PrayerWidget.kt` | AppWidgetProvider |
| `java/widget/BootReceiver.kt` | إعادة التشغيل بعد reboot |
| `java/WidgetBridgePlugin.kt` | Capacitor plugin — جسر JS ↔ Android |

---

## خطوات التكامل

### 1. تحديد اسم الحزمة

افتح `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="..." package="YOUR_ACTUAL_PACKAGE_NAME">
```
استبدل `YOUR_PACKAGE_NAME` في جميع ملفات `.kt`.

---

### 2. نسخ الملفات

```
android-widget/res/layout/widget_prayer.xml
android-widget/res/layout/widget_prayer_medium.xml
android-widget/res/layout/widget_prayer_small.xml
  → android/app/src/main/res/layout/

android-widget/res/xml/prayer_widget_info.xml
  → android/app/src/main/res/xml/

android-widget/res/drawable/widget_bg.xml
android-widget/res/drawable/widget_card_bg.xml
android-widget/res/drawable/widget_number_bg.xml
android-widget/res/drawable/widget_progress.xml
  → android/app/src/main/res/drawable/

android-widget/res/values/widget_strings.xml
  → android/app/src/main/res/values/

android-widget/java/widget/PrayerWidget.kt
android-widget/java/widget/PrayerWidgetService.kt
android-widget/java/widget/BootReceiver.kt
  → android/app/src/main/java/YOUR_PACKAGE/widget/

android-widget/java/WidgetBridgePlugin.kt
  → android/app/src/main/java/YOUR_PACKAGE/
```

---

### 3. أيقونة الإشعار

أنشئ `res/drawable/ic_stat_noor.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp"
    android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2z"/>
</vector>
```

---

### 4. AndroidManifest.xml

أضف داخل `<manifest>`:
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```

أضف داخل `<application>`:
```xml
<receiver
    android:name=".widget.PrayerWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/prayer_widget_info" />
</receiver>

<service
    android:name=".widget.PrayerWidgetService"
    android:foregroundServiceType="dataSync"
    android:exported="false" />

<receiver
    android:name=".widget.BootReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
    </intent-filter>
</receiver>
```

---

### 5. تسجيل البلاجن في MainActivity.kt

```kotlin
import YOUR_PACKAGE_NAME.WidgetBridgePlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(WidgetBridgePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

---

### 6. استدعاء البلاجن من JavaScript

```typescript
import { Plugins } from '@capacitor/core';
const { NoorWidget } = Plugins as any;

// استدعه عند فتح التطبيق أو تحديث مواقيت الصلاة
await NoorWidget.setPrayerTimes({
  prayers: [
    { name: "الفجر",  timeMs: 1700000000000, timeStr: "04:35" },
    { name: "الظهر",  timeMs: 1700043600000, timeStr: "12:05" },
    { name: "العصر",  timeMs: 1700061600000, timeStr: "15:30" },
    { name: "المغرب", timeMs: 1700079600000, timeStr: "18:20" },
    { name: "العشاء", timeMs: 1700089200000, timeStr: "19:50" },
    // أضف 3 أيام على الأقل لضمان عمل الويدجت بدون إنترنت
  ],
  city: "القاهرة",  // اسم المدينة — يظهر في رأس الويدجت
  lat: 30.0,
  lng: 31.2,
});
```

**تنبيه:** `timeMs` هو Unix timestamp بالميلي ثانية (`Date.getTime()`).

---

## أحجام الويدجت

الخدمة تختار التصميم تلقائياً حسب حجم الويدجت على الشاشة:

| الحجم | الأبعاد التقريبية | ما يُعرَض |
|--------|-------------------|-----------|
| **كبير** | ≥ 180×155dp | كل الميزات: تاريخ هجري + مدينة + اسم صلاة + عداد + شريط تقدم |
| **متوسط** | ≥ 180×130dp | مدينة + اسم صلاة + عداد + شريط تقدم |
| **صغير** | < 180×130dp | اسم صلاة + hh:mm فقط |

المستخدم يغير الحجم بالسحب — الويدجت يتكيف تلقائياً.

---

## التاريخ الهجري

يستخدم `android.icu.util.IslamicCalendar` المدمج في Android منذ API 24.  
على الأجهزة الأقدم (API 21–23) لا يُعرض التاريخ الهجري.

---

## أيقونات الصلوات

| الصلاة | الأيقونة |
|---------|----------|
| الفجر  | 🌅 |
| الشروق | 🌄 |
| الظهر  | ☀️ |
| العصر  | 🌤️ |
| المغرب | 🌇 |
| العشاء | 🌙 |

---

## تصميم Glassmorphism

الخلفية طبقتان:
1. تدرج داكن (نيلي/بنفسجي) بشفافية 80% يسمح بظهور الخلفية خلف الويدجت
2. طبقة ذهبية خفيفة + حافة ذهبية شفافة تعطي المظهر الزجاجي

> ملاحظة: Android RemoteViews لا يدعم blur حقيقي. التأثير محاكى بالشفافية.

---

## إذا كان الويدجت يعرض "--"

افتح التطبيق مرة واحدة — سيُخزن بيانات الصلاة للأيام الثلاثة القادمة.

## اختبار الويدجت

1. بناء وتثبيت APK
2. اضغط طويلاً على الشاشة → Widgets → "نُور"
3. اسحبه وغيّر حجمه (صغير / متوسط / كبير) لترى التصميمات الثلاثة
4. افتح التطبيق مرة واحدة لتزويد الويدجت بالبيانات
