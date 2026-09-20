import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

export const LoadingState = ({ text = 'Đang tải...' }: { text?: string }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={APP_COLOR.PRIMARY} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: APP_COLOR.MUTED,
    fontSize: 14,
  },
});
