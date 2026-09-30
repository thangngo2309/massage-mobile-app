#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# In Home Massage 247 - KTV
# Android Local Release Build Script
#
# Usage:
#   ./build.sh apk
#   ./build.sh bundle
#   ./build.sh clean
#   ./build.sh install
#   ./build.sh logs
#
# Output:
#   dist/in-home-massage-247-ktv-vX.X.X-buildY.apk
#   dist/in-home-massage-247-ktv-vX.X.X-buildY.aab
#
# Keystore:
#   ./inhome247-therapist-release.jks
#
# Alias:
#   inhome247-therapist
# ============================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# ============================================================
# COLORS
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# APP CONFIG
# ============================================================

APP_NAME="In Home Massage 247 - KTV"
APP_FILE_PREFIX="in-home-massage-247-ktv"

EXPECTED_ANDROID_PACKAGE="com.hoangan.inhomemassage247.therapist"

API_URL="https://dev.in-home-massage-247.com/api"

DIST_DIR="$PROJECT_ROOT/dist"

# ============================================================
# ANDROID SIGNING CONFIG
# ============================================================

KEYSTORE_SOURCE="$PROJECT_ROOT/inhome247-therapist-release.jks"

KEYSTORE_TARGET_NAME="inhome247-therapist-release.jks"
KEYSTORE_TARGET="$PROJECT_ROOT/android/app/$KEYSTORE_TARGET_NAME"

KEY_ALIAS="inhome247-therapist"

# ============================================================
# ENV
# ============================================================

export NODE_ENV=production

export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_PUBLIC_ANDROID_API_URL="$API_URL"
export EXPO_PUBLIC_IOS_API_URL="$API_URL"

# ============================================================
# HELPERS
# ============================================================

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

fail() {
  print_error "$1"
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Không tìm thấy command: $1"
  fi
}

# ============================================================
# VERSION INFO
# ============================================================

load_version_info() {
  APP_VERSION="$(
    node -e "
      const app = require('./app.json');
      process.stdout.write(String(app.expo?.version || '0.0.0'));
    "
  )"

  ANDROID_VERSION_CODE="$(
    node -e "
      const app = require('./app.json');
      process.stdout.write(
        String(app.expo?.android?.versionCode || 1)
      );
    "
  )"

  if [ -z "$APP_VERSION" ]; then
    fail "Không đọc được expo.version từ app.json"
  fi

  if [ -z "$ANDROID_VERSION_CODE" ]; then
    fail "Không đọc được expo.android.versionCode từ app.json"
  fi

  APK_FILE_NAME="${APP_FILE_PREFIX}-v${APP_VERSION}-build${ANDROID_VERSION_CODE}.apk"
  AAB_FILE_NAME="${APP_FILE_PREFIX}-v${APP_VERSION}-build${ANDROID_VERSION_CODE}.aab"

  APK_DIST_PATH="$DIST_DIR/$APK_FILE_NAME"
  AAB_DIST_PATH="$DIST_DIR/$AAB_FILE_NAME"
}

# ============================================================
# HEADER
# ============================================================

print_header() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}   ${APP_NAME}${NC}"
  echo -e "${BLUE}   Android Local Release Build${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""

  echo -e "${BLUE}API:${NC} $API_URL"
  echo -e "${BLUE}Package:${NC} $EXPECTED_ANDROID_PACKAGE"
  echo -e "${BLUE}Version:${NC} $APP_VERSION"
  echo -e "${BLUE}Build:${NC} $ANDROID_VERSION_CODE"
  echo -e "${BLUE}Keystore:${NC} $KEYSTORE_SOURCE"
  echo -e "${BLUE}Alias:${NC} $KEY_ALIAS"
  echo ""
}

# ============================================================
# CHECK COMMANDS
# ============================================================

check_commands() {
  require_command node
  require_command npm
  require_command npx
  require_command python3
  require_command java
  require_command keytool

  print_success "Các command cần thiết đều tồn tại"
}

# ============================================================
# CHECK PROJECT
# ============================================================

check_project() {
  [ -f "$PROJECT_ROOT/package.json" ] || \
    fail "Không tìm thấy package.json"

  [ -f "$PROJECT_ROOT/app.json" ] || \
    fail "Không tìm thấy app.json"

  [ -f "$KEYSTORE_SOURCE" ] || \
    fail "Không tìm thấy keystore: $KEYSTORE_SOURCE"

  local android_package

  android_package="$(
    node -e "
      const app = require('./app.json');
      process.stdout.write(app.expo?.android?.package || '');
    "
  )"

  echo "Android package: $android_package"

  if [ "$android_package" != "$EXPECTED_ANDROID_PACKAGE" ]; then
    fail "Android package không đúng. Expected: $EXPECTED_ANDROID_PACKAGE"
  fi

  print_success "Android package chính xác"
  print_success "Đã tìm thấy KTV release keystore"
}

# ============================================================
# LOAD SIGNING CREDENTIALS
# ============================================================

load_signing_credentials() {
  if [ -z "${KTV_RELEASE_STORE_PASSWORD:-}" ]; then
    echo ""

    read -r -s \
      -p "Nhập password của KTV release keystore: " \
      KTV_RELEASE_STORE_PASSWORD

    echo ""
  fi

  if [ -z "$KTV_RELEASE_STORE_PASSWORD" ]; then
    fail "Keystore password không được để trống"
  fi

  if [ -z "${KTV_RELEASE_KEY_PASSWORD:-}" ]; then
    KTV_RELEASE_KEY_PASSWORD="$KTV_RELEASE_STORE_PASSWORD"
  fi

  export KTV_RELEASE_STORE_FILE="$KEYSTORE_TARGET_NAME"
  export KTV_RELEASE_STORE_PASSWORD
  export KTV_RELEASE_KEY_ALIAS="$KEY_ALIAS"
  export KTV_RELEASE_KEY_PASSWORD

  print_success "Đã nạp Android signing credentials"
}

# ============================================================
# VERIFY SOURCE KEYSTORE
# ============================================================

verify_source_keystore() {
  print_info "Kiểm tra KTV release keystore..."

  if ! keytool \
    -list \
    -keystore "$KEYSTORE_SOURCE" \
    -storepass "$KTV_RELEASE_STORE_PASSWORD" \
    -alias "$KEY_ALIAS" \
    >/dev/null 2>&1; then

    fail "Keystore password hoặc alias không chính xác"
  fi

  print_success "KTV release keystore hợp lệ"
}

# ============================================================
# DEPENDENCIES
# ============================================================

ensure_dependencies() {
  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    print_warning "node_modules chưa tồn tại"
    print_info "Running npm install..."

    npm install

    print_success "npm install hoàn tất"
  fi
}

# ============================================================
# PREBUILD
# ============================================================

run_prebuild() {
  print_info "Xóa Android native project cũ..."

  rm -rf "$PROJECT_ROOT/android"

  print_info "Chạy Expo prebuild..."
  print_info "API URL: $EXPO_PUBLIC_ANDROID_API_URL"

  EXPO_NO_GIT_STATUS=1 \
  NODE_ENV="$NODE_ENV" \
  EXPO_PUBLIC_API_URL="$EXPO_PUBLIC_API_URL" \
  EXPO_PUBLIC_ANDROID_API_URL="$EXPO_PUBLIC_ANDROID_API_URL" \
  EXPO_PUBLIC_IOS_API_URL="$EXPO_PUBLIC_IOS_API_URL" \
    npx expo prebuild \
      --clean \
      --platform android

  [ -d "$PROJECT_ROOT/android" ] || \
    fail "Expo prebuild không tạo android/"

  [ -f "$PROJECT_ROOT/android/app/build.gradle" ] || \
    fail "Không tìm thấy android/app/build.gradle sau prebuild"

  print_success "Expo prebuild hoàn tất"
}

# ============================================================
# COPY KEYSTORE
# ============================================================

copy_keystore() {
  print_info "Copy KTV release keystore vào android/app..."

  cp "$KEYSTORE_SOURCE" "$KEYSTORE_TARGET"

  [ -f "$KEYSTORE_TARGET" ] || \
    fail "Không copy được release keystore"

  print_success "Keystore đã được copy vào android/app"
}

# ============================================================
# CONFIGURE RELEASE SIGNING
# ============================================================

configure_release_signing() {
  local build_gradle="$PROJECT_ROOT/android/app/build.gradle"

  print_info "Cấu hình Gradle release signing..."

  python3 <<'PY'
from pathlib import Path
import re

path = Path("android/app/build.gradle")
text = path.read_text()


def find_block(text: str, keyword: str, start: int = 0):
    pattern = re.compile(
        r'(?m)^[ \t]*' + re.escape(keyword) + r'[ \t]*\{'
    )

    match = pattern.search(text, start)

    if not match:
        raise RuntimeError(
            f"Không tìm thấy block: {keyword}"
        )

    brace_start = text.find("{", match.start())

    depth = 0

    for i in range(brace_start, len(text)):
        char = text[i]

        if char == "{":
            depth += 1

        elif char == "}":
            depth -= 1

            if depth == 0:
                return match.start(), i + 1

    raise RuntimeError(
        f"Không tìm được dấu đóng của block: {keyword}"
    )


signing_start, signing_end = find_block(
    text,
    "signingConfigs"
)

signing_block = text[signing_start:signing_end]

if "KTV_RELEASE_STORE_PASSWORD" not in signing_block:
    closing_brace_index = signing_end - 1

    release_signing = '''
        release {
            storeFile file(System.getenv("KTV_RELEASE_STORE_FILE"))
            storePassword System.getenv("KTV_RELEASE_STORE_PASSWORD")
            keyAlias System.getenv("KTV_RELEASE_KEY_ALIAS")
            keyPassword System.getenv("KTV_RELEASE_KEY_PASSWORD")
        }
'''

    text = (
        text[:closing_brace_index]
        + release_signing
        + text[closing_brace_index:]
    )


build_types_start, build_types_end = find_block(
    text,
    "buildTypes"
)

build_types_text = text[
    build_types_start:build_types_end
]

release_match = re.search(
    r'(?m)^[ \t]*release[ \t]*\{',
    build_types_text
)

if not release_match:
    raise RuntimeError(
        "Không tìm thấy buildTypes.release"
    )

release_global_start = (
    build_types_start
    + release_match.start()
)

release_start, release_end = find_block(
    text,
    "release",
    release_global_start
)

release_block = text[
    release_start:release_end
]

if re.search(
    r'signingConfig\s+signingConfigs\.\w+',
    release_block
):
    release_block = re.sub(
        r'signingConfig\s+signingConfigs\.\w+',
        'signingConfig signingConfigs.release',
        release_block,
        count=1
    )
else:
    brace = release_block.find("{")

    release_block = (
        release_block[:brace + 1]
        + "\n            signingConfig signingConfigs.release"
        + release_block[brace + 1:]
    )


text = (
    text[:release_start]
    + release_block
    + text[release_end:]
)

path.write_text(text)
PY

  if ! grep -q \
    'KTV_RELEASE_STORE_PASSWORD' \
    "$build_gradle"; then

    fail "Không inject được release signingConfig"
  fi

  if ! grep -q \
    'signingConfig signingConfigs.release' \
    "$build_gradle"; then

    fail "Release chưa sử dụng signingConfigs.release"
  fi

  print_success "Đã cấu hình release signing"
}

# ============================================================
# VERIFY TARGET KEYSTORE
# ============================================================

verify_target_keystore() {
  print_info "Kiểm tra keystore trong android/app..."

  if ! keytool \
    -list \
    -keystore "$KEYSTORE_TARGET" \
    -storepass "$KTV_RELEASE_STORE_PASSWORD" \
    -alias "$KEY_ALIAS" \
    >/dev/null 2>&1; then

    fail "Keystore trong android/app không hợp lệ"
  fi

  print_success "Keystore trong android/app hợp lệ"
}

# ============================================================
# PREPARE DIST
# ============================================================

prepare_dist() {
  mkdir -p "$DIST_DIR"

  print_success "Output directory: $DIST_DIR"
}

# ============================================================
# PREPARE BUILD
# ============================================================

prepare_build() {
  check_commands
  check_project
  ensure_dependencies
  load_signing_credentials
  verify_source_keystore

  run_prebuild
  copy_keystore
  configure_release_signing
  verify_target_keystore
  prepare_dist

  echo ""
  print_success "Android native project đã sẵn sàng"
  echo ""
}

# ============================================================
# GRADLE
# ============================================================

run_gradle() {
  local task="$1"

  (
    cd "$PROJECT_ROOT/android"

    NODE_ENV="$NODE_ENV" \
    KTV_RELEASE_STORE_FILE="$KTV_RELEASE_STORE_FILE" \
    KTV_RELEASE_STORE_PASSWORD="$KTV_RELEASE_STORE_PASSWORD" \
    KTV_RELEASE_KEY_ALIAS="$KTV_RELEASE_KEY_ALIAS" \
    KTV_RELEASE_KEY_PASSWORD="$KTV_RELEASE_KEY_PASSWORD" \
    EXPO_PUBLIC_API_URL="$EXPO_PUBLIC_API_URL" \
    EXPO_PUBLIC_ANDROID_API_URL="$EXPO_PUBLIC_ANDROID_API_URL" \
    EXPO_PUBLIC_IOS_API_URL="$EXPO_PUBLIC_IOS_API_URL" \
      ./gradlew "$task"
  )
}

# ============================================================
# BUILD APK
# ============================================================

build_apk() {
  prepare_build

  print_info "Building Release APK..."

  run_gradle assembleRelease

  local gradle_apk

  gradle_apk="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"

  if [ ! -f "$gradle_apk" ]; then
    fail "Không tìm thấy APK sau khi build"
  fi

  rm -f "$APK_DIST_PATH"

  cp "$gradle_apk" "$APK_DIST_PATH"

  [ -f "$APK_DIST_PATH" ] || \
    fail "Không copy được APK vào dist"

  echo ""

  print_success "APK build thành công"

  print_info "Version: $APP_VERSION"
  print_info "Build: $ANDROID_VERSION_CODE"

  print_info "APK:"
  echo "$APK_DIST_PATH"

  local size

  size="$(du -h "$APK_DIST_PATH" | cut -f1)"

  print_info "APK size: $size"

  if command -v apksigner >/dev/null 2>&1; then
    print_info "Kiểm tra APK signature..."

    if apksigner verify "$APK_DIST_PATH"; then
      print_success "APK signature hợp lệ"
    else
      fail "APK signature không hợp lệ"
    fi
  fi
}

# ============================================================
# BUILD AAB
# ============================================================

build_bundle() {
  prepare_build

  print_info "Building Release Android App Bundle..."

  run_gradle bundleRelease

  local gradle_aab

  gradle_aab="$PROJECT_ROOT/android/app/build/outputs/bundle/release/app-release.aab"

  if [ ! -f "$gradle_aab" ]; then
    fail "Không tìm thấy AAB sau khi build"
  fi

  rm -f "$AAB_DIST_PATH"

  cp "$gradle_aab" "$AAB_DIST_PATH"

  [ -f "$AAB_DIST_PATH" ] || \
    fail "Không copy được AAB vào dist"

  echo ""

  print_success "AAB build thành công"

  print_info "Version: $APP_VERSION"
  print_info "Build: $ANDROID_VERSION_CODE"

  print_info "AAB:"
  echo "$AAB_DIST_PATH"

  local size

  size="$(du -h "$AAB_DIST_PATH" | cut -f1)"

  print_info "AAB size: $size"

  print_success "AAB sẵn sàng upload Google Play Console"
}

# ============================================================
# CLEAN
# ============================================================

clean_build() {
  print_info "Cleaning Android build..."

  rm -rf "$PROJECT_ROOT/android"

  print_success "Đã xóa android/"
}

# ============================================================
# INSTALL APK
# ============================================================

install_apk() {
  require_command adb

  if [ ! -f "$APK_DIST_PATH" ]; then
    fail "Không tìm thấy $APK_FILE_NAME. Chạy ./build.sh apk trước."
  fi

  print_info "Installing APK:"
  echo "$APK_DIST_PATH"

  adb install -r "$APK_DIST_PATH"

  print_success "APK installed"
}

# ============================================================
# LOGS
# ============================================================

show_logs() {
  require_command adb

  print_info "Showing Android logs..."
  print_info "Nhấn Ctrl+C để dừng."

  adb logcat | grep -E \
    "ReactNativeJS|Expo|AndroidRuntime|FATAL|InHome|Massage|Notification|Push|❌|⚠️"
}

# ============================================================
# MAIN
# ============================================================

load_version_info
print_header

COMMAND="${1:-apk}"

case "$COMMAND" in

  apk)
    build_apk
    ;;

  bundle|aab)
    build_bundle
    ;;

  clean)
    clean_build
    ;;

  install)
    install_apk
    ;;

  logs)
    show_logs
    ;;

  *)
    echo ""
    echo "Usage:"
    echo ""
    echo "  ./build.sh apk"
    echo "      Build release APK"
    echo ""
    echo "  ./build.sh bundle"
    echo "      Build release AAB"
    echo ""
    echo "  ./build.sh clean"
    echo "      Xóa Android native project"
    echo ""
    echo "  ./build.sh install"
    echo "      Cài APK hiện tại lên thiết bị"
    echo ""
    echo "  ./build.sh logs"
    echo "      Xem Android logs"
    echo ""

    exit 1
    ;;
esac

echo ""
print_success "Done!"