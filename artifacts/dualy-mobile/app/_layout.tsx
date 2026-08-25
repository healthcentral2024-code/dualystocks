import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { cache } from '@/lib/token-cache';
import { LanguageProvider } from '@/lib/i18n';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

const STATIC_CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || '';
const API_ORIGIN = API_DOMAIN ? `https://${API_DOMAIN}` : '';
const CLERK_PROXY_URL = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

if (API_ORIGIN) {
  setBaseUrl(API_ORIGIN);
}

function ApiTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return <>{children}</>;
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(auth)/sign-up" options={{ presentation: 'modal' }} />
      <Stack.Screen name="analysis/[ticker]" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutContent() {
  const [clerkPublishableKey, setClerkPublishableKey] = useState(
    STATIC_CLERK_PUBLISHABLE_KEY,
  );
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (clerkPublishableKey) return;

    if (!API_ORIGIN) {
      const error = new Error('Missing mobile API domain');
      setBootstrapError(error);
      void SplashScreen.hideAsync();
      return;
    }

    const controller = new AbortController();

    void fetch(`${API_ORIGIN}/api/mobile/config`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Mobile configuration request failed (${response.status})`);
        }

        return response.json() as Promise<{ clerkPublishableKey?: unknown }>;
      })
      .then((config) => {
        if (
          typeof config.clerkPublishableKey !== 'string' ||
          !config.clerkPublishableKey
        ) {
          throw new Error('Mobile configuration is incomplete');
        }

        setClerkPublishableKey(config.clerkPublishableKey);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setBootstrapError(
          error instanceof Error
            ? error
            : new Error('Unable to load mobile configuration'),
        );
        void SplashScreen.hideAsync();
      });

    return () => controller.abort();
  }, [clerkPublishableKey]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && clerkPublishableKey) {
      SplashScreen.hideAsync();
    }
  }, [clerkPublishableKey, fontsLoaded, fontError]);

  if (bootstrapError) throw bootstrapError;
  if ((!fontsLoaded && !fontError) || !clerkPublishableKey) return null;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={cache}
      proxyUrl={CLERK_PROXY_URL}
    >
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ApiTokenProvider>
            <LanguageProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </LanguageProvider>
          </ApiTokenProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <RootLayoutContent />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}