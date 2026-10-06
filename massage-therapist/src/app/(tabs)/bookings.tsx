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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const response = await getTherapistBookingsAPI({
          page: 1,
          limit: 50,
          status: status === 'all' ? undefined : status,
        });

        setItems(response.items);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const realtimeRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  useBookingRealtime(realtimeRefresh);

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
                    onPress={() => setStatus(item.value)}
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
  error: {
    marginTop: 14,
    color: APP_COLOR.DANGER,
    fontSize: 13,
  },
  separator: {
    height: 12,
  },
});

export default BookingsPage;
