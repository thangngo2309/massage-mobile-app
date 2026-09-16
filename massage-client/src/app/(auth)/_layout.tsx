import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';
import { replaceRoute } from '@/utils/navigation';

const AuthLayout = () => {
  const user = useUserStore(state => state.user);
  const isHydrated = useUserStore(state => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    if (user) {
      replaceRoute('/(tabs)');
    }
  }, [isHydrated, user]);

  if (!isHydrated || user) {
    return null;
  }

  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: APP_COLOR.BACKGROUND,
        },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
};

export default AuthLayout;
