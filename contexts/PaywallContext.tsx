import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Superwall from '@superwall/react-native-superwall';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeRevenueCat,
  identifyUser,
  resetUser,
  getSubscriptionDetails,
  restorePurchases,
  syncPurchases,
  PRODUCT_IDS,
  setupCustomerInfoListener
} from '@/lib/revenueCat';
import { ensureUserProfile } from '@/lib/userProfile';

// Key for the "just subscribed" flag
const JUST_SUBSCRIBED_KEY = 'strikelab_just_subscribed';
// Key for tracking subscription status in AsyncStorage
const IS_SUBSCRIBED_KEY = 'strikelab_is_subscribed';
// Key for tracking if paywall has been shown this session
const HAS_SHOWN_PAYWALL_KEY = 'strikelab_has_shown_paywall_session';

interface PaywallContextType {
  isSubscribed: boolean;
  loading: boolean;
  presentPaywall: (identifier: string) => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  isTrialActive: boolean;
  subscriptionType: 'monthly' | 'annual' | null;
  restoreSubscription: () => Promise<void>;
  setJustSubscribedFlag: () => Promise<void>;
  clearJustSubscribedFlag: () => Promise<void>;
  checkJustSubscribedFlag: () => Promise<boolean>;
  hasShownPaywall: boolean;
  resetPaywallShownFlag: () => void;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

// How often to verify subscription status
const SUBSCRIPTION_VERIFY_INTERVAL = 1000 * 60 * 60; // 1 hour

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  console.log('PaywallProvider initializing');

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual' | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);
  const { session } = useAuth();

  // Reset paywall shown flag (e.g., when user signs out)
  const resetPaywallShownFlag = useCallback(() => {
    console.log('PaywallContext: Resetting hasShownPaywall flag');
    setHasShownPaywall(false);
  }, []);

  // Initialize Superwall and RevenueCat
  useEffect(() => {
    console.log('PaywallProvider initialization effect running');
    let mounted = true;
    
    const initializeServices = async () => {
      try {
        // Check if there's a stored subscription status first
        const [storedSubscriptionStatus, storedSubscriptionType, storedTrialStatus] = await Promise.all([
          AsyncStorage.getItem(IS_SUBSCRIBED_KEY),
          AsyncStorage.getItem('strikelab_subscription_type'),
          AsyncStorage.getItem('strikelab_is_trial')
        ]);
        
        if (storedSubscriptionStatus === 'true' && mounted) {
          console.log('Found stored subscription status: subscribed');
          setIsSubscribed(true);
          setSubscriptionType(storedSubscriptionType as 'monthly' | 'annual' | null || 'monthly');
          setIsTrialActive(storedTrialStatus === 'true');
        }
        
        // Initialize Superwall
        const superwallKey = Platform.OS === "ios" 
          ? process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY 
          : process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY;

        if (!superwallKey) {
          throw new Error('SuperWall API key not found');
        }

        console.log('Configuring Superwall');
        Superwall.configure(superwallKey);
        console.log('SuperWall initialized successfully');

        // Initialize RevenueCat
        console.log('Initializing RevenueCat');
        await initializeRevenueCat();
        console.log('RevenueCat initialized successfully');

        if (mounted) {
          // Set up customer info listener
          setupCustomerInfoListener(async (customerInfo) => {
            console.log('Customer info updated, checking subscription status');
            if (mounted) {
              await checkSubscription();
            }
          });
        }

      } catch (error) {
        console.error('Error initializing services:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Delay initialization slightly to ensure native modules are ready
    const initTimer = setTimeout(() => {
      initializeServices();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
    };
  }, []);

  // Profile creation using shared utility
  const createUserProfile = async (user: User) => {
    console.log('PaywallContext: Ensuring user profile exists for:', user.id);
    const result = await ensureUserProfile(user);
    if (!result.success) {
      console.error('PaywallContext: Failed to ensure user profile:', result.error);
      // Don't throw - user is still subscribed, just log error
    }
  };

  // Helper to persist subscription state to AsyncStorage
  const persistSubscriptionState = async (
    subscribed: boolean,
    type: 'monthly' | 'annual' | null,
    trial: boolean
  ) => {
    try {
      if (subscribed) {
        await Promise.all([
          AsyncStorage.setItem(IS_SUBSCRIBED_KEY, 'true'),
          AsyncStorage.setItem('strikelab_subscription_type', type || 'monthly'),
          AsyncStorage.setItem('strikelab_is_trial', trial ? 'true' : 'false'),
        ]);
        console.log('PaywallContext: Subscription state persisted to AsyncStorage');
      } else {
        await Promise.all([
          AsyncStorage.setItem(IS_SUBSCRIBED_KEY, 'false'),
          AsyncStorage.removeItem('strikelab_subscription_type'),
          AsyncStorage.removeItem('strikelab_is_trial'),
        ]);
        console.log('PaywallContext: Subscription state cleared from AsyncStorage');
      }
    } catch (error) {
      console.error('PaywallContext: Error persisting subscription state:', error);
    }
  };

  // Helper to update subscription state and persist
  const updateSubscriptionState = async (
    subscribed: boolean,
    type: 'monthly' | 'annual' | null,
    trial: boolean
  ) => {
    setIsSubscribed(subscribed);
    setSubscriptionType(type);
    setIsTrialActive(trial);
    await persistSubscriptionState(subscribed, type, trial);

    // Update Superwall status
    if (Superwall.shared) {
      if (subscribed) {
        const entitlements = new Set(['Premium Access']);
        Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
      } else {
        Superwall.shared.subscriptionStatus = 'inactive';
      }
    }
  };

  // Ensure session is valid during subscription process
  const ensureSessionValid = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Try to refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Store subscription state temporarily
        await AsyncStorage.setItem('pending_subscription_state', JSON.stringify({
          isSubscribed: true,
          type: subscriptionType,
          isTrial: isTrialActive,
          timestamp: Date.now()
        }));
        
        throw new Error('Session expired during subscription process');
      }
    }
    return true;
  };

  // Function to set the "just subscribed" flag
  const setJustSubscribedFlag = async () => {
    try {
      console.log('Setting justSubscribed flag in AsyncStorage');
      await AsyncStorage.setItem(JUST_SUBSCRIBED_KEY, 'true');
    } catch (error) {
      console.error('Error setting justSubscribed flag:', error);
    }
  };

  // Function to clear the "just subscribed" flag
  const clearJustSubscribedFlag = async () => {
    try {
      console.log('Clearing justSubscribed flag from AsyncStorage');
      await AsyncStorage.removeItem(JUST_SUBSCRIBED_KEY);
    } catch (error) {
      console.error('Error clearing justSubscribed flag:', error);
    }
  };

  // Function to check if the "just subscribed" flag exists
  const checkJustSubscribedFlag = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(JUST_SUBSCRIBED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking justSubscribed flag:', error);
      return false;
    }
  };

  const checkSubscription = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // First check if we have a session
      if (!session?.user) {
        // Check for pending subscription state first
        try {
          const pendingState = await AsyncStorage.getItem('pending_subscription_state');
          if (pendingState) {
            const parsed = JSON.parse(pendingState);
            const timestamp = parsed.timestamp;
            const now = Date.now();
            
            // Only use pending state if it's less than 1 hour old
            if (now - timestamp < 1000 * 60 * 60) {
              console.log('Found valid pending subscription state:', parsed);
              setIsSubscribed(parsed.isSubscribed);
              setSubscriptionType(parsed.type);
              setIsTrialActive(parsed.isTrial);
              
              // Clear the pending state
              await AsyncStorage.removeItem('pending_subscription_state');
              return true;
            } else {
              console.log('Pending subscription state expired, removing');
              await AsyncStorage.removeItem('pending_subscription_state');
            }
          }
        } catch (pendingError) {
          console.error('Error checking pending subscription state:', pendingError);
        }

        console.log('No authenticated session, checking for anonymous subscription...');
        
        try {
          // Check for anonymous subscription on the current device
          console.log('Checking for anonymous subscription status');
          const details = await getSubscriptionDetails();
          
          if (details.isSubscribed) {
            console.log('Anonymous subscription detected, updating state');
            await updateSubscriptionState(true, details.subscriptionType, details.isTrialActive);

            // Store subscription details for transfer when user logs in
            await AsyncStorage.setItem('strikelab_anon_subscription_type', details.subscriptionType || 'monthly');
            await AsyncStorage.setItem('strikelab_anon_is_trial', details.isTrialActive ? 'true' : 'false');

            return true;
          }
          
          console.log('No anonymous subscription found');
          return false;
        } catch (anonError) {
          console.error('Error checking for anonymous subscription:', anonError);
          return false;
        }
      }

      // If we have a session, ensure it's valid before proceeding
      try {
        await ensureSessionValid();
      } catch (sessionError) {
        console.error('Session validation failed:', sessionError);
        return false;
      }

      // If we have a session, check for a subscription transfer
      console.log('Identifying user with RevenueCat:', session.user.id);
      await identifyUser(session.user.id);

      // Check if we need to transfer an anonymous subscription
      const [anonSubType, anonIsTrial] = await Promise.all([
        AsyncStorage.getItem('strikelab_anon_subscription_type'),
        AsyncStorage.getItem('strikelab_anon_is_trial')
      ]);

      if (anonSubType) {
        console.log('Found anonymous subscription to transfer:', { type: anonSubType, isTrial: anonIsTrial });
        
        // Attempt to verify the subscription multiple times
        let verificationAttempts = 0;
        const maxAttempts = 3;
        
        while (verificationAttempts < maxAttempts) {
          console.log(`Attempting to verify subscription transfer (attempt ${verificationAttempts + 1}/${maxAttempts})`);
          
          const details = await getSubscriptionDetails();
          
          if (details.isSubscribed) {
            console.log('Subscription successfully transferred to authenticated user');

            // Clear anonymous subscription data
            await Promise.all([
              AsyncStorage.removeItem('strikelab_anon_subscription_type'),
              AsyncStorage.removeItem('strikelab_anon_is_trial')
            ]);

            // Update state with transferred subscription
            await updateSubscriptionState(true, details.subscriptionType, details.isTrialActive);

            // Create user profile
            await createUserProfile(session.user);

            return true;
          }
          
          // Add delay between attempts
          await new Promise(resolve => setTimeout(resolve, 1500 * (verificationAttempts + 1)));
          verificationAttempts++;
        }
        
        console.error('Failed to verify subscription transfer after multiple attempts');
        return false;
      }

      // Normal subscription check for authenticated users
      console.log('Checking subscription status for authenticated user');
      const details = await getSubscriptionDetails();

      if (details.isSubscribed) {
        console.log('Active subscription found for authenticated user');
        await updateSubscriptionState(true, details.subscriptionType, details.isTrialActive);

        // Create or update user profile
        await createUserProfile(session.user);

        return true;
      }

      console.log('No active subscription found for authenticated user');
      await updateSubscriptionState(false, null, false);

      return false;

    } catch (error) {
      console.error('Error in subscription flow:', error);
      await updateSubscriptionState(false, null, false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle user session changes
  useEffect(() => {
    console.log('PaywallProvider session effect:', {
      hasSession: !!session,
      loading,
      isSubscribed
    });

    if (session?.user) {
      checkSubscription();
    } else {
      console.log('No session, clearing subscription state');

      // Reset paywall shown flag so it can be shown again after sign out
      setHasShownPaywall(false);

      // Only reset RevenueCat user if we're not already in anonymous state
      const handleSignOut = async () => {
        try {
          const identified = await AsyncStorage.getItem('strikelab_rc_identified');
          if (identified === 'true') {
            console.log('Previously identified non-anonymous user, resetting RevenueCat user');
            try {
              await resetUser();
              await AsyncStorage.removeItem('strikelab_rc_identified');
            } catch (error: any) {
              console.log('Safe to ignore RevenueCat reset error for anonymous user:', error.message);
            }
          } else {
            console.log('No previously identified user, skipping RevenueCat reset');
          }
        } catch (error) {
          console.error('Error handling RevenueCat user state:', error);
        }

        // Clear subscription state and persist
        setIsSubscribed(false);
        setIsTrialActive(false);
        setSubscriptionType(null);
        await persistSubscriptionState(false, null, false);

        if (Superwall.shared) {
          Superwall.shared.subscriptionStatus = 'inactive';
        }
      };

      handleSignOut();
    }
  }, [session]);

  const presentPaywall = async (identifier: string) => {
    console.log('PaywallContext: Attempting to present paywall with identifier:', identifier);

    // Check if already subscribed - no need to show paywall
    if (isSubscribed) {
      console.log('PaywallContext: User already subscribed, skipping paywall');
      return;
    }

    // Check if we've already shown the paywall this session
    if (hasShownPaywall) {
      console.log('PaywallContext: Paywall already shown this session, skipping');
      return;
    }

    try {
      if (!Superwall.shared) {
        throw new Error('Superwall.shared is not available');
      }

      // Mark that we've shown the paywall
      setHasShownPaywall(true);
      console.log('PaywallContext: Marking paywall as shown');

      // Create a promise to handle the Superwall callback
      await Superwall.shared.register(identifier).then(async () => {
        console.log('PaywallContext: Paywall callback executed - purchase completed or paywall dismissed');

        try {
          // IMPORTANT: Sync purchases with RevenueCat first
          // When Superwall handles a purchase via StoreKit, RevenueCat may not know about it yet
          // This is critical for App Store review where sandbox purchases need to be synced
          console.log('PaywallContext: Syncing purchases with RevenueCat...');
          try {
            await syncPurchases();
            console.log('PaywallContext: Purchase sync completed');
          } catch (syncError) {
            console.warn('PaywallContext: Purchase sync failed, continuing with verification:', syncError);
          }

          // Small delay to allow RevenueCat backend to process the synced purchase
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Try multiple times to verify the subscription
          let attempts = 0;
          const maxAttempts = 3;
          let subscriptionVerified = false;

          while (attempts < maxAttempts && !subscriptionVerified) {
            try {
              console.log(`PaywallContext: Checking subscription status (attempt ${attempts + 1}/${maxAttempts})`);

              // Add increasing delays between attempts
              if (attempts > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500 * (attempts + 1)));

                // Sync again on retry in case it helps
                try {
                  await syncPurchases();
                } catch (e) {
                  // Ignore sync errors on retry
                }
              }

              // Session validation is optional - anonymous users can still have valid purchases
              try {
                await ensureSessionValid();
              } catch (sessionError) {
                console.log(`PaywallContext: No valid session (attempt ${attempts + 1}), continuing anyway for anonymous purchase`);
                // Don't skip - anonymous purchases are valid
              }

              const subscriptionDetails = await getSubscriptionDetails();
              console.log('PaywallContext: Subscription details:', subscriptionDetails);
              
              if (subscriptionDetails.isSubscribed) {
                console.log('PaywallContext: RevenueCat confirms subscription');
                console.log('PaywallContext: Subscription details:', {
                  type: subscriptionDetails.subscriptionType,
                  isTrial: subscriptionDetails.isTrialActive
                });
                
                // Set the justSubscribed flag to ensure proper navigation
                await setJustSubscribedFlag();
                
                // Update subscription state
                setIsSubscribed(true);
                setIsTrialActive(subscriptionDetails.isTrialActive);
                setSubscriptionType(subscriptionDetails.subscriptionType);
                
                // Persist the subscription status and type
                await AsyncStorage.setItem(IS_SUBSCRIBED_KEY, 'true');
                await AsyncStorage.setItem('strikelab_subscription_type', subscriptionDetails.subscriptionType || 'monthly');
                await AsyncStorage.setItem('strikelab_is_trial', subscriptionDetails.isTrialActive ? 'true' : 'false');
                
                // Update Superwall status
                if (Superwall.shared) {
                  const entitlements = new Set(['Premium Access']);
                  Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
                }
                
                subscriptionVerified = true;
                break;
              } else {
                console.log('PaywallContext: No active subscription detected, will retry');
              }
            } catch (verifyError) {
              console.error(`PaywallContext: Error verifying subscription (attempt ${attempts + 1}):`, verifyError);
            }
            
            attempts++;
          }
          
          if (!subscriptionVerified) {
            console.log('PaywallContext: Failed to verify subscription after initial attempts');

            // RevenueCat may take longer to process sandbox receipts (used during App Store review)
            // Try additional attempts with longer delays before giving up
            console.log('PaywallContext: Attempting extended verification for potential sandbox purchase');

            let extendedAttempts = 0;
            const maxExtendedAttempts = 3;

            while (extendedAttempts < maxExtendedAttempts && !subscriptionVerified) {
              // Longer delays: 3s, 5s, 8s
              const delay = (extendedAttempts + 1) * 2000 + 1000;
              console.log(`PaywallContext: Extended verification attempt ${extendedAttempts + 1}/${maxExtendedAttempts}, waiting ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));

              try {
                const extendedDetails = await getSubscriptionDetails();
                if (extendedDetails.isSubscribed) {
                  console.log('PaywallContext: Subscription verified on extended attempt');
                  await setJustSubscribedFlag();
                  await updateSubscriptionState(true, extendedDetails.subscriptionType, extendedDetails.isTrialActive);
                  subscriptionVerified = true;
                  break;
                }
              } catch (extendedError) {
                console.error(`PaywallContext: Extended verification attempt ${extendedAttempts + 1} failed:`, extendedError);
              }

              extendedAttempts++;
            }

            // If still not verified, try to get receipt directly from Superwall as last resort
            if (!subscriptionVerified) {
              console.log('PaywallContext: All verification attempts failed, trying receipt-based fallback');

              try {
                const receipt = await Superwall.shared.getAppStoreReceipt();
                if (receipt) {
                  console.log('PaywallContext: Found App Store receipt, granting access');

                  // Check if it's an annual subscription
                  const isAnnual = receipt.toLowerCase().includes('annual') || receipt.toLowerCase().includes('yearly');

                  await setJustSubscribedFlag();
                  await updateSubscriptionState(true, isAnnual ? 'annual' : 'monthly', isAnnual);

                  console.log('PaywallContext: Set subscription type to:', isAnnual ? 'annual' : 'monthly');
                  subscriptionVerified = true;
                }
              } catch (receiptError) {
                console.error('PaywallContext: Receipt-based fallback failed:', receiptError);
                // At this point, we've exhausted all options
                // The purchase may have failed or there's a genuine issue
              }
            }

            if (!subscriptionVerified) {
              console.error('PaywallContext: Unable to verify subscription after all attempts');
              // Don't show an error to the user - let them try again or contact support
              // The Superwall paywall should have already handled the purchase result
            }
          }
        } catch (checkError) {
          console.error('PaywallContext: Critical error in subscription verification:', checkError);
        }
      }).catch((error) => {
        if (error.code === 'USER_CANCELLED') {
          console.log('PaywallContext: User cancelled the paywall');
          return;
        }
        throw error;
      });

    } catch (error) {
      console.error('PaywallContext: Error presenting paywall:', error);
      throw error;
    }
  };

  // Restore subscription
  const restoreSubscription = async () => {
    try {
      setLoading(true);
      const hasValidSubscription = await restorePurchases();
      
      if (!hasValidSubscription) {
        console.log('No valid subscription found to restore');
      }
      
      await checkSubscription();
    } catch (error) {
      console.error('Error restoring subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    isSubscribed,
    loading,
    presentPaywall,
    checkSubscription,
    isTrialActive,
    subscriptionType,
    restoreSubscription,
    setJustSubscribedFlag,
    clearJustSubscribedFlag,
    checkJustSubscribedFlag,
    hasShownPaywall,
    resetPaywallShownFlag,
  };

  console.log('PaywallContext: Current state:', {
    isSubscribed,
    loading,
    hasSession: !!session,
    isTrialActive,
    subscriptionType,
  });

  return (
    <PaywallContext.Provider value={contextValue}>
      {children}
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
} 