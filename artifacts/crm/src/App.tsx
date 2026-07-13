import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import Dashboard from '@/pages/dashboard';
import Contacts from '@/pages/contacts';
import Deals from '@/pages/deals';
import Tasks from '@/pages/tasks';

// Shell
import { Shell } from '@/components/layout/shell';

export const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(152, 24%, 28%)",
    colorForeground: "hsl(152, 24%, 15%)",
    colorMutedForeground: "hsl(152, 10%, 45%)",
    colorDanger: "hsl(12, 76%, 61%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(40, 20%, 98%)",
    colorInputForeground: "hsl(152, 24%, 15%)",
    colorNeutral: "hsl(40, 20%, 90%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-black/5 border border-[hsl(40,20%,90%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl text-[hsl(152,24%,15%)] font-semibold",
    headerSubtitle: "text-[hsl(152,10%,45%)]",
    socialButtonsBlockButtonText: "text-[hsl(152,24%,15%)] font-medium",
    formFieldLabel: "text-[hsl(152,24%,15%)] font-medium",
    footerActionLink: "text-[hsl(152,24%,28%)] hover:text-[hsl(152,24%,15%)] font-semibold",
    footerActionText: "text-[hsl(152,10%,45%)]",
    dividerText: "text-[hsl(152,10%,45%)] bg-white px-2",
    identityPreviewEditButton: "text-[hsl(152,24%,28%)]",
    formFieldSuccessText: "text-[hsl(152,24%,28%)]",
    alertText: "text-[hsl(12,76%,61%)]",
    logoBox: "h-12 flex items-center justify-center mb-4",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-[hsl(40,20%,90%)] hover:bg-[hsl(40,20%,98%)] transition-colors",
    formButtonPrimary: "bg-[hsl(152,24%,28%)] hover:bg-[hsl(152,24%,15%)] text-white shadow-sm transition-colors",
    formFieldInput: "border-[hsl(40,20%,90%)] bg-[hsl(40,20%,98%)] focus:ring-[hsl(152,24%,30%)]",
    footerAction: "bg-[hsl(40,33%,98%)] rounded-b-2xl border-t border-[hsl(40,20%,90%)] py-4",
    dividerLine: "bg-[hsl(40,20%,90%)]",
    alert: "bg-[hsl(12,76%,96%)] border-[hsl(12,76%,61%)]",
    otpCodeFieldInput: "border-[hsl(40,20%,90%)]",
    formFieldRow: "mb-4",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Shell>
          <Component />
        </Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to EduCRM",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with EduCRM",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} />
            </Route>
            <Route path="/contacts">
              <ProtectedRoute component={Contacts} />
            </Route>
            <Route path="/deals">
              <ProtectedRoute component={Deals} />
            </Route>
            <Route path="/tasks">
              <ProtectedRoute component={Tasks} />
            </Route>
            
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
