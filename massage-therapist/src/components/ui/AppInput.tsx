import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { APP_COLOR } from '@/utils/constant';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  password?: boolean;
};

export const AppInput = ({
  label,
  error,
  password = false,
  style,
  ...props
}: Props) => {
  const [secure, setSecure] = useState(password);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          {...props}
          secureTextEntry={secure}
          placeholderTextColor="#94A3B8"
          style={[styles.input, style]}
        />

        {password ? (
          <Pressable
            hitSlop={10}
            onPress={() => setSecure((value) => !value)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={APP_COLOR.MUTED}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: APP_COLOR.TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrapper: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  inputError: {
    borderColor: '#FCA5A5',
  },
  input: {
    flex: 1,
    color: APP_COLOR.TEXT,
    fontSize: 15,
    paddingVertical: 12,
  },
  error: {
    color: APP_COLOR.DANGER,
    fontSize: 12,
  },
});
