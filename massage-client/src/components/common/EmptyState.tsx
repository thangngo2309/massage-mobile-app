import { StyleSheet, Text, View } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: 'center',
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default EmptyState;
