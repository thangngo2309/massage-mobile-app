import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { APP_COLOR } from '@/utils/constant';

const WelcomePage = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.hero}>
      <View style={styles.icon}>
        <Ionicons name="hand-left-outline" size={44} color="#FFFFFF" />
      </View>

      <Text style={styles.brand}>MASSAGE IN ROOM</Text>

      <Text style={styles.title}>Ứng dụng dành cho kỹ thuật viên</Text>

      <Text style={styles.description}>
        Quản lý lịch làm việc, dịch vụ và booking của bạn ngay trên điện thoại.
      </Text>
    </View>

    <View style={styles.actions}>
      <AppButton
        title="Đăng nhập"
        onPress={() => router.push('/(auth)/login')}
      />

      <AppButton
        title="Đăng ký KTV"
        variant="secondary"
        onPress={() => router.push('/(auth)/signup')}
      />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  hero: {
    marginTop: 70,
  },
  icon: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  brand: {
    marginTop: 28,
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    marginTop: 14,
    color: APP_COLOR.TEXT,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
  },
  description: {
    marginTop: 14,
    color: APP_COLOR.MUTED,
    fontSize: 16,
    lineHeight: 25,
  },
  actions: {
    gap: 12,
    paddingBottom: 20,
  },
});

export default WelcomePage;
