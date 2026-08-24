import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { useGetBillingSubscription, getGetBillingSubscriptionQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfilePage() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { lang, setLang } = useLanguage();
  const c = useColors();
  const router = useRouter();

  const sub = useGetBillingSubscription({ query: { enabled: !!isSignedIn, queryKey: getGetBillingSubscriptionQueryKey() } });

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.scroll}>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="globe" size={24} color={c.primary} style={styles.icon} />
            <Text style={[styles.settingTitle, { color: c.foreground }]}>
              {lang === 'es' ? 'Idioma' : 'Language'}
            </Text>
          </View>
          <View style={styles.langToggle}>
            <Text style={[styles.langText, { color: lang === 'es' ? c.primary : c.mutedForeground }]}>ES</Text>
            <Switch
              value={lang === 'en'}
              onValueChange={(val) => setLang(val ? 'en' : 'es')}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#fff"
            />
            <Text style={[styles.langText, { color: lang === 'en' ? c.primary : c.mutedForeground }]}>EN</Text>
          </View>
        </View>
      </Card>

      {isSignedIn ? (
        <>
          <Card style={styles.card}>
            <View style={styles.accountHeader}>
              <View style={styles.avatar}>
                <Text style={{ color: c.card, fontFamily: 'Inter_700Bold', fontSize: 20 }}>
                  {user?.primaryEmailAddress?.emailAddress.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.email, { color: c.foreground }]}>{user?.primaryEmailAddress?.emailAddress}</Text>
                
                {sub.data ? (
                  <Badge variant={sub.data.active ? 'success' : 'secondary'} style={{ marginTop: 8 }}>
                    {sub.data.active ? (lang === 'es' ? 'Premium Activo' : 'Premium Active') : (lang === 'es' ? 'Gratis' : 'Free')}
                  </Badge>
                ) : null}
              </View>
            </View>

            <Button 
              title={lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'} 
              variant="outline" 
              onPress={() => signOut()} 
              style={{ marginTop: 24 }}
            />
          </Card>
        </>
      ) : (
        <Card style={[styles.card, { alignItems: 'center', padding: 32 }]}>
          <Feather name="user" size={48} color={c.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.email, { color: c.foreground, textAlign: 'center', marginBottom: 16 }]}>
            {lang === 'es' ? 'No has iniciado sesión' : 'Not signed in'}
          </Text>
          <Button 
            title={lang === 'es' ? 'Iniciar Sesión' : 'Sign In'} 
            onPress={() => router.push('/(auth)/sign-in')} 
          />
        </Card>
      )}

      <Text style={[styles.footer, { color: c.mutedForeground }]}>
        DualyStocks v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  settingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981', // emerald
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  email: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});