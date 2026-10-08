import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { StorageKeys } from '@/constants/common.constant';
import type {
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
} from '@/types';
import { loginAPI, logoutAPI, meAPI, registerAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';

type UserState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  register: (
    payload: Omit<RegisterPayload, 'role'>,
  ) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  clearError: () => void;
};

const persistSession = async (response: AuthResponse) => {
  await AsyncStorage.multiSet([
    [StorageKeys.USER, JSON.stringify(response.user)],
    [StorageKeys.ACCESS_TOKEN, response.accessToken],
    [StorageKeys.REFRESH_TOKEN, response.refreshToken],
  ]);
};

const clearSession = async () => {
  await AsyncStorage.multiRemove([
    StorageKeys.USER,
    StorageKeys.ACCESS_TOKEN,
    StorageKeys.REFRESH_TOKEN,
  ]);
};

const assertTherapist = (user: AuthUser) => {
  if (user.role !== 'therapist') {
    throw new Error('Tài khoản này không phải tài khoản kỹ thuật viên');
  }
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    try {
      const [[, savedUser], [, accessToken], [, refreshToken]] =
        await AsyncStorage.multiGet([
          StorageKeys.USER,
          StorageKeys.ACCESS_TOKEN,
          StorageKeys.REFRESH_TOKEN,
        ]);

      if (!accessToken || !refreshToken) {
        await clearSession();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isHydrated: true,
          error: null,
        });

        return;
      }

      const user = await meAPI();

      assertTherapist(user);

      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isHydrated: true,
        error: null,
      });

      void savedUser;
    } catch {
      await clearSession();

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isHydrated: true,
        error: null,
      });
    }
  },

  login: async (login, password) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await loginAPI({
        login: login.trim(),
        password,
        deviceName: `massage-therapist-${Platform.OS}`,
      });

      assertTherapist(response.user);

      await persistSession(response);

      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isLoading: false,
        error: null,
      });

      router.replace('/(tabs)');
    } catch (error) {
      await clearSession();

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: getApiErrorMessage(error),
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await registerAPI({
        ...payload,
        role: 'therapist',
        deviceName: `massage-therapist-${Platform.OS}`,
      });

      assertTherapist(response.user);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: getApiErrorMessage(error),
      });

      throw error;
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken;

    set({
      isLoading: true,
    });

    try {
      if (refreshToken) {
        await logoutAPI(refreshToken);
      }
    } catch {
      // Logout local vẫn tiếp tục kể cả Backend lỗi.
    }

    await clearSession();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });

    router.replace('/(auth)/welcome');
  },

  setUser: async (user) => {
    if (user) {
      assertTherapist(user);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(StorageKeys.USER);
    }

    set({ user });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
