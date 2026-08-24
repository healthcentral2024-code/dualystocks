import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Badge } from './ui/Badge';
import { useRouter } from 'expo-router';
import { ScreenerStock } from '@workspace/api-client-react';

interface StockRowProps {
  stock: ScreenerStock | { ticker: string; companyName: string; price: number; changePercent: number; overallScore?: number; overallVerdict?: string; sector?: string; };
  onPress?: () => void;
  showScore?: boolean;
}

export function StockRow({ stock, onPress, showScore }: StockRowProps) {
  const c = useColors();
  const router = useRouter();
  const isUp = stock.changePercent >= 0;

  const handlePress = () => {
    if (onPress) onPress();
    else router.push(`/analysis/${stock.ticker}`);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: c.border }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={[styles.ticker, { color: c.foreground }]}>{stock.ticker}</Text>
        <Text style={[styles.name, { color: c.mutedForeground }]} numberOfLines={1}>
          {stock.companyName}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: c.foreground }]}>${stock.price.toFixed(2)}</Text>
          <Badge variant={isUp ? 'success' : 'destructive'} style={styles.changeBadge}>
            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </Badge>
        </View>
        
        {showScore && 'overallScore' in stock && stock.overallScore !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: c.primary }]}>{stock.overallScore}</Text>
            <Text style={[styles.scoreLabel, { color: c.mutedForeground }]}>Score</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    paddingRight: 16,
  },
  ticker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  score: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  scoreLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
});