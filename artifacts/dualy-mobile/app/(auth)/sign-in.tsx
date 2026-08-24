import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSignIn, useSSO } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/lib/i18n';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const { signIn } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const c = useColors();
  const { lang } = useLanguage();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const onGooglePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: () => router.replace('/(tabs)'),
        });
      } else {
        setGeneralError(
          lang === 'es'
            ? 'No se pudo completar el acceso con Google.'
            : 'Google sign in could not be completed.',
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setGeneralError(
        err.errors?.[0]?.longMessage ||
          err.message ||
          (lang === 'es' ? 'Falló el acceso con Google' : 'Google sign in failed'),
      );
    }
  }, [lang, startSSOFlow, router]);

  const handleSubmit = async () => {
    setLoading(true);
    setGeneralError('');

    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      });

      if (error) {
        setGeneralError(
          error.message || (lang === 'es' ? 'Credenciales no válidas' : 'Invalid credentials'),
        );
        setLoading(false);
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: () => router.replace('/(tabs)')
        });
      } else {
        setGeneralError(
          lang === 'es'
            ? 'No se pudo completar el acceso. Revisa tu correo y los pasos pendientes.'
            : 'Sign in not complete. Check your email or pending factors.',
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setGeneralError(
        err.errors?.[0]?.message ||
          (lang === 'es' ? 'Credenciales no válidas' : 'Invalid credentials'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: c.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: c.foreground }]}>
            {lang === 'es' ? 'Bienvenido de nuevo' : 'Welcome back'}
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {lang === 'es'
              ? 'Accede a tu cuenta de DualyStocks'
              : 'Sign in to your DualyStocks account'}
          </Text>
        </View>

        {generalError ? <Text style={[styles.error, { color: c.destructive }]}>{generalError}</Text> : null}

        <Button 
          title={lang === 'es' ? 'Continuar con Google' : 'Continue with Google'}
          onPress={onGooglePress} 
          variant="outline"
          style={{ marginBottom: 16 }}
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.mutedForeground }]}>
            {lang === 'es' ? 'o' : 'or'}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        <Input
          label={lang === 'es' ? 'Correo electrónico' : 'Email address'}
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label={lang === 'es' ? 'Contraseña' : 'Password'}
          value={password}
          onChangeText={setPassword}
          placeholder={lang === 'es' ? 'Escribe tu contraseña' : 'Enter password'}
          secureTextEntry
        />

        <Button 
          title={lang === 'es' ? 'Iniciar sesión' : 'Sign in'}
          onPress={handleSubmit} 
          loading={loading}
          style={styles.submitBtn}
        />

        <View style={styles.footer}>
          <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>
            {lang === 'es' ? '¿No tienes una cuenta? ' : "Don't have an account? "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>
              {lang === 'es' ? 'Regístrate' : 'Sign up'}
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 260,
    height: 104,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});