#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# CONFIG
# ============================================================

# Project Ghép Hàng đang có Distribution Certificate hợp lệ
OLD_PROJECT="$HOME/Workspace/FL/ghephang247-taixe"

# Project Massage = thư mục chứa chính file script này
NEW_PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Provisioning Profile đã tải từ Apple Developer
MASSAGE_PROFILE="$HOME/Downloads/In_Home_Massage_247_Client_AppStore.mobileprovision"

# Files nguồn
OLD_CREDENTIALS_JSON="$OLD_PROJECT/credentials.json"
OLD_P12="$OLD_PROJECT/credentials/ios/dist-cert.p12"

# Files đích
NEW_IOS_CREDENTIALS_DIR="$NEW_PROJECT/credentials/ios"
NEW_P12="$NEW_IOS_CREDENTIALS_DIR/dist-cert.p12"
NEW_PROFILE="$NEW_IOS_CREDENTIALS_DIR/profile.mobileprovision"
NEW_CREDENTIALS_JSON="$NEW_PROJECT/credentials.json"

# Thông tin mong đợi
EXPECTED_APP_IDENTIFIER="C9TJ8NQJKZ.com.hoangan.inhomemassage247.client"
EXPECTED_CERT_SERIAL="5DB9A585BA2F0818D97E0BC2A2B9396A"

# Temp files
CERT_PEM="$(mktemp /tmp/inhome247-cert.XXXXXX.pem)"
PROFILE_PLIST="$(mktemp /tmp/inhome247-profile.XXXXXX.plist)"

cleanup() {
  rm -f "$CERT_PEM" "$PROFILE_PLIST"
}

trap cleanup EXIT

# ============================================================
# HELPERS
# ============================================================

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
# STEP 1: CHECK COMMANDS
# ============================================================

info "===== 1. KIỂM TRA COMMAND ====="

require_command jq
require_command openssl
require_command security

if [[ ! -x "/usr/libexec/PlistBuddy" ]]; then
  error "Không tìm thấy /usr/libexec/PlistBuddy"
fi

success "Các command cần thiết đều tồn tại."

# ============================================================
# STEP 2: CHECK SOURCE FILES
# ============================================================

info "===== 2. KIỂM TRA FILE NGUỒN ====="

require_file "$OLD_CREDENTIALS_JSON"
require_file "$OLD_P12"
require_file "$MASSAGE_PROFILE"

success "credentials.json cũ: $OLD_CREDENTIALS_JSON"
success "Distribution Certificate: $OLD_P12"
success "Massage Provisioning Profile: $MASSAGE_PROFILE"

# ============================================================
# STEP 3: CHECK OLD credentials.json
# ============================================================

info "===== 3. KIỂM TRA credentials.json CỦA GHÉP HÀNG ====="

if ! jq -e '.ios' "$OLD_CREDENTIALS_JSON" >/dev/null; then
  error "credentials.json không có object .ios"
fi

if ! jq -e '.ios.distributionCertificate' "$OLD_CREDENTIALS_JSON" >/dev/null; then
  error "credentials.json không có .ios.distributionCertificate"
fi

P12_PASSWORD="$(
  jq -r '.ios.distributionCertificate.password // empty' \
    "$OLD_CREDENTIALS_JSON"
)"

if [[ -z "$P12_PASSWORD" ]]; then
  error "Không lấy được password của Distribution Certificate từ credentials.json"
fi

success "Đã đọc được cấu hình Distribution Certificate."
success "Password tồn tại và KHÔNG được in ra màn hình."

# ============================================================
# STEP 4: PREPARE MASSAGE CREDENTIAL FILES
# ============================================================

info "===== 4. COPY CREDENTIAL FILES SANG MASSAGE ====="

mkdir -p "$NEW_IOS_CREDENTIALS_DIR"

cp -f "$OLD_P12" "$NEW_P12"
cp -f "$MASSAGE_PROFILE" "$NEW_PROFILE"

success "Đã copy dist-cert.p12"
success "Đã copy profile.mobileprovision"

# ============================================================
# STEP 5: CREATE credentials.json
# ============================================================

info "===== 5. TẠO credentials.json CHO MASSAGE ====="

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
  > "$NEW_CREDENTIALS_JSON"

success "Đã tạo: $NEW_CREDENTIALS_JSON"

# ============================================================
# STEP 6: VERIFY P12
# ============================================================

info "===== 6. KIỂM TRA DISTRIBUTION CERTIFICATE ====="

if ! openssl pkcs12 \
  -in "$NEW_P12" \
  -clcerts \
  -nokeys \
  -passin "pass:$P12_PASSWORD" \
  -out "$CERT_PEM" \
  >/dev/null 2>&1; then

  echo "OpenSSL đọc P12 theo chế độ thường thất bại."
  echo "Thử lại với -legacy..."

  if ! openssl pkcs12 \
    -legacy \
    -in "$NEW_P12" \
    -clcerts \
    -nokeys \
    -passin "pass:$P12_PASSWORD" \
    -out "$CERT_PEM" \
    >/dev/null 2>&1; then

    error "Không thể đọc file dist-cert.p12. Có thể password hoặc file P12 không đúng."
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

success "Distribution Certificate đúng certificate đang dùng."

# ============================================================
# STEP 7: VERIFY PROVISIONING PROFILE
# ============================================================

info "===== 7. KIỂM TRA PROVISIONING PROFILE ====="

if ! security cms \
  -D \
  -i "$NEW_PROFILE" \
  > "$PROFILE_PLIST"; then
  error "Không thể decode provisioning profile."
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
  error "Provisioning Profile không đúng app Massage. Expected: $EXPECTED_APP_IDENTIFIER"
fi

success "Provisioning Profile đúng app Massage."

# ============================================================
# STEP 8: SHOW FILES
# ============================================================

info "===== 8. FILES ĐÃ CHUẨN BỊ ====="

ls -lh \
  "$NEW_P12" \
  "$NEW_PROFILE" \
  "$NEW_CREDENTIALS_JSON"

# ============================================================
# STEP 9: SHOW SAFE credentials.json
# ============================================================

info "===== 9. credentials.json (ĐÃ CHE PASSWORD) ====="

jq '
  if .ios.distributionCertificate.password then
    .ios.distributionCertificate.password = "******"
  else
    .
  end
' "$NEW_CREDENTIALS_JSON"

# ============================================================
# DONE
# ============================================================

echo
success "HOÀN TẤT!"
echo
echo "Project Massage:"
echo "  $NEW_PROJECT"
echo
echo "Bước tiếp theo:"
echo
echo "  cd \"$NEW_PROJECT\""
echo "  npx eas-cli@latest credentials --platform ios"
echo
echo "Sau đó chọn:"
echo "  production"
echo "  Apple login -> No"
echo "  credentials.json"
echo "  Upload credentials from credentials.json to EAS"
echo