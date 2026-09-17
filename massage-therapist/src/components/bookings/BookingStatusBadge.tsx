import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '@/types';
import { BOOKING_STATUS_LABEL } from '@/utils/booking-ui';
import { APP_COLOR } from '@/utils/constant';

const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const danger = status === 'rejected' || status === 'cancelled' || status === 'expired';
  const success = status === 'completed';
  const backgroundColor = danger ? '#FEE2E2' : success ? '#DCFCE7' : APP_COLOR.PRIMARY_LIGHT;
  const color = danger ? APP_COLOR.DANGER : success ? APP_COLOR.SUCCESS : APP_COLOR.PRIMARY_DARK;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{BOOKING_STATUS_LABEL[status] ?? status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '800' },
});

export default BookingStatusBadge;
