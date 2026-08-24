import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const c = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 16,
    overflow: 'hidden',
  },
});