import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { AppButton } from '@/components/ui/AppButton';
import type { TherapistService } from '@/types';
import {
  getTherapistServicesAPI,
  updateTherapistServiceAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatCurrency } from '@/utils/helpers';

const ServiceItem = ({
  item,
  onChanged,
}: {
  item: TherapistService;
  onChanged: (next: TherapistService) => void;
}) => {
  const [price, setPrice] = useState(String(item.price));
  const [isActive, setIsActive] = useState(item.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrice(String(item.price));
    setIsActive(item.isActive);
  }, [item]);

  const numericPrice = Number(price.replace(/[^\d]/g, ''));
  const validPrice = Number.isFinite(numericPrice) && numericPrice > 0;

  const save = async () => {
    if (!validPrice) {
      setError('Giá dịch vụ phải lớn hơn 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateTherapistServiceAPI(item.id, {
        price: numericPrice,
        isActive,
      });

      setPrice(String(updated.price));
      setIsActive(updated.isActive);
      onChanged(updated);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.name}>{item.serviceName}</Text>
          <Text style={styles.meta}>{item.optionLabel}</Text>

          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={16} color={APP_COLOR.PRIMARY} />
            <Text style={styles.durationText}>{item.durationMinutes} phút</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : null]}>
          <Text
            style={[
              styles.statusBadgeText,
              isActive ? styles.statusBadgeTextActive : null,
            ]}>
            {isActive ? 'Đang nhận' : 'Tạm ẩn'}
          </Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giá mặc định</Text>
          <Text style={styles.summaryValue}>{formatCurrency(item.defaultPrice)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí nền tảng</Text>
          <Text style={styles.summaryValue}>{item.platformFeeRate}%</Text>
        </View>
      </View>

      <View>
        <Text style={styles.inputLabel}>Giá của bạn</Text>
        <TextInput
          value={price}
          onChangeText={(value) => {
            setPrice(value.replace(/[^\d]/g, ''));
            setError(null);
          }}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="Nhập giá dịch vụ"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.activeRow}>
        <View style={styles.flex}>
          <Text style={styles.activeTitle}>Nhận dịch vụ này</Text>
          <Text style={styles.activeDescription}>
            Tắt khi bạn tạm thời không muốn nhận booking cho dịch vụ này.
          </Text>
        </View>

        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: '#CBD5E1', true: APP_COLOR.PRIMARY }}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title="Lưu thay đổi"
        loading={saving}
        disabled={saving || !validPrice}
        onPress={() => void save()}
      />
    </View>
  );
};

const ServicesPage = () => {
  const [items, setItems] = useState<TherapistService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setItems(await getTherapistServicesAPI());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Dịch vụ của tôi</Text>

            <Text style={styles.description}>
              Quản lý giá và trạng thái nhận từng dịch vụ.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? <LoadingState /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Chưa có dịch vụ"
              description="Admin chưa gán dịch vụ nào cho tài khoản của bạn."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ServiceItem
            item={item}
            onChanged={(next) =>
              setItems((current) =>
                current.map((service) =>
                  service.id === next.id ? next : service,
                ),
              )
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.BACKGROUND,
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 30,
    fontWeight: '900',
  },
  description: {
    marginTop: 6,
    color: APP_COLOR.MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  flex: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  card: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: {
    color: APP_COLOR.TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    marginTop: 4,
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  durationRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  statusBadgeActive: {
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  statusBadgeText: {
    color: APP_COLOR.MUTED,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextActive: {
    color: APP_COLOR.PRIMARY_DARK,
  },
  summaryBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  summaryValue: {
    color: APP_COLOR.TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  inputLabel: {
    marginBottom: 6,
    color: APP_COLOR.TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    paddingHorizontal: 14,
    color: APP_COLOR.TEXT,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  activeDescription: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    marginTop: 10,
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ServicesPage;
