import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { StorageKeys, UserRole } from '@/constants/common.constant';
import type {
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
} from '@/types';
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
  registerClient: (
    payload: Omit<RegisterPayload, 'role'>,
  ) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => Promise<void>;
  clearError: () => void;
}

const extractTokens = (data: AuthResponse) => ({
  accessToken: data.accessToken ?? data.access_token ?? null,
  refreshToken: data.refreshToken ?? data.refresh_token ?? null,
});

const assertClient = (user?: AuthUser | null) => {
  if (!user || user.role !== UserRole.CLIENT) {
    throw new Error('Tài khoản này không phải tài khoản khách hàng.');
  }

  return user;
};

const clearLocalSession = async () => {
  await AsyncStorage.multiRemove([
    StorageKeys.ACCESS_TOKEN,
    StorageKeys.REFRESH_TOKEN,
    StorageKeys.USER,
  ]);
};

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
      const [[, accessToken], [, refreshToken], [, rawUser]] =
        await AsyncStorage.multiGet([
          StorageKeys.ACCESS_TOKEN,
          StorageKeys.REFRESH_TOKEN,
          StorageKeys.USER,
        ]);

      const cachedUser = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;

      if (cachedUser && cachedUser.role !== UserRole.CLIENT) {
        await clearLocalSession();

        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        });

        return;
      }

      set({
        accessToken,
        refreshToken,
        user: cachedUser,
      });

      if (accessToken) {
        try {
          const user = assertClient(await getAccountAPI());

          await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));

          set({ user });
        } catch (error) {
          console.log('[AUTH][HYDRATE][ERR]', getApiErrorMessage(error));

          await clearLocalSession();

          set({
            accessToken: null,
            refreshToken: null,
            user: null,
          });
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
        deviceName: `${Platform.OS}-in-home-massage-247-client`,
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

      const user = assertClient(data.user ?? (await getAccountAPI()));

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
      await clearLocalSession();

      const message = getApiErrorMessage(error, 'Đăng nhập thất bại.');

      console.log('[AUTH][LOGIN][ERR]', message);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: message,
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerClient: async payload => {
    set({ isLoading: true, error: null });

    try {
      /**
       * Backend hiện tại:
       * - tạo client ở trạng thái inactive
       * - gửi OTP
       * - chưa tạo session
       */
      const response = await registerAPI({
        ...payload,
        role: UserRole.CLIENT,
        deviceName: `${Platform.OS}-in-home-massage-247-client`,
      });

      assertClient(response.user);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
      });

      return response;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Đăng ký thất bại.');

      console.log('[AUTH][REGISTER][ERR]', message);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: message,
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserProfile: async () => {
    try {
      const user = assertClient(await getAccountAPI());

      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));

      set({ user });

      return user;
    } catch (error) {
      console.log('[AUTH][ME][ERR]', getApiErrorMessage(error));
      return null;
    }
  },

  setUser: async user => {
    if (user) {
      assertClient(user);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(StorageKeys.USER);
    }

    set({ user });
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const refreshToken =
        get().refreshToken ??
        (await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN));

      if (refreshToken) {
        try {
          await logoutAPI(refreshToken);
        } catch (error) {
          console.log('[AUTH][LOGOUT][SERVER_ERR]', getApiErrorMessage(error));
        }
      }
    } finally {
      await clearLocalSession();

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
