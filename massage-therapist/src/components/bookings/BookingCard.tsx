import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Booking } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { APP_COLOR } from '@/utils/constant';
import { BookingStatusBadge } from './BookingStatusBadge';

export const BookingCard = ({ booking }: { booking: Booking }) => (
  <Pressable
    onPress={() => router.push(`/bookings/${booking.id}`)}
    style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
    <View style={styles.header}>
      <Text style={styles.serviceName}>
        {booking.serviceName}
        {booking.durationMinutes ? ` - ${booking.durationMinutes} phút` : ''}
      </Text>

      <BookingStatusBadge status={booking.status} />
    </View>

    <Text style={styles.schedule}>{formatDateTime(booking.scheduledAt)}</Text>

    <Text style={styles.client}>
      Khách: {booking.client?.user?.fullName || 'Khách hàng'}
    </Text>

    <Text style={styles.address}>{booking.address}</Text>

    <View style={styles.footer}>
      <Text style={styles.price}>{formatCurrency(booking.totalAmount)}</Text>
      <Text style={styles.detail}>Xem chi tiết →</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 9,
  },
  pressed: {
    opacity: 0.82,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceName: {
    flex: 1,
    color: APP_COLOR.TEXT,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  schedule: {
    color: APP_COLOR.PRIMARY,
    fontSize: 15,
    fontWeight: '800',
  },
  client: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '700',
  },
  address: {
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  detail: {
    color: APP_COLOR.PRIMARY,
    fontSize: 14,
    fontWeight: '800',
  },
});
