
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { useEffect, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import { sendRegistrationOtpAPI, verifyRegistrationOtpAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
type RegisterStep = 'register' | 'otp';
const DEFAULT_RESEND_SECONDS = 60;

const SignupPage = () => {
  const register = useUserStore(state => state.register);

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

  const [localError, setLocalError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSeconds(current => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [resendSeconds]);

  const resetMessages = () => {
    setLocalError(null);

    setSuccessMessage(null);

    clearError();
  };

  const validateRegister = () => {
    const normalizedName = fullName.trim();

    const normalizedPhone = phone.trim();

    const normalizedEmail = email.trim();

    if (normalizedName.length < 2) {
      return 'Vui lòng nhập họ và tên hợp lệ.';
    }

    if (!normalizedPhone) {
      return 'Vui lòng nhập số điện thoại.';
    }

    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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
      const response = await register({
        fullName: fullName.trim(),

        phone: phone.trim(),

        email: email.trim() || undefined,

        password,
      });

      /**
       * Backend trả phone đã normalize.
       * Dùng đúng phone Backend trả về
       * cho send/verify OTP.
       */
      setRegisteredPhone(response.user.phone);

      setOtp('');

      setResendSeconds(DEFAULT_RESEND_SECONDS);

      setSuccessMessage(response.message || 'Mã OTP đã được gửi tới số điện thoại của bạn.');

      setStep('otp');
    } catch {
      /**
       * Error đã có trong store.
       */
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

      setSuccessMessage(response.message);

      /**
       * Verify OTP chỉ:
       *
       * inactive -> active
       *
       * Không có accessToken /
       * refreshToken.
       */
      Alert.alert(
        'Xác thực thành công',
        response.message || 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.',
        [
          {
            text: 'Đăng nhập',

            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ],
      );
    } catch (error) {
      setLocalError(getApiErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registeredPhone || resendSeconds > 0 || isResending) {
      return;
    }

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
      setLocalError(getApiErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    resetMessages();

    setOtp('');

    setStep('register');
  };

  const currentError = localError || storeError;

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View>
              <View style={styles.otpIcon}>
                <Ionicons name="shield-checkmark-outline" size={36} color="#FFFFFF" />
              </View>

              <Text style={styles.eyebrow}>XÁC THỰC SỐ ĐIỆN THOẠI</Text>

              <Text style={styles.title}>Nhập mã OTP</Text>

              <Text style={styles.description}>Mã xác thực đã được gửi tới số điện thoại:</Text>

              <Text style={styles.phone}>{registeredPhone}</Text>
            </View>

            <View style={styles.form}>
              <AppInput
                label="Mã OTP"
                value={otp}
                onChangeText={value => {
                  setOtp(value.replace(/\D/g, ''));

                  setLocalError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                placeholder="Nhập 6 chữ số"
              />

              {successMessage ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={APP_COLOR.SUCCESS} />

                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {currentError ? <Text style={styles.error}>{currentError}</Text> : null}

              <AppButton
                title="Xác nhận OTP"
                loading={isVerifying}
                disabled={isVerifying || otp.trim().length !== 6}
                onPress={() => void handleVerifyOtp()}
              />

              <AppButton
                title={resendSeconds > 0 ? `Gửi lại mã sau ${resendSeconds}s` : 'Gửi lại mã OTP'}
                variant="secondary"
                loading={isResending}
                disabled={resendSeconds > 0 || isResending}
                onPress={() => void handleResendOtp()}
              />

              <AppButton
                title="Thay đổi thông tin đăng ký"
                variant="ghost"
                disabled={isVerifying || isResending}
                onPress={handleBackToRegister}
              />

              <AppButton
                title="Quay về đăng nhập"
                variant="ghost"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.eyebrow}>IN HOME MASSAGE 247</Text>

            <Text style={styles.title}>Đăng ký KTV</Text>

            <Text style={styles.description}>
              Tạo tài khoản kỹ thuật viên và xác thực số điện thoại bằng OTP.
            </Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Họ và tên"
              value={fullName}
              onChangeText={value => {
                setFullName(value);

                resetMessages();
              }}
              placeholder="Nguyễn Văn A"
              maxLength={255}
            />

            <AppInput
              label="Số điện thoại"
              value={phone}
              onChangeText={value => {
                setPhone(value);

                resetMessages();
              }}
              keyboardType="phone-pad"
              placeholder="0909000001"
            />

            <AppInput
              label="Email"
              value={email}
              onChangeText={value => {
                setEmail(value);

                resetMessages();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ktv@example.com"
            />

            <AppInput
              label="Mật khẩu"
              value={password}
              onChangeText={value => {
                setPassword(value);

                resetMessages();
              }}
              placeholder="Tối thiểu 8 ký tự"
              password
            />

            <AppInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={value => {
                setConfirmPassword(value);

                resetMessages();
              }}
              placeholder="Nhập lại mật khẩu"
              password
            />

            {currentError ? <Text style={styles.error}>{currentError}</Text> : null}

            <AppButton
              title="Đăng ký và nhận OTP"
              loading={isLoading}
              disabled={isLoading}
              onPress={() => void handleRegister()}
            />

            <AppButton
              title="Đã có tài khoản? Đăng nhập"
              variant="ghost"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: APP_COLOR.BACKGROUND,
  },

  content: {
    flexGrow: 1,

    padding: 24,

    justifyContent: 'center',

    gap: 28,
  },

  eyebrow: {
    marginTop: 20,

    color: APP_COLOR.PRIMARY,

    fontSize: 12,

    fontWeight: '900',

    letterSpacing: 1.5,
  },

  title: {
    marginTop: 8,

    color: APP_COLOR.TEXT,

    fontSize: 32,

    fontWeight: '900',
  },

  description: {
    marginTop: 10,

    color: APP_COLOR.MUTED,

    fontSize: 15,

    lineHeight: 22,
  },

  phone: {
    marginTop: 7,

    color: APP_COLOR.PRIMARY,

    fontSize: 17,

    fontWeight: '900',
  },

  form: {
    gap: 15,
  },

  error: {
    color: APP_COLOR.DANGER,

    fontSize: 13,

    lineHeight: 19,
  },

  otpIcon: {
    width: 66,

    height: 66,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 20,

    backgroundColor: APP_COLOR.PRIMARY,
  },

  successBox: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    padding: 12,

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
});

export default SignupPage;

