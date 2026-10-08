import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/common/LoadingState';
import { AppButton } from '@/components/ui/AppButton';
import type { ScheduleException, WorkingHour } from '@/types';
import {
  createScheduleExceptionAPI,
  deleteScheduleExceptionAPI,
  getScheduleExceptionsAPI,
  getWorkingHoursAPI,
  replaceWorkingHoursAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const dayLabels = [
  'Chủ nhật',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
];

const SchedulePage = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingException, setSavingException] = useState(false);
  const [deletingExceptionId, setDeletingExceptionId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionNote, setExceptionNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [hours, exceptionItems] = await Promise.all([
        getWorkingHoursAPI(),
        getScheduleExceptionsAPI(),
      ]);

      setWorkingHours(hours);
      setExceptions(
        [...exceptionItems].sort((a, b) => a.date.localeCompare(b.date)),
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayHours = useMemo(() => {
    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      items: workingHours
        .map((item, sourceIndex) => ({ item, sourceIndex }))
        .filter(({ item }) => item.dayOfWeek === dayOfWeek),
    }));
  }, [workingHours]);

  const updateShift = (sourceIndex: number, patch: Partial<WorkingHour>) => {
    setWorkingHours((current) =>
      current.map((item, index) =>
        index === sourceIndex
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const addShift = (dayOfWeek: number) => {
    setWorkingHours((current) => [
      ...current,
      {
        dayOfWeek,
        startTime: '08:00',
        endTime: '17:00',
        isActive: true,
      },
    ]);
  };

  const removeShift = (sourceIndex: number) => {
    setWorkingHours((current) =>
      current.filter((_, index) => index !== sourceIndex),
    );
  };

  const saveWorkingHours = async () => {
    setSavingHours(true);
    setError(null);

    try {
      const saved = await replaceWorkingHoursAPI(workingHours);
      setWorkingHours(saved);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSavingHours(false);
    }
  };

  const addDayOff = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exceptionDate)) {
      setError('Ngày nghỉ phải có định dạng YYYY-MM-DD.');
      return;
    }

    setSavingException(true);
    setError(null);

    try {
      const created = await createScheduleExceptionAPI({
        date: exceptionDate,
        isDayOff: true,
        note: exceptionNote.trim() || undefined,
      });

      setExceptions((current) =>
        [...current, created].sort((a, b) => a.date.localeCompare(b.date)),
      );

      setExceptionDate('');
      setExceptionNote('');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSavingException(false);
    }
  };

  const deleteException = (id: number) => {
    Alert.alert('Xóa ngày nghỉ', 'Bạn chắc chắn muốn xóa ngoại lệ lịch này?', [
      {
        text: 'Không',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setDeletingExceptionId(id);
          setError(null);

          try {
            await deleteScheduleExceptionAPI(id);
            setExceptions((current) =>
              current.filter((item) => item.id !== id),
            );
          } catch (deleteError) {
            setError(getApiErrorMessage(deleteError));
          } finally {
            setDeletingExceptionId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lịch làm việc</Text>

        <Text style={styles.description}>
          Thiết lập các ca làm việc hàng tuần và ngày nghỉ. Bạn có thể thêm nhiều
          ca trong cùng một ngày.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Ca làm việc hàng tuần</Text>
            <Text style={styles.sectionDescription}>
              Xóa hết các ca của một ngày để đặt ngày đó thành nghỉ.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          {displayHours.map((day) => (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayLabels[day.dayOfWeek]}</Text>

                <Pressable
                  hitSlop={8}
                  onPress={() => addShift(day.dayOfWeek)}
                  style={({ pressed }) => [
                    styles.addShiftButton,
                    pressed ? styles.pressed : null,
                  ]}>
                  <Ionicons name="add" size={17} color={APP_COLOR.PRIMARY} />
                  <Text style={styles.addShift}>Thêm ca</Text>
                </Pressable>
              </View>

              {!day.items.length ? (
                <View style={styles.restBox}>
                  <Text style={styles.restText}>Nghỉ</Text>
                </View>
              ) : (
                <View style={styles.shiftList}>
                  {day.items.map(({ item, sourceIndex }) => (
                    <View
                      key={`${day.dayOfWeek}-${sourceIndex}`}
                      style={styles.shiftRow}>
                      <View style={styles.timeFields}>
                        <TextInput
                          value={item.startTime}
                          onChangeText={(value) =>
                            updateShift(sourceIndex, {
                              startTime: value,
                            })
                          }
                          style={styles.timeInput}
                          placeholder="08:00"
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />

                        <Text style={styles.dash}>-</Text>

                        <TextInput
                          value={item.endTime}
                          onChangeText={(value) =>
                            updateShift(sourceIndex, {
                              endTime: value,
                            })
                          }
                          style={styles.timeInput}
                          placeholder="17:00"
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>

                      <Pressable
                        hitSlop={8}
                        onPress={() => removeShift(sourceIndex)}
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed ? styles.pressed : null,
                        ]}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={APP_COLOR.DANGER}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <AppButton
            title="Lưu lịch làm việc"
            loading={savingHours}
            disabled={savingHours}
            onPress={() => void saveWorkingHours()}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="calendar-outline"
              size={21}
              color={APP_COLOR.PRIMARY}
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Ngày nghỉ</Text>
            <Text style={styles.sectionDescription}>
              Tạo ngoại lệ cho những ngày bạn không nhận lịch.
            </Text>
          </View>
        </View>

        <View style={styles.exceptionForm}>
          <TextInput
            value={exceptionDate}
            onChangeText={setExceptionDate}
            style={styles.field}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
          />

          <TextInput
            value={exceptionNote}
            onChangeText={setExceptionNote}
            style={[styles.field, styles.noteInput]}
            placeholder="Lý do hoặc ghi chú..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />

          <AppButton
            title="Thêm ngày nghỉ"
            variant="secondary"
            loading={savingException}
            disabled={!exceptionDate || savingException}
            onPress={() => void addDayOff()}
          />
        </View>

        <View style={styles.exceptionSection}>
          <Text style={styles.exceptionTitle}>Ngoại lệ đã tạo</Text>

          {!exceptions.length ? (
            <View style={styles.emptyException}>
              <Text style={styles.emptyExceptionText}>Chưa có ngoại lệ.</Text>
            </View>
          ) : (
            exceptions.map((item) => (
              <View key={item.id} style={styles.exceptionCard}>
                <View style={styles.flex}>
                  <Text style={styles.exceptionDate}>{item.date}</Text>

                  <Text style={styles.exceptionText}>
                    {item.isDayOff
                      ? 'Nghỉ cả ngày'
                      : `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`}
                  </Text>

                  <Text style={styles.exceptionNote}>
                    {item.note || 'Ngày nghỉ'}
                  </Text>
                </View>

                <Pressable
                  disabled={deletingExceptionId === item.id}
                  onPress={() => deleteException(item.id)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed ? styles.pressed : null,
                  ]}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={APP_COLOR.DANGER}
                  />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.65,
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
  error: {
    marginTop: 12,
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  sectionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionDescription: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginTop: 14,
    gap: 12,
  },
  dayCard: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  dayTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  addShiftButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  addShift: {
    color: APP_COLOR.PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  restBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  restText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  shiftList: {
    marginTop: 12,
    gap: 9,
  },
  shiftRow: {
    minHeight: 54,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  timeFields: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  timeInput: {
    flex: 1,
    minWidth: 72,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    color: APP_COLOR.TEXT,
    textAlign: 'center',
    backgroundColor: APP_COLOR.SURFACE,
    fontSize: 14,
    fontWeight: '700',
  },
  dash: {
    color: APP_COLOR.MUTED,
    fontWeight: '800',
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  divider: {
    height: 1,
    marginTop: 28,
    backgroundColor: APP_COLOR.BORDER,
  },
  exceptionForm: {
    marginTop: 14,
    gap: 10,
  },
  field: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    color: APP_COLOR.TEXT,
  },
  noteInput: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  exceptionSection: {
    marginTop: 22,
  },
  exceptionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyException: {
    marginTop: 10,
    padding: 16,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
  },
  emptyExceptionText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  exceptionCard: {
    marginTop: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  exceptionDate: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '900',
  },
  exceptionText: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  exceptionNote: {
    marginTop: 5,
    color: APP_COLOR.TEXT,
    fontSize: 13,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
});

export default SchedulePage;
