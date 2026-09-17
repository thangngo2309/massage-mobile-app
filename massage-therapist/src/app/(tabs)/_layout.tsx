import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';
import { replaceRoute } from '@/utils/navigation';

const TabLayout = () => {
  const user = useUserStore(state => state.user);
  const isHydrated = useUserStore(state => state.isHydrated);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isHydrated && !user) replaceRoute('/(auth)/welcome');
  }, [isHydrated, user]);

  if (!isHydrated || !user) return null;

  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_COLOR.PRIMARY,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          backgroundColor: APP_COLOR.SURFACE,
          borderTopWidth: 1,
          borderTopColor: APP_COLOR.BORDER,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <FontAwesome name="home" size={21} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Booking', tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={20} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Lịch làm việc', tabBarIcon: ({ color }) => <FontAwesome name="clock-o" size={21} color={color} /> }} />
      <Tabs.Screen name="services" options={{ title: 'Dịch vụ', tabBarIcon: ({ color }) => <FontAwesome name="list" size={20} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <FontAwesome name="user" size={21} color={color} /> }} />
    </Tabs>
  );
};

export default TabLayout;
