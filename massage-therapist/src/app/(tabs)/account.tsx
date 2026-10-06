import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/common/LoadingState';
import { TherapistReviews } from '@/components/ratings/TherapistReviews';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import type { TherapistProfile } from '@/types';
import {
  getTherapistProfileAPI,
  updateAcceptingBookingsAPI,
  updateTherapistProfileAPI,
} from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const getVerificationLabel = (
  status?: TherapistProfile['verificationStatus'],
) => {
  switch (status) {
    case 'verified':
      return 'Đã xác minh';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return 'Chờ xác minh';
  }
};

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
    setError(null);

    try {
      const data = await getTherapistProfileAPI();

      setProfile(data);
      setFullName(data.fullName ?? '');
      setBio(data.bio ?? '');
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
    const normalizedName = fullName.trim();

    if (normalizedName.length < 2) {
      setError('Vui lòng nhập họ và tên hợp lệ.');
      return;
    }

    if (normalizedName.length > 255) {
      setError('Họ và tên không được vượt quá 255 ký tự.');
      return;
    }

    if (bio.trim().length > 2000) {
      setError('Giới thiệu không được vượt quá 2000 ký tự.');
      return;
    }

    const years =
      experienceYears.trim() === '' ? null : Number(experienceYears.trim());

    if (
      years !== null &&
      (!Number.isFinite(years) || years < 0 || years > 80)
    ) {
      setError('Số năm kinh nghiệm không hợp lệ.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateTherapistProfileAPI({
        fullName: normalizedName,
        bio: bio.trim() || null,
        experienceYears: years,
      });

      setProfile(updated);
      setFullName(updated.fullName ?? '');
      setBio(updated.bio ?? '');
      setExperienceYears(String(updated.experienceYears ?? 0));
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccepting = async (value: boolean) => {
    if (!profile) return;

    if (profile.verificationStatus !== 'verified') {
      setError('Chỉ kỹ thuật viên đã xác minh mới có thể bật nhận booking.');
      return;
    }

    setUpdatingAccepting(true);
    setError(null);

    try {
      const updated = await updateAcceptingBookingsAPI(value);
      setProfile(updated);
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

  const verified = profile?.verificationStatus === 'verified';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tài khoản</Text>
        <Text style={styles.description}>
          Quản lý hồ sơ kỹ thuật viên và trạng thái nhận booking.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.summary}>
          <Text style={styles.summaryName}>
            {profile?.fullName || 'Kỹ thuật viên'}
          </Text>
          <Text style={styles.summaryMeta}>{profile?.phone || ''}</Text>
          {profile?.email ? (
            <Text style={styles.summaryMeta}>{profile.email}</Text>
          ) : null}

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Xác minh</Text>
            <Text style={styles.statusValue}>
              {getVerificationLabel(profile?.verificationStatus)}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Đánh giá</Text>
            <Text style={styles.statusValue}>
              {Number(profile?.ratingAverage ?? 0).toFixed(1)} (
              {profile?.ratingCount ?? 0})
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Đã hoàn thành</Text>
            <Text style={styles.statusValue}>
              {profile?.completedBookings ?? 0} booking
            </Text>
          </View>
        </View>

        <View style={styles.acceptCard}>
          <View style={styles.flex}>
            <Text style={styles.acceptTitle}>Trạng thái nhận lịch</Text>
            <Text style={styles.acceptDescription}>
              {verified
                ? 'Bật để sẵn sàng nhận booking mới từ khách hàng.'
                : 'Chỉ kỹ thuật viên đã xác minh mới được bật nhận booking.'}
            </Text>
          </View>

          <Switch
            value={profile?.isAcceptingBookings ?? false}
            disabled={!verified || updatingAccepting}
            onValueChange={toggleAccepting}
            trackColor={{ false: '#CBD5E1', true: APP_COLOR.PRIMARY }}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Thông tin hồ sơ</Text>

          <AppInput
            label="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            maxLength={255}
          />

          <AppInput
            label="Giới thiệu bản thân"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={2000}
            placeholder="Giới thiệu kinh nghiệm, phong cách phục vụ..."
            style={styles.bioInput}
          />

          <AppInput
            label="Số năm kinh nghiệm"
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
          />

          <AppButton
            title="Lưu hồ sơ"
            loading={saving}
            disabled={saving}
            onPress={() => void save()}
          />
        </View>

        {profile?.id ? (
          <View style={styles.reviews}>
            <TherapistReviews
              therapistId={profile.id}
              ratingAverage={profile.ratingAverage}
              ratingCount={profile.ratingCount}
            />
          </View>
        ) : null}

        <View style={styles.logout}>
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
  flex: {
    flex: 1,
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
    gap: 12,
  },
  statusLabel: {
    color: '#99F6E4',
    fontSize: 13,
  },
  statusValue: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
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
    marginTop: 22,
    gap: 14,
  },
  sectionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  bioInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  reviews: {
    marginTop: 22,
  },
  logout: {
    marginTop: 22,
  },
});

export default AccountPage;
