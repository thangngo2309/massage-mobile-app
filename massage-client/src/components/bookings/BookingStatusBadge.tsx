import { StyleSheet, Text, View } from 'react-native';

import { getBookingStatusMeta } from '@/utils/booking-ui';

interface BookingStatusBadgeProps {
  status?: string | null;
}

const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const meta = getBookingStatusMeta(status);

  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}> 
      <Text style={[styles.text, { color: meta.textColor }]}>{meta.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default BookingStatusBadge;
