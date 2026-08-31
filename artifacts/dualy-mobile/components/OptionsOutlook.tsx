import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type {
  OptionsHistoricalOutlook,
  OptionsHorizonOutlookHorizon,
  OptionsDirectionalOutlookReasonsItem,
} from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui/Card';

type Lang = 'es' | 'en';

const labels = {
  es: {
    title: 'Contexto histórico para CALL y PUT',
    subtitle: 'Compara la dirección y el movimiento reciente de la acción para el plazo elegido.',
    week: '1 semana',
    two_weeks: '2 semanas',
    month: '1 mes',
    range: 'Rango histórico estimado',
    move: 'Movimiento típico',
    volatility: 'Volatilidad realizada',
    percentile: 'Percentil histórico',
    favorable: 'Condiciones favorables',
    unfavorable: 'Condiciones poco favorables',
    score: 'Puntuación histórica',
    insufficient: 'No hay suficientes sesiones recientes para calcular una orientación responsable.',
    disclaimer: 'Este semáforo evalúa únicamente el historial de la acción. No conoce la prima, strike, vencimiento, volatilidad implícita ni griegas de un contrato real; no indica que una opción esté barata o cara y no es una recomendación.',
  },
  en: {
    title: 'Historical CALL and PUT context',
    subtitle: "Compare the stock's recent direction and movement for the selected time frame.",
    week: '1 week',
    two_weeks: '2 weeks',
    month: '1 month',
    range: 'Estimated historical range',
    move: 'Typical move',
    volatility: 'Realized volatility',
    percentile: 'Historical percentile',
    favorable: 'Favorable conditions',
    unfavorable: 'Less favorable conditions',
    score: 'Historical score',
    insufficient: 'There are not enough recent sessions to calculate a responsible outlook.',
    disclaimer: "This signal evaluates only the stock's history. It does not know a real contract's premium, strike, expiration, implied volatility, or Greeks; it does not say an option is cheap or expensive and is not a recommendation.",
  },
} as const;

const reasons: Record<OptionsDirectionalOutlookReasonsItem, Record<Lang, string>> = {
  bullish_trend: { es: 'La tendencia de fondo es alcista.', en: 'The underlying trend is bullish.' },
  bearish_trend: { es: 'La tendencia de fondo es bajista.', en: 'The underlying trend is bearish.' },
  sideways_trend: { es: 'La tendencia lateral no favorece una dirección clara.', en: 'The sideways trend does not favor a clear direction.' },
  rsi_overbought: { es: 'El RSI está sobrecomprado; aumenta el riesgo de retroceso.', en: 'RSI is overbought, increasing pullback risk.' },
  rsi_oversold: { es: 'El RSI está sobrevendido; aumenta la posibilidad de rebote.', en: 'RSI is oversold, increasing rebound potential.' },
  rsi_balanced: { es: 'El RSI está en una zona equilibrada.', en: 'RSI is in a balanced zone.' },
  room_to_resistance: { es: 'Hay espacio histórico suficiente antes de la resistencia.', en: 'There is enough historical room before resistance.' },
  limited_room_to_resistance: { es: 'La resistencia está cerca frente al movimiento esperado.', en: 'Resistance is close relative to the expected move.' },
  room_to_support: { es: 'Hay espacio histórico suficiente antes del soporte.', en: 'There is enough historical room before support.' },
  limited_room_to_support: { es: 'El soporte está cerca frente al movimiento esperado.', en: 'Support is close relative to the expected move.' },
  elevated_historical_volatility: { es: 'El movimiento reciente está elevado frente a su historial.', en: 'Recent movement is elevated versus its history.' },
  normal_historical_volatility: { es: 'El movimiento reciente está dentro de su comportamiento normal.', en: 'Recent movement is within its normal behavior.' },
};

export function OptionsOutlook({
  outlook,
  lang,
}: {
  outlook: OptionsHistoricalOutlook;
  lang: Lang;
}) {
  const c = useColors();
  const copy = labels[lang];
  const [selectedHorizon, setSelectedHorizon] =
    useState<OptionsHorizonOutlookHorizon>('week');
  const selected =
    outlook.horizons.find((item) => item.horizon === selectedHorizon) ??
    outlook.horizons[0];
  const money = (value: number) => `$${value.toFixed(2)}`;

  return (
    <View style={styles.section} testID="section-options-outlook">
      <Text style={[styles.title, { color: c.foreground }]}>{copy.title}</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{copy.subtitle}</Text>

      {!outlook.available || !selected ? (
        <Card style={{ marginTop: 16, backgroundColor: '#fffbeb' }}>
          <Text style={{ color: '#92400e', lineHeight: 20 }}>{copy.insufficient}</Text>
        </Card>
      ) : (
        <>
          <View style={[styles.selector, { backgroundColor: c.secondary }]}>
            {outlook.horizons.map((item) => {
              const active = item.horizon === selected.horizon;
              return (
                <TouchableOpacity
                  key={item.horizon}
                  onPress={() => setSelectedHorizon(item.horizon)}
                  style={[
                    styles.selectorButton,
                    active && { backgroundColor: c.card, borderColor: c.border },
                  ]}
                  testID={`button-options-${item.horizon}`}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: active ? c.foreground : c.mutedForeground },
                    ]}
                  >
                    {copy[item.horizon]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Card style={{ marginTop: 12 }}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>{copy.range}</Text>
                <Text style={[styles.metricValue, { color: c.foreground }]}>
                  {money(selected.lowerPrice)} – {money(selected.upperPrice)}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>{copy.move}</Text>
                <Text style={[styles.metricValue, { color: c.foreground }]}>
                  ±{money(selected.expectedMove)} ({selected.expectedMovePercent.toFixed(1)}%)
                </Text>
              </View>
            </View>
            <View style={[styles.volatilityRow, { borderTopColor: c.border }]}>
              <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>
                {copy.volatility}: {outlook.realizedVolatilityPercent?.toFixed(1) ?? '—'}%
              </Text>
              {outlook.volatilityPercentile !== null && (
                <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>
                  {copy.percentile}: {outlook.volatilityPercentile.toFixed(0)}%
                </Text>
              )}
            </View>
          </Card>

          {(['call', 'put'] as const).map((side) => {
            const reading = selected[side];
            const favorable = reading.status === 'favorable';
            const accent = favorable ? '#059669' : '#e11d48';
            const background = favorable ? '#ecfdf5' : '#fff1f2';
            return (
              <View
                key={side}
                style={[styles.reading, { borderColor: accent, backgroundColor: background }]}
                testID={`card-options-${side}`}
              >
                <View style={styles.readingHeader}>
                  <View style={styles.sideTitle}>
                    <Feather
                      name={side === 'call' ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={accent}
                    />
                    <Text style={[styles.sideName, { color: '#0f172a' }]}>{side.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: accent }]}>
                    <Text style={styles.statusText}>
                      {favorable ? copy.favorable : copy.unfavorable}
                    </Text>
                  </View>
                </View>
                <Text style={styles.score}>{copy.score}: {reading.score}/100</Text>
                {reading.reasons.map((reason) => (
                  <View key={reason} style={styles.reasonRow}>
                    <Text style={{ color: '#475569' }}>•</Text>
                    <Text style={styles.reasonText}>{reasons[reason][lang]}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}

      <Text style={[styles.disclaimer, { color: c.mutedForeground, borderTopColor: c.border }]}>
        {copy.disclaimer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: 24 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, marginBottom: 6 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  selector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginTop: 16 },
  selectorButton: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  selectorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'center' },
  metricRow: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1 },
  metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase' },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 5 },
  volatilityRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 12, gap: 5 },
  reading: { borderWidth: 2, borderRadius: 16, padding: 16, marginTop: 12 },
  readingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sideTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sideName: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  statusPill: { flexShrink: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 10, textAlign: 'center' },
  score: { color: '#64748b', fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase', marginTop: 12, marginBottom: 7 },
  reasonRow: { flexDirection: 'row', gap: 8, marginTop: 5 },
  reasonText: { color: '#334155', flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  disclaimer: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 14, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});