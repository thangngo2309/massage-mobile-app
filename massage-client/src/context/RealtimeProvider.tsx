import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useRealtimeStore } from '@/store/useRealtimeStore';
import { useUserStore } from '@/store/useUserStore';
import type { BookingRealtimePayload } from '@/types/realtime';
import { connectSocket, disconnectSocket, getSocket } from '@/utils/socket';

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const user = useUserStore(state => state.user);
  const isHydrated = useUserStore(state => state.isHydrated);
  const bumpBookingAndAvailability = useRealtimeStore(
    state => state.bumpBookingAndAvailability,
  );

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    const syncData = () => {
      bumpBookingAndAvailability();
    };

    const handleConnect = () => {
      if (__DEV__) {
        console.log('[Realtime] connected', socket.id);
      }

      syncData();
    };

    const handleConnectError = (error: Error) => {
      if (__DEV__) {
        console.warn('[Realtime] connect error', error.message);
      }
    };

    const handleDisconnect = (reason: string) => {
      if (__DEV__) {
        console.log('[Realtime] disconnected', reason);
      }
    };

    const handleBookingCreated = (payload: BookingRealtimePayload) => {
      if (__DEV__) {
        console.log('[Realtime] booking.created', payload);
      }

      syncData();
    };

    const handleBookingUpdated = (payload: BookingRealtimePayload) => {
      if (__DEV__) {
        console.log('[Realtime] booking.updated', payload);
      }

      syncData();
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('booking.created', handleBookingCreated);
    socket.on('booking.updated', handleBookingUpdated);

    if (!socket.connected) {
      void connectSocket();
    } else {
      syncData();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('booking.created', handleBookingCreated);
      socket.off('booking.updated', handleBookingUpdated);
    };
  }, [bumpBookingAndAvailability, isHydrated, user]);

  return <>{children}</>;
};
