import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { LoadingState } from '@/components/common/LoadingState';
import { useUserStore } from '@/store/useUserStore';
import type { TherapistProfile } from '@/types';
import {
  getTherapistProfileAPI,
  updateAcceptingBookingsAPI,
  updateTherapistProfileAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const AccountPage = () => {
  const logout = useUserStore((state) => state.logout);

  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAccepting, setUpdatingAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getTherapistProfileAPI();

      setProfile(data);
      setFullName(data.fullName);
      setBio(data.bio || '');
      setExperienceYears(String(data.experienceYears ?? 0));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateTherapistProfileAPI({
        fullName: fullName.trim(),
        bio: bio.trim() || null,
        experienceYears: Number(experienceYears) || 0,
      });

      setProfile(updated);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccepting = async (value: boolean) => {
    setUpdatingAccepting(true);
    setError(null);

    try {
      setProfile(await updateAcceptingBookingsAPI(value));
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError));
    } finally {
      setUpdatingAccepting(false);
    }
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
        <Text style={styles.title}>Tài khoản</Text>
        <Text style={styles.description}>
          Quản lý hồ sơ kỹ thuật viên và trạng thái nhận booking.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.summary}>
          <Text style={styles.summaryName}>{profile?.fullName}</Text>
          <Text style={styles.summaryMeta}>{profile?.phone}</Text>
          <Text style={styles.summaryMeta}>{profile?.email || ''}</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Xác minh</Text>
            <Text style={styles.statusValue}>{profile?.verificationStatus}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Đánh giá</Text>
            <Text style={styles.statusValue}>
              {Number(profile?.ratingAverage ?? 0).toFixed(2)} (
              {profile?.ratingCount ?? 0})
            </Text>
          </View>
        </View>

        <View style={styles.acceptCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.acceptTitle}>Nhận booking</Text>
            <Text style={styles.acceptDescription}>
              Chỉ KTV đã verified mới có thể bật chức năng này.
            </Text>
          </View>

          <Switch
            value={profile?.isAcceptingBookings ?? false}
            disabled={updatingAccepting}
            onValueChange={toggleAccepting}
            trackColor={{
              true: APP_COLOR.PRIMARY,
            }}
          />
        </View>

        <View style={styles.form}>
          <AppInput
            label="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
          />

          <AppInput label="Giới thiệu" value={bio} onChangeText={setBio} multiline />

          <AppInput
            label="Số năm kinh nghiệm"
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
          />

          <AppButton title="Lưu hồ sơ" loading={saving} onPress={save} />

          <AppButton
            title="Đăng xuất"
            variant="danger"
            onPress={() => void logout()}
          />
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
  summary: {
    marginTop: 18,
    padding: 17,
    borderRadius: 18,
    backgroundColor: APP_COLOR.PRIMARY,
    gap: 7,
  },
  summaryName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryMeta: {
    color: '#CCFBF1',
    fontSize: 13,
  },
  statusRow: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: '#99F6E4',
    fontSize: 13,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  acceptCard: {
    marginTop: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    gap: 12,
  },
  acceptTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  acceptDescription: {
    marginTop: 4,
    color: APP_COLOR.MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    marginTop: 18,
    gap: 14,
  },
});

export default AccountPage;
