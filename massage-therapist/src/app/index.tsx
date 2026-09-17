import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';
import { replaceRoute } from '@/utils/navigation';

const RootPage = () => {
  const user = useUserStore(state => state.user);
  const isHydrated = useUserStore(state => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    replaceRoute(user ? '/(tabs)' : '/(auth)/welcome');
  }, [isHydrated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={APP_COLOR.PRIMARY} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: APP_COLOR.BACKGROUND },
});

export default RootPage;
