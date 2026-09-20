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

  const save = async () => {
    const numericPrice = Number(price.replace(/[^\d]/g, ''));

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Giá dịch vụ không hợp lệ');
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
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.serviceName}</Text>
          <Text style={styles.meta}>
            {item.optionLabel || `${item.durationMinutes} phút`}
          </Text>
        </View>

        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{
            true: APP_COLOR.PRIMARY,
          }}
        />
      </View>

      <Text style={styles.defaultPrice}>
        Giá mặc định: {formatCurrency(item.defaultPrice)}
      </Text>

      <TextInput
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        style={styles.input}
        placeholder="Giá KTV"
      />

      <Text style={styles.fee}>
        Phí nền tảng: {Number(item.platformFeeRate).toFixed(2)}%
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton title="Lưu thay đổi" loading={saving} onPress={save} />
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Dịch vụ của tôi</Text>
            <Text style={styles.description}>
              Điều chỉnh giá và bật/tắt các dịch vụ bạn đang cung cấp.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? <LoadingState /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Chưa có dịch vụ"
              description="Dịch vụ cần được Admin gán cho kỹ thuật viên trước."
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
  card: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 11,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  defaultPrice: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    paddingHorizontal: 14,
    color: APP_COLOR.TEXT,
    backgroundColor: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  fee: {
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
  },
});

export default ServicesPage;
