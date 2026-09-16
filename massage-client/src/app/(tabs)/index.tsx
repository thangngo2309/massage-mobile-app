import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserStore } from '@/store/useUserStore';
import { APP_COLOR } from '@/utils/constant';
import { pushRoute } from '@/utils/navigation';

const HomePage = () => {
  const user = useUserStore(state => state.user);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Xin chào</Text>
            <Text style={styles.name}>{user?.fullName ?? 'Khách hàng'}</Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={APP_COLOR.PRIMARY_DARK} />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>MASSAGE IN ROOM</Text>
          <Text style={styles.title}>Thư giãn ngay tại nơi bạn ở</Text>
          <Text style={styles.description}>
            Chọn dịch vụ, kỹ thuật viên, thời gian và địa điểm. Hệ thống sẽ kiểm tra lịch khả dụng trước khi đặt.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.heroButton}
            onPress={() => pushRoute('/(tabs)/services')}>
            <Text style={styles.heroButtonText}>Khám phá dịch vụ</Text>
            <Ionicons name="arrow-forward" size={18} color={APP_COLOR.PRIMARY_DARK} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quy trình đặt lịch</Text>

        {[
          ['1', 'Chọn dịch vụ', 'Chọn liệu trình và thời lượng phù hợp.'],
          ['2', 'Tìm kỹ thuật viên', 'Tìm KTV phù hợp theo khu vực và thời gian.'],
          ['3', 'Chọn thời gian', 'Chọn khung giờ còn khả dụng của kỹ thuật viên.'],
          ['4', 'Xác nhận booking', 'Kiểm tra thông tin và gửi yêu cầu đặt lịch.'],
        ].map(([number, title, description]) => (
          <View key={number} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{number}</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDescription}>{description}</Text>
            </View>
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
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  greeting: {
    color: APP_COLOR.MUTED,
    fontSize: 13,
  },
  name: {
    marginTop: 2,
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  hero: {
    marginTop: 8,
    borderRadius: 24,
    padding: 22,
    backgroundColor: APP_COLOR.PRIMARY,
  },
  badge: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: '#D1FAE5',
    fontSize: 15,
    lineHeight: 22,
  },
  heroButton: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  heroButtonText: {
    color: APP_COLOR.PRIMARY_DARK,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    color: APP_COLOR.TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY_LIGHT,
  },
  stepNumberText: {
    color: APP_COLOR.PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
    marginLeft: 13,
  },
  stepTitle: {
    color: APP_COLOR.TEXT,
    fontSize: 15,
    fontWeight: '800',
  },
  stepDescription: {
    marginTop: 4,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default HomePage;
