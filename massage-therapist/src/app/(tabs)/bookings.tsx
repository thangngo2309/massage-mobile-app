import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import type { Booking, BookingStatus } from '@/types';
import { getTherapistBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

type StatusFilter = 'all' | BookingStatus;

const PAGE_SIZE = 10;

const FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'waiting_therapist_accept' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang di chuyển', value: 'therapist_on_the_way' },
  { label: 'Đang thực hiện', value: 'in_progress' },
  { label: 'Hoàn thành', value: 'completed' },
];

const BookingsPage = () => {
  const [items, setItems] = useState<Booking[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await getTherapistBookingsAPI({
          page,
          limit: PAGE_SIZE,
          status: status === 'all' ? undefined : status,
        });

        setItems(response.items);
        setTotalPages(Math.max(1, response.pagination.totalPages || 1));

        if (
          response.pagination.totalPages > 0 &&
          page > response.pagination.totalPages
        ) {
          setPage(response.pagination.totalPages);
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const realtimeRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  useBookingRealtime(realtimeRefresh);

  const changeFilter = (value: StatusFilter) => {
    if (value === status) {
      return;
    }

    setStatus(value);
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={APP_COLOR.PRIMARY}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Booking của tôi</Text>

            <Text style={styles.description}>
              Xác nhận booking và theo dõi các lịch dịch vụ của bạn.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              {FILTERS.map((item) => {
                const active = item.value === status;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => changeFilter(item.value)}
                    style={[styles.filter, active ? styles.filterActive : null]}>
                    <Text
                      style={[
                        styles.filterText,
                        active ? styles.filterTextActive : null,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={APP_COLOR.DANGER}
                />

                <Text style={styles.error}>{error}</Text>

                <Pressable onPress={() => void load()}>
                  <Text style={styles.retry}>Thử lại</Text>
                </Pressable>
              </View>
            ) : null}

            {loading ? <LoadingState /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Chưa có booking"
              description="Booking của khách hàng sẽ xuất hiện tại đây."
            />
          ) : null
        }
        ListFooterComponent={
          !loading && items.length > 0 && totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={({ pressed }) => [
                  styles.pageButton,
                  page <= 1 ? styles.pageButtonDisabled : null,
                  pressed && page > 1 ? styles.pageButtonPressed : null,
                ]}>
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={page <= 1 ? '#CBD5E1' : APP_COLOR.PRIMARY}
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    page <= 1 ? styles.pageButtonTextDisabled : null,
                  ]}>
                  Trước
                </Text>
              </Pressable>

              <Text style={styles.pageInfo}>
                Trang {page} / {totalPages}
              </Text>

              <Pressable
                disabled={page >= totalPages}
                onPress={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                style={({ pressed }) => [
                  styles.pageButton,
                  page >= totalPages ? styles.pageButtonDisabled : null,
                  pressed && page < totalPages ? styles.pageButtonPressed : null,
                ]}>
                <Text
                  style={[
                    styles.pageButtonText,
                    page >= totalPages ? styles.pageButtonTextDisabled : null,
                  ]}>
                  Sau
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    page >= totalPages ? '#CBD5E1' : APP_COLOR.PRIMARY
                  }
                />
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => <BookingCard booking={item} />}
      />
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
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 30,
    fontWeight: '900',
  },
  description: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  filters: {
    paddingTop: 18,
    paddingBottom: 2,
    gap: 8,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  filterActive: {
    borderColor: APP_COLOR.PRIMARY,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  filterText: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  errorBox: {
    marginTop: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  error: {
    flex: 1,
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 18,
  },
  retry: {
    color: APP_COLOR.DANGER,
    fontSize: 12,
    fontWeight: '900',
  },
  separator: {
    height: 12,
  },
  pagination: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pageButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  pageButtonDisabled: {
    backgroundColor: '#F8FAFC',
  },
  pageButtonPressed: {
    opacity: 0.7,
  },
  pageButtonText: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  pageButtonTextDisabled: {
    color: '#CBD5E1',
  },
  pageInfo: {
    color: APP_COLOR.MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default BookingsPage;
