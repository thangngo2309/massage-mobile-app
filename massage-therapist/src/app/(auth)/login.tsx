import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const submit = async () => {
    if (!loginValue.trim() || !password) {
      setLocalError('Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }
    setLocalError('');
    clearError();
    try { await login(loginValue, password); } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.icon}><Ionicons name="medical-outline" size={28} color={APP_COLOR.PRIMARY_DARK} /></View>
          <Text style={styles.title}>Đăng nhập KTV</Text>
          <Text style={styles.subtitle}>Quản lý công việc của bạn trên Massage In Room.</Text>
          <AppInput label="Tài khoản" value={loginValue} onChangeText={setLoginValue} autoCapitalize="none" placeholder="Số điện thoại hoặc email" />
          <AppInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry placeholder="Nhập mật khẩu" />
          {!!(localError || storeError) && <Text style={styles.error}>{localError || storeError}</Text>}
          <AppButton title="Đăng nhập" loading={isLoading} onPress={() => void submit()} />
          <TouchableOpacity onPress={() => pushRoute('/(auth)/signup')}><Text style={styles.link}>Chưa có tài khoản? Đăng ký KTV</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: APP_COLOR.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: APP_COLOR.TEXT, fontSize: 30, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 21, marginTop: 7, marginBottom: 26 },
  error: { color: APP_COLOR.DANGER, marginBottom: 12 },
  link: { color: APP_COLOR.PRIMARY, textAlign: 'center', marginTop: 20, fontWeight: '700' },
});

export default LoginPage;
