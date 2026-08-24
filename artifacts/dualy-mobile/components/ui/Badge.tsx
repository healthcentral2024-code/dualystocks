import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const c = useColors();

  let bg = c.primary;
  let textCol = c.primaryForeground;
  let borderW = 0;
  let borderCol = 'transparent';

  if (variant === 'secondary') {
    bg = c.secondary;
    textCol = c.secondaryForeground;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textCol = c.foreground;
    borderW = 1;
    borderCol = c.border;
  } else if (variant === 'destructive') {
    bg = c.destructive;
    textCol = c.destructiveForeground;
  } else if (variant === 'success') {
    bg = '#10b981'; // explicit emerald
    textCol = '#fff';
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderWidth: borderW,
        },
        style
      ]}
    >
      <Text style={[styles.text, { color: textCol }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});