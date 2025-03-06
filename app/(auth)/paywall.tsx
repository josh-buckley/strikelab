import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { usePaywall } from '@/contexts/PaywallContext';
import { ROUTES } from '@/lib/routes';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function PaywallScreen() {
  const { presentPaywall, isSubscribed, loading, setJustSubscribedFlag, checkJustSubscribedFlag } = usePaywall();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [hasShownPaywall, setHasShownPaywall] = useState(false);
  const params = useLocalSearchParams();
  
  // Track if this is from onboarding completion
  const fromOnboarding = params.fromOnboarding === 'true';

  console.log('PaywallScreen: Rendered with params:', { fromOnboarding, params });

  // Show paywall when this screen is explicitly navigated to from onboarding
  useEffect(() => {
    const showPaywall = async () => {
      try {
        // Only show paywall if we haven't shown it yet in this session
        // and we're not in the middle of loading
        // and we're coming from onboarding
        if (!hasShownPaywall && !loading && fromOnboarding) {
          console.log('PaywallScreen: Showing paywall from onboarding');
          setHasShownPaywall(true);
          
          // Use the test_paywall identifier or whatever is appropriate
          await presentPaywall('test_paywall');
          
          // For sandbox testing, we'll automatically redirect after the paywall completes
          console.log('PaywallScreen: Paywall interaction completed, checking subscription and flags');
          
          // After paywall is closed, check if user subscribed OR if the justSubscribed flag is set
          // This gives two chances for the redirect to work
          if (isSubscribed) {
            console.log('PaywallScreen: User is now showing as subscribed');
            // Let layout handle navigation
          } else {
            console.log('PaywallScreen: Checking justSubscribed flag');
            const checkIfSubscribed = await checkJustSubscribedFlag();
            if (checkIfSubscribed) {
              console.log('PaywallScreen: justSubscribed flag is set');
            } else {
              // SANDBOX TESTING ONLY: Set flag after paywall interaction
              console.log('PaywallScreen: SANDBOX MODE - Setting subscription flag');
              await setJustSubscribedFlag();
            }
          }
        }
      } catch (error) {
        console.error('PaywallScreen: Error showing paywall:', error);
        // Even if there's an error, try to redirect
        router.replace(ROUTES.AUTH.LOGIN);
      }
    };

    // If user is already subscribed, set flag and redirect to login
    if (isSubscribed) {
      const handleExistingSubscription = async () => {
        console.log('PaywallScreen: User already subscribed, setting flag and redirecting to login');
        await setJustSubscribedFlag();
        
        // Add a small delay before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('PaywallScreen: Redirecting to login for existing subscriber');
        router.replace(ROUTES.AUTH.LOGIN);
      };
      
      handleExistingSubscription();
    } else if (!loading && !hasShownPaywall && fromOnboarding) {
      // Only show paywall if we're not loading, haven't shown it yet, and coming from onboarding
      showPaywall();
    } else if (!fromOnboarding && !loading) {
      // If we're not coming from onboarding, redirect to onboarding
      console.log('PaywallScreen: Not from onboarding, redirecting to onboarding');
      router.replace(ROUTES.AUTH.ONBOARDING);
    }
  }, [loading, isSubscribed, hasShownPaywall, fromOnboarding]);

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint} />
      ) : (
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            Unlock StrikeLab Premium
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Loading subscription options...
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
}); 