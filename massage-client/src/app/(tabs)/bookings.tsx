import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import type { Booking } from '@/types';
import { getClientBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

const BookingsPage = () => {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getClientBookingsAPI();
      setItems(
        [...data].sort((a, b) => {
          const aTime = new Date(a.scheduledAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.scheduledAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        }),
      );
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải danh sách booking.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn</Text>
        <Text style={styles.subtitle}>
          Theo dõi trạng thái, địa điểm và đánh giá các booking của bạn.
        </Text>
      </View>

      {loading ? (
        <LoadingState message="Đang tải lịch hẹn..." />
      ) : error && !items.length ? (
        <View style={styles.stateWrap}>
          <EmptyState title="Không thể tải booking" description={error} />
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={APP_COLOR.PRIMARY}
            />
          }
          ListHeaderComponent={
            error ? <Text style={styles.inlineError}>{error}</Text> : null
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có lịch hẹn"
              description="Booking mới sẽ xuất hiện tại đây sau khi bạn đặt dịch vụ."
            />
          }
          renderItem={({ item }) => {
            const therapistName =
              item.therapist?.user?.fullName ||
              (item.therapistId ? `Kỹ thuật viên #${item.therapistId}` : 'Đang chờ KTV');

            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => pushRoute(`/bookings/${item.id}`)}
                style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.codeWrap}>
                    <Text style={styles.codeLabel}>BOOKING</Text>
                    <Text style={styles.codeValue}>{item.bookingCode || `#${item.id}`}</Text>
                  </View>
                  <BookingStatusBadge status={item.status} />
                </View>

                <Text style={styles.service}>{item.serviceName || 'Dịch vụ massage'}</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={17} color={APP_COLOR.MUTED} />
                  <Text numberOfLines={1} style={styles.infoText}>{therapistName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={17} color={APP_COLOR.MUTED} />
                  <Text style={styles.infoText}>{formatDateTime(item.scheduledAt)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={17} color={APP_COLOR.MUTED} />
                  <Text numberOfLines={2} style={styles.infoText}>{item.address}</Text>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
                  <View style={styles.detailLink}>
                    <Text style={styles.detailText}>Chi tiết</Text>
                    <Ionicons name="chevron-forward" size={17} color={APP_COLOR.PRIMARY} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  title: { color: APP_COLOR.TEXT, fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 6, color: APP_COLOR.MUTED, fontSize: 14, lineHeight: 20 },
  stateWrap: { flex: 1, padding: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  inlineError: {
    marginBottom: 11, padding: 11, borderRadius: 12, backgroundColor: '#FEF2F2',
    color: APP_COLOR.DANGER, fontSize: 12,
  },
  card: {
    marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  codeWrap: { flex: 1 },
  codeLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  codeValue: { marginTop: 2, color: APP_COLOR.TEXT, fontSize: 14, fontWeight: '900' },
  service: { marginTop: 14, marginBottom: 10, color: APP_COLOR.TEXT, fontSize: 17, fontWeight: '900' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 7 },
  infoText: { flex: 1, color: APP_COLOR.MUTED, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: APP_COLOR.BORDER,
  },
  amount: { color: APP_COLOR.PRIMARY, fontSize: 16, fontWeight: '900' },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailText: { color: APP_COLOR.PRIMARY, fontSize: 13, fontWeight: '800' },
  retryButton: {
    alignSelf: 'center', marginTop: 14, paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, backgroundColor: APP_COLOR.PRIMARY,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});

export default BookingsPage;
