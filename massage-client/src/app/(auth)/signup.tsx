import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
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
import { APP_COLOR } from '@/utils/constant';
import { pushRoute } from '@/utils/navigation';

const SignUpPage = () => {
  const registerClient = useUserStore(state => state.registerClient);
  const isLoading = useUserStore(state => state.isLoading);
  const storeError = useUserStore(state => state.error);
  const clearError = useUserStore(state => state.clearError);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !password) {
      setLocalError('Vui lòng nhập họ tên, số điện thoại và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLocalError('');
    clearError();

    try {
      await registerClient({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        deviceName: `${Platform.OS}-massage-in-room`,
      });
    } catch {
      // Error đã được store lưu để UI hiển thị.
    }
  };

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

          <Text style={styles.eyebrow}>MASSAGE IN ROOM</Text>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản khách hàng để bắt đầu tìm dịch vụ và đặt lịch massage.
          </Text>

          <View style={styles.card}>
            <AppInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
              autoCapitalize="words"
            />

            <AppInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="0988617215"
              keyboardType="phone-pad"
              containerStyle={styles.field}
            />

            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com (không bắt buộc)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.field}
            />

            <AppInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              containerStyle={styles.field}
            />

            <AppInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              containerStyle={styles.field}
              onSubmitEditing={() => void handleSubmit()}
            />

            {!!(localError || storeError) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color={APP_COLOR.DANGER} />
                <Text style={styles.errorText}>{localError || storeError}</Text>
              </View>
            )}

            <AppButton
              title="Đăng ký"
              loading={isLoading}
              onPress={() => void handleSubmit()}
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
  eyebrow: {
    marginTop: 34,
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
  submitButton: {
    marginTop: 18,
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
