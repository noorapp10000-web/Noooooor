#!/usr/bin/env bash
# =============================================================================
# ios-setup.sh — تُشغَّل مرة واحدة على macOS بعد "cap add ios"
# شغّل هذا السكريبت من جذر المشروع:
#   bash scripts/ios-setup.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFOPLIST="$ROOT/ios/App/App/Info.plist"

if [ ! -f "$INFOPLIST" ]; then
  echo "❌ ملف Info.plist غير موجود."
  echo "   شغّل أولاً: npx cap add ios"
  exit 1
fi

echo "✅ Info.plist موجود"

# ── إضافة صلاحيات الخصوصية المطلوبة لـ iOS ─────────────────────────────────
add_plist_key() {
  local KEY="$1"
  local DESC="$2"
  # تجاهل إذا كان المفتاح موجوداً بالفعل
  if /usr/libexec/PlistBuddy -c "Print :$KEY" "$INFOPLIST" &>/dev/null; then
    echo "  ↳ $KEY — موجود مسبقاً"
  else
    /usr/libexec/PlistBuddy -c "Add :$KEY string '$DESC'" "$INFOPLIST"
    echo "  ✓ أُضيف: $KEY"
  fi
}

echo ""
echo "📋 إضافة صلاحيات الخصوصية..."

# الموقع — مطلوب لمنصة القبلة وحساب مواقيت الصلاة
add_plist_key "NSLocationWhenInUseUsageDescription" \
  "يستخدم نُور موقعك لتحديد اتجاه القبلة ومواقيت الصلاة بدقة"

add_plist_key "NSLocationAlwaysAndWhenInUseUsageDescription" \
  "يستخدم نُور موقعك لتحديد اتجاه القبلة ومواقيت الصلاة بدقة"

# التعرف على الكلام — الـ plugin مثبَّت في المشروع
add_plist_key "NSSpeechRecognitionUsageDescription" \
  "يستخدم نُور التعرف على الصوت لتحسين تجربة البحث في القرآن الكريم"

add_plist_key "NSMicrophoneUsageDescription" \
  "يستخدم نُور الميكروفون للتعرف على الصوت عند البحث في القرآن الكريم"

# ── إضافة قدرة الصوت في الخلفية ─────────────────────────────────────────────
echo ""
echo "🎵 إضافة خاصية الصوت في الخلفية (UIBackgroundModes)..."

# تحقق من وجود UIBackgroundModes
if /usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$INFOPLIST" &>/dev/null; then
  # المصفوفة موجودة — تحقق من وجود 'audio'
  if /usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$INFOPLIST" | grep -q "audio"; then
    echo "  ↳ UIBackgroundModes:audio — موجود مسبقاً"
  else
    /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes: string 'audio'" "$INFOPLIST"
    echo "  ✓ أُضيف: UIBackgroundModes → audio"
  fi
else
  /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes array" "$INFOPLIST"
  /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes: string 'audio'" "$INFOPLIST"
  echo "  ✓ أُنشئ: UIBackgroundModes → audio"
fi

# ── منع التدوير التلقائي (portrait فقط) ─────────────────────────────────────
echo ""
echo "📱 ضبط الاتجاهات المدعومة (Portrait فقط)..."

# إعداد UISupportedInterfaceOrientations لـ iPhone
if /usr/libexec/PlistBuddy -c "Print :UISupportedInterfaceOrientations" "$INFOPLIST" &>/dev/null; then
  echo "  ↳ UISupportedInterfaceOrientations — موجود، لا تغيير"
else
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$INFOPLIST"
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations: string 'UIInterfaceOrientationPortrait'" "$INFOPLIST"
  echo "  ✓ أُنشئ: Portrait فقط"
fi

# ── نسخ ملف Privacy Manifest ─────────────────────────────────────────────────
PRIVACY_SRC="$ROOT/ios-config/PrivacyInfo.xcprivacy"
PRIVACY_DST="$ROOT/ios/App/App/PrivacyInfo.xcprivacy"

if [ -f "$PRIVACY_SRC" ] && [ ! -f "$PRIVACY_DST" ]; then
  cp "$PRIVACY_SRC" "$PRIVACY_DST"
  echo ""
  echo "✓ نُسِخ PrivacyInfo.xcprivacy إلى مجلد iOS"
  echo "  ⚠️  يجب إضافته يدوياً لـ Xcode project: File → Add Files to App"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅  الإعداد اكتمل!"
echo ""
echo "الخطوات التالية في Xcode:"
echo "  1. افتح ios/App/App.xcworkspace"
echo "  2. Signing & Capabilities ← أضف: Background Modes → Audio"
echo "  3. Signing & Capabilities ← أضف: Push Notifications"
echo "  4. تأكد من Bundle ID: com.noor.noor"
echo "  5. اختر Development Team"
echo "═══════════════════════════════════════════════════"
