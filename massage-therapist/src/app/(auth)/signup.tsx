import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { APP_COLOR } from '@/utils/constant';

const SignupPage = () => {
  const register = useUserStore((state) => state.register);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || password.length < 8) return;

    try {
      await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
    } catch {
      // error đã nằm trong store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.eyebrow}>MASSAGE IN ROOM</Text>
            <Text style={styles.title}>Đăng ký KTV</Text>
            <Text style={styles.description}>
              Tài khoản đăng ký từ app này luôn có role therapist.
            </Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
            />

            <AppInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="0909000001"
            />

            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ktv@example.com"
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
              title="Tạo tài khoản"
              loading={isLoading}
              onPress={handleSubmit}
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
    gap: 15,
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
  },
});

export default SignupPage;
