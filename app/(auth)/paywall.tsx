import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const [buttonText, setButtonText] = useState('Continue to Login');
  const params = useLocalSearchParams();
  
  // Track if this is from onboarding completion
  const fromOnboarding = params.fromOnboarding === 'true';

  console.log('PaywallScreen: Rendered with params:', { fromOnboarding, params });

  // Function to handle redirection to login
  const proceedToLogin = async () => {
    console.log('PaywallScreen: Proceeding to login screen');
    await setJustSubscribedFlag();
    router.replace(ROUTES.AUTH.LOGIN);
  };

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
          setButtonText('Processing Purchase...');
          
          // Use the test_paywall identifier or whatever is appropriate
          await presentPaywall('test_paywall');
          
          // After paywall is closed, check subscription status
          console.log('PaywallScreen: Paywall interaction completed, checking subscription and flags');
          
          // Check subscription status and redirect accordingly
          if (isSubscribed) {
            console.log('PaywallScreen: User is now showing as subscribed, redirecting to login');
            setButtonText('Subscription Active - Continue to Login');
            proceedToLogin();
          } else {
            console.log('PaywallScreen: Checking justSubscribed flag');
            const checkIfSubscribed = await checkJustSubscribedFlag();
            if (checkIfSubscribed) {
              console.log('PaywallScreen: justSubscribed flag is set, redirecting to login');
              setButtonText('Subscription Active - Continue to Login');
              proceedToLogin();
            } else {
              setButtonText('Continue to Login');
            }
          }
        }
      } catch (error) {
        console.error('PaywallScreen: Error showing paywall:', error);
        setButtonText('Continue to Login');
      }
    };

    // If user is already subscribed, set flag and redirect to login
    if (isSubscribed) {
      setButtonText('Subscription Active - Continue to Login');
      proceedToLogin();
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
        <>
          <ActivityIndicator size="large" color={colorScheme === 'dark' ? Colors.light.tint : Colors.dark.tint} />
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint }
            ]}
            onPress={proceedToLogin}
          >
            <ThemedText style={styles.buttonText}>
              {buttonText}
            </ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            Unlock StrikeLab Premium
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isSubscribed ? 'Subscription Active' : 'Loading subscription options...'}
          </ThemedText>
          
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint }
            ]}
            onPress={proceedToLogin}
          >
            <ThemedText style={styles.buttonText}>
              {buttonText}
            </ThemedText>
          </TouchableOpacity>
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
    marginBottom: 30,
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 