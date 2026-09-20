import { StyleSheet, Text, View } from 'react-native';

import {
  getBookingStatusLabel,
  getBookingStatusTone,
  type BookingStatusTone,
} from '@/constants/booking.constant';
import type { BookingStatus } from '@/types/booking';

const toneStyles: Record<
  BookingStatusTone,
  { backgroundColor: string; color: string }
> = {
  neutral: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  info: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  warning: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
  },
  danger: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
};

export const BookingStatusBadge = ({
  status,
}: {
  status: BookingStatus | string;
}) => {
  const tone = getBookingStatusTone(status);
  const current = toneStyles[tone];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: current.backgroundColor,
        },
      ]}>
      <Text
        style={[
          styles.text,
          {
            color: current.color,
          },
        ]}>
        {getBookingStatusLabel(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
