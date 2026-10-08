import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { AppButton } from '@/components/ui/AppButton';
import type { Booking, BookingStatus } from '@/types';
import {
  getTherapistBookingAPI,
  updateTherapistBookingStatusAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime } from '@/utils/helpers';

type Action = {
  title: string;
  status: BookingStatus;
  variant?: 'primary' | 'secondary' | 'danger';
  confirm?: string;
  requiresReason?: boolean;
};

const getActions = (status: BookingStatus): Action[] => {
  switch (status) {
    case 'waiting_therapist_accept':
      return [
        {
          title: 'Xác nhận booking',
          status: 'confirmed',
        },
        {
          title: 'Từ chối',
          status: 'rejected',
          variant: 'danger',
          requiresReason: true,
        },
      ];

    case 'confirmed':
      return [
        {
          title: 'Bắt đầu di chuyển',
          status: 'therapist_on_the_way',
        },
        {
          title: 'Hủy booking',
          status: 'cancelled_by_therapist',
          variant: 'danger',
          confirm: 'Bạn chắc chắn muốn hủy booking này?',
        },
      ];

    case 'therapist_on_the_way':
      return [
        {
          title: 'Đã đến nơi',
          status: 'arrived',
        },
        {
          title: 'Hủy booking',
          status: 'cancelled_by_therapist',
          variant: 'danger',
          confirm: 'Bạn chắc chắn muốn hủy booking này?',
        },
      ];

    case 'arrived':
      return [
        {
          title: 'Bắt đầu dịch vụ',
          status: 'in_progress',
        },
        {
          title: 'Hủy booking',
          status: 'cancelled_by_therapist',
          variant: 'danger',
          confirm: 'Bạn chắc chắn muốn hủy booking này?',
        },
      ];

    case 'in_progress':
      return [
        {
          title: 'Hoàn thành',
          status: 'completed',
        },
      ];

    default:
      return [];
  }
};

const BookingDetailPage = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const bookingId = Number(params.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<BookingStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setBooking(null);
      setLoading(false);
      setError('Booking không hợp lệ.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTherapistBookingAPI(bookingId);
      setBooking(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const actions = useMemo(
    () => (booking ? getActions(booking.status) : []),
    [booking],
  );

  const performAction = async (action: Action, reason?: string) => {
    if (updatingStatus) {
      return;
    }

    setUpdatingStatus(action.status);
    setError(null);

    try {
      const actionReason =
        action.status === 'rejected'
          ? reason?.trim()
          : action.status === 'cancelled_by_therapist'
            ? 'Kỹ thuật viên hủy booking'
            : undefined;

      const next = await updateTherapistBookingStatusAPI(
        bookingId,
        action.status,
        actionReason,
      );

      setBooking(next);
      setRejecting(false);
      setRejectionReason('');
    } catch (actionError) {
      setError(getApiErrorMessage(actionError));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAction = (action: Action) => {
    if (action.requiresReason) {
      setRejecting(true);
      setRejectionReason('');
      setError(null);
      return;
    }

    if (!action.confirm) {
      void performAction(action);
      return;
    }

    Alert.alert('Xác nhận', action.confirm, [
      {
        text: 'Không',
        style: 'cancel',
      },
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: () => void performAction(action),
      },
    ]);
  };

  const confirmReject = () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      setError('Vui lòng nhập lý do từ chối booking.');
      return;
    }

    const action = actions.find((item) => item.status === 'rejected');

    if (!action) {
      return;
    }

    void performAction(action, reason);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={APP_COLOR.DANGER}
          />

          <Text style={styles.error}>{error || 'Không tìm thấy booking'}</Text>

          <AppButton
            title="Quay lại"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const clientName =
    booking.client?.fullName ||
    booking.client?.user?.fullName ||
    'Khách hàng';

  const clientPhone =
    booking.client?.phone || booking.client?.user?.phone || '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.flex}>
              <Text style={styles.code}>
                {booking.bookingCode || `Booking #${booking.id}`}
              </Text>

              <Text style={styles.service}>{booking.serviceName}</Text>
            </View>

            <BookingStatusBadge status={booking.status} />
          </View>

          <Text style={styles.schedule}>
            {formatDateTime(booking.scheduledAt)}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin khách hàng</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Khách hàng</Text>
              <Text style={styles.value}>{clientName}</Text>
            </View>
          </View>

          {clientPhone ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="call-outline"
                size={19}
                color={APP_COLOR.PRIMARY}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.value}>{clientPhone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin lịch hẹn</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.value}>
                {formatDateTime(booking.scheduledAt)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời lượng</Text>
              <Text style={styles.value}>{booking.durationMinutes} phút</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ phục vụ</Text>
              <Text style={styles.value}>{booking.address}</Text>
            </View>
          </View>

          {booking.clientNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.infoLabel}>Ghi chú của khách</Text>
              <Text style={styles.noteText}>{booking.clientNote}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dịch vụ</Text>

          <Text style={styles.serviceName}>{booking.serviceName}</Text>

          <View style={styles.priceBox}>
            <View style={styles.row}>
              <Text style={styles.muted}>Thời lượng</Text>
              <Text style={styles.valueSmall}>{booking.durationMinutes} phút</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.muted}>Giá dịch vụ</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(booking.servicePrice)}
              </Text>
            </View>
          </View>
        </View>

        {booking.cancellationReason ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lý do hủy / từ chối</Text>
            <Text style={styles.value}>{booking.cancellationReason}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiến trình</Text>

          {booking.statusHistories?.length ? (
            booking.statusHistories
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              )
              .map((history, index, histories) => {
                const historyNote = history.note || history.reason || null;
                const last = index === histories.length - 1;

                return (
                  <View key={history.id} style={styles.timelineItem}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot}>
                        <Ionicons name="checkmark" size={15} color={APP_COLOR.PRIMARY} />
                      </View>

                      {!last ? <View style={styles.timelineLine} /> : null}
                    </View>

                    <View style={[styles.timelineContent, !last && styles.timelineSpacing]}>
                      <BookingStatusBadge status={history.toStatus} />

                      <Text style={styles.historyTime}>
                        {formatDateTime(history.createdAt)}
                      </Text>

                      {historyNote ? (
                        <Text style={styles.historyReason}>{historyNote}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
          ) : (
            <Text style={styles.muted}>Chưa có lịch sử trạng thái.</Text>
          )}
        </View>

        {rejecting ? (
          <View style={styles.rejectCard}>
            <Text style={styles.rejectTitle}>Lý do từ chối</Text>

            <Text style={styles.rejectDescription}>
              Vui lòng nhập lý do để khách hàng biết vì sao booking không được
              nhận.
            </Text>

            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              maxLength={500}
              placeholder="Nhập lý do..."
              placeholderTextColor="#94A3B8"
              style={styles.rejectInput}
            />

            <View style={styles.rejectActions}>
              <AppButton
                title="Xác nhận từ chối"
                variant="danger"
                loading={updatingStatus === 'rejected'}
                disabled={Boolean(updatingStatus) || !rejectionReason.trim()}
                onPress={confirmReject}
              />

              <AppButton
                title="Hủy"
                variant="secondary"
                disabled={Boolean(updatingStatus)}
                onPress={() => {
                  setRejecting(false);
                  setRejectionReason('');
                  setError(null);
                }}
              />
            </View>
          </View>
        ) : actions.length ? (
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>Thao tác</Text>

            <View style={styles.actions}>
              {actions.map((action) => (
                <AppButton
                  key={action.status}
                  title={action.title}
                  variant={action.variant || 'primary'}
                  loading={updatingStatus === action.status}
                  disabled={Boolean(updatingStatus)}
                  onPress={() => handleAction(action)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  hero: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: APP_COLOR.PRIMARY,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  code: {
    color: '#99F6E4',
    fontSize: 12,
    fontWeight: '900',
  },
  service: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  schedule: {
    color: '#CCFBF1',
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 13,
  },
  actionCard: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  cardTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  value: {
    marginTop: 3,
    color: APP_COLOR.TEXT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  valueSmall: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  serviceName: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '800',
  },
  muted: {
    color: APP_COLOR.MUTED,
    fontSize: 14,
  },
  noteBox: {
    marginTop: 2,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP_COLOR.BORDER,
  },
  noteText: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
  priceBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    gap: 11,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceValue: {
    color: APP_COLOR.PRIMARY,
    fontSize: 16,
    fontWeight: '900',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 11,
  },
  timelineRail: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 32,
    backgroundColor: APP_COLOR.BORDER,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineSpacing: {
    paddingBottom: 18,
  },
  historyTime: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  historyReason: {
    marginTop: 5,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    marginTop: 14,
    gap: 10,
  },
  rejectCard: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectTitle: {
    color: '#991B1B',
    fontSize: 17,
    fontWeight: '900',
  },
  rejectDescription: {
    marginTop: 6,
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
  },
  rejectInput: {
    minHeight: 100,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    color: APP_COLOR.TEXT,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  rejectActions: {
    marginTop: 14,
    gap: 10,
  },
});

export default BookingDetailPage;
