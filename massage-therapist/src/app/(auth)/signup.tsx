import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';
import { replaceRoute } from '@/utils/navigation';

const SignupPage = () => {
  const registerTherapist = useUserStore(state => state.registerTherapist);
  const isLoading = useUserStore(state => state.isLoading);
  const storeError = useUserStore(state => state.error);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!fullName.trim() || !phone.trim() || !password) return setError('Vui lòng nhập họ tên, số điện thoại và mật khẩu.');
    if (password.length < 6) return setError('Mật khẩu cần ít nhất 6 ký tự.');
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.');
    setError('');
    try {
      await registerTherapist({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim() || undefined, password });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Đăng ký kỹ thuật viên</Text>
          <Text style={styles.subtitle}>Tài khoản sẽ ở trạng thái chờ xác minh sau khi đăng ký.</Text>
          <AppInput label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" />
          <AppInput label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09xxxxxxxx" />
          <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Không bắt buộc" />
          <AppInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
          <AppInput label="Xác nhận mật khẩu" value={confirm} onChangeText={setConfirm} secureTextEntry />
          {!!(error || storeError) && <Text style={styles.error}>{error || storeError}</Text>}
          <AppButton title="Tạo tài khoản KTV" loading={isLoading} onPress={() => void submit()} />
          <TouchableOpacity onPress={() => replaceRoute('/(auth)/login')}><Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { color: APP_COLOR.TEXT, fontSize: 28, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 21, marginTop: 7, marginBottom: 24 },
  error: { color: APP_COLOR.DANGER, marginBottom: 12 },
  link: { color: APP_COLOR.PRIMARY, textAlign: 'center', marginTop: 20, fontWeight: '700' },
});

export default SignupPage;
