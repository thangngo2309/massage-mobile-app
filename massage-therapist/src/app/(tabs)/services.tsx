import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import type { TherapistServiceItem } from '@/types';
import { getTherapistServicesAPI, updateTherapistServiceAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { asNumber, formatCurrency } from '@/utils/helpers';

const ServicesPage = () => {
  const [items, setItems] = useState<TherapistServiceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await getTherapistServicesAPI();
      setItems(data);
      setDrafts(Object.fromEntries(data.map(item => [item.id, String(asNumber(item.price))])));
    } catch (e) { setError(getApiErrorMessage(e, 'Không thể tải dịch vụ.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (item: TherapistServiceItem, isActive = item.isActive) => {
    const price = Number((drafts[item.id] ?? '').replace(/[^0-9]/g, ''));
    if (!Number.isFinite(price) || price < 0) { setError('Giá dịch vụ không hợp lệ.'); return; }
    setSavingId(item.id); setError('');
    try {
      const updated = await updateTherapistServiceAPI(item.id, { price, isActive });
      setItems(current => current.map(row => row.id === item.id ? { ...row, ...updated, price, isActive } : row));
    } catch (e) { setError(getApiErrorMessage(e, 'Không thể cập nhật dịch vụ.')); }
    finally { setSavingId(null); }
  };

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Dịch vụ của tôi</Text><Text style={styles.subtitle}>Cập nhật giá và trạng thái nhận booking cho từng liệu trình.</Text></View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Chưa có dịch vụ" description="Admin cần gán dịch vụ cho KTV trước." />}
        renderItem={({ item }) => {
          const optionName = item.serviceOption?.name ?? `Lựa chọn #${item.serviceOptionId}`;
          const serviceName = item.serviceOption?.service?.name ?? 'Dịch vụ';
          return (
            <View style={styles.card}>
              <View style={styles.row}><View style={styles.flex}><Text style={styles.service}>{serviceName}</Text><Text style={styles.option}>{optionName}</Text>{!!item.serviceOption?.durationMinutes && <Text style={styles.meta}>{item.serviceOption.durationMinutes} phút</Text>}</View><Switch value={item.isActive} onValueChange={value => void save(item, value)} disabled={savingId === item.id} /></View>
              <Text style={styles.label}>Giá KTV</Text>
              <TextInput value={drafts[item.id] ?? ''} onChangeText={value => setDrafts(current => ({ ...current, [item.id]: value }))} keyboardType="number-pad" style={styles.input} />
              <View style={styles.infoRow}><Text style={styles.meta}>Hiện tại: {formatCurrency(item.price)}</Text>{item.platformFeeRate !== null && item.platformFeeRate !== undefined && <Text style={styles.meta}>Phí nền tảng: {asNumber(item.platformFeeRate)}%</Text>}</View>
              <TouchableOpacity style={styles.save} disabled={savingId === item.id} onPress={() => void save(item)}><Text style={styles.saveText}>{savingId === item.id ? 'Đang lưu...' : 'Lưu giá'}</Text></TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  header: { padding: 16, paddingBottom: 8 },
  title: { color: APP_COLOR.TEXT, fontSize: 26, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 20, marginTop: 6 },
  error: { color: APP_COLOR.DANGER, paddingHorizontal: 16, paddingVertical: 8 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 110 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: APP_COLOR.BORDER, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  service: { color: APP_COLOR.TEXT, fontSize: 16, fontWeight: '900' },
  option: { color: APP_COLOR.PRIMARY, fontWeight: '700', marginTop: 5 },
  meta: { color: APP_COLOR.MUTED, marginTop: 5, fontSize: 12 },
  label: { color: APP_COLOR.TEXT, fontWeight: '700', fontSize: 13, marginTop: 14, marginBottom: 7 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: APP_COLOR.BACKGROUND, paddingHorizontal: 12, color: APP_COLOR.TEXT },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  save: { alignSelf: 'flex-start', backgroundColor: APP_COLOR.PRIMARY_LIGHT, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  saveText: { color: APP_COLOR.PRIMARY_DARK, fontWeight: '800' },
});

export default ServicesPage;
