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
  registerTherapist: (payload: Omit<RegisterPayload, 'role'>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const extractTokens = (data: AuthResponse) => ({
  accessToken: data.accessToken ?? data.access_token ?? null,
  refreshToken: data.refreshToken ?? data.refresh_token ?? null,
});

const persistSession = async (data: AuthResponse) => {
  const tokens = extractTokens(data);
  const entries: [string, string][] = [];
  if (tokens.accessToken) entries.push([StorageKeys.ACCESS_TOKEN, tokens.accessToken]);
  if (tokens.refreshToken) entries.push([StorageKeys.REFRESH_TOKEN, tokens.refreshToken]);
  if (data.user) entries.push([StorageKeys.USER, JSON.stringify(data.user)]);
  if (entries.length) await AsyncStorage.multiSet(entries);
  return tokens;
};

const assertTherapist = (user: AuthUser) => {
  if (user.role !== UserRole.THERAPIST) {
    throw new Error('Tài khoản này không phải tài khoản kỹ thuật viên.');
  }
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
      set({ accessToken, refreshToken, user: cachedUser?.role === UserRole.THERAPIST ? cachedUser : null });

      if (accessToken) {
        try {
          const user = await getAccountAPI();
          assertTherapist(user);
          await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
          set({ user });
        } catch {
          await AsyncStorage.multiRemove([
            StorageKeys.ACCESS_TOKEN,
            StorageKeys.REFRESH_TOKEN,
            StorageKeys.USER,
          ]);
          set({ user: null, accessToken: null, refreshToken: null });
        }
      }
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async (login, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginAPI({
        login: login.trim(),
        password,
        deviceName: `${Platform.OS}-massage-therapist`,
      });
      const tokens = await persistSession(data);
      if (!tokens.accessToken) throw new Error('API không trả access token.');
      const user = data.user ?? (await getAccountAPI());
      assertTherapist(user);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
      set({ user, ...tokens });
      replaceRoute('/(tabs)');
    } catch (error) {
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER,
      ]);
      const message = getApiErrorMessage(error, 'Đăng nhập thất bại.');
      set({ user: null, accessToken: null, refreshToken: null, error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerTherapist: async payload => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerAPI({
        ...payload,
        role: UserRole.THERAPIST,
        deviceName: `${Platform.OS}-massage-therapist`,
      });
      const tokens = await persistSession(data);
      if (tokens.accessToken) {
        const user = data.user ?? (await getAccountAPI());
        assertTherapist(user);
        await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
        set({ user, ...tokens });
        replaceRoute('/(tabs)');
      } else {
        replaceRoute('/(auth)/login');
      }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Đăng ký thất bại.');
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken =
        get().refreshToken ?? (await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN));
      if (refreshToken) {
        try {
          await logoutAPI(refreshToken);
        } catch {}
      }
    } finally {
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER,
      ]);
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false, error: null });
      replaceRoute('/(auth)/welcome');
    }
  },
}));
