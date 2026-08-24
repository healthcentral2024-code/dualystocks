import React, { useEffect } from 'react';
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

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const CLERK_PROXY_URL = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment');
}

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={cache}
      proxyUrl={CLERK_PROXY_URL}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}