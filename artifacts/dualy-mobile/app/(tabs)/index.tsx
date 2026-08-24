import React, { useCallback, useState } from 'react';
import { Image, ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { 
  useGetMarketPulse, 
  useGetRecentAnalyses, 
  useGetTopPicks, 
  useGetFavorites,
  useGetBillingSubscription,
  getGetBillingSubscriptionQueryKey,
  getGetTopPicksQueryKey,
  getGetFavoritesQueryKey
} from '@workspace/api-client-react';
import { StockRow } from '@/components/StockRow';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function IndexPage() {
  const { isSignedIn } = useAuth();
  const { apiLang, lang } = useLanguage();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const marketPulse = useGetMarketPulse({ lang: apiLang });
  const recent = useGetRecentAnalyses();
  
  // Only enabled if signed in
  const sub = useGetBillingSubscription({ query: { enabled: !!isSignedIn, queryKey: getGetBillingSubscriptionQueryKey() } });
  const isPremium = !!sub.data?.active;

  const topPicks = useGetTopPicks({ lang: apiLang }, { query: { enabled: !!isSignedIn && isPremium, queryKey: getGetTopPicksQueryKey({ lang: apiLang }) } });
  const favorites = useGetFavorites({ lang: apiLang }, { query: { enabled: !!isSignedIn && isPremium, queryKey: getGetFavoritesQueryKey({ lang: apiLang }) } });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      marketPulse.refetch(),
      recent.refetch(),
      isSignedIn && sub.refetch(),
      isSignedIn && isPremium && topPicks.refetch(),
      isSignedIn && isPremium && favorites.refetch(),
    ].filter(Boolean));
    setRefreshing(false);
  }, [marketPulse, recent, isSignedIn, sub, isPremium, topPicks, favorites]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <View style={styles.brandHeader}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>
          {lang === 'es' ? 'Pulso del Mercado' : 'Market Pulse'}
        </Text>
        {marketPulse.data ? (
          <Card>
            <View style={styles.pulseHeader}>
              <Badge variant={marketPulse.data.mood === 'up' ? 'success' : marketPulse.data.mood === 'down' ? 'destructive' : 'secondary'}>
                {marketPulse.data.mood.toUpperCase()}
              </Badge>
            </View>
            <Text style={[styles.pulseSummary, { color: c.foreground }]}>
              {marketPulse.data.summary}
            </Text>
            <View style={styles.sectors}>
              {marketPulse.data.sectors.slice(0, 3).map((sec, i) => (
                <View key={i} style={styles.sectorRow}>
                  <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium', flex: 1 }}>{sec.label}</Text>
                  <Text style={{ color: sec.changeToday >= 0 ? c.primary : c.destructive, fontFamily: 'Inter_600SemiBold' }}>
                    {sec.changeToday > 0 ? '+' : ''}{sec.changeToday.toFixed(2)}%
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <Text style={{ color: c.mutedForeground }}>{lang === 'es' ? 'Cargando...' : 'Loading...'}</Text>
        )}
      </View>

      {!isSignedIn && (
        <View style={styles.section}>
          <Card style={{ backgroundColor: c.secondary, borderColor: c.border }}>
            <Text style={[styles.promoTitle, { color: c.foreground }]}>
              {lang === 'es' ? 'Desbloquea DualyStocks Premium' : 'Unlock DualyStocks Premium'}
            </Text>
            <Text style={[styles.promoDesc, { color: c.mutedForeground }]}>
              {lang === 'es' 
                ? 'Regístrate para ver las Mejores Opciones diarias y seguir tus acciones favoritas.' 
                : 'Sign in to see daily Top Picks and track your favorite stocks.'}
            </Text>
            <Button 
              title={lang === 'es' ? 'Iniciar Sesión' : 'Sign In'} 
              onPress={() => router.push('/(auth)/sign-in')} 
            />
          </Card>
        </View>
      )}

      {isSignedIn && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>
            {lang === 'es' ? 'Top Picks Diarias' : 'Daily Top Picks'}
          </Text>
          {!isPremium && sub.isSuccess ? (
            <Card style={{ alignItems: 'center', padding: 24 }}>
              <Feather name="lock" size={32} color={c.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={[styles.promoTitle, { color: c.foreground, textAlign: 'center' }]}>
                {lang === 'es' ? 'Exclusivo Premium' : 'Premium Exclusive'}
              </Text>
              <Text style={[styles.promoDesc, { color: c.mutedForeground, textAlign: 'center' }]}>
                {lang === 'es' 
                  ? 'Activa tu suscripción en la web de DualyStocks para ver las mejores acciones del día.' 
                  : 'Activate your subscription on the DualyStocks website to see the best stocks of the day.'}
              </Text>
            </Card>
          ) : topPicks.data ? (
            <Card style={{ padding: 0 }}>
              {topPicks.data.picks.map((pick, i) => (
                <StockRow key={pick.ticker} stock={pick} />
              ))}
            </Card>
          ) : (
            <Text style={{ color: c.mutedForeground }}>{lang === 'es' ? 'Cargando...' : 'Loading...'}</Text>
          )}
        </View>
      )}

      {isSignedIn && favorites.data && favorites.data.favorites.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>
            {lang === 'es' ? 'Tus Favoritas' : 'Your Favorites'}
          </Text>
          <Card style={{ padding: 0 }}>
            {favorites.data.favorites.map((fav) => (
              fav.stock ? <StockRow key={fav.ticker} stock={fav.stock} /> : null
            ))}
          </Card>
        </View>
      )}

      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>
          {lang === 'es' ? 'Análisis Recientes' : 'Recent Analyses'}
        </Text>
        {recent.data ? (
          <Card style={{ padding: 0 }}>
            {recent.data.map((rec) => (
              <StockRow key={rec.ticker} stock={rec} showScore />
            ))}
          </Card>
        ) : (
          <Text style={{ color: c.mutedForeground }}>{lang === 'es' ? 'Cargando...' : 'Loading...'}</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  brandHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  brandLogo: {
    width: 280,
    height: 106,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  pulseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pulseSummary: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  sectors: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 8,
  },
  sectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promoTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  promoDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});