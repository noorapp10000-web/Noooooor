#!/usr/bin/env bash
# copy-widget-files.sh
# Copies updated widget resource files from android-widget/ source into the
# live android/ project before every Gradle build.

set -euo pipefail

WIDGET_SRC="artifacts/noor/android-widget/res"
ANDROID_RES="android/app/src/main/res"

echo "=== نُور Widget — copying resource files ==="

# ── Layouts ──────────────────────────────────────────────────────────────────
echo "  [layout] widget_prayer.xml  (large 4×3+)"
cp "$WIDGET_SRC/layout/widget_prayer.xml"        "$ANDROID_RES/layout/widget_prayer.xml"

echo "  [layout] widget_prayer_medium.xml  (4×2)"
cp "$WIDGET_SRC/layout/widget_prayer_medium.xml" "$ANDROID_RES/layout/widget_prayer_medium.xml"

echo "  [layout] widget_prayer_small.xml   (2×2)"
cp "$WIDGET_SRC/layout/widget_prayer_small.xml"  "$ANDROID_RES/layout/widget_prayer_small.xml"

# ── Dark mode drawables ───────────────────────────────────────────────────────
echo "  [drawable] widget_bg.xml"
cp "$WIDGET_SRC/drawable/widget_bg.xml"       "$ANDROID_RES/drawable/widget_bg.xml"

echo "  [drawable] widget_card_bg.xml"
cp "$WIDGET_SRC/drawable/widget_card_bg.xml"  "$ANDROID_RES/drawable/widget_card_bg.xml"

echo "  [drawable] widget_number_bg.xml"
cp "$WIDGET_SRC/drawable/widget_number_bg.xml" "$ANDROID_RES/drawable/widget_number_bg.xml"

echo "  [drawable] widget_progress.xml"
cp "$WIDGET_SRC/drawable/widget_progress.xml" "$ANDROID_RES/drawable/widget_progress.xml"

echo "  [drawable] widget_prayer_cell_bg.xml"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_bg.xml"        "$ANDROID_RES/drawable/widget_prayer_cell_bg.xml"

echo "  [drawable] widget_prayer_cell_active_bg.xml"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_active_bg.xml" "$ANDROID_RES/drawable/widget_prayer_cell_active_bg.xml"

# ── Light mode drawables ──────────────────────────────────────────────────────
echo "  [drawable] widget_bg_light.xml"
cp "$WIDGET_SRC/drawable/widget_bg_light.xml"       "$ANDROID_RES/drawable/widget_bg_light.xml"

echo "  [drawable] widget_card_bg_light.xml"
cp "$WIDGET_SRC/drawable/widget_card_bg_light.xml"  "$ANDROID_RES/drawable/widget_card_bg_light.xml"

echo "  [drawable] widget_number_bg_light.xml"
cp "$WIDGET_SRC/drawable/widget_number_bg_light.xml" "$ANDROID_RES/drawable/widget_number_bg_light.xml"

echo "  [drawable] widget_prayer_cell_bg_light.xml"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_bg_light.xml"        "$ANDROID_RES/drawable/widget_prayer_cell_bg_light.xml"

echo "  [drawable] widget_prayer_cell_active_bg_light.xml"
cp "$WIDGET_SRC/drawable/widget_prayer_cell_active_bg_light.xml" "$ANDROID_RES/drawable/widget_prayer_cell_active_bg_light.xml"

# ── Prayer icons (vector drawables) ──────────────────────────────────────────
echo "  [drawable] ic_prayer_fajr.xml"
cp "$WIDGET_SRC/drawable/ic_prayer_fajr.xml"    "$ANDROID_RES/drawable/ic_prayer_fajr.xml"

echo "  [drawable] ic_prayer_dhuhr.xml"
cp "$WIDGET_SRC/drawable/ic_prayer_dhuhr.xml"   "$ANDROID_RES/drawable/ic_prayer_dhuhr.xml"

echo "  [drawable] ic_prayer_asr.xml"
cp "$WIDGET_SRC/drawable/ic_prayer_asr.xml"     "$ANDROID_RES/drawable/ic_prayer_asr.xml"

echo "  [drawable] ic_prayer_maghrib.xml"
cp "$WIDGET_SRC/drawable/ic_prayer_maghrib.xml" "$ANDROID_RES/drawable/ic_prayer_maghrib.xml"

echo "  [drawable] ic_prayer_isha.xml"
cp "$WIDGET_SRC/drawable/ic_prayer_isha.xml"    "$ANDROID_RES/drawable/ic_prayer_isha.xml"

# ── Theme toggle icons ────────────────────────────────────────────────────────
echo "  [drawable] ic_widget_theme_dark.xml"
cp "$WIDGET_SRC/drawable/ic_widget_theme_dark.xml"  "$ANDROID_RES/drawable/ic_widget_theme_dark.xml"

echo "  [drawable] ic_widget_theme_light.xml"
cp "$WIDGET_SRC/drawable/ic_widget_theme_light.xml" "$ANDROID_RES/drawable/ic_widget_theme_light.xml"

# ── XML / Values ──────────────────────────────────────────────────────────────
echo "  [xml] prayer_widget_info.xml"
cp "$WIDGET_SRC/xml/prayer_widget_info.xml"   "$ANDROID_RES/xml/prayer_widget_info.xml"

echo "  [values] widget_strings.xml"
cp "$WIDGET_SRC/values/widget_strings.xml"    "$ANDROID_RES/values/widget_strings.xml"

echo ""
echo "✅ Widget resources copied successfully."
echo "   Layouts    : widget_prayer + _medium + _small"
echo "   Dark mode  : widget_bg / widget_card_bg / widget_number_bg / cells"
echo "   Light mode : widget_bg_light / widget_card_bg_light / widget_number_bg_light / cells"
echo "   Icons      : ic_prayer_fajr/dhuhr/asr/maghrib/isha"
echo "   Toggle     : ic_widget_theme_dark / ic_widget_theme_light"
