#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# CONFIG
# ============================================================

OLD_PROJECT="$HOME/Workspace/FL/ghephang247-taixe"

# App KTV = thư mục chứa script này
KTV_PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Provisioning Profile của KTV tải từ Apple Developer
KTV_PROFILE="$HOME/Downloads/In_Home_Massage_247_Therapist_AppStore.mobileprovision"

# Credentials cũ dùng để lấy Distribution Certificate + password
OLD_CREDENTIALS_JSON="$OLD_PROJECT/credentials.json"
OLD_P12="$OLD_PROJECT/credentials/ios/dist-cert.p12"

# Credentials mới cho KTV
KTV_IOS_CREDENTIALS_DIR="$KTV_PROJECT/credentials/ios"
KTV_P12="$KTV_IOS_CREDENTIALS_DIR/dist-cert.p12"
KTV_MOBILEPROVISION="$KTV_IOS_CREDENTIALS_DIR/profile.mobileprovision"
KTV_CREDENTIALS_JSON="$KTV_PROJECT/credentials.json"

# Expected Apple values
EXPECTED_TEAM_ID="C9TJ8NQJKZ"
EXPECTED_BUNDLE_ID="com.hoangan.inhomemassage247.therapist"
EXPECTED_APP_IDENTIFIER="${EXPECTED_TEAM_ID}.${EXPECTED_BUNDLE_ID}"

EXPECTED_CERT_SERIAL="5DB9A585BA2F0818D97E0BC2A2B9396A"

CERT_PEM="$(mktemp /tmp/inhome247-therapist-cert.XXXXXX.pem)"
PROFILE_PLIST="$(mktemp /tmp/inhome247-therapist-profile.XXXXXX.plist)"

cleanup() {
  rm -f "$CERT_PEM" "$PROFILE_PLIST"
}

trap cleanup EXIT

info() {
  printf "\n\033[1;34m%s\033[0m\n" "$1"
}

success() {
  printf "\033[1;32m✔ %s\033[0m\n" "$1"
}

error() {
  printf "\033[1;31m✖ %s\033[0m\n" "$1" >&2
  exit 1
}

require_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    error "Không tìm thấy file: $file"
  fi
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    error "Không tìm thấy command: $command_name"
  fi
}

# ============================================================
# 1. COMMANDS
# ============================================================

info "===== 1. KIỂM TRA COMMAND ====="

require_command jq
require_command openssl
require_command security
require_command node

if [[ ! -x "/usr/libexec/PlistBuddy" ]]; then
  error "Không tìm thấy /usr/libexec/PlistBuddy"
fi

success "Các command cần thiết đều tồn tại."

# ============================================================
# 2. CHECK app.json
# ============================================================

info "===== 2. KIỂM TRA APP KTV ====="

APP_JSON="$KTV_PROJECT/app.json"

require_file "$APP_JSON"

CURRENT_NAME="$(jq -r '.expo.name // empty' "$APP_JSON")"
CURRENT_SLUG="$(jq -r '.expo.slug // empty' "$APP_JSON")"
CURRENT_BUNDLE_ID="$(jq -r '.expo.ios.bundleIdentifier // empty' "$APP_JSON")"

echo "Name      : $CURRENT_NAME"
echo "Slug      : $CURRENT_SLUG"
echo "Bundle ID : $CURRENT_BUNDLE_ID"

if [[ "$CURRENT_BUNDLE_ID" != "$EXPECTED_BUNDLE_ID" ]]; then
  error "Bundle ID chưa đúng. Expected: $EXPECTED_BUNDLE_ID"
fi

success "Bundle ID app KTV chính xác."

# ============================================================
# 3. SOURCE FILES
# ============================================================

info "===== 3. KIỂM TRA FILE NGUỒN ====="

require_file "$OLD_CREDENTIALS_JSON"
require_file "$OLD_P12"
require_file "$KTV_PROFILE"

success "credentials.json cũ: $OLD_CREDENTIALS_JSON"
success "Distribution Certificate: $OLD_P12"
success "KTV Provisioning Profile: $KTV_PROFILE"

# ============================================================
# 4. READ P12 PASSWORD
# ============================================================

info "===== 4. ĐỌC DISTRIBUTION CERTIFICATE CONFIG ====="

if ! jq -e '.ios.distributionCertificate' \
  "$OLD_CREDENTIALS_JSON" >/dev/null; then
  error "credentials.json cũ không có .ios.distributionCertificate"
fi

P12_PASSWORD="$(
  jq -r '.ios.distributionCertificate.password // empty' \
    "$OLD_CREDENTIALS_JSON"
)"

if [[ -z "$P12_PASSWORD" ]]; then
  error "Không lấy được password của Distribution Certificate."
fi

success "Đã lấy được password P12."
success "Password không được hiển thị."

# ============================================================
# 5. COPY CREDENTIALS
# ============================================================

info "===== 5. COPY CREDENTIALS SANG APP KTV ====="

mkdir -p "$KTV_IOS_CREDENTIALS_DIR"

cp -f "$OLD_P12" "$KTV_P12"
cp -f "$KTV_PROFILE" "$KTV_MOBILEPROVISION"

success "Đã copy dist-cert.p12"
success "Đã copy profile.mobileprovision"

# ============================================================
# 6. CREATE credentials.json
# ============================================================

info "===== 6. TẠO credentials.json ====="

jq \
  --arg p12Password "$P12_PASSWORD" \
  '{
    ios: {
      provisioningProfilePath: "credentials/ios/profile.mobileprovision",
      distributionCertificate: {
        path: "credentials/ios/dist-cert.p12",
        password: $p12Password
      }
    }
  }' \
  "$OLD_CREDENTIALS_JSON" \
  > "$KTV_CREDENTIALS_JSON"

success "Đã tạo: $KTV_CREDENTIALS_JSON"

# ============================================================
# 7. VERIFY CERTIFICATE
# ============================================================

info "===== 7. KIỂM TRA DISTRIBUTION CERTIFICATE ====="

if ! openssl pkcs12 \
  -in "$KTV_P12" \
  -clcerts \
  -nokeys \
  -passin "pass:$P12_PASSWORD" \
  -out "$CERT_PEM" \
  >/dev/null 2>&1; then

  echo "OpenSSL thường không đọc được P12. Thử -legacy..."

  if ! openssl pkcs12 \
    -legacy \
    -in "$KTV_P12" \
    -clcerts \
    -nokeys \
    -passin "pass:$P12_PASSWORD" \
    -out "$CERT_PEM" \
    >/dev/null 2>&1; then

    error "Không đọc được Distribution Certificate."
  fi
fi

CERT_SERIAL="$(
  openssl x509 \
    -in "$CERT_PEM" \
    -noout \
    -serial |
  sed 's/^serial=//' |
  tr '[:lower:]' '[:upper:]' |
  tr -d ':'
)"

CERT_END_DATE="$(
  openssl x509 \
    -in "$CERT_PEM" \
    -noout \
    -enddate |
  sed 's/^notAfter=//'
)"

CERT_SUBJECT="$(
  openssl x509 \
    -in "$CERT_PEM" \
    -noout \
    -subject
)"

echo "Serial     : $CERT_SERIAL"
echo "Expiration : $CERT_END_DATE"
echo "Subject    : $CERT_SUBJECT"

if [[ "$CERT_SERIAL" != "$EXPECTED_CERT_SERIAL" ]]; then
  error "Certificate serial không khớp. Expected: $EXPECTED_CERT_SERIAL"
fi

success "Distribution Certificate chính xác."

# ============================================================
# 8. VERIFY PROVISIONING PROFILE
# ============================================================

info "===== 8. KIỂM TRA KTV PROVISIONING PROFILE ====="

if ! security cms \
  -D \
  -i "$KTV_MOBILEPROVISION" \
  > "$PROFILE_PLIST"; then

  error "Không decode được provisioning profile."
fi

APP_IDENTIFIER="$(
  /usr/libexec/PlistBuddy \
    -c "Print :Entitlements:application-identifier" \
    "$PROFILE_PLIST"
)"

PROFILE_NAME="$(
  /usr/libexec/PlistBuddy \
    -c "Print :Name" \
    "$PROFILE_PLIST"
)"

PROFILE_EXPIRATION="$(
  /usr/libexec/PlistBuddy \
    -c "Print :ExpirationDate" \
    "$PROFILE_PLIST"
)"

PROFILE_UUID="$(
  /usr/libexec/PlistBuddy \
    -c "Print :UUID" \
    "$PROFILE_PLIST"
)"

echo "Application Identifier : $APP_IDENTIFIER"
echo "Profile Name           : $PROFILE_NAME"
echo "Profile UUID           : $PROFILE_UUID"
echo "Expiration             : $PROFILE_EXPIRATION"

if [[ "$APP_IDENTIFIER" != "$EXPECTED_APP_IDENTIFIER" ]]; then
  error "Provisioning Profile không đúng app KTV. Expected: $EXPECTED_APP_IDENTIFIER"
fi

success "Provisioning Profile đúng app KTV."

# ============================================================
# 9. FILES
# ============================================================

info "===== 9. FILES ĐÃ CHUẨN BỊ ====="

ls -lh \
  "$KTV_P12" \
  "$KTV_MOBILEPROVISION" \
  "$KTV_CREDENTIALS_JSON"

# ============================================================
# 10. SAFE JSON OUTPUT
# ============================================================

info "===== 10. credentials.json (CHE PASSWORD) ====="

jq '
  .ios.distributionCertificate.password = "******"
' "$KTV_CREDENTIALS_JSON"

echo
success "HOÀN TẤT SIGNING FILES CHO APP KTV"

echo
echo "Project:"
echo "  $KTV_PROJECT"

echo
echo "Bundle:"
echo "  $EXPECTED_BUNDLE_ID"

echo
echo "Bước tiếp theo:"
echo "  npx eas-cli@latest project:info"
echo "  npx eas-cli@latest credentials --platform ios"