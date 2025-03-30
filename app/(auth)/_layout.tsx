import { Stack } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import { usePaywall } from '@/contexts/PaywallContext';

// Removed AsyncStorage import - onboarding state comes from useAuth

export default function AuthLayout() {
  // Only need session and loading from useAuth for redirection logic here
  const { session, loading } = useAuth(); 
  const { isSubscribed, checkJustSubscribedFlag } = usePaywall();
  const segments = useSegments();
  const router = useRouter();
  const [justSubscribed, setJustSubscribed] = useState(false); // Keep for potential post-paywall logic if needed

  // Consolidated auth flow check
  const checkAuthFlow = useCallback(async () => {
    // Check subscription flag status - useful if paywall is presented outside login later
    const justSubscribedFlag = await checkJustSubscribedFlag();
    setJustSubscribed(justSubscribedFlag);
    
    console.log('AuthLayout: Effect running', {
      hasSession: !!session,
      isSubscribed,
      justSubscribed: justSubscribedFlag,
      loading,
      segments,
      currentSegment: segments.length > 1 ? segments[1] : segments[0],
    });
    
    // If loading session state, wait
    if (loading) {
      console.log('AuthLayout: Still loading session, waiting...');
      return;
    }

    const currentScreen = segments.length > 1 ? segments[1] as string : segments[0] as string;
    const currentGroup = segments.length > 0 ? segments[0] as string : '';

    // --- Allow Access Rules --- 

    // Allow access to paywall screen always
    if (currentScreen === 'paywall') {
      console.log('AuthLayout: On paywall screen, allowing.');
      return;
    }

    // Allow access to login screen always (redirection happens *from* here)
    if (currentScreen === 'login') {
      console.log('AuthLayout: On login screen, allowing.');
      return;
    }

    // Allow access to onboarding screen if there's no session
    if (currentScreen === 'onboarding' && !session) {
      console.log('AuthLayout: On onboarding screen without session, allowing.');
      return;
    }

    // --- Redirection Rules --- 

    // 1. If NO session, redirect to onboarding (if not already on allowed screens)
    if (!session) {
      console.log('AuthLayout: No session.');
      if (currentScreen !== 'onboarding' && currentScreen !== 'login' && currentScreen !== 'paywall') {
        console.log('AuthLayout: Redirecting unauthenticated user to onboarding.');
        router.replace(ROUTES.AUTH.ONBOARDING);
        return;
      }
    }
    // 2. If has session...
    else {
      console.log('AuthLayout: Session exists.');
      // If user is subscribed, redirect to main app (if in auth group)
      if (isSubscribed) {
        console.log('AuthLayout: User is subscribed.');
        if (currentGroup === '(auth)') {
          console.log('AuthLayout: Redirecting subscribed user from auth group to main app.');
          router.replace(ROUTES.TABS.HOME);
          return;
        }
      } 
      // If user has session but is NOT subscribed
      // They should have completed onboarding (marked in OnboardingScreen9)
      // They should have seen paywall on login screen mount
      // --> Keep them on login/paywall until they subscribe.
      else {
         console.log('AuthLayout: User has session but is NOT subscribed.');
         if (currentScreen !== 'login' && currentScreen !== 'paywall') {
            console.log('AuthLayout: Redirecting authenticated, unsubscribed user to login (for paywall).');
            router.replace(ROUTES.AUTH.LOGIN);
            return;
         }
      }
    }

  }, [session, loading, isSubscribed, segments, checkJustSubscribedFlag, router]); // Dependencies updated

  // Single effect to handle all auth flow checks
  useEffect(() => {
    checkAuthFlow();
  }, [checkAuthFlow]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
} 