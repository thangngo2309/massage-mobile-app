import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';

const LoginPage = () => {
  const login = useUserStore((state) => state.login);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!loginValue.trim() || password.length < 8) return;

    try {
      await login(loginValue, password);
    } catch {
      // error đã nằm trong store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}>
        <View>
          <Text style={styles.eyebrow}>KỸ THUẬT VIÊN</Text>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.description}>
            Đăng nhập để xem booking và quản lý lịch làm việc.
          </Text>
        </View>

        <View style={styles.form}>
          <AppInput
            label="Số điện thoại hoặc email"
            value={loginValue}
            onChangeText={setLoginValue}
            autoCapitalize="none"
            placeholder="0909000001"
          />

          <AppInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="Tối thiểu 8 ký tự"
            password
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            title="Đăng nhập"
            loading={isLoading}
            onPress={handleSubmit}
          />

          <AppButton
            title="Chưa có tài khoản? Đăng ký"
            variant="ghost"
            onPress={() => router.push('/(auth)/signup')}
          />
        </View>
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
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  eyebrow: {
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
  form: {
    gap: 16,
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default LoginPage;
