import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
};

const getActions = (status: BookingStatus): Action[] => {
  switch (status) {
    case 'waiting_therapist_accept':
      return [
        {
          title: 'Nhận booking',
          status: 'confirmed',
        },
        {
          title: 'Từ chối',
          status: 'rejected',
          variant: 'danger',
          confirm: 'Bạn chắc chắn muốn từ chối booking này?',
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

  const load = useCallback(async () => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) return;

    setLoading(true);
    setError(null);

    try {
      setBooking(await getTherapistBookingAPI(bookingId));
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

  const performAction = async (action: Action) => {
    setUpdatingStatus(action.status);
    setError(null);

    try {
      const next = await updateTherapistBookingStatusAPI(
        bookingId,
        action.status,
        action.status === 'rejected'
          ? 'Kỹ thuật viên từ chối booking'
          : action.status === 'cancelled_by_therapist'
            ? 'Kỹ thuật viên hủy booking'
            : undefined,
      );

      setBooking(next);
    } catch (actionError) {
      setError(getApiErrorMessage(actionError));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAction = (action: Action) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.code}>{booking.bookingCode}</Text>
              <Text style={styles.service}>{booking.serviceName}</Text>
            </View>

            <BookingStatusBadge status={booking.status} />
          </View>

          <Text style={styles.schedule}>{formatDateTime(booking.scheduledAt)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Khách hàng</Text>
          <Text style={styles.value}>
            {booking.client?.user?.fullName || 'Khách hàng'}
          </Text>
          <Text style={styles.muted}>{booking.client?.user?.phone || ''}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Địa điểm</Text>
          <Text style={styles.value}>{booking.address}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dịch vụ</Text>
          <View style={styles.row}>
            <Text style={styles.muted}>Thời lượng</Text>
            <Text style={styles.valueSmall}>{booking.durationMinutes} phút</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Giá dịch vụ</Text>
            <Text style={styles.valueSmall}>
              {formatCurrency(booking.servicePrice)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Tổng tiền</Text>
            <Text style={styles.valueSmall}>
              {formatCurrency(booking.totalAmount)}
            </Text>
          </View>
        </View>

        {booking.clientNote ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú của khách</Text>
            <Text style={styles.value}>{booking.clientNote}</Text>
          </View>
        ) : null}

        {booking.cancellationReason ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lý do hủy / từ chối</Text>
            <Text style={styles.value}>{booking.cancellationReason}</Text>
          </View>
        ) : null}

        {booking.statusHistories?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lịch sử trạng thái</Text>

            {booking.statusHistories
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              )
              .map((history) => (
                <View key={history.id} style={styles.historyItem}>
                  <BookingStatusBadge status={history.toStatus} />
                  <Text style={styles.historyTime}>
                    {formatDateTime(history.createdAt)}
                  </Text>
                  {history.reason ? (
                    <Text style={styles.historyReason}>{history.reason}</Text>
                  ) : null}
                </View>
              ))}
          </View>
        ) : null}

        {actions.length ? (
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
    gap: 9,
  },
  cardTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  value: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  valueSmall: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  muted: {
    color: APP_COLOR.MUTED,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLOR.BORDER,
    gap: 6,
  },
  historyTime: {
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  historyReason: {
    color: APP_COLOR.TEXT,
    fontSize: 13,
  },
  actions: {
    marginTop: 4,
    gap: 10,
  },
});

export default BookingDetailPage;
