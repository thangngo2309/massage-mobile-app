import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { BookingStatus, type Booking, type ClientBookingPagination } from '@/types';
import { getClientBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

type StatusFilter = 'all' | BookingStatus;

const FILTERS: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: 'Tất cả',
    value: 'all',
  },
  {
    label: 'Chờ xác nhận',
    value: BookingStatus.WAITING_THERAPIST_ACCEPT,
  },
  {
    label: 'Đã xác nhận',
    value: BookingStatus.CONFIRMED,
  },
  {
    label: 'Đang thực hiện',
    value: BookingStatus.IN_PROGRESS,
  },
  {
    label: 'Hoàn thành',
    value: BookingStatus.COMPLETED,
  },
];

const EMPTY_PAGINATION: ClientBookingPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const BookingsPage = () => {
  const [items, setItems] = useState<Booking[]>([]);

  const [status, setStatus] = useState<StatusFilter>('all');

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<ClientBookingPagination>(EMPTY_PAGINATION);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  const bookingRevision = useRealtimeStore(state => state.bookingRevision);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const data = await getClientBookingsAPI({
          page,
          limit: 10,
          status: status === 'all' ? undefined : status,
        });

        setItems(
          [...data.items].sort((a, b) => {
            const aTime = new Date(a.scheduledAt || a.createdAt || 0).getTime();

            const bTime = new Date(b.scheduledAt || b.createdAt || 0).getTime();

            return bTime - aTime;
          }),
        );

        setPagination(data.pagination);

        if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
          setPage(data.pagination.totalPages);
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Không thể tải danh sách booking.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, status],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (bookingRevision <= 0) {
      return;
    }

    void load(true);
  }, [bookingRevision, load]);

  const resultText = useMemo(() => {
    if (!pagination.total) {
      return 'Chưa có booking';
    }

    return `${pagination.total} booking`;
  }, [pagination.total]);

  const handleFilterChange = (nextStatus: StatusFilter) => {
    if (nextStatus === status) {
      return;
    }

    setStatus(nextStatus);
    setPage(1);
  };

  const handlePrevious = () => {
    if (page <= 1 || loading || refreshing) {
      return;
    }

    setPage(current => Math.max(1, current - 1));
  };

  const handleNext = () => {
    if (loading || refreshing || pagination.totalPages <= 0 || page >= pagination.totalPages) {
      return;
    }

    setPage(current => current + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn</Text>

        <Text style={styles.subtitle}>Theo dõi các booking và trạng thái dịch vụ của bạn.</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.filterScroll}
          contentContainerStyle={styles.filters}>
          {FILTERS.map(item => {
            const active = status === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.75}
                onPress={() => handleFilterChange(item.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.resultMeta}>
        <Text style={styles.resultText}>{resultText}</Text>

        {pagination.totalPages > 1 ? (
          <Text style={styles.pageText}>
            Trang {page}/{pagination.totalPages}
          </Text>
        ) : null}
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
          ListHeaderComponent={error ? <Text style={styles.inlineError}>{error}</Text> : null}
          ListEmptyComponent={
            <EmptyState
              title="Chưa có lịch hẹn"
              description="Booking phù hợp với bộ lọc sẽ xuất hiện tại đây."
            />
          }
          ListFooterComponent={
            pagination.totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={page <= 1 || refreshing}
                  activeOpacity={0.75}
                  onPress={handlePrevious}
                  style={[
                    styles.pageButton,
                    (page <= 1 || refreshing) && styles.pageButtonDisabled,
                  ]}>
                  <Ionicons name="chevron-back" size={18} color={APP_COLOR.PRIMARY} />

                  <Text style={styles.pageButtonText}>Trước</Text>
                </TouchableOpacity>

                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>
                    {page} / {pagination.totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={page >= pagination.totalPages || refreshing}
                  activeOpacity={0.75}
                  onPress={handleNext}
                  style={[
                    styles.pageButton,
                    (page >= pagination.totalPages || refreshing) && styles.pageButtonDisabled,
                  ]}>
                  <Text style={styles.pageButtonText}>Sau</Text>

                  <Ionicons name="chevron-forward" size={18} color={APP_COLOR.PRIMARY} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const therapistName =
              item.therapist?.fullName ||
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

                  <Text numberOfLines={1} style={styles.infoText}>
                    {therapistName}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={17} color={APP_COLOR.MUTED} />

                  <Text style={styles.infoText}>{formatDateTime(item.scheduledAt)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={17} color={APP_COLOR.MUTED} />

                  <Text numberOfLines={2} style={styles.infoText}>
                    {item.address}
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },

  title: {
    color: APP_COLOR.TEXT,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 21,
  },

  /**
   * Wrapper riêng cho filter để ScrollView
   * không crop nội dung theo chiều dọc.
   */
  filterSection: {
    minHeight: 58,
    justifyContent: 'center',
  },

  filterScroll: {
    flexGrow: 0,
    minHeight: 58,
  },

  filters: {
    minHeight: 58,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,

    gap: 8,
  },

  filterChip: {
    minHeight: 42,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 16,
    paddingVertical: 8,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,

    backgroundColor: APP_COLOR.SURFACE,
  },

  filterChipActive: {
    borderColor: APP_COLOR.PRIMARY,

    backgroundColor: APP_COLOR.PRIMARY,
  },

  filterChipText: {
    color: APP_COLOR.MUTED,

    fontSize: 13,
    lineHeight: 18,

    fontWeight: '800',

    includeFontPadding: false,
  },

  filterChipTextActive: {
    color: '#FFFFFF',
  },

  resultMeta: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 16,

    paddingTop: 4,

    paddingBottom: 12,
  },

  resultText: {
    color: APP_COLOR.MUTED,

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '700',
  },

  pageText: {
    color: APP_COLOR.MUTED,

    fontSize: 12,

    lineHeight: 18,
  },

  stateWrap: {
    flex: 1,

    padding: 20,
  },

  list: {
    paddingHorizontal: 16,

    paddingBottom: 110,
  },

  inlineError: {
    marginBottom: 11,

    padding: 11,

    borderRadius: 12,

    backgroundColor: '#FEF2F2',

    color: APP_COLOR.DANGER,

    fontSize: 12,
  },

  card: {
    marginBottom: 12,

    padding: 16,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: APP_COLOR.BORDER,

    backgroundColor: APP_COLOR.SURFACE,
  },

  cardTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    gap: 10,
  },

  codeWrap: {
    flex: 1,
  },

  codeLabel: {
    color: '#94A3B8',

    fontSize: 10,

    lineHeight: 14,

    fontWeight: '800',

    letterSpacing: 1,
  },

  codeValue: {
    marginTop: 2,

    color: APP_COLOR.TEXT,

    fontSize: 14,

    lineHeight: 20,

    fontWeight: '900',
  },

  service: {
    marginTop: 14,

    marginBottom: 10,

    color: APP_COLOR.TEXT,

    fontSize: 17,

    lineHeight: 23,

    fontWeight: '900',
  },

  infoRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    marginTop: 7,
  },

  infoText: {
    flex: 1,

    color: APP_COLOR.MUTED,

    fontSize: 13,

    lineHeight: 19,
  },

  footer: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginTop: 14,

    paddingTop: 12,

    borderTopWidth: 1,

    borderTopColor: APP_COLOR.BORDER,
  },

  amount: {
    color: APP_COLOR.PRIMARY,

    fontSize: 16,

    lineHeight: 22,

    fontWeight: '900',
  },

  detailLink: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 2,
  },

  detailText: {
    color: APP_COLOR.PRIMARY,

    fontSize: 13,

    lineHeight: 19,

    fontWeight: '800',
  },

  pagination: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 10,

    paddingTop: 12,

    paddingBottom: 8,
  },

  pageButton: {
    minHeight: 42,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 4,

    paddingHorizontal: 13,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: APP_COLOR.BORDER,

    backgroundColor: APP_COLOR.SURFACE,
  },

  pageButtonDisabled: {
    opacity: 0.38,
  },

  pageButtonText: {
    color: APP_COLOR.PRIMARY,

    fontSize: 13,

    lineHeight: 18,

    fontWeight: '800',
  },

  pageBadge: {
    minWidth: 56,

    minHeight: 42,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },

  pageBadgeText: {
    color: APP_COLOR.PRIMARY_DARK,

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '900',
  },

  retryButton: {
    alignSelf: 'center',

    marginTop: 14,

    paddingHorizontal: 18,

    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: APP_COLOR.PRIMARY,
  },

  retryText: {
    color: '#FFFFFF',

    fontWeight: '800',
  },
});

export default BookingsPage;
