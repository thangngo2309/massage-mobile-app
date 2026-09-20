import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { LoadingState } from '@/components/common/LoadingState';
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

const defaultSchedule: WorkingHour[] = Array.from({ length: 7 }, (_, day) => ({
  dayOfWeek: day,
  startTime: '08:00',
  endTime: '17:00',
  isActive: false,
}));

const SchedulePage = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingException, setSavingException] = useState(false);
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
      setExceptions(exceptionItems);
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
    const grouped = new Map<number, WorkingHour[]>();

    for (const hour of workingHours) {
      const list = grouped.get(hour.dayOfWeek) ?? [];
      list.push(hour);
      grouped.set(hour.dayOfWeek, list);
    }

    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      items:
        grouped.get(dayOfWeek) ??
        defaultSchedule.filter((item) => item.dayOfWeek === dayOfWeek),
    }));
  }, [workingHours]);

  const updateHour = (
    dayOfWeek: number,
    index: number,
    patch: Partial<WorkingHour>,
  ) => {
    setWorkingHours((current) => {
      let next = current;

      if (!current.some((item) => item.dayOfWeek === dayOfWeek)) {
        next = [
          ...current,
          {
            dayOfWeek,
            startTime: '08:00',
            endTime: '17:00',
            isActive: false,
          },
        ];
      }

      const dayItems = next.filter((item) => item.dayOfWeek === dayOfWeek);
      const target = dayItems[index];

      if (!target) return next;

      let occurrence = -1;

      return next.map((item) => {
        if (item.dayOfWeek !== dayOfWeek) return item;

        occurrence += 1;

        return occurrence === index ? { ...item, ...patch } : item;
      });
    });
  };

  const addShift = (dayOfWeek: number) => {
    setWorkingHours((current) => [
      ...current,
      {
        dayOfWeek,
        startTime: '13:00',
        endTime: '17:00',
        isActive: true,
      },
    ]);
  };

  const removeShift = (dayOfWeek: number, index: number) => {
    let occurrence = -1;

    setWorkingHours((current) =>
      current.filter((item) => {
        if (item.dayOfWeek !== dayOfWeek) return true;

        occurrence += 1;
        return occurrence !== index;
      }),
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
      setError('Ngày nghỉ phải có định dạng YYYY-MM-DD');
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
          try {
            await deleteScheduleExceptionAPI(id);
            setExceptions((current) => current.filter((item) => item.id !== id));
          } catch (deleteError) {
            setError(getApiErrorMessage(deleteError));
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
          Có thể cấu hình nhiều ca trong cùng một ngày. Các ca active không được
          chồng lấn nhau.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          {displayHours.map((day) => (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayLabels[day.dayOfWeek]}</Text>

                <Pressable onPress={() => addShift(day.dayOfWeek)}>
                  <Text style={styles.addShift}>+ Thêm ca</Text>
                </Pressable>
              </View>

              {day.items.map((item, index) => (
                <View
                  key={`${day.dayOfWeek}-${index}`}
                  style={styles.shiftRow}>
                  <Switch
                    value={item.isActive}
                    onValueChange={(value) =>
                      updateHour(day.dayOfWeek, index, {
                        isActive: value,
                      })
                    }
                    trackColor={{
                      true: APP_COLOR.PRIMARY,
                    }}
                  />

                  <TextInput
                    value={item.startTime}
                    onChangeText={(value) =>
                      updateHour(day.dayOfWeek, index, {
                        startTime: value,
                      })
                    }
                    style={styles.timeInput}
                    placeholder="08:00"
                    maxLength={5}
                  />

                  <Text style={styles.dash}>-</Text>

                  <TextInput
                    value={item.endTime}
                    onChangeText={(value) =>
                      updateHour(day.dayOfWeek, index, {
                        endTime: value,
                      })
                    }
                    style={styles.timeInput}
                    placeholder="17:00"
                    maxLength={5}
                  />

                  {day.items.length > 1 ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => removeShift(day.dayOfWeek, index)}>
                      <Text style={styles.remove}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ))}

          <AppButton
            title="Lưu lịch làm việc"
            loading={savingHours}
            onPress={saveWorkingHours}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Ngày nghỉ / ngoại lệ lịch</Text>

        <View style={styles.exceptionForm}>
          <TextInput
            value={exceptionDate}
            onChangeText={setExceptionDate}
            style={styles.field}
            placeholder="YYYY-MM-DD"
          />

          <TextInput
            value={exceptionNote}
            onChangeText={setExceptionNote}
            style={styles.field}
            placeholder="Ghi chú, ví dụ: Nghỉ cá nhân"
          />

          <AppButton
            title="Thêm ngày nghỉ"
            variant="secondary"
            loading={savingException}
            onPress={addDayOff}
          />
        </View>

        {exceptions.map((item) => (
          <View key={item.id} style={styles.exceptionCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exceptionDate}>{item.date}</Text>

              <Text style={styles.exceptionText}>
                {item.isDayOff
                  ? 'Nghỉ cả ngày'
                  : `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`}
              </Text>

              {item.note ? (
                <Text style={styles.exceptionNote}>{item.note}</Text>
              ) : null}
            </View>

            <Pressable onPress={() => deleteException(item.id)}>
              <Text style={styles.deleteText}>Xóa</Text>
            </Pressable>
          </View>
        ))}
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
  },
  section: {
    marginTop: 18,
    gap: 12,
  },
  dayCard: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  addShift: {
    color: APP_COLOR.PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 70,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    color: APP_COLOR.TEXT,
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
  },
  dash: {
    color: APP_COLOR.MUTED,
    fontWeight: '800',
  },
  remove: {
    color: APP_COLOR.DANGER,
    fontSize: 25,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    marginVertical: 28,
    backgroundColor: APP_COLOR.BORDER,
  },
  sectionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 21,
    fontWeight: '900',
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
  exceptionCard: {
    marginTop: 11,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 13,
  },
  exceptionNote: {
    marginTop: 5,
    color: APP_COLOR.TEXT,
    fontSize: 13,
  },
  deleteText: {
    color: APP_COLOR.DANGER,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SchedulePage;
