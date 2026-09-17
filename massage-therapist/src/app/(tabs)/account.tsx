import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingState from '@/components/common/LoadingState';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import { useUserStore } from '@/store/useUserStore';
import type { TherapistSelfProfile } from '@/types';
import { getTherapistSelfAPI, updateAcceptingBookingsAPI, updateTherapistSelfAPI } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { APP_COLOR } from '@/utils/constant';

const AccountPage = () => {
  const logout = useUserStore(state => state.logout);
  const [profile, setProfile] = useState<TherapistSelfProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getTherapistSelfAPI(); setProfile(data); setFullName(data.fullName ?? ''); setBio(data.bio ?? ''); setExperienceYears(String(data.experienceYears ?? 0));
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    const years = Number(experienceYears);
    if (!fullName.trim()) return setError('Họ tên không được để trống.');
    if (!Number.isFinite(years) || years < 0) return setError('Số năm kinh nghiệm không hợp lệ.');
    setSaving(true); setError(''); setMessage('');
    try { const updated = await updateTherapistSelfAPI({ fullName: fullName.trim(), bio: bio.trim(), experienceYears: years }); setProfile(current => ({ ...(current ?? updated), ...updated })); setMessage('Đã cập nhật hồ sơ.'); }
    catch (e) { setError(getApiErrorMessage(e, 'Không thể cập nhật hồ sơ.')); }
    finally { setSaving(false); }
  };

  const toggle = async (value: boolean) => {
    if (!profile) return;
    if (value && profile.verificationStatus !== 'verified') { setError('KTV cần được xác minh trước khi bật nhận booking.'); return; }
    setSaving(true); setError('');
    try { const updated = await updateAcceptingBookingsAPI(value); setProfile(current => ({ ...(current ?? updated), ...updated, isAcceptingBookings: value })); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tài khoản KTV</Text><Text style={styles.subtitle}>Hồ sơ công khai và trạng thái hoạt động của bạn.</Text>
        <View style={styles.statusCard}>
          <View style={styles.flex}><Text style={styles.statusTitle}>Nhận booking</Text><Text style={styles.statusMeta}>Xác minh: {profile?.verificationStatus ?? 'pending'}</Text></View>
          <Switch value={Boolean(profile?.isAcceptingBookings)} onValueChange={value => void toggle(value)} disabled={saving} />
        </View>
        <View style={styles.card}>
          <AppInput label="Họ và tên" value={fullName} onChangeText={setFullName} />
          <AppInput label="Số năm kinh nghiệm" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" />
          <Text style={styles.label}>Giới thiệu</Text>
          <TextInput value={bio} onChangeText={setBio} multiline numberOfLines={5} textAlignVertical="top" placeholder="Giới thiệu kinh nghiệm, phong cách phục vụ..." style={styles.bio} />
          {!!profile?.phone && <Text style={styles.meta}>SĐT: {profile.phone}</Text>}
          {!!profile?.email && <Text style={styles.meta}>Email: {profile.email}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!message && <Text style={styles.success}>{message}</Text>}
          <AppButton title="Lưu hồ sơ" loading={saving} onPress={() => void save()} />
        </View>
        <AppButton title="Đăng xuất" variant="danger" style={styles.logout} onPress={() => void logout()} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLOR.BACKGROUND },
  content: { padding: 16, paddingBottom: 110 },
  title: { color: APP_COLOR.TEXT, fontSize: 26, fontWeight: '900' },
  subtitle: { color: APP_COLOR.MUTED, lineHeight: 20, marginTop: 6 },
  statusCard: { backgroundColor: APP_COLOR.PRIMARY, borderRadius: 18, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  statusTitle: { color: '#fff', fontWeight: '900', fontSize: 17 },
  statusMeta: { color: '#D1FAE5', marginTop: 5 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: APP_COLOR.BORDER, borderRadius: 16, padding: 16, marginTop: 14 },
  label: { color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  bio: { minHeight: 112, borderRadius: 13, borderWidth: 1, borderColor: APP_COLOR.BORDER, backgroundColor: '#fff', padding: 12, color: APP_COLOR.TEXT },
  meta: { color: APP_COLOR.MUTED, marginTop: 9 },
  error: { color: APP_COLOR.DANGER, marginVertical: 10 },
  success: { color: APP_COLOR.SUCCESS, marginVertical: 10, fontWeight: '700' },
  logout: { marginTop: 18 },
});

export default AccountPage;
