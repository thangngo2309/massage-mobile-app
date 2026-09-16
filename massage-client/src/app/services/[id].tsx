import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import type { Service } from '@/types';
import { getClientServiceAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { firstRouteParam, formatCurrency, formatDuration } from '@/utils/helpers';
import { pushRoute } from '@/utils/navigation';

const ServiceDetailPage = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const serviceId = Number(firstRouteParam(params.id));

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setError('Mã dịch vụ không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      setService(await getClientServiceAPI(serviceId));
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải chi tiết dịch vụ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [serviceId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Chi tiết dịch vụ" back />
        <LoadingState message="Đang tải liệu trình..." />
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Chi tiết dịch vụ" back />
        <View style={styles.stateWrap}>
          <EmptyState title="Không thể tải dịch vụ" description={error || 'Dịch vụ không tồn tại.'} />
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeOptions = (service.options ?? []).filter(option => option.isActive !== false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Chọn liệu trình" subtitle={service.name} back />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={27} color={APP_COLOR.PRIMARY} />
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
          {!!service.description && <Text style={styles.description}>{service.description}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Liệu trình khả dụng</Text>

        {!activeOptions.length ? (
          <EmptyState
            title="Chưa có liệu trình"
            description="Dịch vụ này hiện chưa có lựa chọn đang hoạt động."
          />
        ) : (
          activeOptions.map(option => {
            const label = option.name || option.label || `Liệu trình #${option.id}`;

            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.75}
                style={styles.optionCard}
                onPress={() =>
                  pushRoute(
                    `/(tabs)/therapists?serviceId=${service.id}&serviceOptionId=${option.id}`,
                  )
                }>
                <View style={styles.optionTop}>
                  <Text style={styles.optionName}>{label}</Text>
                  <Ionicons name="arrow-forward-circle" size={25} color={APP_COLOR.PRIMARY} />
                </View>

                {!!option.description && (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={15} color={APP_COLOR.MUTED} />
                    <Text style={styles.metaText}>{formatDuration(option.durationMinutes)}</Text>
                  </View>

                  {option.price !== undefined && option.price !== null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="cash-outline" size={15} color={APP_COLOR.MUTED} />
                      <Text style={styles.metaPrice}>{formatCurrency(option.price)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  hero: {
    padding: 18, borderRadius: 20, borderWidth: 1, borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  heroIcon: {
    width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  serviceName: { marginTop: 14, color: APP_COLOR.TEXT, fontSize: 22, fontWeight: '900' },
  description: { marginTop: 8, color: APP_COLOR.MUTED, fontSize: 14, lineHeight: 21 },
  sectionTitle: { marginTop: 22, marginBottom: 11, color: APP_COLOR.TEXT, fontSize: 18, fontWeight: '900' },
  optionCard: {
    marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.SURFACE,
  },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  optionName: { flex: 1, color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  optionDescription: { marginTop: 7, color: APP_COLOR.MUTED, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 999, backgroundColor: '#F8FAFC',
  },
  metaText: { color: APP_COLOR.MUTED, fontSize: 12, fontWeight: '700' },
  metaPrice: { color: APP_COLOR.PRIMARY, fontSize: 12, fontWeight: '900' },
  stateWrap: { flex: 1, padding: 20 },
  retryButton: {
    alignSelf: 'center', marginTop: 14, paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, backgroundColor: APP_COLOR.PRIMARY,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});

export default ServiceDetailPage;
