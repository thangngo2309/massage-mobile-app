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

const LoginPage = () => {
  const login = useUserStore(state => state.login);
  const isLoading = useUserStore(state => state.isLoading);
  const storeError = useUserStore(state => state.error);
  const clearError = useUserStore(state => state.clearError);

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    const normalizedLogin = loginValue.trim();

    if (!normalizedLogin || !password) {
      setLocalError('Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLocalError('');
    clearError();

    try {
      await login(normalizedLogin, password);
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
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => pushRoute('/(auth)/welcome')}>
              <Ionicons name="arrow-back" size={24} color={APP_COLOR.TEXT} />
            </TouchableOpacity>

            <View style={styles.brandIcon}>
              <Ionicons name="sparkles" size={26} color={APP_COLOR.PRIMARY} />
            </View>

            <Text style={styles.eyebrow}>MASSAGE IN ROOM</Text>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để đặt lịch và quản lý các buổi massage của bạn.
            </Text>
          </View>

          <View style={styles.card}>
            <AppInput
              label="Số điện thoại hoặc email"
              value={loginValue}
              onChangeText={value => {
                setLoginValue(value);
                if (localError) setLocalError('');
                if (storeError) clearError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Vui lòng nhập số điện thoại hoặc email "
              returnKeyType="next"
            />

            <AppInput
              label="Mật khẩu"
              value={password}
              onChangeText={value => {
                setPassword(value);
                if (localError) setLocalError('');
                if (storeError) clearError();
              }}
              secureTextEntry
              placeholder="Nhập mật khẩu"
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
              containerStyle={styles.passwordField}
            />

            {!!(localError || storeError) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color={APP_COLOR.DANGER} />
                <Text style={styles.errorText}>{localError || storeError}</Text>
              </View>
            )}

            <AppButton
              title="Đăng nhập"
              loading={isLoading}
              disabled={!loginValue.trim() || !password}
              onPress={() => void handleSubmit()}
              style={styles.loginButton}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => pushRoute('/(auth)/signup')}>
              <Text style={styles.registerText}>
                Chưa có tài khoản? <Text style={styles.registerStrong}>Đăng ký</Text>
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
    paddingBottom: 36,
  },
  header: {
    paddingTop: 8,
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
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    marginTop: 54,
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 18,
    color: APP_COLOR.PRIMARY,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 8,
    color: APP_COLOR.TEXT,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 10,
    color: APP_COLOR.MUTED,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginTop: 30,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  passwordField: {
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
  loginButton: {
    marginTop: 18,
  },
  registerText: {
    marginTop: 20,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    textAlign: 'center',
  },
  registerStrong: {
    color: APP_COLOR.PRIMARY,
    fontWeight: '800',
  },
});

export default LoginPage;
