import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}: ButtonProps) {
  const c = useColors();

  let bg = c.primary;
  let textCol = c.primaryForeground;
  let borderW = 0;
  let borderCol = 'transparent';

  if (variant === 'outline') {
    bg = 'transparent';
    textCol = c.foreground;
    borderW = 1;
    borderCol = c.border;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textCol = c.foreground;
  } else if (variant === 'destructive') {
    bg = c.destructive;
    textCol = c.destructiveForeground;
  }

  let paddingV = 14;
  let paddingH = 24;
  let fontSize = 16;

  if (size === 'sm') {
    paddingV = 8;
    paddingH = 16;
    fontSize = 14;
  } else if (size === 'lg') {
    paddingV = 18;
    paddingH = 32;
    fontSize = 18;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderWidth: borderW,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius: colors.radius,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textCol} />
      ) : (
        <>
          {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { color: textCol, size: fontSize * 1.2, style: { marginRight: 8 } }) : icon}
          <Text style={[styles.text, { color: textCol, fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});