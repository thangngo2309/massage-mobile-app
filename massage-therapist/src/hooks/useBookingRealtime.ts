import { useEffect } from 'react';
import { io } from 'socket.io-client';

import { useUserStore } from '@/store/useUserStore';
import { SOCKET_BASE_URL } from '@/utils/axios.customize';

type BookingRealtimeEvent = {
  id: number;
  clientId: number;
  therapistId: number | null;
  status: string;
  scheduledAt?: string | null;
  updatedAt?: string | null;
};

export const useBookingRealtime = (
  onEvent: (payload: BookingRealtimeEvent) => void,
) => {
  const accessToken = useUserStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token: accessToken,
      },
    });

    socket.on('booking.created', onEvent);
    socket.on('booking.updated', onEvent);

    return () => {
      socket.off('booking.created', onEvent);
      socket.off('booking.updated', onEvent);
      socket.disconnect();
    };
  }, [accessToken, onEvent]);
};
