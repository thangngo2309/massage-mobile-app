import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { StorageKeys } from '@/constants/common.constant';

const rawBase =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_ANDROID_API_URL ?? process.env.EXPO_PUBLIC_API_URL
    : process.env.EXPO_PUBLIC_IOS_API_URL ?? process.env.EXPO_PUBLIC_API_URL;

const normalizeBaseUrl = (value?: string) => {
  const base = (value ?? 'http://localhost:7200').replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

export const BACKEND_API = normalizeBaseUrl(rawBase);
const DEBUG = process.env.EXPO_PUBLIC_API_DEBUG === 'true';

if (DEBUG) console.log('[API][CONFIG]', { platform: Platform.OS, baseURL: BACKEND_API });

const api = axios.create({
  baseURL: BACKEND_API,
  timeout: 20000,
});

const refreshClient = axios.create({
  baseURL: BACKEND_API,
  timeout: 20000,
});

let refreshingPromise: Promise<string | null> | null = null;

const getNewAccessToken = async () => {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const refreshToken = await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
    if (!refreshToken) return null;

    const response = await refreshClient.post('/auth/refresh', {
      refreshToken,
      deviceName: `${Platform.OS}-massage-therapist`,
    });

    const payload = response.data?.data ?? response.data;
    const accessToken = payload?.accessToken ?? payload?.access_token ?? null;
    const rotatedRefreshToken = payload?.refreshToken ?? payload?.refresh_token ?? refreshToken;

    if (accessToken) await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, accessToken);
    if (rotatedRefreshToken) {
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, rotatedRefreshToken);
    }

    return accessToken as string | null;
  })().finally(() => {
    refreshingPromise = null;
  });

  return refreshingPromise;
};

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (DEBUG) {
    console.log('[API][REQ]', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    });
  }

  return config;
});

api.interceptors.response.use(
  response => {
    if (DEBUG) console.log('[API][RES]', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (DEBUG) {
      console.log('[API][ERR]', {
        status: error.response?.status,
        url,
        data: error.response?.data,
      });
    }

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      const accessToken = await getNewAccessToken();
      if (accessToken) {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
