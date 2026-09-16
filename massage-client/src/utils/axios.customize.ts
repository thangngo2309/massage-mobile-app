import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { StorageKeys } from '@/constants/common.constant';

const DEBUG_API = process.env.EXPO_PUBLIC_API_DEBUG !== 'false';

const rawBaseURL =
  (Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_ANDROID_API_URL
    : process.env.EXPO_PUBLIC_IOS_API_URL) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:7200';

const normalizeBaseURL = (url: string) => {
  const normalized = url.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  return `${normalized}/api`;
};

export const BACKEND_API = normalizeBaseURL(rawBaseURL);

const sanitize = (value: any): any => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (/password|token|authorization/i.test(key)) {
        return [key, '***'];
      }
      return [key, sanitize(item)];
    }),
  );
};

const buildUrl = (config: { baseURL?: string; url?: string }) => {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  return `${base}${url}`;
};

if (DEBUG_API) {
  console.log('[API][CONFIG]', {
    platform: Platform.OS,
    baseURL: BACKEND_API,
  });
}

const api = axios.create({
  baseURL: BACKEND_API,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: BACKEND_API,
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

const unwrap = <T = any>(payload: any): T => {
  return (payload?.data ?? payload) as T;
};

const extractAccessToken = (payload: any): string | null => {
  const data = unwrap<any>(payload);
  return data?.accessToken ?? data?.access_token ?? null;
};

const extractRefreshToken = (payload: any): string | null => {
  const data = unwrap<any>(payload);
  return data?.refreshToken ?? data?.refresh_token ?? null;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
  if (!refreshToken) return null;

  if (DEBUG_API) {
    console.log('[AUTH][REFRESH] start');
  }

  const response = await refreshClient.post('/auth/refresh', {
    refreshToken,
    deviceName: `${Platform.OS}-massage-in-room`,
  });

  const accessToken = extractAccessToken(response.data);
  const nextRefreshToken = extractRefreshToken(response.data) ?? refreshToken;

  if (!accessToken) {
    throw new Error('Refresh response không có access token.');
  }

  await AsyncStorage.multiSet([
    [StorageKeys.ACCESS_TOKEN, accessToken],
    [StorageKeys.REFRESH_TOKEN, nextRefreshToken],
  ]);

  if (DEBUG_API) {
    console.log('[AUTH][REFRESH] success');
  }

  return accessToken;
};

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (DEBUG_API) {
    console.log('[API][REQ]', {
      method: config.method?.toUpperCase(),
      url: buildUrl(config),
      params: sanitize(config.params),
      data: sanitize(config.data),
      hasAuthorization: Boolean(config.headers.Authorization),
    });
  }

  return config;
});

api.interceptors.response.use(
  response => {
    if (DEBUG_API) {
      console.log('[API][RES]', {
        status: response.status,
        method: response.config.method?.toUpperCase(),
        url: buildUrl(response.config),
        data: sanitize(response.data),
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (DEBUG_API) {
      console.log('[API][ERR]', {
        message: error.message,
        status: error.response?.status,
        code: error.code,
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest ? buildUrl(originalRequest) : undefined,
        response: sanitize(error.response?.data),
      });
    }

    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const accessToken = await refreshPromise;
      if (!accessToken) {
        await AsyncStorage.multiRemove([
          StorageKeys.ACCESS_TOKEN,
          StorageKeys.REFRESH_TOKEN,
          StorageKeys.USER,
        ]);
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER,
      ]);
      return Promise.reject(refreshError);
    }
  },
);

export default api;
