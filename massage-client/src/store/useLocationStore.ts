import * as Location from 'expo-location';
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
  resetStore: () => void;
}

const formatAddress = (geo: Location.LocationGeocodedAddress) => {
  return [geo.name, geo.street, geo.district, geo.city, geo.region]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .join(', ');
};

export const useLocationStore = create<LocationState>(set => ({
  userLocation: null,
  address: '',
  loading: false,
  error: null,

  getCurrentLocation: async () => {
    set({ loading: true, error: null });

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        set({ error: 'Bạn chưa cấp quyền vị trí.' });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const [geo] = await Location.reverseGeocodeAsync(userLocation);

      set({
        userLocation,
        address: geo ? formatAddress(geo) : '',
      });

      return userLocation;
    } catch (error: any) {
      set({ error: error?.message ?? 'Không thể lấy vị trí hiện tại.' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  resetStore: () =>
    set({
      userLocation: null,
      address: '',
      loading: false,
      error: null,
    }),
}));
