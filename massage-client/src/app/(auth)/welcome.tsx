import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import { APP_COLOR } from '@/utils/constant';
import { pushRoute } from '@/utils/navigation';

const WelcomePage = () => {
  return (
    <LinearGradient
      colors={[APP_COLOR.PRIMARY_DARK, APP_COLOR.PRIMARY, '#115E59']}
      style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>M</Text>
          </View>

          <Text style={styles.eyebrow}>MASSAGE AT YOUR ROOM</Text>
          <Text style={styles.brand}>Massage In Room</Text>

          <Text style={styles.subtitle}>
            Đặt lịch massage tại phòng, chọn dịch vụ, kỹ thuật viên và thời gian phù hợp với bạn.
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Đăng nhập"
            variant="secondary"
            onPress={() => pushRoute('/(auth)/login')}
          />

          <AppButton
            title="Tạo tài khoản khách hàng"
            style={styles.registerButton}
            onPress={() => pushRoute('/(auth)/signup')}
          />

          <Text style={styles.note}>
            Bằng việc tiếp tục, bạn đồng ý sử dụng ứng dụng theo chính sách của Massage In Room.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: 48,
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoMarkText: {
    color: APP_COLOR.PRIMARY_DARK,
    fontSize: 28,
    fontWeight: '900',
  },
  eyebrow: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    marginTop: 12,
  },
  subtitle: {
    color: '#D1FAE5',
    fontSize: 17,
    lineHeight: 26,
    marginTop: 16,
  },
  actions: {
    gap: 12,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  note: {
    marginTop: 8,
    color: '#CCFBF1',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default WelcomePage;
