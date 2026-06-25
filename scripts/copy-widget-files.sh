#!/usr/bin/env bash
# copy-widget-files.sh
# Copies updated widget resource files from android-widget/ source into the
# live android/ project before every Gradle build.
# Does NOT touch Java/Kotlin source files (already integrated in android/).

set -euo pipefail

WIDGET_SRC="artifacts/noor/android-widget/res"
ANDROID_RES="android/app/src/main/res"

echo "=== نُور Widget — copying resource files ==="

# ── Layouts (3 sizes) ────────────────────────────────────────────────────────
echo "  [layout] widget_prayer.xml  (large 4×3+)"
cp "$WIDGET_SRC/layout/widget_prayer.xml"        "$ANDROID_RES/layout/widget_prayer.xml"

echo "  [layout] widget_prayer_medium.xml  (4×2)"
cp "$WIDGET_SRC/layout/widget_prayer_medium.xml" "$ANDROID_RES/layout/widget_prayer_medium.xml"

echo "  [layout] widget_prayer_small.xml   (2×2)"
cp "$WIDGET_SRC/layout/widget_prayer_small.xml"  "$ANDROID_RES/layout/widget_prayer_small.xml"

# ── Drawables ────────────────────────────────────────────────────────────────
echo "  [drawable] widget_bg.xml  (glassmorphism background)"
cp "$WIDGET_SRC/drawable/widget_bg.xml"       "$ANDROID_RES/drawable/widget_bg.xml"

echo "  [drawable] widget_card_bg.xml  (glass card)"
cp "$WIDGET_SRC/drawable/widget_card_bg.xml"  "$ANDROID_RES/drawable/widget_card_bg.xml"

echo "  [drawable] widget_number_bg.xml  (countdown digits)"
cp "$WIDGET_SRC/drawable/widget_number_bg.xml" "$ANDROID_RES/drawable/widget_number_bg.xml"

echo "  [drawable] widget_progress.xml  (golden progress bar)"
cp "$WIDGET_SRC/drawable/widget_progress.xml" "$ANDROID_RES/drawable/widget_progress.xml"

echo "  [drawable] widget_prayer_cell_bg.xml  (prayer cell normal)"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_bg.xml"        "$ANDROID_RES/drawable/widget_prayer_cell_bg.xml"

echo "  [drawable] widget_prayer_cell_active_bg.xml  (prayer cell active)"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_active_bg.xml" "$ANDROID_RES/drawable/widget_prayer_cell_active_bg.xml"

# ── XML (widget provider info) ───────────────────────────────────────────────
echo "  [xml] prayer_widget_info.xml"
cp "$WIDGET_SRC/xml/prayer_widget_info.xml"   "$ANDROID_RES/xml/prayer_widget_info.xml"

# ── Values (widget strings) ──────────────────────────────────────────────────
echo "  [values] widget_strings.xml"
cp "$WIDGET_SRC/values/widget_strings.xml"    "$ANDROID_RES/values/widget_strings.xml"

echo ""
echo "✅ Widget resources copied successfully."
echo "   Layouts : widget_prayer + _medium + _small"
echo "   Drawables: widget_bg / widget_card_bg / widget_number_bg / widget_progress"
echo "   XML     : prayer_widget_info"
echo "   Values  : widget_strings"
