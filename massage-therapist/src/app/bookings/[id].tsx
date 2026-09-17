import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import LoadingState from '@/components/common/LoadingState';
import AppButton from '@/components/ui/AppButton';
import type { TherapistBooking } from '@/types';
import { getTherapistBookingAPI, updateTherapistBookingStatusAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { canRejectBooking, getNextTherapistAction } from '@/utils/booking-ui';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime, getClientName, getClientPhone } from '@/utils/helpers';
import { replaceRoute } from '@/utils/navigation';

const BookingDetailPage = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const [booking, setBooking] = useState<TherapistBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) { setError('Booking không hợp lệ.'); setLoading(false); return; }
    setError('');
    try { setBooking(await getTherapistBookingAPI(id)); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể tải booking.')); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (status: TherapistBooking['status']) => {
    if (!booking || updating) return;
    setUpdating(true); setError('');
    try { setBooking(await updateTherapistBookingStatusAPI(booking.id, status)); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể cập nhật trạng thái.')); }
    finally { setUpdating(false); }
  };

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;
  if (!booking) return <SafeAreaView style={styles.container}><View style={styles.fallback}><Text style={styles.error}>{error || 'Không tìm thấy booking.'}</Text></View></SafeAreaView>;

  const next = getNextTherapistAction(booking.status);
  const phone = getClientPhone(booking);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => replaceRoute('/(tabs)/bookings')} style={styles.back}><Ionicons name="arrow-back" size={22} color={APP_COLOR.TEXT} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết booking</Text><View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.rowBetween}><Text style={styles.service}>{booking.serviceName ?? booking.serviceOption?.name ?? 'Dịch vụ massage'}</Text><BookingStatusBadge status={booking.status} /></View>
          <Text style={styles.time}>{formatDateTime(booking.scheduledAt)}</Text>
          {!!booking.durationMinutes && <Text style={styles.meta}>{booking.durationMinutes} phút</Text>}
        </View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Khách hàng</Text><Text style={styles.value}>{getClientName(booking)}</Text>{!!phone && <Text style={styles.meta}>{phone}</Text>}</View>
        <View style={styles.card}><Text style={styles.sectionTitle}>Địa điểm</Text><Text style={styles.value}>{booking.address || 'Chưa có địa chỉ'}</Text>{!!booking.clientNote && <><Text style={styles.noteLabel}>Ghi chú khách hàng</Text><Text style={styles.meta}>{booking.clientNote}</Text></>}</View>
        <View style={styles.card}><Text style={styles.sectionTitle}>Chi phí</Text><View style={styles.line}><Text style={styles.meta}>Giá dịch vụ</Text><Text style={styles.value}>{formatCurrency(booking.servicePrice)}</Text></View><View style={styles.line}><Text style={styles.meta}>Tổng booking</Text><Text style={styles.total}>{formatCurrency(booking.totalAmount ?? booking.servicePrice)}</Text></View></View>
        {!!booking.cancellationReason && <View style={styles.card}><Text style={styles.sectionTitle}>Lý do hủy/từ chối</Text><Text style={styles.meta}>{booking.cancellationReason}</Text></View>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {next && <AppButton title={next.label} loading={updating} onPress={() => Alert.alert('Xác nhận', `Bạn muốn ${next.label.toLowerCase()}?`, [{ text: 'Không', style: 'cancel' }, { text: 'Xác nhận', onPress: () => void changeStatus(next.status) }])} />}
        {canRejectBooking(booking.status) && <AppButton title="Từ chối booking" variant="danger" disabled={updating} style={styles.actionGap} onPress={() => Alert.alert('Từ chối booking', 'Bạn chắc chắn muốn từ chối booking này?', [{ text: 'Không', style: 'cancel' }, { text: 'Từ chối', style: 'destructive', onPress: () => void changeStatus('rejected') }])} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: APP_COLOR.BORDER, backgroundColor: '#fff' },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: APP_COLOR.TEXT, fontWeight: '900', fontSize: 17 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: APP_COLOR.BORDER, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  service: { flex: 1, color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900' },
  time: { color: APP_COLOR.PRIMARY, fontWeight: '800', marginTop: 12 },
  sectionTitle: { color: APP_COLOR.TEXT, fontWeight: '900', marginBottom: 10 },
  value: { color: APP_COLOR.TEXT, fontWeight: '700', lineHeight: 21 },
  meta: { color: APP_COLOR.MUTED, marginTop: 5, lineHeight: 20 },
  noteLabel: { color: APP_COLOR.TEXT, fontWeight: '700', marginTop: 14 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 7 },
  total: { color: APP_COLOR.PRIMARY_DARK, fontWeight: '900', fontSize: 17 },
  error: { color: APP_COLOR.DANGER, lineHeight: 20 },
  actionGap: { marginTop: 0 },
  fallback: { padding: 24 },
});

export default BookingDetailPage;
