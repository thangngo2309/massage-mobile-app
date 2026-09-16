import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import ScreenHeader from '@/components/common/ScreenHeader';
import TherapistReviews from '@/components/ratings/TherapistReviews';
import AppButton from '@/components/ui/AppButton';
import type {
  Rating,
  TherapistAvailabilitySlot,
  TherapistAvailabilitySlotsResult,
  TherapistSearchParams,
  TherapistSummary,
} from '@/types';
import {
  findMatchingTherapistAPI,
  getTherapistAvailabilitySlotsAPI,
  getTherapistRatingsAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import {
  firstRouteParam,
  formatCurrency,
  formatDistance,
  formatDuration,
  parseNumberParam,
} from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

const TherapistDetailPage = () => {
  const params = useLocalSearchParams<{
    id?: string | string[];
    serviceId?: string | string[];
    serviceOptionId?: string | string[];
    date?: string | string[];
    startTime?: string | string[];
    latitude?: string | string[];
    longitude?: string | string[];
    districtCode?: string | string[];
    provinceCode?: string | string[];
  }>();

  const therapistId = Number(firstRouteParam(params.id));
  const serviceId = parseNumberParam(params.serviceId);
  const serviceOptionId = parseNumberParam(params.serviceOptionId);
  const date = firstRouteParam(params.date);
  const originalStartTime = firstRouteParam(params.startTime);
  const latitude = parseNumberParam(params.latitude);
  const longitude = parseNumberParam(params.longitude);
  const districtCode = firstRouteParam(params.districtCode);
  const provinceCode = firstRouteParam(params.provinceCode);

  const [therapist, setTherapist] = useState<TherapistSummary | null>(null);
  const [availability, setAvailability] = useState<TherapistAvailabilitySlotsResult | null>(null);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [selectedTime, setSelectedTime] = useState(originalStartTime);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const hasDistrict = districtCode.trim().length > 0;
  const validParams =
    Number.isInteger(therapistId) &&
    therapistId > 0 &&
    !!serviceId &&
    !!serviceOptionId &&
    !!date &&
    !!originalStartTime &&
    (hasCoordinates || hasDistrict);

  const load = async () => {
    if (!validParams || !serviceId || !serviceOptionId) {
      setError('Thông tin tìm kiếm kỹ thuật viên không đầy đủ.');
      setLoading(false);
      return;
    }

    const searchQuery: TherapistSearchParams = {
      serviceOptionId,
      date,
      startTime: originalStartTime,
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

    try {
      const [matchingTherapist, slots, ratingItems] = await Promise.all([
        findMatchingTherapistAPI(therapistId, searchQuery),
        getTherapistAvailabilitySlotsAPI(therapistId, {
          serviceId,
          serviceOptionId,
          date,
          slotInterval: 30,
        }),
        getTherapistRatingsAPI(therapistId).catch(() => [] as Rating[]),
      ]);

      if (!matchingTherapist) {
        setTherapist(null);
        setAvailability(slots);
        setReviews(ratingItems);
        setError('Kỹ thuật viên không còn phù hợp với điều kiện tìm kiếm ban đầu.');
        return;
      }

      setTherapist(matchingTherapist);
      setAvailability(slots);
      setReviews(ratingItems);

      const originalSlot = slots.slots?.find(
        slot => slot.startTime === originalStartTime && slot.available,
      );

      if (!originalSlot) {
        setSelectedTime(slots.slots?.find(slot => slot.available)?.startTime ?? '');
      }
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải thông tin kỹ thuật viên.'));
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
    originalStartTime,
    latitude,
    longitude,
    districtCode,
    provinceCode,
  ]);

  const handleSlotSelect = (slot: TherapistAvailabilitySlot) => {
    if (!slot.available) return;
    setSelectedTime(slot.startTime);
  };

  const handleContinue = () => {
    if (!therapist || !serviceId || !serviceOptionId || !selectedTime) return;

    const query = [
      `therapistId=${therapistId}`,
      `serviceId=${serviceId}`,
      `serviceOptionId=${serviceOptionId}`,
      `date=${encodeURIComponent(date)}`,
      `startTime=${encodeURIComponent(selectedTime)}`,
    ];

    if (hasCoordinates) {
      query.push(`latitude=${latitude}`, `longitude=${longitude}`);
    }

    if (districtCode) query.push(`districtCode=${encodeURIComponent(districtCode)}`);
    if (provinceCode) query.push(`provinceCode=${encodeURIComponent(provinceCode)}`);

    pushRoute(`/bookings/new?${query.join('&')}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Kỹ thuật viên" back />
        <LoadingState message="Đang kiểm tra lịch khả dụng..." />
      </SafeAreaView>
    );
  }

  if (error || !therapist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Kỹ thuật viên" back />
        <View style={styles.stateWrap}>
          <EmptyState
            title="Không thể tiếp tục"
            description={error || 'Kỹ thuật viên không còn khả dụng.'}
          />
          <AppButton title="Kiểm tra lại" onPress={() => void load()} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  const rating = Number(therapist.ratingAverage ?? 0);
  const distance = formatDistance(therapist.distanceKm);
  const availableSlots = availability?.slots?.filter(slot => slot.available) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Chi tiết kỹ thuật viên" back />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {therapist.avatarUrl ? (
            <Image source={{ uri: therapist.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={38} color={APP_COLOR.PRIMARY_DARK} />
            </View>
          )}

          <View style={styles.profileBody}>
            <Text style={styles.name}>{therapist.fullName || therapist.name || 'Kỹ thuật viên'}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={APP_COLOR.ACCENT} />
              <Text style={styles.ratingText}>
                {rating > 0 ? rating.toFixed(1) : 'Mới'}
                {therapist.ratingCount ? ` (${therapist.ratingCount} đánh giá)` : ''}
              </Text>
            </View>

            <View style={styles.metaLine}>
              {!!therapist.experienceYears && (
                <Text style={styles.metaText}>{therapist.experienceYears} năm kinh nghiệm</Text>
              )}
              {!!distance && <Text style={styles.metaText}>{distance}</Text>}
            </View>
          </View>
        </View>

        {!!therapist.bio && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            <Text style={styles.bodyText}>{therapist.bio}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dịch vụ đã chọn</Text>
          <Text style={styles.serviceName}>{therapist.serviceName || 'Dịch vụ massage'}</Text>
          {!!therapist.optionLabel && <Text style={styles.optionLabel}>{therapist.optionLabel}</Text>}

          <View style={styles.serviceMeta}>
            {!!therapist.durationMinutes && (
              <View style={styles.serviceMetaItem}>
                <Ionicons name="time-outline" size={17} color={APP_COLOR.MUTED} />
                <Text style={styles.serviceMetaText}>{formatDuration(therapist.durationMinutes)}</Text>
              </View>
            )}

            {therapist.price !== undefined && therapist.price !== null && (
              <View style={styles.serviceMetaItem}>
                <Ionicons name="cash-outline" size={17} color={APP_COLOR.MUTED} />
                <Text style={styles.price}>{formatCurrency(therapist.price)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Chọn khung giờ</Text>
              <Text style={styles.sectionSubtitle}>{date.split('-').reverse().join('/')}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => void load()}>
              <Ionicons name="refresh" size={21} color={APP_COLOR.PRIMARY} />
            </TouchableOpacity>
          </View>

          {!availability?.available || !availableSlots.length ? (
            <View style={styles.noSlots}>
              <Ionicons name="time-outline" size={30} color="#94A3B8" />
              <Text style={styles.noSlotsTitle}>Không còn khung giờ phù hợp</Text>
              {!!availability?.reason && (
                <Text style={styles.noSlotsText}>{availability.reason}</Text>
              )}
            </View>
          ) : (
            <View style={styles.slots}>
              {availability.slots.map(slot => {
                const selected = slot.available && slot.startTime === selectedTime;

                return (
                  <TouchableOpacity
                    key={`${slot.startTime}-${slot.endTime}`}
                    disabled={!slot.available}
                    activeOpacity={0.75}
                    onPress={() => handleSlotSelect(slot)}
                    style={[
                      styles.slot,
                      selected && styles.slotSelected,
                      !slot.available && styles.slotDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.slotTime,
                        selected && styles.slotTimeSelected,
                        !slot.available && styles.slotTimeDisabled,
                      ]}>
                      {slot.startTime}
                    </Text>
                    <Text
                      style={[
                        styles.slotEnd,
                        selected && styles.slotTimeSelected,
                        !slot.available && styles.slotTimeDisabled,
                      ]}>
                      → {slot.endTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Đánh giá khách hàng</Text>
          <TherapistReviews items={reviews} />
        </View>

        <AppButton
          title={selectedTime ? `Tiếp tục · ${selectedTime}` : 'Chọn khung giờ để tiếp tục'}
          disabled={!selectedTime}
          onPress={handleContinue}
          icon={<Ionicons name="arrow-forward" size={19} color="#FFFFFF" />}
          style={styles.continueButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingBottom: 34 },
  stateWrap: { flex: 1, padding: 20 },
  retryButton: { marginTop: 14 },
  profileCard: {
    flexDirection: 'row', padding: 17, borderRadius: 20, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  avatar: { width: 82, height: 82, borderRadius: 24, backgroundColor: '#E2E8F0' },
  avatarFallback: {
    width: 82, height: 82, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  profileBody: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  name: { color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  ratingText: { color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '800' },
  metaLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 8 },
  metaText: { color: APP_COLOR.MUTED, fontSize: 12 },
  card: {
    marginTop: 13, padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  sectionTitle: { color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { marginTop: 3, color: APP_COLOR.MUTED, fontSize: 12 },
  bodyText: { marginTop: 8, color: APP_COLOR.MUTED, fontSize: 14, lineHeight: 21 },
  serviceName: { marginTop: 9, color: APP_COLOR.TEXT, fontSize: 15, fontWeight: '800' },
  optionLabel: { marginTop: 4, color: APP_COLOR.MUTED, fontSize: 13 },
  serviceMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  serviceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  serviceMetaText: { color: APP_COLOR.MUTED, fontSize: 13, fontWeight: '700' },
  price: { color: APP_COLOR.PRIMARY, fontSize: 14, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  slot: {
    minWidth: 88, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 13,
    borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: '#F8FAFC',
  },
  slotSelected: { borderColor: APP_COLOR.PRIMARY, backgroundColor: APP_COLOR.PRIMARY },
  slotDisabled: { opacity: 0.35, backgroundColor: '#F1F5F9' },
  slotTime: { color: APP_COLOR.TEXT, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  slotEnd: { marginTop: 2, color: APP_COLOR.MUTED, textAlign: 'center', fontSize: 10 },
  slotTimeSelected: { color: '#FFFFFF' },
  slotTimeDisabled: { color: '#94A3B8' },
  noSlots: { alignItems: 'center', paddingVertical: 22 },
  noSlotsTitle: { marginTop: 8, color: APP_COLOR.TEXT, fontSize: 14, fontWeight: '800' },
  noSlotsText: { marginTop: 5, color: APP_COLOR.MUTED, fontSize: 12, textAlign: 'center' },
  reviewSection: { marginTop: 20 },
  reviewTitle: { marginBottom: 10, color: APP_COLOR.TEXT, fontSize: 18, fontWeight: '900' },
  continueButton: { marginTop: 18 },
});

export default TherapistDetailPage;
