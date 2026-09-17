import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';

import { APP_COLOR } from '@/utils/constant';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

const AppInput = ({ label, error, secureTextEntry, style, ...props }: Props) => {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, !!error && styles.errorBorder]}>
        <TextInput
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry ? hidden : false}
          style={[styles.input, style]}
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setHidden(value => !value)} style={styles.eye}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={21} color={APP_COLOR.MUTED} />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 13 },
  label: { color: APP_COLOR.TEXT, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  inputWrap: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    borderRadius: 13,
  },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, color: APP_COLOR.TEXT, fontSize: 15 },
  eye: { paddingHorizontal: 12, paddingVertical: 10 },
  errorBorder: { borderColor: APP_COLOR.DANGER },
  error: { color: APP_COLOR.DANGER, fontSize: 12, marginTop: 5 },
});

export default AppInput;
