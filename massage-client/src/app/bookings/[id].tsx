import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import ScreenHeader from '@/components/common/ScreenHeader';
import RatingEditor from '@/components/ratings/RatingEditor';
import AppButton from '@/components/ui/AppButton';
import type { Booking, Rating } from '@/types';
import {
  cancelClientBookingAPI,
  createRatingAPI,
  getClientBookingAPI,
  getMyRatingByBookingAPI,
  updateRatingAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { canClientCancelBooking, canClientRateBooking } from '@/utils/booking-ui';
import { APP_COLOR } from '@/utils/constant';
import {
  firstRouteParam,
  formatCurrency,
  formatDateTime,
  formatDuration,
} from '@/utils/helpers';

const DetailRow = ({ icon, label, value }: { icon: any; label: string; value?: string | null }) => {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={APP_COLOR.PRIMARY} />
      </View>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
};

const BookingDetailPage = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const bookingId = Number(firstRouteParam(params.id));

  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setError('Mã booking không hợp lệ.');
      setLoading(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const bookingData = await getClientBookingAPI(bookingId);
      setBooking(bookingData);

      if (canClientRateBooking(bookingData.status)) {
        setRating(await getMyRatingByBookingAPI(bookingId));
      } else {
        setRating(null);
      }
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải chi tiết booking.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmCancel = () => {
    if (!booking || !canClientCancelBooking(booking.status)) return;

    Alert.alert(
      'Hủy booking?',
      'Bạn có chắc muốn hủy lịch hẹn này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy booking',
          style: 'destructive',
          onPress: () => void handleCancel(),
        },
      ],
    );
  };

  const handleCancel = async () => {
    if (!booking) return;

    setCanceling(true);
    try {
      await cancelClientBookingAPI(booking.id);
      await load(true);
      Alert.alert('Đã hủy booking', 'Trạng thái booking đã được cập nhật.');
    } catch (error) {
      Alert.alert('Không thể hủy booking', getApiErrorMessage(error));
    } finally {
      setCanceling(false);
    }
  };

  const handleRatingSubmit = async (payload: { rating: number; comment: string }) => {
    if (!booking || !canClientRateBooking(booking.status)) return;

    setSavingRating(true);
    try {
      const saved = rating
        ? await updateRatingAPI(rating.id, payload)
        : await createRatingAPI({
            bookingId: booking.id,
            rating: payload.rating,
            comment: payload.comment || undefined,
          });

      setRating(saved);
      Alert.alert('Thành công', rating ? 'Đã cập nhật đánh giá.' : 'Cảm ơn bạn đã đánh giá.');
    } catch (error) {
      Alert.alert('Không thể lưu đánh giá', getApiErrorMessage(error));
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Chi tiết booking" back />
        <LoadingState message="Đang tải booking..." />
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Chi tiết booking" back />
        <View style={styles.stateWrap}>
          <EmptyState title="Không thể tải booking" description={error || 'Booking không tồn tại.'} />
          <AppButton title="Thử lại" onPress={() => void load()} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  const therapistName =
    booking.therapist?.user?.fullName ||
    (booking.therapistId ? `Kỹ thuật viên #${booking.therapistId}` : 'Chưa có kỹ thuật viên');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Chi tiết booking" back />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={APP_COLOR.PRIMARY}
          />
        }
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.codeLabel}>MÃ BOOKING</Text>
              <Text style={styles.code}>{booking.bookingCode || `#${booking.id}`}</Text>
            </View>
            <BookingStatusBadge status={booking.status} />
          </View>

          <Text style={styles.serviceName}>{booking.serviceName || 'Dịch vụ massage'}</Text>
          <Text style={styles.amount}>{formatCurrency(booking.totalAmount)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>

          <DetailRow
            icon="calendar-outline"
            label="Thời gian bắt đầu"
            value={formatDateTime(booking.scheduledAt)}
          />
          <DetailRow
            icon="time-outline"
            label="Thời lượng"
            value={formatDuration(booking.durationMinutes)}
          />
          <DetailRow icon="person-outline" label="Kỹ thuật viên" value={therapistName} />
          <DetailRow
            icon="call-outline"
            label="Điện thoại KTV"
            value={booking.therapist?.user?.phone}
          />
          <DetailRow icon="location-outline" label="Địa điểm" value={booking.address} />
          <DetailRow icon="document-text-outline" label="Ghi chú" value={booking.clientNote} />
          <DetailRow
            icon="close-circle-outline"
            label="Lý do hủy"
            value={booking.cancellationReason}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi phí</Text>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Giá dịch vụ</Text>
            <Text style={styles.moneyValue}>{formatCurrency(booking.servicePrice)}</Text>
          </View>
          {booking.platformFee !== undefined && (
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Phí nền tảng</Text>
              <Text style={styles.moneyValue}>{formatCurrency(booking.platformFee)}</Text>
            </View>
          )}
          {booking.taxAmount !== undefined && (
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Thuế</Text>
              <Text style={styles.moneyValue}>{formatCurrency(booking.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.moneyRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.totalAmount)}</Text>
          </View>
        </View>

        {canClientCancelBooking(booking.status) && (
          <AppButton
            title="Hủy booking"
            variant="danger"
            loading={canceling}
            onPress={confirmCancel}
            icon={<Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />}
            style={styles.cancelButton}
          />
        )}

        {canClientRateBooking(booking.status) && (
          <RatingEditor
            value={rating}
            saving={savingRating}
            onSubmit={payload => void handleRatingSubmit(payload)}
          />
        )}

        <TouchableOpacity style={styles.refreshLink} onPress={() => void load(true)}>
          <Ionicons name="refresh" size={18} color={APP_COLOR.PRIMARY} />
          <Text style={styles.refreshText}>Cập nhật trạng thái</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingBottom: 34 },
  stateWrap: { flex: 1, padding: 20 },
  retryButton: { marginTop: 14 },
  heroCard: {
    padding: 17, borderRadius: 20, borderWidth: 1, borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  codeLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  code: { marginTop: 3, color: APP_COLOR.TEXT, fontSize: 17, fontWeight: '900' },
  serviceName: { marginTop: 17, color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900' },
  amount: { marginTop: 6, color: APP_COLOR.PRIMARY, fontSize: 18, fontWeight: '900' },
  card: {
    marginTop: 13, padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  sectionTitle: { marginBottom: 4, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: APP_COLOR.BORDER,
  },
  detailIcon: {
    width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  detailBody: { flex: 1 },
  detailLabel: { color: APP_COLOR.MUTED, fontSize: 11, fontWeight: '700' },
  detailValue: { marginTop: 3, color: APP_COLOR.TEXT, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  moneyLabel: { color: APP_COLOR.MUTED, fontSize: 13 },
  moneyValue: { color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '800' },
  totalRow: { marginTop: 5, paddingTop: 13, borderTopWidth: 1, borderTopColor: APP_COLOR.BORDER },
  totalLabel: { color: APP_COLOR.TEXT, fontSize: 15, fontWeight: '900' },
  totalValue: { color: APP_COLOR.PRIMARY, fontSize: 16, fontWeight: '900' },
  cancelButton: { marginTop: 14 },
  refreshLink: {
    flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6,
    marginTop: 18, paddingVertical: 10, paddingHorizontal: 14,
  },
  refreshText: { color: APP_COLOR.PRIMARY, fontSize: 13, fontWeight: '800' },
});

export default BookingDetailPage;
