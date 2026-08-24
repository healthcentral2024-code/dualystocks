import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  style?: StyleProp<TextStyle>;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const c = useColors();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.input,
            color: c.foreground,
            borderColor: error ? c.destructive : c.border,
          },
          style
        ]}
        placeholderTextColor={c.mutedForeground}
        {...props}
      />
      {error && <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 6,
  },
});