import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSignUp, useSSO } from '@clerk/expo';
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

export default function SignUpPage() {
  useWarmUpBrowser();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const c = useColors();
  const { lang } = useLanguage();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg(
          lang === 'es'
            ? 'No se pudo completar el registro con Google.'
            : 'Google sign up could not be completed.',
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMsg(
        err.errors?.[0]?.longMessage ||
          err.message ||
          (lang === 'es' ? 'Falló el registro con Google' : 'Google sign up failed'),
      );
    }
  }, [lang, startSSOFlow, router]);

  const onSignUpPress = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await signUp.password({
        emailAddress,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message ||
            (lang === 'es' ? 'Ocurrió un error durante el registro' : 'An error occurred during sign up'),
        );
        setLoading(false);
        return;
      }
      
      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMsg(
        err.errors?.[0]?.message ||
          (lang === 'es' ? 'Ocurrió un error durante el registro' : 'An error occurred during sign up'),
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      await signUp.verifications.verifyEmailCode({
        code,
      });

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: () => {
            router.replace('/(tabs)');
          },
        });
      } else {
        setErrorMsg(
          lang === 'es' ? 'La verificación no se completó.' : 'Verification not complete.',
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err.errors?.[0]?.message || (lang === 'es' ? 'Código no válido' : 'Invalid code'),
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
            {pendingVerification
              ? lang === 'es' ? 'Verifica tu correo' : 'Verify Email'
              : lang === 'es' ? 'Crea tu cuenta' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {pendingVerification 
              ? lang === 'es' ? 'Escribe el código enviado a tu correo' : 'Enter the code sent to your email'
              : lang === 'es' ? 'Regístrate en DualyStocks' : 'Sign up for DualyStocks'}
          </Text>
        </View>

        {errorMsg ? <Text style={[styles.error, { color: c.destructive }]}>{errorMsg}</Text> : null}

        {!pendingVerification ? (
          <>
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
              placeholder={lang === 'es' ? 'Crea una contraseña segura' : 'Create a strong password'}
              secureTextEntry
            />

            <View nativeID="clerk-captcha" />

            <Button 
              title={lang === 'es' ? 'Registrarme' : 'Sign up'}
              onPress={onSignUpPress} 
              loading={loading}
              style={styles.submitBtn}
            />

            <View style={styles.footer}>
              <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                {lang === 'es' ? '¿Ya tienes una cuenta? ' : 'Already have an account? '}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>
                  {lang === 'es' ? 'Inicia sesión' : 'Sign in'}
                </Text>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Input
              label={lang === 'es' ? 'Código de verificación' : 'Verification Code'}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="numeric"
            />
            <Button 
              title={lang === 'es' ? 'Verificar' : 'Verify'}
              onPress={onPressVerify} 
              loading={loading}
              style={styles.submitBtn}
            />
          </>
        )}
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