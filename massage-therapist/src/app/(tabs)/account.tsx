import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
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
  const authUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
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

      if (authUser) {
        await setUser({
          ...authUser,
          fullName: updated.fullName,
        });
      }
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccepting = async (value: boolean) => {
    if (!profile) {
      return;
    }

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Ionicons name="person-outline" size={23} color={APP_COLOR.PRIMARY} />
          </View>

          <View style={styles.flex}>
            <Text style={styles.title}>Hồ sơ kỹ thuật viên</Text>
            <Text style={styles.description}>
              Cập nhật thông tin hiển thị với khách hàng.
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.summaryGrid}>
          <View style={styles.statCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <Text style={styles.statLabel}>Xác minh</Text>
            <Text style={styles.statValueSmall}>
              {getVerificationLabel(profile?.verificationStatus)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star" size={19} color="#F59E0B" />
            <Text style={styles.statLabel}>Đánh giá</Text>
            <Text style={styles.statValue}>
              {Number(profile?.ratingAverage ?? 0).toFixed(1)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={APP_COLOR.PRIMARY}
            />
            <Text style={styles.statLabel}>Hoàn thành</Text>
            <Text style={styles.statValue}>{profile?.completedBookings ?? 0}</Text>
          </View>
        </View>

        <View style={styles.acceptCard}>
          <View style={styles.flex}>
            <Text style={styles.acceptTitle}>Trạng thái nhận lịch</Text>
            <Text style={styles.acceptDescription}>
              Chỉ kỹ thuật viên đã xác minh mới được bật nhận booking.
            </Text>
          </View>

          <Switch
            value={profile?.isAcceptingBookings ?? false}
            disabled={!verified || updatingAccepting}
            onValueChange={toggleAccepting}
            trackColor={{ false: '#CBD5E1', true: APP_COLOR.PRIMARY }}
          />
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Thông tin hồ sơ</Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactName}>
              {profile?.fullName || 'Kỹ thuật viên'}
            </Text>
            <Text style={styles.contactMeta}>{profile?.phone || ''}</Text>
            {profile?.email ? (
              <Text style={styles.contactMeta}>{profile.email}</Text>
            ) : null}
          </View>

          <View style={styles.form}>
            <AppInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              maxLength={255}
            />

            <AppInput
              label="Số năm kinh nghiệm"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              maxLength={2}
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

            <AppButton
              title="Lưu hồ sơ"
              loading={saving}
              disabled={saving}
              onPress={() => void save()}
            />
          </View>
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headingIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 28,
    fontWeight: '900',
  },
  description: {
    marginTop: 3,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    marginTop: 12,
    color: APP_COLOR.DANGER,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryGrid: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 118,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  statLabel: {
    marginTop: 8,
    color: APP_COLOR.MUTED,
    fontSize: 11,
  },
  statValue: {
    marginTop: 5,
    color: APP_COLOR.TEXT,
    fontSize: 21,
    fontWeight: '900',
  },
  statValueSmall: {
    marginTop: 5,
    color: APP_COLOR.TEXT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
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
  profileCard: {
    marginTop: 22,
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  sectionTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  contactBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  contactName: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '900',
  },
  contactMeta: {
    marginTop: 4,
    color: APP_COLOR.MUTED,
    fontSize: 12,
  },
  form: {
    marginTop: 16,
    gap: 14,
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
