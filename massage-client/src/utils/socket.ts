import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, type Socket } from 'socket.io-client';

import { StorageKeys } from '@/constants/common.constant';
import type { ServerToClientEvents } from '@/types/realtime';
import { BACKEND_API } from '@/utils/axios.customize';

type AppSocket = Socket<ServerToClientEvents>;

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim().replace(/\/+$/, '') ||
  BACKEND_API.replace(/\/api\/?$/i, '');

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  }) as AppSocket;

  socket.io.on('reconnect_attempt', async () => {
    if (!socket) return;

    socket.auth = {
      token: await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN),
    };
  });

  return socket;
};

export const connectSocket = async (): Promise<AppSocket> => {
  const current = getSocket();

  current.auth = {
    token: await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN),
  };

  if (!current.connected) {
    current.connect();
  }

  return current;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
};
