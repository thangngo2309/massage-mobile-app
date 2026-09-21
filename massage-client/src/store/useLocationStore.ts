import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { create } from 'zustand';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface LocationState {
  userLocation: UserLocation | null;

  address: string;

  loading: boolean;

  error: string | null;

  getCurrentLocation: () => Promise<UserLocation | null>;

  clearError: () => void;

  resetStore: () => void;
}

const LOCATION_TIMEOUT_MS = 15_000;

const formatAddress = (geo: Location.LocationGeocodedAddress): string => {
  return [geo.name, geo.street, geo.district, geo.city, geo.subregion, geo.region]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');
};

const getReadableLocationError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error ?? '');

  const normalized = message.toLowerCase();

  if (normalized.includes('current location is unavailable')) {
    return 'Chưa nhận được tín hiệu GPS. Vui lòng kiểm tra vị trí trên thiết bị hoặc Android Emulator rồi thử lại.';
  }

  if (normalized.includes('location services')) {
    return 'Dịch vụ vị trí đang tắt. Vui lòng bật GPS/Vị trí trên thiết bị.';
  }

  if (normalized.includes('permission')) {
    return 'Ứng dụng chưa được cấp quyền truy cập vị trí.';
  }

  if (normalized.includes('timeout')) {
    return 'Không nhận được tín hiệu GPS trong thời gian chờ. Vui lòng thử lại.';
  }

  return 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và thử lại.';
};

const waitForLocationFix = async (): Promise<Location.LocationObject> => {
  return new Promise(async (resolve, reject) => {
    let subscription: Location.LocationSubscription | null = null;

    let finished = false;

    const finish = (location?: Location.LocationObject, error?: Error) => {
      if (finished) {
        return;
      }

      finished = true;

      clearTimeout(timeout);

      subscription?.remove();

      if (location) {
        resolve(location);

        return;
      }

      reject(error ?? new Error('Location timeout'));
    };

    const timeout = setTimeout(() => {
      finish(undefined, new Error('Location timeout'));
    }, LOCATION_TIMEOUT_MS);

    try {
      /**
       * Dùng watchPositionAsync thay vì chỉ
       * getCurrentPositionAsync.
       *
       * Mục đích:
       * - Giữ GPS provider active.
       * - Chờ Emulator phát location fix.
       */
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,

          timeInterval: 500,

          distanceInterval: 0,
        },
        location => {
          console.log('[LOCATION][FIX]', {
            latitude: location.coords.latitude,

            longitude: location.coords.longitude,

            accuracy: location.coords.accuracy,
          });

          finish(location);
        },
      );
    } catch (error) {
      finish(undefined, error instanceof Error ? error : new Error(String(error)));
    }
  });
};

export const useLocationStore = create<LocationState>(set => ({
  userLocation: null,

  address: '',

  loading: false,

  error: null,

  getCurrentLocation: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      /**
       * ==============================================
       * 1. PERMISSION
       * ==============================================
       */

      let permission = await Location.getForegroundPermissionsAsync();

      console.log(
        '[LOCATION][PERMISSION]',
        permission.status,
        permission.granted,
        permission.canAskAgain,
      );

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        set({
          error: 'Bạn chưa cấp quyền vị trí cho ứng dụng.',
        });

        return null;
      }

      /**
       * ==============================================
       * 2. LOCATION SERVICES
       * ==============================================
       */

      let servicesEnabled = await Location.hasServicesEnabledAsync();

      console.log('[LOCATION][SERVICES]', servicesEnabled);

      if (!servicesEnabled && Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();

          servicesEnabled = await Location.hasServicesEnabledAsync();
        } catch (error) {
          console.log('[LOCATION] enableNetworkProviderAsync:', error);
        }
      }

      if (!servicesEnabled) {
        set({
          error: 'Dịch vụ vị trí đang tắt. Vui lòng bật GPS/Vị trí trên thiết bị.',
        });

        return null;
      }

      /**
       * ==============================================
       * 3. LAST KNOWN LOCATION
       * ==============================================
       */

      let position: Location.LocationObject | null = null;

      try {
        position = await Location.getLastKnownPositionAsync({
          /**
           * Cho phép location gần đây.
           */
          maxAge: 2 * 60 * 1000,

          /**
           * Không đặt quá thấp vì emulator
           * thường accuracy khoảng 20m.
           */
          requiredAccuracy: 500,
        });

        console.log(
          '[LOCATION][LAST KNOWN]',
          position
            ? {
                latitude: position.coords.latitude,

                longitude: position.coords.longitude,

                accuracy: position.coords.accuracy,
              }
            : null,
        );
      } catch (error) {
        console.log('[LOCATION] last known error:', error);
      }

      /**
       * ==============================================
       * 4. KHÔNG CÓ CACHE → CHỜ GPS FIX
       * ==============================================
       */

      if (!position) {
        console.log('[LOCATION] waiting for GPS fix...');

        try {
          position = await waitForLocationFix();
        } catch (error) {
          console.log('[LOCATION] waitForLocationFix failed:', error);

          /**
           * Thử currentPosition lần cuối.
           */
          try {
            position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
          } catch (currentError) {
            console.log('[LOCATION] getCurrentPositionAsync failed:', currentError);
          }
        }
      }

      /**
       * ==============================================
       * 5. VẪN KHÔNG CÓ GPS
       * ==============================================
       */

      if (!position) {
        set({
          error:
            Platform.OS === 'android'
              ? 'Chưa nhận được tọa độ GPS. Nếu đang dùng Android Emulator, hãy đặt một vị trí trong Extended Controls > Location hoặc dùng adb emu geo fix rồi thử lại.'
              : 'Chưa nhận được tọa độ GPS. Vui lòng kiểm tra GPS rồi thử lại.',
        });

        return null;
      }

      const userLocation: UserLocation = {
        latitude: position.coords.latitude,

        longitude: position.coords.longitude,
      };

      console.log('[LOCATION][SUCCESS]', userLocation);

      /**
       * Lưu tọa độ ngay.
       */
      set({
        userLocation,
        error: null,
      });

      /**
       * ==============================================
       * 6. REVERSE GEOCODE
       * ==============================================
       */

      let address = '';

      try {
        const result = await Location.reverseGeocodeAsync(userLocation);

        const geo = result[0];

        if (geo) {
          address = formatAddress(geo);
        }
      } catch (error) {
        /**
         * Reverse geocode lỗi không được làm
         * mất GPS đã lấy được.
         */
        console.log('[LOCATION] reverse geocode failed:', error);
      }

      set({
        userLocation,
        address,
        error: null,
      });

      return userLocation;
    } catch (error) {
      console.error('[LOCATION] unexpected:', error);

      set({
        error: getReadableLocationError(error),
      });

      return null;
    } finally {
      set({
        loading: false,
      });
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },

  resetStore: () => {
    set({
      userLocation: null,
      address: '',
      loading: false,
      error: null,
    });
  },
}));
