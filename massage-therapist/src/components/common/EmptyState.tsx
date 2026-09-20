import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <View style={styles.container}>
    <Ionicons name="file-tray-outline" size={38} color="#94A3B8" />
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 44,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 17,
    fontWeight: '800',
  },
  description: {
    maxWidth: 280,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
