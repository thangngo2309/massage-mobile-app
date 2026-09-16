import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { APP_COLOR } from '@/utils/constant';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AppButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
}: AppButtonProps) => {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (pressed || isDisabled) && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? APP_COLOR.PRIMARY : '#FFFFFF'} />
        ) : (
          icon
        )}
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.secondaryText,
            textStyle,
          ]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: APP_COLOR.PRIMARY,
  },
  secondary: {
    backgroundColor: APP_COLOR.SURFACE,
    borderWidth: 1,
    borderColor: APP_COLOR.PRIMARY,
  },
  danger: {
    backgroundColor: APP_COLOR.DANGER,
  },
  pressed: {
    opacity: 0.65,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryText: {
    color: APP_COLOR.PRIMARY,
  },
});

export default AppButton;
