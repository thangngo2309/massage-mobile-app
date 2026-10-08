
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';

    case 'inactive':
      return 'Chưa kích hoạt';

    case 'suspended':
      return 'Tạm khóa';

    default:
      return 'Đang hoạt động';
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'inactive':
      return APP_COLOR.WARNING;

    case 'suspended':
      return APP_COLOR.DANGER;

    default:
      return APP_COLOR.SUCCESS;
  }
};

type MenuItemProps = {
  icon: 'calendar-outline' | 'sparkles-outline' | 'people-outline';

  title: string;

  description: string;

  onPress: () => void;
};

const MenuItem = ({ icon, title, description, onPress }: MenuItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed ? styles.menuItemPressed : null]}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={APP_COLOR.PRIMARY} />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>

        <Text style={styles.menuDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </Pressable>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: 'call-outline' | 'mail-outline' | 'shield-checkmark-outline';

  label: string;

  value: string;
}) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={APP_COLOR.PRIMARY} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const AccountPage = () => {
  const user = useUserStore(state => state.user);

  const logout = useUserStore(state => state.logout);

  const isLoading = useUserStore(state => state.isLoading);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const statusLabel = getStatusLabel(user?.status);

  const statusColor = getStatusColor(user?.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tài khoản</Text>

          <Text style={styles.subtitle}>Quản lý thông tin và hoạt động của bạn.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color={APP_COLOR.PRIMARY_DARK} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.fullName || 'Khách hàng'}
              </Text>

              <Text style={styles.phone} numberOfLines={1}>
                {user?.phone || 'Chưa có số điện thoại'}
              </Text>

              <View style={styles.badges}>
                <View style={styles.customerBadge}>
                  <Text style={styles.customerBadgeText}>Khách hàng</Text>
                </View>

                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: statusColor,
                      },
                    ]}
                  />

                  <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.sectionCard}>
            <InfoRow
              icon="call-outline"
              label="Số điện thoại"
              value={user?.phone || 'Chưa cập nhật'}
            />

            <View style={styles.divider} />

            <InfoRow icon="mail-outline" label="Email" value={user?.email || 'Chưa cập nhật'} />

            <View style={styles.divider} />

            <InfoRow
              icon="shield-checkmark-outline"
              label="Trạng thái tài khoản"
              value={statusLabel}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động của bạn</Text>

          <View style={styles.sectionCard}>
            <MenuItem
              icon="calendar-outline"
              title="Lịch hẹn của tôi"
              description="Xem và theo dõi các booking đã đặt."
              onPress={() => router.push('/(tabs)/bookings')}
            />

            <View style={styles.divider} />

            <MenuItem
              icon="sparkles-outline"
              title="Khám phá dịch vụ"
              description="Xem các dịch vụ massage đang có."
              onPress={() => router.push('/(tabs)/services')}
            />

            <View style={styles.divider} />

            <MenuItem
              icon="people-outline"
              title="Kỹ thuật viên"
              description="Tìm và xem thông tin kỹ thuật viên."
              onPress={() => router.push('/(tabs)/therapists')}
            />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <AppButton
            title="Đăng xuất"
            variant="danger"
            loading={isLoading}
            disabled={isLoading}
            icon={<Ionicons name="log-out-outline" size={21} color="#FFFFFF" />}
            onPress={handleLogout}
            style={styles.logoutButton}
          />

          <Text style={styles.logoutHint}>
            Bạn có thể đăng nhập lại bằng số điện thoại hoặc email đã đăng ký.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: APP_COLOR.BACKGROUND,
  },

  content: {
    paddingHorizontal: 20,

    paddingTop: 12,

    paddingBottom: 120,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    color: APP_COLOR.TEXT,

    fontSize: 30,

    lineHeight: 38,

    fontWeight: '900',
  },

  subtitle: {
    marginTop: 5,

    color: APP_COLOR.MUTED,

    fontSize: 14,

    lineHeight: 21,
  },

  profileCard: {
    padding: 20,

    borderRadius: 24,

    backgroundColor: APP_COLOR.PRIMARY,
  },

  profileTop: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 16,
  },

  avatar: {
    width: 78,

    height: 78,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 26,

    backgroundColor: '#CCFBF1',
  },

  profileInfo: {
    flex: 1,

    minWidth: 0,
  },

  name: {
    color: '#FFFFFF',

    fontSize: 22,

    lineHeight: 29,

    fontWeight: '900',
  },

  phone: {
    marginTop: 5,

    color: '#CCFBF1',

    fontSize: 14,

    lineHeight: 20,
  },

  badges: {
    marginTop: 12,

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,
  },

  customerBadge: {
    paddingHorizontal: 11,

    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  customerBadgeText: {
    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '800',
  },

  statusBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    paddingHorizontal: 11,

    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.94)',
  },

  statusDot: {
    width: 7,

    height: 7,

    borderRadius: 999,
  },

  statusBadgeText: {
    color: APP_COLOR.PRIMARY_DARK,

    fontSize: 12,

    fontWeight: '800',
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    marginBottom: 10,

    color: APP_COLOR.TEXT,

    fontSize: 17,

    lineHeight: 23,

    fontWeight: '900',
  },

  sectionCard: {
    overflow: 'hidden',

    borderRadius: 20,

    borderWidth: 1,

    borderColor: APP_COLOR.BORDER,

    backgroundColor: APP_COLOR.SURFACE,
  },

  infoRow: {
    minHeight: 74,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingVertical: 13,

    gap: 13,
  },

  infoIcon: {
    width: 42,

    height: 42,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },

  infoContent: {
    flex: 1,

    minWidth: 0,
  },

  infoLabel: {
    color: APP_COLOR.MUTED,

    fontSize: 12,

    lineHeight: 17,
  },

  infoValue: {
    marginTop: 3,

    color: APP_COLOR.TEXT,

    fontSize: 15,

    lineHeight: 20,

    fontWeight: '700',
  },

  divider: {
    height: StyleSheet.hairlineWidth,

    marginLeft: 71,

    backgroundColor: APP_COLOR.BORDER,
  },

  menuItem: {
    minHeight: 82,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingVertical: 14,

    gap: 13,
  },

  menuItemPressed: {
    backgroundColor: '#F8FAFC',
  },

  menuIcon: {
    width: 44,

    height: 44,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },

  menuContent: {
    flex: 1,

    minWidth: 0,
  },

  menuTitle: {
    color: APP_COLOR.TEXT,

    fontSize: 15,

    lineHeight: 21,

    fontWeight: '800',
  },

  menuDescription: {
    marginTop: 3,

    color: APP_COLOR.MUTED,

    fontSize: 12,

    lineHeight: 18,
  },

  logoutSection: {
    marginTop: 28,
  },

  logoutButton: {
    minHeight: 54,

    borderRadius: 16,
  },

  logoutHint: {
    marginTop: 11,

    paddingHorizontal: 16,

    color: APP_COLOR.MUTED,

    fontSize: 12,

    lineHeight: 18,

    textAlign: 'center',
  },
});

export default AccountPage;

