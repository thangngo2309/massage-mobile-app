import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { APP_COLOR } from '@/utils/constant';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

const variantConfig: Record<
  Variant,
  { backgroundColor: string; textColor: string; borderColor?: string }
> = {
  primary: {
    backgroundColor: APP_COLOR.PRIMARY,
    textColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: APP_COLOR.SURFACE,
    textColor: APP_COLOR.PRIMARY,
    borderColor: APP_COLOR.PRIMARY,
  },
  danger: {
    backgroundColor: '#FEE2E2',
    textColor: APP_COLOR.DANGER,
    borderColor: '#FCA5A5',
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: APP_COLOR.PRIMARY,
  },
};

export const AppButton = ({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: Props) => {
  const config = variantConfig[variant];

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor || config.backgroundColor,
          opacity: disabled || loading ? 0.55 : pressed ? 0.82 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={config.textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: config.textColor,
            },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
});
