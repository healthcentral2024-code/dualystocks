import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { esES, enUS } from '@clerk/localizations';
import { LanguageProvider, useLanguage } from '@/lib/language';

// Pages
import Home from '@/pages/home';
import Analysis from '@/pages/analysis';
import Ideas from '@/pages/ideas';
import Subscribe, { useSubscription } from '@/pages/subscribe';
import SignInPage from '@/pages/sign-in';
import SignUpPage from '@/pages/sign-up';
import NotFound from '@/pages/not-found';
import Admin from '@/pages/admin';
import Support from '@/pages/support';
import { ReferralPromo } from '@/components/referral-promo';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(to: string) {
  if (to.startsWith(basePath)) {
    return to.slice(basePath.length) || "/";
  }
  return to;
}

const REF_STORAGE_KEY = "ds_ref";

/**
 * Referral capture: a ?ref=<code> on any landing URL is stored, and once the
 * visitor signs in it is reported to the API so the inviter can earn their
 * 25% reward when this user subscribes.
 */
function ReferralCapture() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem(REF_STORAGE_KEY, ref);
      } catch {
        // storage unavailable (private mode) — referral simply won't persist
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let ref: string | null = null;
    try {
      ref = localStorage.getItem(REF_STORAGE_KEY);
    } catch {
      return;
    }
    if (!ref || ref === user?.id) return;
    fetch(`${import.meta.env.BASE_URL}api/billing/referral`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    })
      .then(() => localStorage.removeItem(REF_STORAGE_KEY))
      .catch(() => {
        // keep it stored; we'll retry on the next visit
      });
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const clerk = useClerk();
  const qc = useQueryClient();

  useEffect(() => {
    return clerk.addListener(({ user }) => {
      // Clear cache when user changes to prevent leaking data
      qc.clear();
    });
  }, [clerk, qc]);

  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in", { replace: true });
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

function RequireSubscription({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useSubscription();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isError && data && !data.active) {
      setLocation("/suscripcion", { replace: true });
    }
  }, [isLoading, isError, data, setLocation]);

  if (isLoading) return null;
  // If the status check itself fails, don't lock the user out silently.
  if (isError) return <>{children}</>;
  if (!data?.active) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/analisis/:ticker">{(params) => <RequireAuth><RequireSubscription><Analysis /></RequireSubscription></RequireAuth>}</Route>
        <Route path="/ideas">{() => <RequireAuth><RequireSubscription><Ideas /></RequireSubscription></RequireAuth>}</Route>
        <Route path="/suscripcion">{() => <RequireAuth><Subscribe /></RequireAuth>}</Route>
        <Route path="/admin">{() => <RequireAuth><Admin /></RequireAuth>}</Route>
        <Route path="/soporte" component={Support} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();

  const clerkLocalization = lang === 'en' ? enUS : esES;

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey} 
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={clerkLocalization}
      appearance={{
        theme: shadcn,
        cssLayerName: "clerk",
        options: {
          logoPlacement: "inside",
          logoLinkUrl: basePath || "/",
          logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
        },
        variables: {
          colorPrimary: "hsl(142 72% 29%)",
          colorForeground: "hsl(222 47% 11%)",
          colorMutedForeground: "hsl(215.4 16.3% 46.9%)",
          colorBackground: "hsl(0 0% 100%)",
          colorInput: "hsl(0 0% 100%)",
          colorInputForeground: "hsl(222 47% 11%)",
          colorDanger: "hsl(348 83% 47%)",
          colorNeutral: "hsl(214 32% 91%)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          borderRadius: "0.35rem",
        },
        elements: {
          // No fixed width here: the account (UserProfile) modal needs its
          // natural ~880px two-column layout. Sign-in/sign-up widths are set
          // per-component below.
          cardBox: "bg-white rounded-2xl max-w-full overflow-hidden shadow-xl border-border",
          card: "!shadow-none !border-0 !bg-transparent !rounded-none",
          footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
        },
        signIn: {
          elements: {
            cardBox: "w-[440px]",
          },
        },
        signUp: {
          elements: {
            cardBox: "w-[440px]",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ReferralCapture />
        <ReferralPromo />
        <TooltipProvider>
          <div className="fixed inset-0 pointer-events-none -z-50 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-[0.12] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen" />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function Root() {
  return (
    <LanguageProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </WouterRouter>
    </LanguageProvider>
  );
}
