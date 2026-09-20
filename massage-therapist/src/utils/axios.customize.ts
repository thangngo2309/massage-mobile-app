import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { StorageKeys } from '@/constants/common.constant';

const selectedHost =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_ANDROID_API_URL || process.env.EXPO_PUBLIC_API_URL
    : Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_IOS_API_URL || process.env.EXPO_PUBLIC_API_URL
      : process.env.EXPO_PUBLIC_API_URL;

const normalizeApiBaseUrl = (value?: string): string => {
  const host = (value || 'http://localhost:7200').replace(/\/+$/, '');

  return host.endsWith('/api') ? host : `${host}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(selectedHost);

export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const debugEnabled = process.env.EXPO_PUBLIC_API_DEBUG === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshingPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('Refresh token không tồn tại');
  }

  const response = await refreshClient.post('/auth/refresh', {
    refreshToken,
    deviceName: Platform.OS,
  });

  const accessToken = response.data?.accessToken;
  const nextRefreshToken = response.data?.refreshToken;

  if (!accessToken || !nextRefreshToken) {
    throw new Error('Refresh response không hợp lệ');
  }

  await AsyncStorage.multiSet([
    [StorageKeys.ACCESS_TOKEN, accessToken],
    [StorageKeys.REFRESH_TOKEN, nextRefreshToken],
  ]);

  return accessToken;
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (debugEnabled) {
    console.log('[API][REQ]', config.method?.toUpperCase(), config.baseURL, config.url);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (debugEnabled) {
      console.log('[API][RES]', response.status, response.config.url);
    }

    return response;
  },
  async (error) => {
    const originalConfig = error.config as RetryConfig | undefined;
    const url = String(originalConfig?.url || '');

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (
      error.response?.status !== 401 ||
      !originalConfig ||
      originalConfig._retry ||
      isAuthEndpoint
    ) {
      if (debugEnabled) {
        console.log('[API][ERR]', error.response?.status, url, error.response?.data);
      }

      throw error;
    }

    originalConfig._retry = true;

    try {
      refreshingPromise ??= refreshAccessToken().finally(() => {
        refreshingPromise = null;
      });

      const nextAccessToken = await refreshingPromise;

      originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;

      return api(originalConfig);
    } catch (refreshError) {
      await AsyncStorage.multiRemove([
        StorageKeys.USER,
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
      ]);

      throw refreshError;
    }
  },
);

if (debugEnabled) {
  console.log('[API][CONFIG]', {
    API_BASE_URL,
    SOCKET_BASE_URL,
  });
}

export default api;
