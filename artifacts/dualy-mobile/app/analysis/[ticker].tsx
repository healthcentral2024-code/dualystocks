import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { 
  useGetAnalysis, 
  useGetChartAnalysis, 
  useGetTrendAnalysis,
  getGetAnalysisQueryKey,
  getGetChartAnalysisQueryKey,
  getGetTrendAnalysisQueryKey,
  useGetFavorites,
  usePostFavorite,
  useDeleteFavorite,
  getGetFavoritesQueryKey,
  useGetBillingSubscription,
  getGetBillingSubscriptionQueryKey,
} from '@workspace/api-client-react';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/lib/i18n';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MiniChart } from '@/components/Chart';
import { Button } from '@/components/ui/Button';
import { OptionsOutlook } from '@/components/OptionsOutlook';

export default function AnalysisPage() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { apiLang, lang } = useLanguage();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const safeTicker = ticker?.toUpperCase() || '';
  const subscription = useGetBillingSubscription({
    query: {
      enabled: !!isSignedIn,
      queryKey: getGetBillingSubscriptionQueryKey(),
    },
  });
  const canAccess = !!isSignedIn && !!subscription.data?.active;

  const analysis = useGetAnalysis(safeTicker, { lang: apiLang }, {
    query: {
      enabled: canAccess && !!safeTicker,
      queryKey: getGetAnalysisQueryKey(safeTicker, { lang: apiLang }),
    },
  });
  const chart = useGetChartAnalysis(safeTicker, { lang: apiLang }, {
    query: {
      enabled: canAccess && !!safeTicker,
      queryKey: getGetChartAnalysisQueryKey(safeTicker, { lang: apiLang }),
    },
  });
  const trend = useGetTrendAnalysis(safeTicker, { lang: apiLang }, {
    query: {
      enabled: canAccess && !!safeTicker,
      queryKey: getGetTrendAnalysisQueryKey(safeTicker, { lang: apiLang }),
    },
  });

  const favoritesQueryKey = getGetFavoritesQueryKey({ lang: apiLang });
  const favs = useGetFavorites({ lang: apiLang }, {
    query: { enabled: canAccess, queryKey: favoritesQueryKey },
  });
  const isFavorite = favs.data?.favorites.some(f => f.ticker === safeTicker) || false;

  const postFav = usePostFavorite();
  const delFav = useDeleteFavorite();

  const toggleFavorite = () => {
    if (!isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }

    if (isFavorite) {
      delFav.mutate({ ticker: safeTicker }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesQueryKey })
      });
    } else {
      postFav.mutate({ data: { ticker: safeTicker } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesQueryKey })
      });
    }
  };

  const openNews = (url: string) => {
    WebBrowser.openBrowserAsync(url);
  };

  const isUp = (analysis.data?.changePercent || 0) >= 0;

  if (!isSignedIn) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Feather name="lock" size={48} color={c.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: c.foreground }]}>
          {lang === 'es' ? 'Inicia sesión para analizar' : 'Sign in to analyze'}
        </Text>
        <Text style={[styles.errorDesc, { color: c.mutedForeground }]}>
          {lang === 'es'
            ? 'Tu cuenta mantiene sincronizados el acceso Premium y tus favoritos.'
            : 'Your account keeps Premium access and favorites in sync.'}
        </Text>
        <Button
          title={lang === 'es' ? 'Iniciar sesión' : 'Sign in'}
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      </View>
    );
  }

  if (subscription.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!subscription.data?.active) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Feather name="lock" size={48} color={c.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: c.foreground }]}>
          {lang === 'es' ? 'Análisis Premium' : 'Premium Analysis'}
        </Text>
        <Text style={[styles.errorDesc, { color: c.mutedForeground }]}>
          {lang === 'es'
            ? 'Activa o gestiona tu suscripción en la web de DualyStocks.'
            : 'Activate or manage your subscription on the DualyStocks website.'}
        </Text>
        <Button
          title={lang === 'es' ? 'Volver' : 'Go back'}
          variant="outline"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  if (analysis.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ color: c.mutedForeground, marginTop: 16 }}>{lang === 'es' ? 'Analizando...' : 'Analyzing...'}</Text>
      </View>
    );
  }

  if (analysis.isError || !analysis.data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Feather name="alert-triangle" size={48} color={c.destructive} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: c.foreground }]}>
          {lang === 'es' ? 'Error al cargar' : 'Failed to load'}
        </Text>
        <Text style={[styles.errorDesc, { color: c.mutedForeground }]}>
          {lang === 'es' ? 'No pudimos analizar esta acción.' : 'We could not analyze this stock.'}
        </Text>
        <TouchableOpacity style={[styles.backBtn, { borderColor: c.border }]} onPress={() => router.back()}>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>{lang === 'es' ? 'Volver' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = analysis.data;
  const chartData = chart.data?.candles.map(c => c.close) || [];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: c.border, backgroundColor: c.card }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={c.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.ticker, { color: c.foreground }]}>{d.ticker}</Text>
          <Text style={[styles.company, { color: c.mutedForeground }]} numberOfLines={1}>{d.companyName}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={toggleFavorite}>
          <Feather name="star" size={24} color={isFavorite ? '#eab308' : c.mutedForeground} style={isFavorite ? styles.starFilled : null} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Price & Score */}
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.price, { color: c.foreground }]}>${d.price.toFixed(2)}</Text>
            <Badge variant={isUp ? 'success' : 'destructive'} style={{ alignSelf: 'flex-start' }}>
              {isUp ? '+' : ''}{d.changePercent.toFixed(2)}%
            </Badge>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreValue, { color: d.overallScore >= 70 ? c.primary : d.overallScore < 40 ? c.destructive : '#eab308' }]}>
              {d.overallScore}
            </Text>
            <Text style={[styles.scoreLabel, { color: c.mutedForeground }]}>Score</Text>
          </View>
        </View>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card style={{ marginVertical: 24, padding: 24, alignItems: 'center' }}>
            <MiniChart data={chartData} width={280} height={100} />
            {chart.data?.technical && (
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground }}>{chart.data.technical.verdict}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', color: c.mutedForeground, marginTop: 4, textAlign: 'center' }}>
                  {lang === 'es' ? 'Señal de compra técnica:' : 'Technical buy signal:'} {chart.data.technical.buyScore}/100
                </Text>
              </View>
            )}
          </Card>
        )}

        {chart.data?.optionsOutlook && (
          <OptionsOutlook outlook={chart.data.optionsOutlook} lang={lang} />
        )}

        <Text style={[styles.sectionTitle, { color: c.foreground }]}>{lang === 'es' ? 'Veredicto' : 'Verdict'}</Text>
        <Card style={{ marginBottom: 24, backgroundColor: c.secondary }}>
          <Text style={[styles.verdict, { color: c.foreground }]}>{d.overallVerdict}</Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: c.foreground }]}>{lang === 'es' ? 'Puntos Clave' : 'Key Takeaways'}</Text>
        <View style={{ marginBottom: 24 }}>
          {d.summary.map((sum, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: c.primary }]} />
              <Text style={[styles.bulletText, { color: c.foreground }]}>{sum}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 16 }]}>{lang === 'es' ? 'Desglose' : 'Breakdown'}</Text>
        <View style={{ gap: 16, marginBottom: 24 }}>
          {d.categories.map((cat, i) => (
            <Card key={i}>
              <View style={styles.catHeader}>
                <Text style={[styles.catTitle, { color: c.foreground }]}>{cat.label}</Text>
                <Text style={[styles.catScore, { color: cat.score >= 70 ? c.primary : cat.score < 40 ? c.destructive : '#eab308' }]}>{cat.score}/100</Text>
              </View>
              <Text style={[styles.catVerdict, { color: c.mutedForeground }]}>{cat.verdict}</Text>
            </Card>
          ))}
        </View>

        {/* Trend Analysis */}
        {trend.isFetching && !trend.data ? (
          <View style={{ marginVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={c.primary} />
          </View>
        ) : trend.isError ? (
          <Text style={{ color: c.mutedForeground, textAlign: 'center', marginVertical: 24 }}>
            {lang === 'es' ? 'No se pudo cargar la tendencia.' : 'Could not load trend.'}
          </Text>
        ) : trend.data ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>{lang === 'es' ? 'Tendencia y Estrategia' : 'Trend & Strategy'}</Text>
            <Card style={{ marginBottom: 24 }}>
              <View style={{ marginBottom: 16 }}>
                {trend.data.frames.map((frame, i) => (
                  <View key={i} style={styles.frameRow}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, flex: 1 }}>{frame.frame}</Text>
                    <Badge variant={frame.trend === 'alcista' || frame.trend === 'bullish' ? 'success' : frame.trend === 'bajista' || frame.trend === 'bearish' ? 'destructive' : 'secondary'}>
                      {frame.trend}
                    </Badge>
                  </View>
                ))}
              </View>
              <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, paddingTop: 16 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', color: c.foreground, marginBottom: 8 }}>
                  {trend.data.signal.message}
                </Text>
                {trend.data.signal.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: c.mutedForeground }]} />
                    <Text style={[styles.bulletText, { color: c.mutedForeground }]}>{b}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        {/* Earnings Dates */}
        {(d.lastEarningsDate || d.nextEarningsDate) && (
          <View style={{ marginBottom: 24, flexDirection: 'row', gap: 16 }}>
            {d.lastEarningsDate && (
              <Card style={{ flex: 1, backgroundColor: c.secondary }}>
                <Text style={{ fontFamily: 'Inter_500Medium', color: c.mutedForeground, fontSize: 12, marginBottom: 4 }}>
                  {lang === 'es' ? 'Resultados Anteriores' : 'Last Earnings'}
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', color: c.foreground }}>
                  {new Date(d.lastEarningsDate).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Card>
            )}
            {d.nextEarningsDate && (
              <Card style={{ flex: 1, backgroundColor: c.secondary }}>
                <Text style={{ fontFamily: 'Inter_500Medium', color: c.mutedForeground, fontSize: 12, marginBottom: 4 }}>
                  {lang === 'es' ? 'Próximos Resultados' : 'Next Earnings'}
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', color: c.foreground }}>
                  {new Date(d.nextEarningsDate).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Recent News */}
        {d.recentNews && d.recentNews.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>{lang === 'es' ? 'Noticias Recientes' : 'Recent News'}</Text>
            <View style={{ gap: 12 }}>
              {d.recentNews.map((news, i) => (
                <TouchableOpacity key={i} onPress={() => openNews(news.url)} activeOpacity={0.7}>
                  <Card>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.foreground, fontSize: 15, marginBottom: 8 }}>
                      {news.title}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', color: c.mutedForeground, fontSize: 12 }}>
                        {new Date(news.publishedAt).toLocaleDateString()}
                      </Text>
                      {news.impact && (
                        <Badge variant={news.impact === 'positive' ? 'success' : news.impact === 'negative' ? 'destructive' : 'secondary'} textStyle={{ fontSize: 10 }}>
                          {news.impact}
                        </Badge>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  errorDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    padding: 8,
  },
  starFilled: {
    // optional fill styling
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  ticker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  company: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    marginBottom: 8,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    lineHeight: 56,
  },
  scoreLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  verdict: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  catScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  catVerdict: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  frameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});