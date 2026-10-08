import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Booking } from '@/types';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency, formatDateTime } from '@/utils/helpers';

import { BookingStatusBadge } from './BookingStatusBadge';

export const BookingCard = ({ booking }: { booking: Booking }) => {
  const clientName =
    booking.client?.fullName ||
    booking.client?.user?.fullName ||
    'Khách hàng';

  return (
    <Pressable
      onPress={() => router.push(`/bookings/${booking.id}`)}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>

          <BookingStatusBadge status={booking.status} />
        </View>

        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={18} color={APP_COLOR.PRIMARY} />
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={17} color={APP_COLOR.PRIMARY} />
          <Text style={styles.metaText} numberOfLines={1}>
            {clientName}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={17} color={APP_COLOR.PRIMARY} />
          <Text style={styles.metaText}>{formatDateTime(booking.scheduledAt)}</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={17} color={APP_COLOR.PRIMARY} />
          <Text style={styles.metaText}>{booking.durationMinutes} phút</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={17} color={APP_COLOR.PRIMARY} />
          <Text style={styles.metaText} numberOfLines={2}>
            {booking.address}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Giá dịch vụ</Text>
          <Text style={styles.price}>{formatCurrency(booking.servicePrice)}</Text>
        </View>

        <Text style={styles.detail}>Xem chi tiết</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  pressed: {
    opacity: 0.82,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 9,
  },
  serviceName: {
    color: APP_COLOR.TEXT,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  metaGrid: {
    marginTop: 16,
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  metaText: {
    flex: 1,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP_COLOR.BORDER,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  priceLabel: {
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  price: {
    marginTop: 3,
    color: APP_COLOR.PRIMARY,
    fontSize: 18,
    fontWeight: '900',
  },
  detail: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
});
