import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/bookings/BookingCard';
import { LoadingState } from '@/components/common/LoadingState';
import { AppButton } from '@/components/ui/AppButton';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import type { Booking, TherapistProfile } from '@/types';
import {
  getTherapistBookingsAPI,
  getTherapistProfileAPI,
  updateAcceptingBookingsAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const ACTIVE_STATUSES = [
  'confirmed',
  'therapist_on_the_way',
  'arrived',
  'in_progress',
] as const;

const TERMINAL_STATUSES = [
  'completed',
  'rejected',
  'cancelled_by_admin',
  'cancelled_by_client',
  'cancelled_by_therapist',
  'expired',
] as const;

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
          limit: 50,
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

    if (profile.verificationStatus !== 'verified') {
      setError('Chỉ kỹ thuật viên đã xác minh mới có thể bật nhận booking.');
      return;
    }

    setUpdatingAccepting(true);
    setError(null);

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

  const stats = useMemo(() => {
    const now = new Date();

    const today = bookings.filter((booking) => {
      const value = new Date(booking.scheduledAt);

      return (
        value.getFullYear() === now.getFullYear() &&
        value.getMonth() === now.getMonth() &&
        value.getDate() === now.getDate()
      );
    });

    const waiting = bookings.filter(
      (booking) => booking.status === 'waiting_therapist_accept',
    );

    const active = bookings.filter((booking) =>
      ACTIVE_STATUSES.includes(
        booking.status as (typeof ACTIVE_STATUSES)[number],
      ),
    );

    const completed = bookings.filter(
      (booking) => booking.status === 'completed',
    );

    return {
      today: today.length,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
    };
  }, [bookings]);

  const upcoming = useMemo(() => {
    const now = Date.now();

    return bookings
      .filter(
        (booking) =>
          new Date(booking.scheduledAt).getTime() >= now &&
          !TERMINAL_STATUSES.includes(
            booking.status as (typeof TERMINAL_STATUSES)[number],
          ),
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      )
      .slice(0, 5);
  }, [bookings]);

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const verified = profile?.verificationStatus === 'verified';

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
          <View style={styles.flex}>
            <Text style={styles.hello}>Xin chào</Text>
            <Text style={styles.name}>
              {profile?.fullName || 'Kỹ thuật viên'}
            </Text>
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
                {verified
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
            {verified
              ? profile?.isAcceptingBookings
                ? 'Bạn đang nhận booking mới.'
                : 'Bạn đang tạm ngừng nhận booking.'
              : 'Bạn cần được xác minh trước khi bật nhận booking.'}
          </Text>

          <AppButton
            title={
              profile?.isAcceptingBookings
                ? 'Tạm ngừng nhận booking'
                : 'Bật nhận booking'
            }
            variant={profile?.isAcceptingBookings ? 'secondary' : 'primary'}
            loading={updatingAccepting}
            disabled={!verified || updatingAccepting}
            onPress={handleToggleAccepting}
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>Hôm nay</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.waiting}</Text>
            <Text style={styles.statLabel}>Chờ nhận</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Đang làm</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking sắp tới</Text>
          <Text style={styles.link} onPress={() => router.push('/(tabs)/bookings')}>
            Xem tất cả
          </Text>
        </View>

        {upcoming.length ? (
          <View style={styles.bookingList}>
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có booking sắp tới</Text>
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
  flex: {
    flex: 1,
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
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
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
  bookingList: {
    gap: 12,
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
