import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RealtimeProvider } from '@/context/RealtimeProvider';
import { ZustandProvider } from '@/context/ZustandProvider';
import { APP_COLOR } from '@/utils/constant';

const RootLayout = () => {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: APP_COLOR.BACKGROUND,
      primary: APP_COLOR.PRIMARY,
      card: APP_COLOR.SURFACE,
      text: APP_COLOR.TEXT,
      border: APP_COLOR.BORDER,
    },
  };

  return (
    <SafeAreaProvider>
      <ZustandProvider>
        <RealtimeProvider>
          <ThemeProvider value={theme}>
            <StatusBar style="dark" />

            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: APP_COLOR.BACKGROUND,
                },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="bookings/[id]" />
              <Stack.Screen name="bookings/new" />
              <Stack.Screen name="services/[id]" />
              <Stack.Screen name="therapists/[id]" />
            </Stack>
          </ThemeProvider>
        </RealtimeProvider>
      </ZustandProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
