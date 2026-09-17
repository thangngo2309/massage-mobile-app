import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import type { BookingStatus, TherapistBooking } from '@/types';
import { getTherapistBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime, getClientName } from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

type Filter = 'all' | 'pending' | 'active' | 'completed';

const BookingsPage = () => {
  const [items, setItems] = useState<TherapistBooking[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setItems(await getTherapistBookingsAPI()); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể tải booking.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => items.filter(item => {
    if (filter === 'pending') return item.status === 'waiting_therapist_accept';
    if (filter === 'active') return ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress'].includes(item.status);
    if (filter === 'completed') return item.status === 'completed';
    return true;
  }), [items, filter]);

  if (loading) return <SafeAreaView style={styles.container}><LoadingState label="Đang tải booking..." /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Booking của tôi</Text><Text style={styles.subtitle}>Nhận booking và cập nhật trạng thái theo quy trình phục vụ.</Text></View>
      <View style={styles.filters}>
        {([['all','Tất cả'],['pending','Chờ nhận'],['active','Đang làm'],['completed','Hoàn thành']] as [Filter,string][]).map(([value,label]) => (
          <TouchableOpacity key={value} style={[styles.chip, filter === value && styles.chipActive]} onPress={() => setFilter(value)}><Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{label}</Text></TouchableOpacity>
        ))}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={APP_COLOR.PRIMARY} />}
        ListEmptyComponent={<EmptyState title="Chưa có booking" description="Booking phù hợp sẽ hiển thị tại đây." />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => pushRoute(`/bookings/${item.id}`)}>
            <View style={styles.row}><Text style={styles.cardTitle}>{item.serviceName ?? item.serviceOption?.name ?? 'Dịch vụ massage'}</Text><BookingStatusBadge status={item.status as BookingStatus} /></View>
            <Text style={styles.time}>{formatDateTime(item.scheduledAt)}</Text>
            <Text style={styles.meta}>Khách: {getClientName(item)}</Text>
            {!!item.address && <Text style={styles.address} numberOfLines={2}>{item.address}</Text>}
            <View style={styles.footer}><Text style={styles.price}>{formatCurrency(item.totalAmount ?? item.servicePrice)}</Text><Text style={styles.link}>Xem chi tiết →</Text></View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  title: { color: APP_COLOR.TEXT, fontSize: 26, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 20, marginTop: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: APP_COLOR.BORDER },
  chipActive: { backgroundColor: APP_COLOR.PRIMARY },
  chipText: { color: APP_COLOR.MUTED, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  error: { color: APP_COLOR.DANGER, paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 110 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: APP_COLOR.BORDER, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '800' },
  time: { color: APP_COLOR.PRIMARY, marginTop: 10, fontWeight: '700' },
  meta: { color: APP_COLOR.TEXT, marginTop: 8, fontWeight: '600' },
  address: { color: APP_COLOR.MUTED, marginTop: 5, lineHeight: 19 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  price: { color: APP_COLOR.TEXT, fontWeight: '900' },
  link: { color: APP_COLOR.PRIMARY, fontWeight: '800', fontSize: 12 },
});

export default BookingsPage;
