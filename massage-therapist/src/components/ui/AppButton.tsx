import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

type Props = Omit<ComponentProps<typeof TouchableOpacity>, 'children'> & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

const AppButton = ({ title, loading, disabled, variant = 'primary', style, ...props }: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? APP_COLOR.PRIMARY : '#fff'} />
      ) : (
        <Text style={[styles.text, (variant === 'secondary' || variant === 'ghost') && styles.darkText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: APP_COLOR.PRIMARY },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: APP_COLOR.BORDER },
  danger: { backgroundColor: APP_COLOR.DANGER },
  ghost: { backgroundColor: APP_COLOR.PRIMARY_LIGHT },
  disabled: { opacity: 0.55 },
  text: { color: '#fff', fontSize: 15, fontWeight: '800' },
  darkText: { color: APP_COLOR.PRIMARY_DARK },
});

export default AppButton;
