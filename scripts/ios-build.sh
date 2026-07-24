#!/usr/bin/env bash
# =============================================================================
# ios-build.sh — سكريبت البناء الكامل لـ iOS على macOS
#
# الاستخدام:
#   bash scripts/ios-build.sh [setup|sync|open]
#
#   setup  — تُشغَّل مرة واحدة فقط: تبني web + cap add ios + ios-setup
#   sync   — بعد كل تعديل كود: build + cap sync
#   open   — تفتح Xcode مباشرة
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMD="${1:-sync}"

# ── تحقق من وجود الأدوات ─────────────────────────────────────────────────────
check_deps() {
  local missing=0
  command -v node   &>/dev/null || { echo "❌ node غير مثبَّت"; missing=1; }
  command -v pnpm   &>/dev/null || { echo "❌ pnpm غير مثبَّت (npm install -g pnpm)"; missing=1; }
  command -v xcodebuild &>/dev/null || { echo "❌ Xcode غير مثبَّت"; missing=1; }
  [ $missing -eq 0 ] || exit 1
}

# ── بناء الويب ────────────────────────────────────────────────────────────────
build_web() {
  echo "🔨 بناء تطبيق الويب..."
  cd "$ROOT/artifacts/noor"
  pnpm run build
  echo "  ✓ اكتمل البناء → artifacts/noor/dist/public"
}

# ── مزامنة Capacitor ──────────────────────────────────────────────────────────
cap_sync() {
  echo "🔄 مزامنة Capacitor..."
  cd "$ROOT"
  npx cap sync ios
  echo "  ✓ اكتملت المزامنة"
}

# ── الإعداد الأول (مرة واحدة) ────────────────────────────────────────────────
cmd_setup() {
  check_deps
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "  إعداد iOS — المرة الأولى فقط"
  echo "═══════════════════════════════════════════════════"

  # تثبيت الحزم
  echo "📦 تثبيت الحزم..."
  cd "$ROOT" && pnpm install

  # بناء الويب
  build_web

  # إضافة منصة iOS
  if [ ! -d "$ROOT/ios" ]; then
    echo "📱 إضافة منصة iOS..."
    cd "$ROOT" && npx cap add ios
    echo "  ✓ أُنشئ مجلد ios/"
  else
    echo "  ↳ مجلد ios/ موجود — تخطي cap add ios"
  fi

  # إعداد Info.plist والصلاحيات
  bash "$ROOT/scripts/ios-setup.sh"

  # تثبيت CocoaPods
  if command -v pod &>/dev/null; then
    echo "🍫 تثبيت CocoaPods..."
    cd "$ROOT/ios/App" && pod install
    echo "  ✓ اكتمل pod install"
  else
    echo "  ⚠️  CocoaPods غير مثبَّت. شغّل: sudo gem install cocoapods"
    echo "       ثم: cd ios/App && pod install"
  fi

  echo ""
  echo "✅ الإعداد اكتمل! شغّل الآن:"
  echo "   bash scripts/ios-build.sh open"
}

# ── المزامنة بعد كل تعديل ────────────────────────────────────────────────────
cmd_sync() {
  check_deps
  [ -d "$ROOT/ios" ] || { echo "❌ مجلد ios/ غير موجود. شغّل أولاً: bash scripts/ios-build.sh setup"; exit 1; }
  build_web
  cap_sync
  echo ""
  echo "✅ جاهز! افتح Xcode أو شغّل: bash scripts/ios-build.sh open"
}

# ── فتح Xcode ─────────────────────────────────────────────────────────────────
cmd_open() {
  local XCWORKSPACE="$ROOT/ios/App/App.xcworkspace"
  [ -f "$XCWORKSPACE" ] || { echo "❌ App.xcworkspace غير موجود. شغّل أولاً: bash scripts/ios-build.sh setup"; exit 1; }
  echo "🚀 فتح Xcode..."
  open "$XCWORKSPACE"
}

# ── اختيار الأمر ─────────────────────────────────────────────────────────────
case "$CMD" in
  setup) cmd_setup ;;
  sync)  cmd_sync  ;;
  open)  cmd_open  ;;
  *)
    echo "استخدام: $0 [setup|sync|open]"
    echo "  setup — إعداد المشروع لأول مرة"
    echo "  sync  — مزامنة بعد كل تعديل كود"
    echo "  open  — فتح Xcode"
    exit 1
    ;;
esac
