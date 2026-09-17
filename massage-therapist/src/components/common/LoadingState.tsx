import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { APP_COLOR } from '@/utils/constant';

const LoadingState = ({ label = 'Đang tải...' }: { label?: string }) => (
  <View style={styles.wrap}>
    <ActivityIndicator size="large" color={APP_COLOR.PRIMARY} />
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingVertical: 42, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 10, color: APP_COLOR.MUTED },
});

export default LoadingState;
