import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import {
  sendRegistrationOtpAPI,
  verifyRegistrationOtpAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { pushRoute, replaceRoute } from '@/utils/navigation';

type RegisterStep = 'register' | 'otp';

const DEFAULT_RESEND_SECONDS = 60;

const SignUpPage = () => {
  const registerClient = useUserStore(state => state.registerClient);
  const isLoading = useUserStore(state => state.isLoading);
  const storeError = useUserStore(state => state.error);
  const clearError = useUserStore(state => state.clearError);

  const [step, setStep] = useState<RegisterStep>('register');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [registeredPhone, setRegisteredPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds(current => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

  const resetMessages = () => {
    setLocalError('');
    setSuccessMessage('');
    clearError();
  };

  const validateRegister = () => {
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();

    if (normalizedName.length < 2) {
      return 'Vui lòng nhập họ và tên hợp lệ.';
    }

    if (normalizedPhone.length < 9) {
      return 'Số điện thoại không hợp lệ.';
    }

    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return 'Email không hợp lệ.';
    }

    return null;
  };

  const handleRegister = async () => {
    resetMessages();

    const validationError = validateRegister();

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      const response = await registerClient({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        deviceName: `${Platform.OS}-in-home-massage-247-client`,
      });

      const normalizedPhone = response.user.phone?.trim() || phone.trim();

      setRegisteredPhone(normalizedPhone);
      setOtp('');
      setResendSeconds(DEFAULT_RESEND_SECONDS);
      setSuccessMessage(
        response.message || 'Mã OTP đã được gửi tới số điện thoại của bạn.',
      );
      setStep('otp');
    } catch {
      // Store đã lưu error để UI hiển thị.
    }
  };

  const handleVerifyOtp = async () => {
    resetMessages();

    const normalizedOtp = otp.trim();

    if (!registeredPhone) {
      setLocalError('Không xác định được số điện thoại đăng ký.');
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setLocalError('Vui lòng nhập mã OTP gồm 6 chữ số.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await verifyRegistrationOtpAPI({
        phone: registeredPhone,
        code: normalizedOtp,
      });

      setSuccessMessage(response.message || 'Xác thực thành công.');

      Alert.alert(
        'Xác thực thành công',
        response.message ||
          'Tài khoản đã được kích hoạt. Vui lòng đăng nhập để tiếp tục.',
        [
          {
            text: 'Đăng nhập',
            onPress: () => replaceRoute('/(auth)/login'),
          },
        ],
      );
    } catch (error) {
      setLocalError(getApiErrorMessage(error, 'Không thể xác thực OTP.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registeredPhone || resendSeconds > 0 || isResending) return;

    resetMessages();
    setIsResending(true);

    try {
      const response = await sendRegistrationOtpAPI({
        phone: registeredPhone,
      });

      setOtp('');
      setResendSeconds(response.resendAfter ?? DEFAULT_RESEND_SECONDS);
      setSuccessMessage(response.message || 'Mã OTP mới đã được gửi.');
    } catch (error) {
      setLocalError(getApiErrorMessage(error, 'Không thể gửi lại OTP.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    resetMessages();
    setOtp('');
    setStep('register');
  };

  const currentError = localError || storeError || '';

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={handleBackToRegister}>
              <Ionicons name="arrow-back" size={24} color={APP_COLOR.TEXT} />
            </TouchableOpacity>

            <View style={styles.otpIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={34}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.eyebrow}>XÁC THỰC SỐ ĐIỆN THOẠI</Text>
            <Text style={styles.title}>Nhập mã OTP</Text>
            <Text style={styles.subtitle}>
              Mã xác thực đã được gửi tới số điện thoại:
            </Text>
            <Text style={styles.phoneText}>{registeredPhone}</Text>

            <View style={styles.card}>
              <AppInput
                label="Mã OTP"
                value={otp}
                onChangeText={value => {
                  setOtp(value.replace(/\D/g, ''));
                  setLocalError('');
                }}
                placeholder="Nhập 6 chữ số"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />

              {!!successMessage && (
                <View style={styles.successBox}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={APP_COLOR.SUCCESS}
                  />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {!!currentError && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={APP_COLOR.DANGER}
                  />
                  <Text style={styles.errorText}>{currentError}</Text>
                </View>
              )}

              <AppButton
                title="Xác nhận OTP"
                loading={isVerifying}
                disabled={isVerifying || otp.trim().length !== 6}
                onPress={() => void handleVerifyOtp()}
                style={styles.submitButton}
              />

              <AppButton
                title={
                  resendSeconds > 0
                    ? `Gửi lại mã sau ${resendSeconds}s`
                    : 'Gửi lại mã OTP'
                }
                variant="secondary"
                loading={isResending}
                disabled={resendSeconds > 0 || isResending}
                onPress={() => void handleResendOtp()}
                style={styles.secondaryButton}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => replaceRoute('/(auth)/login')}>
                <Text style={styles.loginText}>
                  Quay về <Text style={styles.loginStrong}>Đăng nhập</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => pushRoute('/(auth)/login')}>
            <Ionicons name="arrow-back" size={24} color={APP_COLOR.TEXT} />
          </TouchableOpacity>

          <Text style={styles.eyebrow}>IN HOME MASSAGE 247</Text>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản khách hàng và xác thực số điện thoại bằng OTP để bắt đầu đặt lịch.
          </Text>

          <View style={styles.card}>
            <AppInput
              label="Họ và tên"
              value={fullName}
              onChangeText={value => {
                setFullName(value);
                resetMessages();
              }}
              placeholder="Nguyễn Văn A"
              autoCapitalize="words"
              maxLength={255}
            />

            <AppInput
              label="Số điện thoại"
              value={phone}
              onChangeText={value => {
                setPhone(value);
                resetMessages();
              }}
              placeholder="0901234567"
              keyboardType="phone-pad"
              containerStyle={styles.field}
            />

            <AppInput
              label="Email"
              value={email}
              onChangeText={value => {
                setEmail(value);
                resetMessages();
              }}
              placeholder="email@example.com (không bắt buộc)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.field}
            />

            <AppInput
              label="Mật khẩu"
              value={password}
              onChangeText={value => {
                setPassword(value);
                resetMessages();
              }}
              placeholder="Tối thiểu 8 ký tự"
              secureTextEntry
              containerStyle={styles.field}
            />

            <AppInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={value => {
                setConfirmPassword(value);
                resetMessages();
              }}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              containerStyle={styles.field}
              onSubmitEditing={() => void handleRegister()}
            />

            {!!currentError && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={APP_COLOR.DANGER}
                />
                <Text style={styles.errorText}>{currentError}</Text>
              </View>
            )}

            <AppButton
              title="Đăng ký và nhận OTP"
              loading={isLoading}
              disabled={isLoading}
              onPress={() => void handleRegister()}
              style={styles.submitButton}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => pushRoute('/(auth)/login')}>
              <Text style={styles.loginText}>
                Đã có tài khoản? <Text style={styles.loginStrong}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.SURFACE,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
  },
  otpIcon: {
    width: 66,
    height: 66,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  eyebrow: {
    marginTop: 28,
    color: APP_COLOR.PRIMARY,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 8,
    color: APP_COLOR.TEXT,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 10,
    color: APP_COLOR.MUTED,
    fontSize: 15,
    lineHeight: 22,
  },
  phoneText: {
    marginTop: 7,
    color: APP_COLOR.PRIMARY,
    fontSize: 17,
    fontWeight: '900',
  },
  card: {
    marginTop: 26,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  field: {
    marginTop: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 19,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  successText: {
    flex: 1,
    color: APP_COLOR.SUCCESS,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 18,
  },
  secondaryButton: {
    marginTop: 12,
  },
  loginText: {
    marginTop: 20,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    textAlign: 'center',
  },
  loginStrong: {
    color: APP_COLOR.PRIMARY,
    fontWeight: '800',
  },
});

export default SignUpPage;
