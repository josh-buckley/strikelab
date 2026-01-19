import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/lib/AuthProvider';
import { useAuth } from '@/lib/AuthProvider';
import { ROUTES } from '@/lib/routes';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { usePaywall } from '@/contexts/PaywallContext';

// Define the onboarding completed key to match the one in AuthProvider
const ONBOARDING_COMPLETED_KEY = 'strikelab_onboarding_completed';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn('Error preventing splash screen auto-hide');
});

function Layout() {
  const colorScheme = useColorScheme();
  const { session, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subscriptionLoading, checkJustSubscribedFlag, clearJustSubscribedFlag } = usePaywall();
  const segments = useSegments();
  const router = useRouter();
  const [isPreloading, setIsPreloading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const hasNavigatedAfterSubscription = useRef(false);
  const [loaded] = useFonts({
    Poppins: Poppins_400Regular,
    PoppinsSemiBold: Poppins_600SemiBold,
  });

  // Add mount effect
  useEffect(() => {
    console.log('Layout mount effect triggered');
    setIsMounted(true);
  }, []);

  useEffect(() => {
    console.log('Layout loading check:', {
      loaded,
      authLoading,
      subscriptionLoading,
      isPreloading
    });
    
    if (loaded && !authLoading && !subscriptionLoading) {
      // Add a small delay to ensure smooth transition
      console.log('Starting preloading timeout');
      const timer = setTimeout(() => {
        console.log('Preloading timeout complete, setting isPreloading false');
        setIsPreloading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loaded, authLoading, subscriptionLoading]);

  useEffect(() => {
    console.log('Splash screen effect check:', {
      loaded,
      isPreloading
    });
    
    if (loaded && !isPreloading) {
      // Hide the splash screen after everything is loaded
      console.log('Attempting to hide splash screen');
      SplashScreen.hideAsync().catch((error) => {
        console.error('Error hiding splash screen:', error);
      });
    }
  }, [loaded, isPreloading]);

  // Effect for handling navigation logic
  useEffect(() => {
    // Wait until all loading states are false and component is mounted
    if (!isMounted || authLoading || subscriptionLoading || isPreloading || !loaded) {
      console.log('Layout: Navigation effect waiting...', { isMounted, authLoading, subscriptionLoading, isPreloading, loaded });
      return;
    }

    const handleNavigation = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      // Check if the current route is *specifically* one of the core auth flow screens
      let isAllowedAuthRoute = false;
      if (segments.length > 1 && segments[1]) {
        isAllowedAuthRoute = ['login', 'onboarding', 'paywall'].includes(segments[1]);
      }
      const hasSession = !!session;

      // Check if user just subscribed - this takes priority for navigation
      const justSubscribed = await checkJustSubscribedFlag();

      console.log('Layout: Running navigation check', {
        hasSession,
        isSubscribed,
        justSubscribed,
        inAuthGroup,
        inTabsGroup,
        isAllowedAuthRoute,
        segments
      });

      // Handle just subscribed case - clear flag and navigate to tabs
      if (justSubscribed && !hasNavigatedAfterSubscription.current) {
        console.log('Layout: User just subscribed, navigating to tabs and clearing flag');
        hasNavigatedAfterSubscription.current = true;
        await clearJustSubscribedFlag();
        router.replace('/(tabs)');
        return;
      }

      if (hasSession) {
        // User is logged in
        console.log('Layout: User HAS session.');
        if (isSubscribed) {
          // Logged in and subscribed
          console.log('Layout: User IS subscribed.');
          // If they are not already in the main app section, AND not navigating to create-workout, redirect them there.
          if (!inTabsGroup && segments[0] !== 'create-workout') {
            console.log('Layout: Redirecting subscribed user to (tabs) (excluding create-workout)');
            router.replace('/(tabs)');
          } else {
            console.log('Layout: User already in (tabs) or heading to create-workout, no redirect needed.');
          }
        } else {
          // Logged in but NOT subscribed
          console.log('Layout: User IS NOT subscribed.');
          // If they are trying to access a protected route (not in auth group and not an allowed auth route like paywall), redirect to login
          if (!inAuthGroup && !isAllowedAuthRoute) {
            console.log('Layout: Redirecting non-subscribed user from protected route to login');
            router.replace(ROUTES.AUTH.LOGIN);
          } else {
            console.log('Layout: Non-subscribed user is in auth group or allowed route (e.g., paywall), allowing access.');
          }
        }
      } else {
        // User is NOT logged in
        console.log('Layout: User does NOT have session.');
        // If they are trying to access anything outside the auth group
        if (!inAuthGroup) {
          console.log('Layout: Non-logged-in user outside auth group. Checking onboarding status.');
          try {
            const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
            if (hasCompletedOnboarding === 'true') {
              console.log('Layout: Redirecting to Login (onboarding previously completed).');
              router.replace(ROUTES.AUTH.LOGIN);
            } else {
              console.log('Layout: Redirecting to Onboarding (first time or not completed).');
              router.replace(ROUTES.AUTH.ONBOARDING);
            }
          } catch (err) {
            console.error('Layout: Error reading onboarding status, defaulting to login:', err);
            router.replace(ROUTES.AUTH.LOGIN);
          }
        } else {
          console.log('Layout: Non-logged-in user in auth group, allowing access.');
        }
      }
    };

    handleNavigation();
  }, [session, isSubscribed, authLoading, subscriptionLoading, segments, isMounted, isPreloading, loaded, router, checkJustSubscribedFlag, clearJustSubscribedFlag]);

  if (!loaded || isPreloading) {
    return <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WorkoutProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          >
            <Stack.Screen
              name="(auth)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="create-workout"
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </WorkoutProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaywallProvider>
        <Layout />
      </PaywallProvider>
    </AuthProvider>
  );
}
