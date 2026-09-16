import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import ScreenHeader from '@/components/common/ScreenHeader';
import AppButton from '@/components/ui/AppButton';
import { useLocationStore } from '@/store/useLocationStore';
import type { Service, TherapistSearchParams, TherapistSummary } from '@/types';
import {
  checkTherapistAvailabilityAPI,
  createClientBookingAPI,
  findMatchingTherapistAPI,
  getClientServiceAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import {
  firstRouteParam,
  formatCurrency,
  formatDuration,
  parseNumberParam,
} from '@/utils/helpers';
import { replaceRoute } from '@/utils/navigation';

const NewBookingPage = () => {
  const params = useLocalSearchParams<{
    therapistId?: string | string[];
    serviceId?: string | string[];
    serviceOptionId?: string | string[];
    date?: string | string[];
    startTime?: string | string[];
    latitude?: string | string[];
    longitude?: string | string[];
    districtCode?: string | string[];
    provinceCode?: string | string[];
  }>();

  const therapistId = parseNumberParam(params.therapistId);
  const serviceId = parseNumberParam(params.serviceId);
  const serviceOptionId = parseNumberParam(params.serviceOptionId);
  const date = firstRouteParam(params.date);
  const startTime = firstRouteParam(params.startTime);

  // SEARCH LOCATION: giữ nguyên để re-check chính KTV đã chọn.
  const searchLatitude = parseNumberParam(params.latitude);
  const searchLongitude = parseNumberParam(params.longitude);
  const districtCode = firstRouteParam(params.districtCode);
  const provinceCode = firstRouteParam(params.provinceCode);
  const hasSearchCoordinates = searchLatitude !== undefined && searchLongitude !== undefined;
  const hasSearchDistrict = districtCode.trim().length > 0;

  // BOOKING LOCATION: vị trí thực tế KTV sẽ đến, được phép thay đổi độc lập.
  const [bookingLatitude, setBookingLatitude] = useState<number | null>(searchLatitude ?? null);
  const [bookingLongitude, setBookingLongitude] = useState<number | null>(searchLongitude ?? null);
  const [address, setAddress] = useState('');
  const [clientNote, setClientNote] = useState('');

  const [service, setService] = useState<Service | null>(null);
  const [therapist, setTherapist] = useState<TherapistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = useLocationStore(state => state.getCurrentLocation);
  const locating = useLocationStore(state => state.loading);

  const validParams =
    !!therapistId &&
    !!serviceId &&
    !!serviceOptionId &&
    !!date &&
    !!startTime &&
    (hasSearchCoordinates || hasSearchDistrict);

  const selectedOption = useMemo(
    () => service?.options?.find(option => option.id === serviceOptionId),
    [service?.options, serviceOptionId],
  );

  const load = async () => {
    if (!validParams || !therapistId || !serviceId || !serviceOptionId) {
      setError('Thông tin đặt lịch không hợp lệ hoặc đã bị thiếu.');
      setLoading(false);
      return;
    }

    const searchQuery: TherapistSearchParams = {
      serviceOptionId,
      date,
      startTime,
      page: 1,
      limit: 50,
      ...(hasSearchCoordinates
        ? { latitude: searchLatitude, longitude: searchLongitude }
        : {
            districtCode: districtCode.trim(),
            ...(provinceCode ? { provinceCode } : {}),
          }),
    };

    setLoading(true);
    setError('');

    try {
      const [serviceResult, therapistResult] = await Promise.all([
        getClientServiceAPI(serviceId),
        findMatchingTherapistAPI(therapistId, searchQuery),
      ]);

      if (!therapistResult) {
        setError('Kỹ thuật viên không còn khả dụng theo điều kiện bạn đã chọn.');
        setTherapist(null);
        setService(serviceResult);
        return;
      }

      setService(serviceResult);
      setTherapist(therapistResult);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải thông tin xác nhận booking.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [
    therapistId,
    serviceId,
    serviceOptionId,
    date,
    startTime,
    searchLatitude,
    searchLongitude,
    districtCode,
    provinceCode,
  ]);

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();

    if (!location) {
      Alert.alert(
        'Không thể lấy vị trí',
        useLocationStore.getState().error || 'Vui lòng kiểm tra quyền vị trí và thử lại.',
      );
      return;
    }

    // Chỉ cập nhật BOOKING LOCATION, không sửa SEARCH LOCATION.
    setBookingLatitude(location.latitude);
    setBookingLongitude(location.longitude);

    const currentAddress = useLocationStore.getState().address;
    if (currentAddress) setAddress(currentAddress);
  };

  const handleSubmit = async () => {
    if (!therapistId || !serviceId || !serviceOptionId || !therapist || !selectedOption) {
      Alert.alert('Không thể đặt lịch', 'Dịch vụ hoặc kỹ thuật viên không còn hợp lệ.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ KTV sẽ đến phục vụ.');
      return;
    }

    if (bookingLatitude === null || bookingLongitude === null) {
      Alert.alert(
        'Chưa xác định vị trí phục vụ',
        'Vui lòng bấm “Dùng vị trí hiện tại” để xác định tọa độ phục vụ.',
      );
      return;
    }

    setSubmitting(true);

    try {
      // Re-check ngay trước POST để tránh slot vừa bị client khác booking.
      const availability = await checkTherapistAvailabilityAPI(therapistId, {
        serviceId,
        serviceOptionId,
        date,
        startTime,
      });

      if (!availability.available) {
        Alert.alert(
          'Khung giờ không còn trống',
          availability.reason || 'Vui lòng quay lại và chọn khung giờ khác.',
        );
        return;
      }

      const booking = await createClientBookingAPI({
        therapistId,
        serviceOptionId,
        date,
        startTime,
        address: address.trim(),
        latitude: bookingLatitude,
        longitude: bookingLongitude,
        districtCode: districtCode || undefined,
        provinceCode: provinceCode || undefined,
        clientNote: clientNote.trim() || undefined,
      });

      Alert.alert('Đặt lịch thành công', 'Booking đã được gửi đến kỹ thuật viên.', [
        {
          text: 'Xem booking',
          onPress: () => replaceRoute(`/bookings/${booking.id}`),
        },
      ]);
    } catch (error) {
      Alert.alert('Đặt lịch thất bại', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Xác nhận đặt lịch" back />
        <LoadingState message="Đang kiểm tra dịch vụ và kỹ thuật viên..." />
      </SafeAreaView>
    );
  }

  if (error || !service || !therapist || !selectedOption) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Xác nhận đặt lịch" back />
        <View style={styles.stateWrap}>
          <EmptyState
            title="Không thể tiếp tục đặt lịch"
            description={error || 'Dịch vụ hoặc kỹ thuật viên không còn phù hợp.'}
          />
          <AppButton title="Kiểm tra lại" onPress={() => void load()} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title="Xác nhận đặt lịch"
          subtitle="Kiểm tra lại dịch vụ, thời gian và địa điểm trước khi gửi booking."
          back
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="sparkles" size={20} color={APP_COLOR.PRIMARY} />
              </View>
              <View style={styles.summaryBody}>
                <Text style={styles.summaryLabel}>Dịch vụ</Text>
                <Text style={styles.summaryValue}>{service.name}</Text>
                <Text style={styles.summaryMeta}>
                  {selectedOption.name || selectedOption.label || `Liệu trình #${selectedOption.id}`}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="person-outline" size={20} color={APP_COLOR.PRIMARY} />
              </View>
              <View style={styles.summaryBody}>
                <Text style={styles.summaryLabel}>Kỹ thuật viên</Text>
                <Text style={styles.summaryValue}>
                  {therapist.fullName || therapist.name || 'Kỹ thuật viên'}
                </Text>
                {!!therapist.ratingAverage && (
                  <Text style={styles.summaryMeta}>★ {Number(therapist.ratingAverage).toFixed(1)}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.summaryLabel}>Thời gian</Text>
                <Text style={styles.summaryValue}>{date.split('-').reverse().join('/')}</Text>
                <Text style={styles.summaryMeta}>
                  {startTime} · {formatDuration(selectedOption.durationMinutes)}
                </Text>
              </View>

              <View style={styles.column}>
                <Text style={styles.summaryLabel}>Giá dự kiến</Text>
                <Text style={styles.price}>
                  {therapist.price !== undefined && therapist.price !== null
                    ? formatCurrency(therapist.price)
                    : formatCurrency(selectedOption.price)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Địa điểm phục vụ</Text>
            <Text style={styles.sectionSubtitle}>
              Tọa độ booking là địa điểm KTV thực tế sẽ đến. Việc thay đổi vị trí tại đây không làm đổi KTV đã chọn.
            </Text>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.locationButton}
              onPress={() => void handleUseCurrentLocation()}>
              <Ionicons name="locate-outline" size={21} color={APP_COLOR.PRIMARY} />
              <View style={styles.locationBody}>
                <Text style={styles.locationTitle}>
                  {locating ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                </Text>
                <Text style={styles.locationMeta}>
                  {bookingLatitude !== null && bookingLongitude !== null
                    ? `${bookingLatitude.toFixed(5)}, ${bookingLongitude.toFixed(5)}`
                    : 'Chưa có tọa độ phục vụ'}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Địa chỉ chi tiết</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Số nhà, đường, khách sạn, căn hộ..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              style={styles.textAreaSmall}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ghi chú cho kỹ thuật viên</Text>
            <TextInput
              value={clientNote}
              onChangeText={setClientNote}
              placeholder="Ví dụ: gọi trước khi đến, số phòng..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              style={styles.textArea}
            />
          </View>

          <View style={styles.notice}>
            <Ionicons name="shield-checkmark-outline" size={22} color={APP_COLOR.PRIMARY} />
            <Text style={styles.noticeText}>
              Hệ thống sẽ kiểm tra lại lịch khả dụng ngay trước khi tạo booking để tránh trùng lịch.
            </Text>
          </View>

          <AppButton
            title="Xác nhận đặt lịch"
            loading={submitting}
            onPress={() => void handleSubmit()}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingBottom: 34 },
  stateWrap: { flex: 1, padding: 20 },
  retryButton: { marginTop: 14 },
  summaryCard: {
    padding: 16, borderRadius: 20, borderWidth: 1, borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  summaryBody: { flex: 1, marginLeft: 11 },
  summaryLabel: { color: APP_COLOR.MUTED, fontSize: 11, fontWeight: '700' },
  summaryValue: { marginTop: 3, color: APP_COLOR.TEXT, fontSize: 15, fontWeight: '900' },
  summaryMeta: { marginTop: 3, color: APP_COLOR.MUTED, fontSize: 12 },
  divider: { height: 1, marginVertical: 13, backgroundColor: APP_COLOR.BORDER },
  twoColumns: { flexDirection: 'row', gap: 14 },
  column: { flex: 1 },
  price: { marginTop: 4, color: APP_COLOR.PRIMARY, fontSize: 16, fontWeight: '900' },
  card: {
    marginTop: 13, padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  sectionTitle: { color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { marginTop: 5, color: APP_COLOR.MUTED, fontSize: 12, lineHeight: 18 },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, marginTop: 13,
    paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  locationBody: { flex: 1, paddingVertical: 9 },
  locationTitle: { color: APP_COLOR.TEXT, fontSize: 14, fontWeight: '800' },
  locationMeta: { marginTop: 3, color: APP_COLOR.MUTED, fontSize: 11 },
  inputLabel: { marginTop: 14, marginBottom: 7, color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '800' },
  textAreaSmall: {
    minHeight: 78, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC',
    color: APP_COLOR.TEXT, fontSize: 14, lineHeight: 20,
  },
  textArea: {
    minHeight: 102, marginTop: 12, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC',
    color: APP_COLOR.TEXT, fontSize: 14, lineHeight: 20,
  },
  notice: {
    flexDirection: 'row', gap: 10, marginTop: 13, padding: 14, borderRadius: 16,
    backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#CCFBF1',
  },
  noticeText: { flex: 1, color: APP_COLOR.PRIMARY_DARK, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  submitButton: { marginTop: 16 },
});

export default NewBookingPage;
