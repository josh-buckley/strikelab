import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/AuthProvider';
import { usePaywall } from '@/contexts/PaywallContext';
import { ROUTES } from '@/lib/routes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Define the onboarding completed key to match the one in AuthProvider
const ONBOARDING_COMPLETED_KEY = 'strikelab_onboarding_completed';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subscriptionLoading } = usePaywall();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const checkInitialRoute = async () => {
      console.log('Index: Checking initial route', {
        hasSession: !!session,
        isSubscribed,
        authLoading,
        subscriptionLoading
      });

      // If still loading, wait for the loading to complete
      if (authLoading || subscriptionLoading) {
        console.log('Index: Still loading, waiting before navigation');
        return;
      }

      try {
        // Check if user has completed onboarding
        const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        console.log('Index: Has completed onboarding:', hasCompletedOnboarding);

        // If user is authenticated and subscribed, go to main app
        if (session && isSubscribed) {
          console.log('Index: User is authenticated and subscribed, redirecting to main app');
          router.replace(ROUTES.TABS.HOME);
          return;
        }

        // If user has not completed onboarding, go to onboarding
        if (hasCompletedOnboarding !== 'true') {
          console.log('Index: New user, redirecting to onboarding');
          router.replace(ROUTES.AUTH.ONBOARDING);
          return;
        }

        // If user has completed onboarding but is not authenticated, go to login
        if (!session) {
          console.log('Index: User has completed onboarding but not authenticated, redirecting to login');
          router.replace(ROUTES.AUTH.LOGIN);
          return;
        }

        // If user is authenticated but not subscribed, go to paywall
        if (session && !isSubscribed) {
          console.log('Index: User is authenticated but not subscribed, redirecting to paywall');
          router.replace({
            pathname: ROUTES.AUTH.PAYWALL,
            params: { fromOnboarding: 'true' }
          });
          return;
        }
      } catch (error) {
        console.error('Index: Error checking initial route:', error);
        // Default to onboarding if there's an error
        router.replace(ROUTES.AUTH.ONBOARDING);
      }
    };

    checkInitialRoute();
  }, [session, isSubscribed, authLoading, subscriptionLoading, router]);

  // Show a loading indicator while checking the initial route
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
      <ActivityIndicator size="large" color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint} />
    </View>
  );
} 