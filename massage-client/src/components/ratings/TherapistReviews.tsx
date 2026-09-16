import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Rating } from '@/types';
import { APP_COLOR } from '@/utils/constant';
import { formatDateTime } from '@/utils/helpers';

interface TherapistReviewsProps {
  items: Rating[];
}

const TherapistReviews = ({ items }: TherapistReviewsProps) => {
  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
        <Text style={styles.emptyText}>Kỹ thuật viên này chưa có đánh giá hiển thị.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.slice(0, 10).map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>
              {item.client?.user?.fullName || 'Khách hàng'}
            </Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={15} color={APP_COLOR.ACCENT} />
              <Text style={styles.ratingText}>{item.rating}/5</Text>
            </View>
          </View>

          {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
          {!!item.createdAt && <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: APP_COLOR.TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  comment: {
    marginTop: 8,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  date: {
    marginTop: 7,
    color: '#94A3B8',
    fontSize: 11,
  },
  empty: {
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 4,
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
});

export default TherapistReviews;
