import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

import { useUserStore } from '@/store/useUserStore';

const AuthLayout = () => {
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && user) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, user]);

  if (!isHydrated || user) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default AuthLayout;
