import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { 
  useGetScreener, 
  useGetBillingSubscription, 
  GetScreenerPreset, 
  getGetScreenerQueryKey, 
  getGetBillingSubscriptionQueryKey,
  GetScreenerIndex,
  GetScreenerCap,
  GetScreenerRecom,
  GetScreenerTargetUpside,
  GetScreenerOptionable,
  GetScreenerParams
} from '@workspace/api-client-react';
import { StockRow } from '@/components/StockRow';
import { Card } from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const PRESETS: { value: GetScreenerPreset; labelEs: string; labelEn: string }[] = [
  { value: 'valor', labelEs: 'Valor', labelEn: 'Value' },
  { value: 'dividendos', labelEs: 'Dividendos', labelEn: 'Dividends' },
  { value: 'oportunidades', labelEs: 'Oportunidades', labelEn: 'Opportunities' },
  { value: 'estrategia', labelEs: 'Estrategia', labelEn: 'Strategy' },
];

export default function IdeasPage() {
  const { isSignedIn } = useAuth();
  const { apiLang, lang } = useLanguage();
  const c = useColors();

  const [activePreset, setActivePreset] = useState<GetScreenerPreset>('valor');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Omit<GetScreenerParams, 'preset' | 'lang'>>({});

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined).length;

  const sub = useGetBillingSubscription({ query: { enabled: !!isSignedIn, queryKey: getGetBillingSubscriptionQueryKey() } });
  const isPremium = !!sub.data?.active;

  const screenerParams: GetScreenerParams = { preset: activePreset, lang: apiLang, ...filters };

  const screener = useGetScreener(
    screenerParams,
    { query: { enabled: !!isSignedIn && isPremium, queryKey: getGetScreenerQueryKey(screenerParams) } }
  );

  if (!isSignedIn || !isPremium) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Card style={{ margin: 24, alignItems: 'center', padding: 32 }}>
          <Feather name="lock" size={48} color={c.primary} style={{ marginBottom: 24 }} />
          <Text style={[styles.lockTitle, { color: c.foreground }]}>
            {lang === 'es' ? 'Ideas Premium' : 'Premium Ideas'}
          </Text>
          <Text style={[styles.lockDesc, { color: c.mutedForeground }]}>
            {lang === 'es' 
              ? 'Nuestras listas seleccionadas de acciones de alto potencial requieren una suscripción Premium activa. Gestiona tu plan en la web.'
              : 'Our curated lists of high-potential stocks require an active Premium subscription. Manage your plan on the web.'}
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {PRESETS.map(p => {
            const active = activePreset === p.value;
            return (
              <TouchableOpacity 
                key={p.value} 
                style={[styles.tab, active && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
                onPress={() => setActivePreset(p.value)}
              >
                <Text style={[styles.tabText, { color: active ? c.primary : c.mutedForeground }]}>
                  {lang === 'es' ? p.labelEs : p.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.filterBar, { borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Feather name="filter" size={16} color={c.foreground} style={{ marginRight: 6 }} />
          <Text style={[styles.filterBtnText, { color: c.foreground }]}>{lang === 'es' ? 'Filtros' : 'Filters'}</Text>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={() => setFilters({})}>
            <Text style={[styles.filterReset, { color: c.mutedForeground }]}>{lang === 'es' ? 'Limpiar' : 'Reset'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <ScrollView style={[styles.filtersPanel, { backgroundColor: c.card, borderBottomColor: c.border }]} nestedScrollEnabled>
          {/* Index Filter */}
          <Text style={[styles.filterLabel, { color: c.foreground }]}>{lang === 'es' ? 'Índice' : 'Index'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([
              { v: undefined, l: lang === 'es' ? 'Todos' : 'All' },
              { v: 'sp500', l: 'S&P 500' },
              { v: 'nasdaq100', l: 'Nasdaq 100' },
              { v: 'dowjones', l: 'Dow Jones' }
            ] as const).map(opt => (
              <TouchableOpacity key={opt.v || 'all'} onPress={() => setFilters(prev => ({ ...prev, index: opt.v as any }))}>
                <Badge variant={filters.index === opt.v ? 'default' : 'secondary'} style={styles.filterChip}>{opt.l}</Badge>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Market Cap Filter */}
          <Text style={[styles.filterLabel, { color: c.foreground }]}>{lang === 'es' ? 'Capitalización' : 'Market Cap'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([
              { v: undefined, l: lang === 'es' ? 'Todos' : 'All' },
              { v: 'under500', l: '< $500M' },
              { v: 'from500to1000', l: '$500M - $1B' },
              { v: 'over500', l: '> $500M' },
              { v: 'over1000', l: '> $1B' }
            ] as const).map(opt => (
              <TouchableOpacity key={opt.v || 'all'} onPress={() => setFilters(prev => ({ ...prev, cap: opt.v as any }))}>
                <Badge variant={filters.cap === opt.v ? 'default' : 'secondary'} style={styles.filterChip}>{opt.l}</Badge>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recommendation Filter */}
          <Text style={[styles.filterLabel, { color: c.foreground }]}>{lang === 'es' ? 'Recomendación Analistas' : 'Analyst Recom.'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([
              { v: undefined, l: lang === 'es' ? 'Todos' : 'All' },
              { v: 'strongbuy', l: lang === 'es' ? 'Compra Fuerte' : 'Strong Buy' },
              { v: 'buybetter', l: lang === 'es' ? 'Compra o mejor' : 'Buy or better' },
              { v: 'holdbetter', l: lang === 'es' ? 'Mantener o mejor' : 'Hold or better' }
            ] as const).map(opt => (
              <TouchableOpacity key={opt.v || 'all'} onPress={() => setFilters(prev => ({ ...prev, recom: opt.v as any }))}>
                <Badge variant={filters.recom === opt.v ? 'default' : 'secondary'} style={styles.filterChip}>{opt.l}</Badge>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Target Upside Filter */}
          <Text style={[styles.filterLabel, { color: c.foreground }]}>{lang === 'es' ? 'Potencial' : 'Target Upside'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([
              { v: undefined, l: lang === 'es' ? 'Todos' : 'All' },
              { v: 'a10', l: '> 10%' },
              { v: 'a20', l: '> 20%' },
              { v: 'a30', l: '> 30%' },
              { v: 'a50', l: '> 50%' }
            ] as const).map(opt => (
              <TouchableOpacity key={opt.v || 'all'} onPress={() => setFilters(prev => ({ ...prev, targetUpside: opt.v as any }))}>
                <Badge variant={filters.targetUpside === opt.v ? 'default' : 'secondary'} style={styles.filterChip}>{opt.l}</Badge>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Optionable Filter */}
          <View style={styles.switchRow}>
            <Text style={[styles.filterLabel, { color: c.foreground, marginBottom: 0 }]}>{lang === 'es' ? 'Opciones' : 'Options'}</Text>
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, optionable: prev.optionable === 'yes' ? undefined : 'yes' }))}>
              <Badge variant={filters.optionable === 'yes' ? 'default' : 'secondary'} style={styles.filterChip}>
                {lang === 'es' ? 'Solo con opciones' : 'Optionable only'}
              </Badge>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={screener.isFetching} onRefresh={() => screener.refetch()} tintColor={c.primary} />}
      >
        {screener.data && (
          <View style={styles.header}>
            <Text style={[styles.desc, { color: c.foreground }]}>{screener.data.description}</Text>
            <View style={styles.criteria}>
              {screener.data.criteria.map((crit, i) => (
                <Badge key={i} variant="secondary" style={{ marginRight: 8, marginBottom: 8 }}>
                  {crit}
                </Badge>
              ))}
            </View>
          </View>
        )}

        {screener.data ? (
          <Card style={{ padding: 0 }}>
            {screener.data.stocks.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: c.mutedForeground }}>
                  {lang === 'es' ? 'No hay resultados ahora mismo.' : 'No results right now.'}
                </Text>
              </View>
            ) : (
              screener.data.stocks.map((stock) => (
                <StockRow key={stock.ticker} stock={stock} />
              ))
            )}
          </Card>
        ) : (
          <Text style={{ color: c.mutedForeground, textAlign: 'center', marginTop: 24 }}>
            {lang === 'es' ? 'Cargando...' : 'Loading...'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  lockTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  tabs: {
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  header: {
    marginBottom: 24,
  },
  desc: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  criteria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  filterBadge: {
    marginLeft: 6,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  filterReset: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  filtersPanel: {
    padding: 16,
    borderBottomWidth: 1,
    maxHeight: 250,
  },
  filterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 8,
  },
  filterRow: {
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  }
});