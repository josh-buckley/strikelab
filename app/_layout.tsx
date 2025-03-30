import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Superwall from '@superwall/react-native-superwall';
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

// Initialize Superwall as early as possible
const apiKey = Platform.OS === "ios" 
  ? process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY 
  : process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY;

if (apiKey) {
  console.log('Initializing Superwall with key:', apiKey);
  try {
    // Configure with options for handling products
    const options = {
      isDebugMode: __DEV__, // Enable debug mode in development
      paywallResponseTimeout: 10, // Timeout in seconds
      subscriptionStatus: 'unknown' as const // Start with unknown status
    };
    
    Superwall.configure(apiKey, options);
    console.log('Superwall initialized successfully');
    console.log('Superwall.shared available:', !!Superwall.shared);

    // Additional debug info
    if (Superwall.shared) {
      console.log('Superwall is ready to present paywalls');
    } else {
      console.warn('Superwall.shared is not available after initialization');
    }
  } catch (error) {
    console.error('Error initializing Superwall:', error);
  }
} else {
  console.error('SuperWall API key not found');
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn('Error preventing splash screen auto-hide');
});

function Layout() {
  const colorScheme = useColorScheme();
  const { session, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subscriptionLoading, checkJustSubscribedFlag } = usePaywall();
  const segments = useSegments();
  const router = useRouter();
  const [isPreloading, setIsPreloading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [loaded] = useFonts({
    Poppins: Poppins_400Regular,
    PoppinsSemiBold: Poppins_600SemiBold,
  });

  // Add mount effect
  useEffect(() => {
    console.log('Layout mount effect triggered');
    setIsMounted(true);
    
    // Check if user just subscribed
    const checkSubscriptionFlag = async () => {
      const hasJustSubscribed = await checkJustSubscribedFlag();
      console.log('Layout: Just subscribed flag check:', hasJustSubscribed);
      setJustSubscribed(hasJustSubscribed);
    };
    
    checkSubscriptionFlag();
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

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    // Check if the current route is *specifically* one of the core auth flow screens
    let isAllowedAuthRoute = false;
    if (segments.length > 1 && segments[1]) { // Explicitly check if segment exists
        isAllowedAuthRoute = ['login', 'onboarding', 'paywall'].includes(segments[1]);
    }
    const hasSession = !!session;

    console.log('Layout: Running navigation check', { hasSession, isSubscribed, inAuthGroup, inTabsGroup, isAllowedAuthRoute, segments });

    if (hasSession) {
      // User is logged in
      console.log('Layout: User HAS session.');
      if (isSubscribed) {
        // Logged in and subscribed
        console.log('Layout: User IS subscribed.');
        // If they are not already in the main app section, redirect them there.
        if (!inTabsGroup) {
          console.log('Layout: Redirecting subscribed user to (tabs)');
          router.replace('/(tabs)'); // Use replace to avoid back button issues
        } else {
          console.log('Layout: User already in (tabs), no redirect needed.');
        }
      } else {
        // Logged in but NOT subscribed
        console.log('Layout: User IS NOT subscribed.');
        // If they are trying to access a protected route (not in auth group and not an allowed auth route like paywall), redirect to paywall
        if (!inAuthGroup && !isAllowedAuthRoute) {
           console.log('Layout: Redirecting non-subscribed user from protected route to paywall');
           router.replace({
             pathname: ROUTES.AUTH.PAYWALL,
             params: { fromOnboarding: 'false' } // Adjust params as needed
           });
        } else {
           console.log('Layout: Non-subscribed user is in auth group or allowed route (e.g., paywall), allowing access.');
           // Allow access to login, onboarding, paywall itself
        }
      }
    } else {
      // User is NOT logged in
      console.log('Layout: User does NOT have session.');
      // If they are trying to access anything outside the auth group
      if (!inAuthGroup) {
        console.log('Layout: Non-logged-in user outside auth group. Checking onboarding status.');
        // Redirect non-logged-in users away from protected areas
        AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY).then(hasCompletedOnboarding => {
          if (hasCompletedOnboarding === 'true') {
            console.log('Layout: Redirecting to Login (onboarding previously completed).');
            router.replace(ROUTES.AUTH.LOGIN);
          } else {
            console.log('Layout: Redirecting to Onboarding (first time or not completed).');
            router.replace(ROUTES.AUTH.ONBOARDING);
          }
        }).catch(err => {
           console.error('Layout: Error reading onboarding status, defaulting to login:', err);
           router.replace(ROUTES.AUTH.LOGIN); // Fallback on error
        });
      } else {
         console.log('Layout: Non-logged-in user in auth group, allowing access.');
         // Allow access to screens within the (auth) group (like login, onboarding)
      }
    }

  // Dependencies: Re-run when session, subscription status, loading states, segments, or mount status change.
  // Ensure router is stable or memoized if provided via context, otherwise it might cause loops.
  // Assuming Expo Router's useRouter provides a stable instance.
  }, [session, isSubscribed, authLoading, subscriptionLoading, segments, isMounted, isPreloading, loaded, router]);

  if (!loaded || isPreloading) {
    return <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WorkoutProvider>
          <PaywallProvider>
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
              {/* create-workout is now handled within (tabs)/_layout.tsx */}
              {/* <Stack.Screen 
                name="create-workout" 
                options={{ 
                  headerShown: false,
                }}
              /> */}
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </PaywallProvider>
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
