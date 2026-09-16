import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

const ScreenHeader = ({ title, subtitle, back = false, right }: ScreenHeaderProps) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={23} color={APP_COLOR.TEXT} />
          </TouchableOpacity>
        )}

        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {!!right && <View style={styles.right}>{right}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    marginRight: 7,
    marginTop: -3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLOR.SURFACE,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  right: {
    marginLeft: 10,
  },
});

export default ScreenHeader;
