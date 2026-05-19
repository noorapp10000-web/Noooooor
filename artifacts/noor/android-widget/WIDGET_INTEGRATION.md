# نُور — تكامل ويدجت Android

## ما الذي يفعله هذا الويدجت؟
- يعرض على شاشة الهاتف عداداً حياً (ساعات:دقائق:ثوان) للصلاة القادمة
- يعمل حتى لو التطبيق مقفول تماماً من الخلفية
- يتحدث كل ثانية عبر Foreground Service
- يستأنف تلقائياً بعد إعادة تشغيل الهاتف
- يوفر الطاقة: يتوقف عن التحديث عند إيقاف الشاشة ويستأنف فور فتحها
- بيانات الصلاة مخزنة لـ 3 أيام قادمة — لا تحتاج إنترنت

---

## خطوات التكامل

### 1. تحديد اسم الحزمة (Package Name)

افتح `android/app/src/main/AndroidManifest.xml` وانظر إلى السطر:
```xml
<manifest xmlns:android="..." package="YOUR_ACTUAL_PACKAGE_NAME">
```
استبدل `YOUR_PACKAGE_NAME` في جميع ملفات `.kt` بهذه القيمة.

---

### 2. نسخ الملفات

```
android-widget/res/layout/widget_prayer.xml
  → android/app/src/main/res/layout/widget_prayer.xml

android-widget/res/xml/prayer_widget_info.xml
  → android/app/src/main/res/xml/prayer_widget_info.xml

android-widget/res/drawable/widget_bg.xml
android-widget/res/drawable/widget_card_bg.xml
android-widget/res/drawable/widget_number_bg.xml
  → android/app/src/main/res/drawable/

android-widget/res/values/widget_strings.xml
  → android/app/src/main/res/values/widget_strings.xml
  (أو أضف المحتوى إلى strings.xml الموجود)

android-widget/java/widget/PrayerWidget.kt
android-widget/java/widget/PrayerWidgetService.kt
android-widget/java/widget/BootReceiver.kt
  → android/app/src/main/java/YOUR_PACKAGE/widget/

android-widget/java/WidgetBridgePlugin.kt
  → android/app/src/main/java/YOUR_PACKAGE/
```

---

### 3. إنشاء أيقونة الإشعار

أنشئ ملف `ic_stat_noor.xml` في `res/drawable/` (أيقونة بيضاء على شفاف):
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

### 4. تعديل AndroidManifest.xml

أضف داخل `<manifest>` (قبل `<application>`):
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```

أضف داخل `<application>`:
```xml
<!-- ── Widget ──────────────────────────────────────────────────────── -->
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

### 6. الكود الموجود في التطبيق

ملف `src/lib/widget-bridge.ts` و`src/pages/Home.tsx` محدّثان تلقائياً.
التطبيق يرسل بيانات الصلاة للويدجت تلقائياً عند كل فتح.

---

## ملاحظات مهمة

### Android 14+ (API 34)
إذا استخدمت `targetSdk = 34+` في `build.gradle`، يجب إضافة:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```
وهذا موجود مسبقاً في الخطوة 4.

### الإشعار الدائم
Android يطلب إشعاراً دائماً للـ Foreground Service. الإشعار:
- أولوية MIN (أصغر ظهور ممكن)
- بلا صوت أو اهتزاز
- المستخدم يستطيع إخفاءه من إعدادات الإشعارات
- يُحدَّث تلقائياً ليعرض اسم الصلاة + العداد

### إذا كان الويدجت يعرض "--"
افتح التطبيق مرة واحدة — سيُخزن بيانات الصلاة للأيام الثلاثة القادمة.

### اختبار الويدجت
1. بناء وتثبيت APK
2. اضغط طويلاً على الشاشة الرئيسية → Widgets → ابحث عن "نُور"
3. اسحبه إلى الشاشة
4. افتح التطبيق مرة واحدة لتزويد الويدجت بالبيانات
5. سيبدأ العداد يعمل فوراً
