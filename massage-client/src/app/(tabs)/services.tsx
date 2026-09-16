import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import type { Service } from '@/types';
import { getClientServicesAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { pushRoute } from '@/utils/navigation';

const ServicesPage = () => {
  const [items, setItems] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      setItems(await getClientServicesAPI());
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể tải danh sách dịch vụ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    if (!keyword) return items;

    return items.filter(item =>
      `${item.name} ${item.description ?? ''}`.toLocaleLowerCase('vi').includes(keyword),
    );
  }, [items, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dịch vụ</Text>
        <Text style={styles.subtitle}>
          Chọn dịch vụ và liệu trình, sau đó tìm kỹ thuật viên theo thời gian và khu vực.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={19} color={APP_COLOR.MUTED} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm dịch vụ..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <LoadingState message="Đang tải dịch vụ..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="Chưa có dịch vụ"
              description="Không tìm thấy dịch vụ phù hợp với từ khóa hiện tại."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.card}
              onPress={() => pushRoute(`/services/${item.id}`)}>
              <View style={styles.cardIcon}>
                <Ionicons name="sparkles" size={22} color={APP_COLOR.PRIMARY} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!!item.description && (
                  <Text numberOfLines={3} style={styles.cardDescription}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.meta}>{item.options?.length ?? 0} lựa chọn liệu trình</Text>
              </View>

              <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  title: { color: APP_COLOR.TEXT, fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 6, color: APP_COLOR.MUTED, fontSize: 14, lineHeight: 20 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16,
    marginBottom: 12, paddingHorizontal: 14, minHeight: 48, borderWidth: 1,
    borderColor: APP_COLOR.BORDER, borderRadius: 14, backgroundColor: APP_COLOR.SURFACE,
  },
  searchInput: { flex: 1, minHeight: 48, color: APP_COLOR.TEXT, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12,
    borderRadius: 18, borderWidth: 1, borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  cardContent: { flex: 1, marginHorizontal: 13 },
  cardTitle: { color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '800' },
  cardDescription: { marginTop: 6, color: APP_COLOR.MUTED, fontSize: 13, lineHeight: 19 },
  meta: { marginTop: 9, color: APP_COLOR.PRIMARY, fontSize: 13, fontWeight: '800' },
  errorWrap: { padding: 24, alignItems: 'center' },
  error: { color: APP_COLOR.DANGER, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: {
    marginTop: 14, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});

export default ServicesPage;
