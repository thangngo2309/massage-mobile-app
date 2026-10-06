import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Rating } from '@/types';
import { getTherapistRatingsAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';

type Props = {
  therapistId: number;
  ratingAverage?: number | null;
  ratingCount?: number;
};

const formatReviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const RatingStars = ({ rating }: { rating: number }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={17}
        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
      />
    ))}
  </View>
);

export const TherapistReviews = ({
  therapistId,
  ratingAverage = 0,
  ratingCount = 0,
}: Props) => {
  const [items, setItems] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(therapistId) || therapistId <= 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const response = await getTherapistRatingsAPI(therapistId, 1, 5);
      setItems(response.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Đánh giá từ khách hàng</Text>
          <Text style={styles.description}>
            Trải nghiệm thực tế từ những khách hàng đã sử dụng dịch vụ.
          </Text>
        </View>

        <View style={styles.ratingSummary}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.ratingValue}>
            {Number(ratingAverage ?? 0).toFixed(1)}
          </Text>
          <Text style={styles.ratingCount}>({ratingCount ?? 0})</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={APP_COLOR.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Chưa thể tải danh sách đánh giá</Text>
          <Pressable onPress={() => void load()}>
            <Text style={styles.retry}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={28}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
          <Text style={styles.emptyDescription}>
            Bạn chưa nhận được đánh giá nào từ khách hàng.
          </Text>
        </View>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.review,
                index < items.length - 1 ? styles.reviewBorder : null,
              ]}>
              <View style={styles.reviewHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={18} color={APP_COLOR.PRIMARY} />
                  </View>
                  <View style={styles.clientText}>
                    <Text style={styles.clientName}>
                      {item.client?.fullName || 'Khách hàng'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {formatReviewDate(item.createdAt)}
                    </Text>
                  </View>
                </View>

                <RatingStars rating={Number(item.rating ?? 0)} />
              </View>

              {item.comment ? (
                <Text style={styles.comment}>{item.comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  header: {
    gap: 14,
  },
  headerText: {
    gap: 5,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  description: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  ratingSummary: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: '#FFFBEB',
  },
  ratingValue: {
    color: APP_COLOR.TEXT,
    fontSize: 18,
    fontWeight: '900',
  },
  ratingCount: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  loading: {
    marginTop: 18,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  stateBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  stateTitle: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  retry: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  empty: {
    marginTop: 18,
    paddingVertical: 24,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  emptyTitle: {
    marginTop: 10,
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDescription: {
    marginTop: 5,
    paddingHorizontal: 20,
    color: APP_COLOR.MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  list: {
    marginTop: 18,
  },
  review: {
    paddingVertical: 16,
  },
  reviewBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLOR.BORDER,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  clientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientText: {
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  clientName: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewDate: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  comment: {
    marginTop: 11,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
});
