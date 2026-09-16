import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/ui/AppButton';
import { useLocationStore } from '@/store/useLocationStore';
import type {
  Service,
  TherapistSearchParams,
  TherapistSortBy,
  TherapistSummary,
} from '@/types';
import { getClientServiceAPI, searchTherapistsAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import {
  firstRouteParam,
  formatApiDate,
  formatApiTime,
  formatCurrency,
  formatDistance,
  formatDuration,
  parseApiDate,
  parseApiTime,
  parseNumberParam,
} from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

const nextDefaultTime = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const minutes = date.getMinutes();
  date.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
  return date;
};

const TherapistsPage = () => {
  const params = useLocalSearchParams<{
    serviceId?: string | string[];
    serviceOptionId?: string | string[];
    date?: string | string[];
    startTime?: string | string[];
    latitude?: string | string[];
    longitude?: string | string[];
    districtCode?: string | string[];
    provinceCode?: string | string[];
  }>();

  const serviceId = parseNumberParam(params.serviceId);
  const serviceOptionId = parseNumberParam(params.serviceOptionId);
  const initialDate = firstRouteParam(params.date) || formatApiDate(new Date());
  const initialStartTime = firstRouteParam(params.startTime) || formatApiTime(nextDefaultTime());
  const initialLatitude = parseNumberParam(params.latitude);
  const initialLongitude = parseNumberParam(params.longitude);

  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [districtCode, setDistrictCode] = useState(firstRouteParam(params.districtCode));
  const [provinceCode] = useState(firstRouteParam(params.provinceCode));
  const [latitude, setLatitude] = useState<number | undefined>(initialLatitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialLongitude);
  const [sortBy, setSortBy] = useState<TherapistSortBy>('rating');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [items, setItems] = useState<TherapistSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = useLocationStore(state => state.getCurrentLocation);
  const locationLoading = useLocationStore(state => state.loading);
  const locationAddress = useLocationStore(state => state.address);
  const locationError = useLocationStore(state => state.error);

  useEffect(() => {
    if (!serviceId) {
      setService(null);
      return;
    }

    let active = true;
    setServiceLoading(true);

    getClientServiceAPI(serviceId)
      .then(data => {
        if (active) setService(data);
      })
      .catch(() => {
        if (active) setService(null);
      })
      .finally(() => {
        if (active) setServiceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId]);

  const selectedOption = useMemo(
    () => service?.options?.find(option => option.id === serviceOptionId),
    [service?.options, serviceOptionId],
  );

  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const hasLocation = hasCoordinates || districtCode.trim().length > 0;

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();

    if (!location) {
      Alert.alert('Không thể lấy vị trí', useLocationStore.getState().error || 'Vui lòng thử lại.');
      return;
    }

    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setDistrictCode('');
  };

  const handleSearch = async () => {
    if (!serviceId || !serviceOptionId) {
      Alert.alert('Thiếu dịch vụ', 'Vui lòng chọn dịch vụ và liệu trình trước.');
      return;
    }

    if (!date || !startTime) {
      Alert.alert('Thiếu thời gian', 'Vui lòng chọn ngày và giờ phục vụ.');
      return;
    }

    if (!hasLocation) {
      Alert.alert(
        'Thiếu khu vực',
        'Hãy dùng vị trí hiện tại hoặc nhập mã quận/huyện để tìm kỹ thuật viên.',
      );
      return;
    }

    const query: TherapistSearchParams = {
      serviceOptionId,
      date,
      startTime,
      sortBy,
      page: 1,
      limit: 50,
      ...(hasCoordinates
        ? { latitude, longitude }
        : {
            districtCode: districtCode.trim(),
            ...(provinceCode ? { provinceCode } : {}),
          }),
    };

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const result = await searchTherapistsAPI(query);
      setItems(result.items);
    } catch (error) {
      setItems([]);
      setError(getApiErrorMessage(error, 'Không thể tìm kỹ thuật viên.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !value) return;
    setDate(formatApiDate(value));
  };

  const handleTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !value) return;
    setStartTime(formatApiTime(value));
  };

  const openTherapist = (item: TherapistSummary) => {
    if (!serviceId || !serviceOptionId) return;

    const therapistId = Number(item.therapistId ?? item.id);
    if (!Number.isInteger(therapistId) || therapistId <= 0) return;

    const query = [
      `serviceId=${serviceId}`,
      `serviceOptionId=${serviceOptionId}`,
      `date=${encodeURIComponent(date)}`,
      `startTime=${encodeURIComponent(startTime)}`,
    ];

    if (hasCoordinates) {
      query.push(`latitude=${latitude}`, `longitude=${longitude}`);
    }

    if (districtCode.trim()) query.push(`districtCode=${encodeURIComponent(districtCode.trim())}`);
    if (provinceCode) query.push(`provinceCode=${encodeURIComponent(provinceCode)}`);

    pushRoute(`/therapists/${therapistId}?${query.join('&')}`);
  };

  if (!serviceId || !serviceOptionId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Kỹ thuật viên</Text>
          <Text style={styles.subtitle}>Bắt đầu bằng cách chọn dịch vụ và liệu trình.</Text>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={42} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Chưa chọn liệu trình</Text>
          <Text style={styles.emptyText}>
            Danh sách KTV phụ thuộc dịch vụ, thời gian và khu vực nên cần chọn liệu trình trước.
          </Text>
          <AppButton
            title="Chọn dịch vụ"
            onPress={() => pushRoute('/(tabs)/services')}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerNoPadding}>
          <Text style={styles.title}>Tìm kỹ thuật viên</Text>
          <Text style={styles.subtitle}>
            {serviceLoading
              ? 'Đang tải liệu trình...'
              : `${service?.name ?? 'Dịch vụ'} · ${selectedOption?.name || selectedOption?.label || 'Liệu trình đã chọn'}`}
          </Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.fieldLabel}>Ngày phục vụ</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={APP_COLOR.PRIMARY} />
            <Text style={styles.selectText}>{date.split('-').reverse().join('/')}</Text>
            <Ionicons name="chevron-down" size={18} color={APP_COLOR.MUTED} />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={parseApiDate(date)}
                mode="date"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.donePicker}>
                  <Text style={styles.donePickerText}>Xong</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Giờ bắt đầu</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={APP_COLOR.PRIMARY} />
            <Text style={styles.selectText}>{startTime}</Text>
            <Ionicons name="chevron-down" size={18} color={APP_COLOR.MUTED} />
          </TouchableOpacity>

          {showTimePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={parseApiTime(startTime)}
                mode="time"
                is24Hour
                minuteInterval={30}
                onChange={handleTimeChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.donePicker}>
                  <Text style={styles.donePickerText}>Xong</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Khu vực phục vụ</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.locationButton, hasCoordinates && styles.locationButtonActive]}
            onPress={() => void handleUseCurrentLocation()}>
            {locationLoading ? (
              <ActivityIndicator color={APP_COLOR.PRIMARY} />
            ) : (
              <Ionicons name="locate-outline" size={20} color={APP_COLOR.PRIMARY} />
            )}
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationTitle}>
                {hasCoordinates ? 'Đã dùng vị trí hiện tại' : 'Dùng vị trí hiện tại'}
              </Text>
              <Text numberOfLines={2} style={styles.locationSubtitle}>
                {hasCoordinates
                  ? locationAddress || `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`
                  : 'Cho phép ứng dụng xác định khu vực gần bạn'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>hoặc mã quận/huyện</Text>
            <View style={styles.orLine} />
          </View>

          <TextInput
            value={districtCode}
            onChangeText={value => {
              setDistrictCode(value);

              if (value.trim()) {
                setLatitude(undefined);
                setLongitude(undefined);

                if (sortBy === 'distance') {
                  setSortBy('rating');
                }
              }
            }}
            placeholder="Ví dụ: district-code"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            style={styles.input}
          />

          {!!locationError && !hasCoordinates && (
            <Text style={styles.inlineError}>{locationError}</Text>
          )}

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Sắp xếp</Text>
          <View style={styles.chips}>
            {(
              [
                ['rating', 'Đánh giá'],
                ['price', 'Giá'],
                ['distance', 'Khoảng cách'],
              ] as [TherapistSortBy, string][]
            ).map(([value, label]) => {
              const disabled = value === 'distance' && !hasCoordinates;
              const active = sortBy === value;

              return (
                <TouchableOpacity
                  key={value}
                  disabled={disabled}
                  onPress={() => setSortBy(value)}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    disabled && styles.chipDisabled,
                  ]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppButton
            title="Tìm kỹ thuật viên"
            loading={loading}
            onPress={() => void handleSearch()}
            icon={<Ionicons name="search" size={19} color="#FFFFFF" />}
            style={styles.searchButton}
          />
        </View>

        {!!error && <Text style={styles.searchError}>{error}</Text>}

        {searched && !loading && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Kỹ thuật viên phù hợp</Text>
              <Text style={styles.resultCount}>{items.length} kết quả</Text>
            </View>

            {!items.length && !error ? (
              <View style={styles.noResult}>
                <Ionicons name="calendar-clear-outline" size={38} color="#94A3B8" />
                <Text style={styles.noResultTitle}>Chưa tìm thấy KTV phù hợp</Text>
                <Text style={styles.noResultText}>
                  Hãy đổi giờ, ngày hoặc khu vực rồi tìm lại.
                </Text>
              </View>
            ) : (
              items.map(item => {
                const name = item.fullName || item.name || 'Kỹ thuật viên';
                const rating = Number(item.ratingAverage ?? 0);
                const distance = formatDistance(item.distanceKm);

                return (
                  <TouchableOpacity
                    key={String(item.therapistId ?? item.id)}
                    activeOpacity={0.75}
                    style={styles.therapistCard}
                    onPress={() => openTherapist(item)}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Ionicons name="person" size={28} color={APP_COLOR.PRIMARY_DARK} />
                      </View>
                    )}

                    <View style={styles.therapistBody}>
                      <View style={styles.therapistTop}>
                        <Text numberOfLines={1} style={styles.therapistName}>{name}</Text>
                        <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
                      </View>

                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={15} color={APP_COLOR.ACCENT} />
                        <Text style={styles.ratingText}>
                          {rating > 0 ? rating.toFixed(1) : 'Mới'}
                          {item.ratingCount ? ` (${item.ratingCount})` : ''}
                        </Text>
                        {!!distance && <Text style={styles.dotMeta}>· {distance}</Text>}
                      </View>

                      <View style={styles.cardMetaRow}>
                        {!!item.experienceYears && (
                          <Text style={styles.smallMeta}>{item.experienceYears} năm kinh nghiệm</Text>
                        )}
                        {!!item.durationMinutes && (
                          <Text style={styles.smallMeta}>{formatDuration(item.durationMinutes)}</Text>
                        )}
                      </View>

                      <Text style={styles.price}>
                        {item.price !== undefined && item.price !== null
                          ? formatCurrency(item.price)
                          : 'Xem giá dịch vụ'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  headerNoPadding: { marginBottom: 14 },
  title: { color: APP_COLOR.TEXT, fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 6, color: APP_COLOR.MUTED, fontSize: 14, lineHeight: 20 },
  emptyCard: {
    margin: 16, marginTop: 8, padding: 24, borderRadius: 20, alignItems: 'center',
    borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  emptyTitle: { marginTop: 12, color: APP_COLOR.TEXT, fontSize: 18, fontWeight: '900' },
  emptyText: { marginTop: 7, color: APP_COLOR.MUTED, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  emptyButton: { alignSelf: 'stretch', marginTop: 18 },
  filterCard: {
    padding: 16, borderRadius: 20, borderWidth: 1, borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  fieldLabel: { color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  fieldSpacing: { marginTop: 15 },
  selectBox: {
    minHeight: 50, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 14, backgroundColor: '#F8FAFC',
  },
  selectText: { flex: 1, color: APP_COLOR.TEXT, fontSize: 15, fontWeight: '700' },
  pickerWrap: { marginTop: 8, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FAFC' },
  donePicker: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 9 },
  donePickerText: { color: APP_COLOR.PRIMARY, fontWeight: '800' },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 62, paddingHorizontal: 13,
    borderRadius: 14, borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC',
  },
  locationButtonActive: { borderColor: '#99F6E4', backgroundColor: '#F0FDFA' },
  locationTextWrap: { flex: 1, paddingVertical: 9 },
  locationTitle: { color: APP_COLOR.TEXT, fontSize: 14, fontWeight: '800' },
  locationSubtitle: { marginTop: 3, color: APP_COLOR.MUTED, fontSize: 12, lineHeight: 17 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: APP_COLOR.BORDER },
  orText: { color: '#94A3B8', fontSize: 11 },
  input: {
    minHeight: 50, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC', color: APP_COLOR.TEXT, fontSize: 14,
  },
  inlineError: { marginTop: 7, color: APP_COLOR.DANGER, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC',
  },
  chipActive: { borderColor: APP_COLOR.PRIMARY, backgroundColor: APP_COLOR.PRIMARY_LIGHT },
  chipDisabled: { opacity: 0.38 },
  chipText: { color: APP_COLOR.MUTED, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: APP_COLOR.PRIMARY_DARK },
  searchButton: { marginTop: 17 },
  searchError: {
    marginTop: 13, padding: 12, borderRadius: 12, color: APP_COLOR.DANGER,
    backgroundColor: '#FEF2F2', fontSize: 13, lineHeight: 19,
  },
  resultSection: { marginTop: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: APP_COLOR.TEXT, fontSize: 18, fontWeight: '900' },
  resultCount: { color: APP_COLOR.MUTED, fontSize: 12, fontWeight: '700' },
  noResult: {
    padding: 24, alignItems: 'center', borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  noResultTitle: { marginTop: 11, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  noResultText: { marginTop: 6, color: APP_COLOR.MUTED, textAlign: 'center', lineHeight: 19 },
  therapistCard: {
    flexDirection: 'row', padding: 14, marginBottom: 11, borderRadius: 18,
    borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  avatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: '#E2E8F0' },
  avatarFallback: {
    width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  therapistBody: { flex: 1, marginLeft: 12 },
  therapistTop: { flexDirection: 'row', alignItems: 'center' },
  therapistName: { flex: 1, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  ratingText: { color: APP_COLOR.TEXT, fontSize: 12, fontWeight: '800' },
  dotMeta: { color: APP_COLOR.MUTED, fontSize: 12 },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  smallMeta: { color: APP_COLOR.MUTED, fontSize: 12 },
  price: { marginTop: 8, color: APP_COLOR.PRIMARY, fontSize: 14, fontWeight: '900' },
});

export default TherapistsPage;
