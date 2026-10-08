import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { useRealtimeStore } from '@/store/useRealtimeStore';
import type { Booking, BookingStatusHistory, Rating } from '@/types';
import {
  cancelClientBookingAPI,
  createRatingAPI,
  getClientBookingAPI,
  getMyRatingByBookingAPI,
  updateRatingAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import {
  canClientCancelBooking,
  canClientRateBooking,
  getBookingStatusMeta,
} from '@/utils/booking-ui';
import { APP_COLOR } from '@/utils/constant';
import {
  firstRouteParam,
  formatCurrency,
  formatDateTime,
  formatDuration,
} from '@/utils/helpers';

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) => {
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

const BookingTimeline = ({ histories }: { histories: BookingStatusHistory[] }) => {
  if (!histories.length) {
    return (
      <Text style={styles.timelineEmpty}>
        Lịch sử trạng thái sẽ xuất hiện khi booking được cập nhật.
      </Text>
    );
  }

  const sorted = [...histories].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  return (
    <View style={styles.timeline}>
      {sorted.map((history, index) => {
        const meta = getBookingStatusMeta(history.toStatus);
        const note = history.note || history.reason;
        const isLast = index === sorted.length - 1;

        return (
          <View key={history.id} style={styles.timelineItem}>
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: meta.textColor },
                ]}
              />
              {!isLast && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.timelineBody}>
              <Text style={styles.timelineTitle}>{meta.label}</Text>
              <Text style={styles.timelineDate}>
                {formatDateTime(history.createdAt)}
              </Text>

              {!!note && <Text style={styles.timelineNote}>{note}</Text>}
            </View>
          </View>
        );
      })}
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

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const bookingRevision = useRealtimeStore(state => state.bookingRevision);

  const load = useCallback(
    async (refresh = false) => {
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
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, 'Không thể tải chi tiết booking.'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (bookingRevision <= 0) return;
    void load(true);
  }, [bookingRevision, load]);

  const openCancelModal = () => {
    if (!booking || !canClientCancelBooking(booking.status)) return;

    setCancelReason('');
    setCancelError('');
    setCancelModalVisible(true);
  };

  const handleCancel = async () => {
    if (!booking) return;

    const reason = cancelReason.trim();

    if (!reason) {
      setCancelError('Vui lòng nhập lý do hủy booking.');
      return;
    }

    setCanceling(true);
    setCancelError('');

    try {
      await cancelClientBookingAPI(booking.id, reason);

      setCancelModalVisible(false);
      setCancelReason('');

      await load(true);

      Alert.alert('Đã hủy booking', 'Trạng thái booking đã được cập nhật.');
    } catch (cancelRequestError) {
      setCancelError(
        getApiErrorMessage(cancelRequestError, 'Không thể hủy booking.'),
      );
    } finally {
      setCanceling(false);
    }
  };

  const handleRatingSubmit = async (payload: {
    rating: number;
    comment: string;
  }) => {
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

      Alert.alert(
        'Thành công',
        rating ? 'Đã cập nhật đánh giá.' : 'Cảm ơn bạn đã đánh giá.',
      );
    } catch (ratingError) {
      Alert.alert(
        'Không thể lưu đánh giá',
        getApiErrorMessage(ratingError),
      );
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
          <EmptyState
            title="Không thể tải booking"
            description={error || 'Booking không tồn tại.'}
          />

          <AppButton
            title="Thử lại"
            onPress={() => void load()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const therapistName =
    booking.therapist?.fullName ||
    booking.therapist?.user?.fullName ||
    (booking.therapistId
      ? `Kỹ thuật viên #${booking.therapistId}`
      : 'Chưa có kỹ thuật viên');

  const therapistPhone =
    booking.therapist?.phone || booking.therapist?.user?.phone || null;

  const statusHistories = booking.statusHistories ?? [];

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
            <View style={styles.heroCodeWrap}>
              <Text style={styles.codeLabel}>MÃ BOOKING</Text>
              <Text style={styles.code}>
                {booking.bookingCode || `#${booking.id}`}
              </Text>
            </View>

            <BookingStatusBadge status={booking.status} />
          </View>

          <Text style={styles.serviceName}>
            {booking.serviceName || 'Dịch vụ massage'}
          </Text>
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
          <DetailRow
            icon="person-outline"
            label="Kỹ thuật viên"
            value={therapistName}
          />
          <DetailRow
            icon="call-outline"
            label="Điện thoại KTV"
            value={therapistPhone}
          />
          <DetailRow
            icon="location-outline"
            label="Địa điểm"
            value={booking.address}
          />
          <DetailRow
            icon="document-text-outline"
            label="Ghi chú"
            value={booking.clientNote}
          />
          <DetailRow
            icon="close-circle-outline"
            label="Lý do hủy / từ chối"
            value={booking.cancellationReason}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi phí</Text>

          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Giá dịch vụ</Text>
            <Text style={styles.moneyValue}>
              {formatCurrency(booking.servicePrice)}
            </Text>
          </View>

          {Number(booking.taxAmount ?? 0) > 0 && (
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Thuế</Text>
              <Text style={styles.moneyValue}>
                {formatCurrency(booking.taxAmount)}
              </Text>
            </View>
          )}

          <View style={[styles.moneyRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(booking.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tiến trình booking</Text>
          <BookingTimeline histories={statusHistories} />
        </View>

        {canClientCancelBooking(booking.status) && (
          <AppButton
            title="Hủy booking"
            variant="danger"
            loading={canceling}
            onPress={openCancelModal}
            icon={
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#FFFFFF"
              />
            }
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

        <TouchableOpacity
          style={styles.refreshLink}
          onPress={() => void load(true)}>
          <Ionicons name="refresh" size={18} color={APP_COLOR.PRIMARY} />
          <Text style={styles.refreshText}>Cập nhật trạng thái</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!canceling) setCancelModalVisible(false);
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Hủy booking</Text>
                <Text style={styles.modalSubtitle}>
                  Vui lòng cho biết lý do hủy lịch hẹn này.
                </Text>
              </View>

              <TouchableOpacity
                disabled={canceling}
                onPress={() => setCancelModalVisible(false)}
                style={styles.modalClose}>
                <Ionicons name="close" size={22} color={APP_COLOR.MUTED} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={cancelReason}
              onChangeText={value => {
                setCancelReason(value);
                setCancelError('');
              }}
              multiline
              maxLength={500}
              textAlignVertical="top"
              placeholder="Ví dụ: Tôi có việc đột xuất và không thể sử dụng dịch vụ..."
              placeholderTextColor="#94A3B8"
              style={styles.cancelReasonInput}
            />

            <Text style={styles.charCount}>{cancelReason.length}/500</Text>

            {!!cancelError && <Text style={styles.cancelError}>{cancelError}</Text>}

            <AppButton
              title="Xác nhận hủy booking"
              variant="danger"
              loading={canceling}
              disabled={!cancelReason.trim() || canceling}
              onPress={() => void handleCancel()}
              style={styles.modalConfirm}
            />

            <AppButton
              title="Giữ lại booking"
              variant="secondary"
              disabled={canceling}
              onPress={() => setCancelModalVisible(false)}
              style={styles.modalKeep}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  stateWrap: {
    flex: 1,
    padding: 20,
  },
  retryButton: {
    marginTop: 14,
  },
  heroCard: {
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroCodeWrap: {
    flex: 1,
  },
  codeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  code: {
    marginTop: 3,
    color: APP_COLOR.TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  serviceName: {
    marginTop: 17,
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  amount: {
    marginTop: 6,
    color: APP_COLOR.PRIMARY,
    fontSize: 18,
    fontWeight: '900',
  },
  card: {
    marginTop: 13,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  sectionTitle: {
    marginBottom: 4,
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLOR.BORDER,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  detailBody: {
    flex: 1,
  },
  detailLabel: {
    color: APP_COLOR.MUTED,
    fontSize: 11,
    fontWeight: '700',
  },
  detailValue: {
    marginTop: 3,
    color: APP_COLOR.TEXT,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
  },
  moneyLabel: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  moneyValue: {
    color: APP_COLOR.TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: APP_COLOR.BORDER,
  },
  totalLabel: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '900',
  },
  totalValue: {
    color: APP_COLOR.PRIMARY,
    fontSize: 16,
    fontWeight: '900',
  },
  timeline: {
    marginTop: 12,
  },
  timelineEmpty: {
    marginTop: 10,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 68,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: 999,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    backgroundColor: APP_COLOR.BORDER,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  timelineTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  timelineDate: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  timelineNote: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 14,
  },
  refreshLink: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  refreshText: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalCard: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: APP_COLOR.SURFACE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    marginTop: 5,
    maxWidth: 310,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  modalClose: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelReasonInput: {
    minHeight: 120,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: '#F8FAFC',
    color: APP_COLOR.TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    marginTop: 5,
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 11,
  },
  cancelError: {
    marginTop: 8,
    color: APP_COLOR.DANGER,
    fontSize: 12,
    lineHeight: 18,
  },
  modalConfirm: {
    marginTop: 16,
  },
  modalKeep: {
    marginTop: 10,
  },
});

export default BookingDetailPage;
