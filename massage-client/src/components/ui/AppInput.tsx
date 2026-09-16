import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { APP_COLOR } from '@/utils/constant';

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

const AppInput = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType,
  containerStyle,
  inputStyle,
  ...rest
}: AppInputProps) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={containerStyle}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocused(true)}
          onBlur={event => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={[styles.input, secureTextEntry && styles.inputPassword, inputStyle]}
          {...rest}
        />

        {secureTextEntry && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.eyeButton}
            onPress={() => setVisible(current => !current)}>
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={21}
              color={APP_COLOR.MUTED}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: APP_COLOR.PRIMARY,
  },
  inputWrapError: {
    borderColor: APP_COLOR.DANGER,
  },
  input: {
    minHeight: 52,
    color: APP_COLOR.TEXT,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  inputPassword: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 15,
  },
  error: {
    marginTop: 6,
    color: APP_COLOR.DANGER,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default AppInput;
