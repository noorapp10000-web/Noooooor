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

set_plist_string() {
  local KEY="$1"
  local VALUE="$2"
  if /usr/libexec/PlistBuddy -c "Print :$KEY" "$INFOPLIST" &>/dev/null; then
    /usr/libexec/PlistBuddy -c "Set :$KEY '$VALUE'" "$INFOPLIST"
  else
    /usr/libexec/PlistBuddy -c "Add :$KEY string '$VALUE'" "$INFOPLIST"
  fi
  echo "  ✓ ضُبط: $KEY"
}

echo ""
echo "📋 إضافة صلاحيات الخصوصية..."

# الموقع — مطلوب لمنصة القبلة وحساب مواقيت الصلاة
add_plist_key "NSLocationWhenInUseUsageDescription" \
  "يستخدم نُور موقعك لتحديد اتجاه القبلة ومواقيت الصلاة بدقة"

add_plist_key "NSLocationAlwaysAndWhenInUseUsageDescription" \
  "يستخدم نُور موقعك لتحديد مواقيت الصلاة واتجاه القبلة بدقة. لا يتم تتبع موقعك أو استخدامه للإعلانات."

set_plist_string "CFBundleDisplayName" "نُور"

if /usr/libexec/PlistBuddy -c "Print :ITSAppUsesNonExemptEncryption" "$INFOPLIST" &>/dev/null; then
  /usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$INFOPLIST"
else
  /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$INFOPLIST"
fi
echo "  ✓ ضُبط: ITSAppUsesNonExemptEncryption"

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

# إعداد UISupportedInterfaceOrientations لـ iPhone وiPad
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" "$INFOPLIST" &>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$INFOPLIST"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations: string 'UIInterfaceOrientationPortrait'" "$INFOPLIST"
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations~ipad" "$INFOPLIST" &>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad array" "$INFOPLIST"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad: string 'UIInterfaceOrientationPortrait'" "$INFOPLIST"
echo "  ✓ ضُبط: Portrait فقط"

# ── نسخ ملف Privacy Manifest ─────────────────────────────────────────────────
PRIVACY_SRC="$ROOT/ios-config/PrivacyInfo.xcprivacy"
PRIVACY_DST="$ROOT/ios/App/App/PrivacyInfo.xcprivacy"

if [ -f "$PRIVACY_SRC" ]; then
  cp "$PRIVACY_SRC" "$PRIVACY_DST"
  echo ""
  echo "✓ نُسِخ PrivacyInfo.xcprivacy إلى مجلد iOS"
fi

# ── نسخ أيقونات iOS ───────────────────────────────────────────────────────────
ICON_SRC="$ROOT/ios-config/AppIcon.appiconset"
ICON_DST="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ -d "$ICON_SRC" ]; then
  mkdir -p "$ICON_DST"
  rsync -a --delete "$ICON_SRC/" "$ICON_DST/"
  echo "✓ نُسخت أيقونات iOS إلى Assets.xcassets"
fi

# ── ربط الخصوصية وضبط هدف الإصدار الأول ─────────────────────────────────────
XCODE_PROJECT="$ROOT/ios/App/App.xcodeproj"

if [ -d "$XCODE_PROJECT" ] && ruby -e "require 'xcodeproj'" &>/dev/null; then
  ruby - "$XCODE_PROJECT" <<'RUBY'
require 'xcodeproj'

project = Xcodeproj::Project.open(ARGV.fetch(0))
target = project.targets.find { |item| item.name == 'App' }
app_group = project.main_group.groups.find { |group| group.path == 'App' || group.display_name == 'App' }

abort 'تعذر العثور على Target App داخل مشروع Xcode' unless target && app_group

privacy_ref = app_group.files.find { |file| file.path == 'PrivacyInfo.xcprivacy' }
privacy_ref ||= app_group.new_file('PrivacyInfo.xcprivacy')

unless target.resources_build_phase.files_references.include?(privacy_ref)
  target.resources_build_phase.add_file_reference(privacy_ref)
end

target.build_configurations.each do |configuration|
  configuration.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
  configuration.build_settings['MARKETING_VERSION'] = '1.0.0'
  configuration.build_settings['CURRENT_PROJECT_VERSION'] = '2'
  configuration.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.noorapp10000.noor'
end

project.save
RUBY
  echo "✓ رُبط Privacy Manifest وضُبط الإصدار 1.0.0 (Build 2) ومعرّف iOS"
else
  echo "⚠️ تعذر تعديل مشروع Xcode تلقائياً؛ تأكد من تثبيت CocoaPods ثم أعد تشغيل السكريبت"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅  الإعداد اكتمل!"
echo ""
echo "الخطوات التالية في Xcode:"
echo "  1. افتح ios/App/App.xcworkspace"
echo "  2. تأكد من Bundle ID وDevelopment Team"
echo "  3. لا تضف Push Notifications — التطبيق يستخدم Local Notifications"
echo "═══════════════════════════════════════════════════"
