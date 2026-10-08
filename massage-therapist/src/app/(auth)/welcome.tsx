
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { APP_COLOR } from '@/utils/constant';

const WelcomePage = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Ionicons name="hand-left-outline" size={42} color="#FFFFFF" />
          </View>

          <Text style={styles.brand}>MASSAGE IN ROOM</Text>

          <Text style={styles.title}>Ứng dụng dành cho kỹ thuật viên</Text>

          <Text style={styles.description}>
            Quản lý lịch làm việc, dịch vụ và booking của bạn ngay trên điện thoại.
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Đăng nhập" onPress={() => router.push('/(auth)/login')} />

          <AppButton
            title="Đăng ký KTV"
            variant="secondary"
            onPress={() => router.push('/(auth)/signup')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },

  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',

    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },

  hero: {
    flex: 1,

    justifyContent: 'center',

    paddingBottom: 70,
  },

  icon: {
    width: 76,
    height: 76,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 24,

    backgroundColor: APP_COLOR.PRIMARY,
  },

  brand: {
    marginTop: 26,

    color: APP_COLOR.PRIMARY,

    fontSize: 13,
    lineHeight: 18,

    fontWeight: '900',

    letterSpacing: 2,
  },

  title: {
    marginTop: 16,

    maxWidth: 390,

    color: APP_COLOR.TEXT,

    fontSize: 34,
    lineHeight: 42,

    fontWeight: '900',
  },

  description: {
    marginTop: 16,

    maxWidth: 390,

    color: APP_COLOR.MUTED,

    fontSize: 16,
    lineHeight: 25,
  },

  actions: {
    width: '100%',

    gap: 12,

    paddingTop: 16,
    paddingBottom: 8,
  },
});

export default WelcomePage;

