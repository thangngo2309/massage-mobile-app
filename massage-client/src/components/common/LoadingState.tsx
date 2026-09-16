import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

const LoadingState = ({ message = 'Đang tải...' }: { message?: string }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={APP_COLOR.PRIMARY} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 10,
    color: APP_COLOR.MUTED,
    fontSize: 14,
  },
});

export default LoadingState;
