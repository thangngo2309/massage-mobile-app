import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';

const AccountPage = () => {
  const user = useUserStore(state => state.user);
  const logout = useUserStore(state => state.logout);
  const isLoading = useUserStore(state => state.isLoading);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Tài khoản</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={APP_COLOR.PRIMARY_DARK} />
          </View>

          <Text style={styles.name}>{user?.fullName ?? 'Khách hàng'}</Text>

          {!!user?.phone && <Text style={styles.meta}>{user.phone}</Text>}
          {!!user?.email && <Text style={styles.meta}>{user.email}</Text>}

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role ?? 'client'}</Text>
          </View>
        </View>

        <AppButton
          title="Đăng xuất"
          variant="danger"
          loading={isLoading}
          onPress={() => void logout()}
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  content: {
    padding: 20,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 28,
    fontWeight: '900',
  },
  profileCard: {
    marginTop: 18,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  name: {
    marginTop: 14,
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  meta: {
    marginTop: 5,
    color: APP_COLOR.MUTED,
    fontSize: 14,
  },
  roleBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  roleText: {
    color: APP_COLOR.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: '800',
  },
  logoutButton: {
    marginTop: 20,
  },
});

export default AccountPage;
