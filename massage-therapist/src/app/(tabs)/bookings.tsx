import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import {
  matchBookingFilter,
  type BookingFilter,
} from '@/constants/booking.constant';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import type { Booking } from '@/types';
import { getTherapistBookingsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const filters: Array<{ value: BookingFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'waiting', label: 'Chờ nhận' },
  { value: 'working', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
];

const BookingsPage = () => {
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    setError(null);

    try {
      const response = await getTherapistBookingsAPI({
        page: 1,
        limit: 100,
      });

      setItems(response.items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const realtimeRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  useBookingRealtime(realtimeRefresh);

  const filteredItems = useMemo(
    () => items.filter((item) => matchBookingFilter(item.status, filter)),
    [filter, items],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
              Nhận booking và cập nhật trạng thái theo quy trình phục vụ.
            </Text>

            <View style={styles.filters}>
              {filters.map((item) => {
                const active = item.value === filter;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilter(item.value)}
                    style={[
                      styles.filter,
                      active ? styles.filterActive : null,
                    ]}>
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
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading ? <LoadingState /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Không có booking"
              description="Không có booking phù hợp với bộ lọc hiện tại."
            />
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
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  error: {
    marginTop: 14,
    color: APP_COLOR.DANGER,
    fontSize: 13,
  },
});

export default BookingsPage;
