import { Stack } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import { usePaywall } from '@/contexts/PaywallContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the onboarding completed key to match the one in AuthProvider
const ONBOARDING_COMPLETED_KEY = 'strikelab_onboarding_completed';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const { isSubscribed, checkJustSubscribedFlag } = usePaywall();
  const segments = useSegments();
  const router = useRouter();
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Consolidated auth flow check
  const checkAuthFlow = useCallback(async () => {
    // Check subscription flag status
    const justSubscribedFlag = await checkJustSubscribedFlag();
    setJustSubscribed(justSubscribedFlag);
    
    console.log('AuthLayout: Effect running', {
      hasSession: !!session,
      isSubscribed,
      justSubscribed: justSubscribedFlag,
      loading,
      segments,
      currentSegment: segments[1],
    });
    
    // If loading, don't navigate yet
    if (loading) {
      console.log('AuthLayout: Still loading, waiting before navigation');
      return;
    }

    // Handle paywall screen specially - don't redirect away while paywall is active
    if (segments[1] === 'paywall') {
      console.log('AuthLayout: On paywall screen, allowing interaction');
      return;
    }
    
    // If user is authenticated AND subscribed, send them to main app
    if (session && isSubscribed) {
      console.log('AuthLayout: User is authenticated and subscribed, redirecting to main app');
      router.replace(ROUTES.TABS.HOME);
      return;
    }

    // If user just subscribed, ensure they're on login screen
    if (justSubscribedFlag && segments[1] !== 'login') {
      console.log('AuthLayout: User just subscribed, ensuring they are on login screen');
      router.replace(ROUTES.AUTH.LOGIN);
      return;
    }
    
    // Allow users to complete onboarding without being logged in
    if (segments[1] === 'onboarding') {
      console.log('AuthLayout: User is on onboarding, allowing completion');
      return;
    }
    
    // Allow users to access login without being authenticated
    if (segments[1] === 'login') {
      console.log('AuthLayout: User is on login, allowing access');
      return;
    }
    
    // For all other screens in auth group, redirect unauthenticated users to onboarding
    if (!session && !justSubscribedFlag) {
      // Check if user has completed onboarding before
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      
      if (hasCompletedOnboarding === 'true') {
        console.log('AuthLayout: User has completed onboarding before, redirecting to login');
        router.replace(ROUTES.AUTH.LOGIN);
      } else {
        console.log('AuthLayout: New user, redirecting to onboarding');
        router.replace(ROUTES.AUTH.ONBOARDING);
      }
    }
  }, [session, loading, isSubscribed, segments, checkJustSubscribedFlag, router]);

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