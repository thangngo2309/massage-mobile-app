import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingState from '@/components/common/LoadingState';
import AppButton from '@/components/ui/AppButton';
import type { CreateScheduleExceptionPayload, TherapistScheduleException, TherapistWorkingHour, WorkingHourInput } from '@/types';
import { createScheduleExceptionAPI, deleteScheduleExceptionAPI, getScheduleExceptionsAPI, getWorkingHoursAPI, replaceWorkingHoursAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';
import { formatDate } from '@/utils/helpers';

const DAYS = [
  { value: 1, label: 'Thứ 2' }, { value: 2, label: 'Thứ 3' }, { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' }, { value: 5, label: 'Thứ 6' }, { value: 6, label: 'Thứ 7' }, { value: 0, label: 'Chủ nhật' },
];

const cleanTime = (value: string) => value.trim().slice(0, 5);

const SchedulePage = () => {
  const [hours, setHours] = useState<WorkingHourInput[]>([]);
  const [exceptions, setExceptions] = useState<TherapistScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  const [isDayOff, setIsDayOff] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [workingData, exceptionData] = await Promise.all([getWorkingHoursAPI(), getScheduleExceptionsAPI()]);
      setHours(workingData.map((item: TherapistWorkingHour) => ({ dayOfWeek: item.dayOfWeek, startTime: cleanTime(item.startTime), endTime: cleanTime(item.endTime), isActive: item.isActive !== false })));
      setExceptions(exceptionData);
    } catch (e) { setError(getApiErrorMessage(e, 'Không thể tải lịch làm việc.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => Object.fromEntries(DAYS.map(day => [day.value, hours.filter(item => item.dayOfWeek === day.value)])) as Record<number, WorkingHourInput[]>, [hours]);

  const addShift = (day: number) => setHours(current => [...current, { dayOfWeek: day, startTime: '08:00', endTime: '12:00', isActive: true }]);
  const updateShift = (day: number, dayIndex: number, patch: Partial<WorkingHourInput>) => {
    let seen = -1;
    setHours(current => current.map(item => {
      if (item.dayOfWeek !== day) return item;
      seen += 1;
      return seen === dayIndex ? { ...item, ...patch } : item;
    }));
  };
  const removeShift = (day: number, dayIndex: number) => {
    let seen = -1;
    setHours(current => current.filter(item => {
      if (item.dayOfWeek !== day) return true;
      seen += 1;
      return seen !== dayIndex;
    }));
  };

  const saveHours = async () => {
    if (hours.some(item => !/^\d{2}:\d{2}$/.test(item.startTime) || !/^\d{2}:\d{2}$/.test(item.endTime))) {
      setError('Giờ làm việc phải có dạng HH:mm, ví dụ 08:00.'); return;
    }
    setSaving(true); setError('');
    try { const updated = await replaceWorkingHoursAPI(hours); setHours(updated.map(item => ({ dayOfWeek: item.dayOfWeek, startTime: cleanTime(item.startTime), endTime: cleanTime(item.endTime), isActive: item.isActive !== false }))); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể lưu lịch làm việc.')); }
    finally { setSaving(false); }
  };

  const addException = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Ngày ngoại lệ phải có dạng YYYY-MM-DD.'); return; }
    const payload: CreateScheduleExceptionPayload = { date, isDayOff, reason: reason.trim() || undefined, ...(isDayOff ? {} : { startTime, endTime }) };
    setSaving(true); setError('');
    try { const created = await createScheduleExceptionAPI(payload); setExceptions(current => [...current, created].sort((a,b) => a.date.localeCompare(b.date))); setDate(''); setReason(''); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể thêm ngoại lệ.')); }
    finally { setSaving(false); }
  };

  const removeException = async (item: TherapistScheduleException) => {
    try { await deleteScheduleExceptionAPI(item.id); setExceptions(current => current.filter(row => row.id !== item.id)); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể xóa ngoại lệ.')); }
  };

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Lịch làm việc</Text><Text style={styles.subtitle}>Một ngày có thể có nhiều ca. Backend sẽ kiểm tra trùng ca và availability.</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}

        {DAYS.map(day => (
          <View key={day.value} style={styles.dayCard}>
            <View style={styles.dayHeader}><Text style={styles.dayTitle}>{day.label}</Text><TouchableOpacity onPress={() => addShift(day.value)}><Text style={styles.add}>+ Thêm ca</Text></TouchableOpacity></View>
            {(grouped[day.value] ?? []).length === 0 && <Text style={styles.empty}>Chưa có ca làm việc.</Text>}
            {(grouped[day.value] ?? []).map((shift, index) => (
              <View key={`${day.value}-${index}`} style={styles.shiftRow}>
                <TextInput value={shift.startTime} onChangeText={value => updateShift(day.value, index, { startTime: value })} placeholder="08:00" style={styles.timeInput} maxLength={5} />
                <Text style={styles.dash}>–</Text>
                <TextInput value={shift.endTime} onChangeText={value => updateShift(day.value, index, { endTime: value })} placeholder="12:00" style={styles.timeInput} maxLength={5} />
                <Switch value={shift.isActive} onValueChange={value => updateShift(day.value, index, { isActive: value })} />
                <TouchableOpacity onPress={() => removeShift(day.value, index)}><Ionicons name="trash-outline" size={20} color={APP_COLOR.DANGER} /></TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <AppButton title="Lưu lịch làm việc" loading={saving} onPress={() => void saveHours()} />

        <Text style={styles.sectionTitle}>Ngày nghỉ / ngoại lệ</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Ngày (YYYY-MM-DD)</Text><TextInput value={date} onChangeText={setDate} placeholder="2026-09-20" style={styles.input} />
          <View style={styles.switchRow}><Text style={styles.labelNoMargin}>Nghỉ cả ngày</Text><Switch value={isDayOff} onValueChange={setIsDayOff} /></View>
          {!isDayOff && <View style={styles.partialRow}><TextInput value={startTime} onChangeText={setStartTime} style={[styles.input, styles.partial]} maxLength={5} /><Text style={styles.dash}>–</Text><TextInput value={endTime} onChangeText={setEndTime} style={[styles.input, styles.partial]} maxLength={5} /></View>}
          <Text style={styles.label}>Lý do</Text><TextInput value={reason} onChangeText={setReason} placeholder="Việc cá nhân..." style={styles.input} />
          <AppButton title="Thêm ngoại lệ" variant="ghost" disabled={saving} onPress={() => void addException()} />
        </View>

        {exceptions.map(item => (
          <View key={item.id} style={styles.exceptionCard}>
            <View style={styles.flex}><Text style={styles.exceptionDate}>{formatDate(item.date)}</Text><Text style={styles.meta}>{item.isDayOff ? 'Nghỉ cả ngày' : `${cleanTime(item.startTime ?? '')} - ${cleanTime(item.endTime ?? '')}`}</Text>{!!item.reason && <Text style={styles.meta}>{item.reason}</Text>}</View>
            <TouchableOpacity onPress={() => Alert.alert('Xóa ngoại lệ', 'Bạn chắc chắn muốn xóa?', [{ text: 'Không', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => void removeException(item) }])}><Ionicons name="trash-outline" size={21} color={APP_COLOR.DANGER} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { padding: 16, paddingBottom: 110 },
  title: { color: APP_COLOR.TEXT, fontSize: 26, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  error: { color: APP_COLOR.DANGER, marginBottom: 12, lineHeight: 20 },
  dayCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 16, padding: 14, marginBottom: 10 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { color: APP_COLOR.TEXT, fontWeight: '900', fontSize: 16 },
  add: { color: APP_COLOR.PRIMARY, fontWeight: '800' },
  empty: { color: APP_COLOR.MUTED, marginTop: 10 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  timeInput: { width: 72, height: 42, borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 10, paddingHorizontal: 9, backgroundColor: APP_COLOR.BACKGROUND, color: APP_COLOR.TEXT },
  dash: { color: APP_COLOR.MUTED },
  sectionTitle: { color: APP_COLOR.TEXT, fontSize: 20, fontWeight: '900', marginTop: 26, marginBottom: 12 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: APP_COLOR.BORDER, padding: 14 },
  label: { color: APP_COLOR.TEXT, fontWeight: '700', fontSize: 13, marginBottom: 7, marginTop: 11 },
  labelNoMargin: { color: APP_COLOR.TEXT, fontWeight: '700', fontSize: 13 },
  input: { height: 46, borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 11, paddingHorizontal: 12, color: APP_COLOR.TEXT, backgroundColor: APP_COLOR.BACKGROUND },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  partialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  partial: { flex: 1 },
  exceptionCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 14, padding: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  exceptionDate: { color: APP_COLOR.TEXT, fontWeight: '800' },
  meta: { color: APP_COLOR.MUTED, marginTop: 4, lineHeight: 18 },
});

export default SchedulePage;
