import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { APP_COLOR } from '@/utils/constant';

const EmptyState = ({ title, description }: { title: string; description?: string }) => (
  <View style={styles.wrap}>
    <View style={styles.icon}><Ionicons name="file-tray-outline" size={24} color={APP_COLOR.PRIMARY} /></View>
    <Text style={styles.title}>{title}</Text>
    {!!description && <Text style={styles.description}>{description}</Text>}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 28 },
  icon: { width: 52, height: 52, borderRadius: 18, backgroundColor: APP_COLOR.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 12, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  description: { marginTop: 6, color: APP_COLOR.MUTED, lineHeight: 20, textAlign: 'center' },
});

export default EmptyState;
