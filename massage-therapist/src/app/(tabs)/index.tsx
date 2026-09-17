import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import LoadingState from '@/components/common/LoadingState';
import { useUserStore } from '@/store/useUserStore';
import type { TherapistBooking, TherapistSelfProfile } from '@/types';
import { getTherapistBookingsAPI, getTherapistSelfAPI, updateAcceptingBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatDateTime } from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

const DashboardPage = () => {
  const user = useUserStore(state => state.user);
  const [profile, setProfile] = useState<TherapistSelfProfile | null>(null);
  const [bookings, setBookings] = useState<TherapistBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [profileData, bookingData] = await Promise.all([getTherapistSelfAPI(), getTherapistBookingsAPI()]);
      setProfile(profileData);
      setBookings(bookingData);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không thể tải tổng quan.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pending = bookings.filter(item => item.status === 'waiting_therapist_accept').length;
  const active = bookings.filter(item => ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress'].includes(item.status)).length;
  const completed = bookings.filter(item => item.status === 'completed').length;
  const nextBooking = useMemo(() => bookings
    .filter(item => !['completed', 'rejected', 'cancelled', 'expired'].includes(item.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0], [bookings]);

  const toggleAccepting = async (value: boolean) => {
    if (!profile || changing) return;
    if (profile.verificationStatus !== 'verified' && value) {
      setError('KTV cần được xác minh trước khi bật nhận booking.');
      return;
    }
    setChanging(true);
    setError('');
    try {
      const updated = await updateAcceptingBookingsAPI(value);
      setProfile(current => ({ ...(current ?? updated), ...updated, isAcceptingBookings: value }));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={APP_COLOR.PRIMARY} />}>
        <View style={styles.topBar}>
          <View><Text style={styles.greeting}>Xin chào</Text><Text style={styles.name}>{profile?.fullName ?? user?.fullName ?? 'Kỹ thuật viên'}</Text></View>
          <View style={styles.avatar}><Ionicons name="medical" size={22} color={APP_COLOR.PRIMARY_DARK} /></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View><Text style={styles.heroBadge}>TRẠNG THÁI HOẠT ĐỘNG</Text><Text style={styles.heroTitle}>{profile?.isAcceptingBookings ? 'Đang nhận booking' : 'Đang tạm nghỉ'}</Text></View>
            <Switch value={Boolean(profile?.isAcceptingBookings)} onValueChange={value => void toggleAccepting(value)} disabled={changing} trackColor={{ true: '#5EEAD4', false: '#CBD5E1' }} thumbColor="#fff" />
          </View>
          <Text style={styles.heroText}>Xác minh: {profile?.verificationStatus === 'verified' ? 'Đã xác minh' : profile?.verificationStatus === 'rejected' ? 'Bị từ chối' : 'Đang chờ'}</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{pending}</Text><Text style={styles.statLabel}>Chờ nhận</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{active}</Text><Text style={styles.statLabel}>Đang xử lý</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{completed}</Text><Text style={styles.statLabel}>Hoàn thành</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Booking tiếp theo</Text>
        {nextBooking ? (
          <TouchableOpacity style={styles.bookingCard} onPress={() => pushRoute(`/bookings/${nextBooking.id}`)} activeOpacity={0.86}>
            <View style={styles.rowBetween}><Text style={styles.bookingTitle}>{nextBooking.serviceName ?? nextBooking.serviceOption?.name ?? 'Dịch vụ massage'}</Text><BookingStatusBadge status={nextBooking.status} /></View>
            <Text style={styles.bookingMeta}>{formatDateTime(nextBooking.scheduledAt)}</Text>
            {!!nextBooking.address && <Text style={styles.bookingAddress} numberOfLines={2}>{nextBooking.address}</Text>}
            <Text style={styles.link}>Xem booking →</Text>
          </TouchableOpacity>
        ) : <View style={styles.emptyCard}><Text style={styles.emptyText}>Chưa có booking sắp tới.</Text></View>}

        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quick} onPress={() => pushRoute('/(tabs)/schedule')}><Ionicons name="time-outline" size={24} color={APP_COLOR.PRIMARY} /><Text style={styles.quickText}>Lịch làm việc</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quick} onPress={() => pushRoute('/(tabs)/services')}><Ionicons name="list-outline" size={24} color={APP_COLOR.PRIMARY} /><Text style={styles.quickText}>Dịch vụ</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingBottom: 110 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  greeting: { color: APP_COLOR.MUTED, fontSize: 13 },
  name: { color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: APP_COLOR.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: APP_COLOR.PRIMARY, borderRadius: 24, padding: 20, marginTop: 8 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, alignItems: 'center' },
  heroBadge: { color: '#A7F3D0', fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 7 },
  heroText: { color: '#D1FAE5', marginTop: 12, fontWeight: '700' },
  error: { color: '#FECACA', marginTop: 10, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: APP_COLOR.BORDER },
  statValue: { color: APP_COLOR.TEXT, fontSize: 22, fontWeight: '900' },
  statLabel: { color: APP_COLOR.MUTED, marginTop: 4, fontSize: 12 },
  sectionTitle: { color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900', marginTop: 24, marginBottom: 12 },
  bookingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: APP_COLOR.BORDER },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  bookingTitle: { flex: 1, color: APP_COLOR.TEXT, fontWeight: '800', fontSize: 16 },
  bookingMeta: { color: APP_COLOR.PRIMARY, fontWeight: '700', marginTop: 10 },
  bookingAddress: { color: APP_COLOR.MUTED, marginTop: 6, lineHeight: 19 },
  link: { color: APP_COLOR.PRIMARY, fontWeight: '800', marginTop: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: APP_COLOR.BORDER },
  emptyText: { color: APP_COLOR.MUTED },
  quickRow: { flexDirection: 'row', gap: 12 },
  quick: { flex: 1, minHeight: 92, backgroundColor: '#fff', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: APP_COLOR.BORDER },
  quickText: { color: APP_COLOR.TEXT, fontWeight: '800', marginTop: 10 },
});

export default DashboardPage;
