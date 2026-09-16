import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { StorageKeys, UserRole } from '@/constants/common.constant';
import type { AuthResponse, AuthUser, RegisterPayload } from '@/types';
import { getAccountAPI, loginAPI, logoutAPI, registerAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { replaceRoute } from '@/utils/navigation';

interface UserState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  registerClient: (payload: Omit<RegisterPayload, 'role'>) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<AuthUser | null>;
  clearError: () => void;
}

const extractTokens = (data: AuthResponse) => ({
  accessToken: data.accessToken ?? data.access_token ?? null,
  refreshToken: data.refreshToken ?? data.refresh_token ?? null,
});

const persistSession = async (data: AuthResponse) => {
  const { accessToken, refreshToken } = extractTokens(data);
  const entries: [string, string][] = [];

  if (accessToken) entries.push([StorageKeys.ACCESS_TOKEN, accessToken]);
  if (refreshToken) entries.push([StorageKeys.REFRESH_TOKEN, refreshToken]);
  if (data.user) entries.push([StorageKeys.USER, JSON.stringify(data.user)]);

  if (entries.length) {
    await AsyncStorage.multiSet(entries);
  }

  return { accessToken, refreshToken };
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: async () => {
    try {
      const [[, accessToken], [, refreshToken], [, rawUser]] = await AsyncStorage.multiGet([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER,
      ]);

      const cachedUser = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;

      set({
        accessToken,
        refreshToken,
        user: cachedUser,
      });

      if (accessToken) {
        try {
          const user = await getAccountAPI();
          await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
          set({ user });
        } catch (error) {
          console.log('[AUTH][HYDRATE][ERR]', getApiErrorMessage(error));
        }
      }
    } catch (error) {
      console.log('[AUTH][HYDRATE][ERR]', error);
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async (login, password) => {
    set({ isLoading: true, error: null });

    try {
      const payload = {
        login: login.trim(),
        password,
        deviceName: `${Platform.OS}-massage-in-room`,
      };

      console.log('[AUTH][LOGIN] submit', {
        ...payload,
        password: '***',
      });

      const data = await loginAPI(payload);
      const tokens = await persistSession(data);

      if (!tokens.accessToken) {
        throw new Error('Đăng nhập thành công nhưng API không trả access token.');
      }

      const user = data.user ?? (await getAccountAPI());

      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));

      set({
        user,
        ...tokens,
        error: null,
      });

      console.log('[AUTH][LOGIN] success', {
        userId: user.id ?? user.sub,
        role: user.role,
      });

      replaceRoute('/(tabs)');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Đăng nhập thất bại.');
      console.log('[AUTH][LOGIN][ERR]', message);
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerClient: async payload => {
    set({ isLoading: true, error: null });

    try {
      const data = await registerAPI({
        ...payload,
        role: UserRole.CLIENT,
        deviceName: `${Platform.OS}-massage-in-room`,
      });

      const tokens = await persistSession(data);

      if (tokens.accessToken) {
        const user = data.user ?? (await getAccountAPI());

        await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));

        set({
          user,
          ...tokens,
          error: null,
        });

        replaceRoute('/(tabs)');
        return;
      }

      replaceRoute('/(auth)/login');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Đăng ký thất bại.');
      console.log('[AUTH][REGISTER][ERR]', message);
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserProfile: async () => {
    try {
      const user = await getAccountAPI();
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
      set({ user });
      return user;
    } catch (error) {
      console.log('[AUTH][ME][ERR]', getApiErrorMessage(error));
      return null;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const refreshToken =
        get().refreshToken ?? (await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN));

      if (refreshToken) {
        try {
          await logoutAPI(refreshToken);
        } catch (error) {
          console.log('[AUTH][LOGOUT][SERVER_ERR]', getApiErrorMessage(error));
        }
      }
    } finally {
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER,
      ]);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });

      replaceRoute('/(auth)/welcome');
    }
  },
}));
