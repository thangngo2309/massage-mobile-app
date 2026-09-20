import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BookingCard } from '@/components/bookings/BookingCard';
import { LoadingState } from '@/components/common/LoadingState';
import type { Booking, TherapistProfile } from '@/types';
import {
  getTherapistBookingsAPI,
  getTherapistProfileAPI,
  updateAcceptingBookingsAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';

const DashboardPage = () => {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAccepting, setUpdatingAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    setError(null);

    try {
      const [profileData, bookingData] = await Promise.all([
        getTherapistProfileAPI(),
        getTherapistBookingsAPI({
          page: 1,
          limit: 10,
        }),
      ]);

      setProfile(profileData);
      setBookings(bookingData.items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const realtimeRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  useBookingRealtime(realtimeRefresh);

  const handleToggleAccepting = async () => {
    if (!profile) return;

    setUpdatingAccepting(true);

    try {
      const updated = await updateAcceptingBookingsAPI(
        !profile.isAcceptingBookings,
      );

      setProfile(updated);
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError));
    } finally {
      setUpdatingAccepting(false);
    }
  };

  const nextBooking =
    bookings.find((item) =>
      [
        'waiting_therapist_accept',
        'confirmed',
        'therapist_on_the_way',
        'arrived',
        'in_progress',
      ].includes(item.status),
    ) ?? null;

  const waitingCount = bookings.filter(
    (item) => item.status === 'waiting_therapist_accept',
  ).length;

  const activeCount = bookings.filter((item) =>
    ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress'].includes(
      item.status,
    ),
  ).length;

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.hello}>Xin chào</Text>
            <Text style={styles.name}>{profile?.fullName || 'Kỹ thuật viên'}</Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={APP_COLOR.PRIMARY_DARK} />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.cardEyebrow}>TRẠNG THÁI HOẠT ĐỘNG</Text>
              <Text style={styles.verification}>
                {profile?.verificationStatus === 'verified'
                  ? 'Đã xác minh'
                  : profile?.verificationStatus === 'rejected'
                    ? 'Bị từ chối xác minh'
                    : 'Đang chờ xác minh'}
              </Text>
            </View>

            <View
              style={[
                styles.dot,
                {
                  backgroundColor: profile?.isAcceptingBookings
                    ? '#10B981'
                    : '#94A3B8',
                },
              ]}
            />
          </View>

          <Text style={styles.statusText}>
            {profile?.isAcceptingBookings
              ? 'Bạn đang nhận booking mới.'
              : 'Bạn đang tạm ngừng nhận booking.'}
          </Text>

          <AppButton
            title={
              profile?.isAcceptingBookings
                ? 'Tạm ngừng nhận booking'
                : 'Bật nhận booking'
            }
            variant={profile?.isAcceptingBookings ? 'secondary' : 'primary'}
            loading={updatingAccepting}
            onPress={handleToggleAccepting}
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{waitingCount}</Text>
            <Text style={styles.statLabel}>Chờ nhận</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Đang làm</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.completedBookings ?? 0}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking cần chú ý</Text>
          <Text
            style={styles.link}
            onPress={() => {
              router.push('/(tabs)/bookings');
            }}>
            Xem tất cả
          </Text>
        </View>

        {nextBooking ? (
          <BookingCard booking={nextBooking} />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có booking đang hoạt động</Text>
            <Text style={styles.emptyText}>
              Booking mới sẽ xuất hiện tại đây khi khách chọn bạn.
            </Text>
          </View>
        )}
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
    padding: 18,
    paddingBottom: 110,
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: {
    color: APP_COLOR.MUTED,
    fontSize: 16,
  },
  name: {
    marginTop: 4,
    color: APP_COLOR.TEXT,
    fontSize: 27,
    fontWeight: '900',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
  },
  statusCard: {
    padding: 18,
    gap: 14,
    borderRadius: 20,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    color: '#99F6E4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  verification: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: {
    color: '#CCFBF1',
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  statValue: {
    color: APP_COLOR.TEXT,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  link: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 7,
  },
  emptyTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default DashboardPage;
