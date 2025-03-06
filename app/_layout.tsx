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

  useEffect(() => {
    if (!isMounted || authLoading || subscriptionLoading || isPreloading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedRoute = !inAuthGroup;
    const isOnboarding = segments[1] === 'onboarding';
    const isPaywall = segments[1] === 'paywall';
    const isLogin = segments[1] === 'login';
    const hasSession = !!session;

    // Use a more specific navigation check that prioritizes justSubscribed flag
    const checkNavigation = async () => {
      // Check if user has just subscribed
      const justSubscribedFlag = await checkJustSubscribedFlag();
      
      // Also check AsyncStorage directly for subscription status
      // This is a fallback in case the context state gets reset
      const storedSubscriptionStatus = await AsyncStorage.getItem('strikelab_is_subscribed');
      const isStoredAsSubscribed = storedSubscriptionStatus === 'true';
      
      // Use either the context state or the stored state
      const effectiveSubscriptionStatus = isSubscribed || isStoredAsSubscribed;
      
      setJustSubscribed(justSubscribedFlag);
      
      // Add debug logs
      console.log('Navigation check:', {
        hasSession,
        isSubscribed,
        isStoredAsSubscribed,
        effectiveSubscriptionStatus,
        justSubscribed: justSubscribedFlag,
        isOnboarding,
        isPaywall,
        isLogin,
        inAuthGroup,
        inProtectedRoute,
        segments,
      });

      // If we're already in the tabs section and either subscribed or have a session, don't redirect
      if (segments[0] === '(tabs)' && (effectiveSubscriptionStatus || hasSession)) {
        console.log('User is in tabs and has subscription or session, allowing access');
        return;
      }

      // SANDBOX TESTING OVERRIDE
      // For sandbox testing only - if we're on the paywall screen, don't redirect
      if (isPaywall) {
        console.log('User is on paywall screen, allowing completion');
        return;
      }
      
      // If user just subscribed, always allow them to access login
      if (justSubscribedFlag) {
        console.log('User just subscribed, directing to login if needed');
        if (!isLogin) {
          console.log('User just subscribed but not on login, redirecting to login');
          router.replace(ROUTES.AUTH.LOGIN);
        }
        return;
      }

      // For existing paths that shouldn't redirect
      if (isOnboarding || isPaywall || isLogin) {
        console.log('User is already on onboarding, paywall, or login, not redirecting');
        return;
      }

      // Main navigation logic
      if (!hasSession && !effectiveSubscriptionStatus) {
        // Check if user has completed onboarding before
        const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        
        if (hasCompletedOnboarding === 'true') {
          console.log('User has completed onboarding before, redirecting to login');
          router.replace(ROUTES.AUTH.LOGIN);
        } else {
          console.log('New user, redirecting to onboarding');
          router.replace(ROUTES.AUTH.ONBOARDING);
        }
      } else if (hasSession && !effectiveSubscriptionStatus && !inAuthGroup) {
        console.log('Has session but not subscribed, redirecting to paywall');
        router.replace({
          pathname: ROUTES.AUTH.PAYWALL,
          params: { fromOnboarding: 'true' }
        });
      } else if (!hasSession && effectiveSubscriptionStatus) {
        console.log('Subscribed but no session, redirecting to login');
        router.replace(ROUTES.AUTH.LOGIN);
      }
    };
    
    checkNavigation();
  }, [session, isSubscribed, authLoading, subscriptionLoading, segments, isMounted, isPreloading, justSubscribed]);

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
              <Stack.Screen 
                name="create-workout" 
                options={{ 
                  headerShown: false,
                }} 
              />
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
