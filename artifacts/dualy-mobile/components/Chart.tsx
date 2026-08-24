import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface ChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function MiniChart({ data, color, height = 40, width = 80 }: ChartProps) {
  const c = useColors();
  if (!data || data.length === 0) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const strokeColor = color || (data[0] <= data[data.length - 1] ? c.primary : c.destructive);

  // For a filled area under the line
  const fillPath = `${points} L ${width} ${height} L 0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={strokeColor} stopOpacity="0.2" />
          <Stop offset="1" stopColor={strokeColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill="url(#grad)" />
      <Path d={points} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}