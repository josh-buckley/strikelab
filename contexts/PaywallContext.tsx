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
  PRODUCT_IDS,
  setupCustomerInfoListener
} from '@/lib/revenueCat';

// Key for the "just subscribed" flag
const JUST_SUBSCRIBED_KEY = 'strikelab_just_subscribed';
// Key for tracking subscription status in AsyncStorage
const IS_SUBSCRIBED_KEY = 'strikelab_is_subscribed';

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
  const { session } = useAuth();

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

  // Separate profile creation logic
  const createUserProfile = async (user: User) => {
    console.log('Attempting to create user profile:', user.id);
    
    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        console.log('No existing profile found, creating new profile');
        
        // Create initial user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            stance: 'orthodox',
          });

        if (profileError) throw profileError;

        // Initialize user levels
        const { error: levelsError } = await supabase
          .from('user_levels')
          .insert({
            user_id: user.id,
            punches_level: 1,
            punches_xp: 0,
            kicks_level: 1,
            kicks_xp: 0,
            elbows_level: 1,
            elbows_xp: 0,
            knees_level: 1,
            knees_xp: 0,
            footwork_level: 1,
            footwork_xp: 0,
            clinch_level: 1,
            clinch_xp: 0,
            defensive_level: 1,
            defensive_xp: 0,
            sweeps_level: 1,
            sweeps_xp: 0,
            feints_level: 1,
            feints_xp: 0
          });

        if (levelsError) throw levelsError;

        // Initialize category progress
        const categories = [
          'punches', 'kicks', 'elbows', 'knees', 'footwork', 
          'clinch', 'defensive', 'sweeps', 'feints'
        ];
        
        const categoryEntries = categories.map(category => ({
          user_id: user.id,
          name: category,
          xp: 0,
          level: 1
        }));

        const { error: categoryError } = await supabase
          .from('category_progress')
          .insert(categoryEntries);

        if (categoryError) throw categoryError;

        // Initialize daily XP tracker
        const today = new Date().toISOString().split('T')[0];
        const { error: trackerError } = await supabase
          .from('daily_xp_tracker')
          .insert({
            user_id: user.id,
            date: today,
            workout_count: 0
          });

        if (trackerError) throw trackerError;

        console.log('User profile and related data initialized successfully');
      } else {
        console.log('Existing profile found for user:', user.id);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't throw - user is still subscribed, just log error
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
            setIsSubscribed(true);
            setIsTrialActive(details.isTrialActive);
            setSubscriptionType(details.subscriptionType);
            
            // Store subscription details for transfer
            await AsyncStorage.setItem('strikelab_anon_subscription_type', details.subscriptionType || 'monthly');
            await AsyncStorage.setItem('strikelab_anon_is_trial', details.isTrialActive ? 'true' : 'false');
            
            // Set subscription status in Superwall
            if (Superwall.shared) {
              console.log('Updating Superwall status for anonymous user');
              const entitlements = new Set(['Premium Access']);
              Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
            }
            
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
            setIsSubscribed(true);
            setIsTrialActive(details.isTrialActive);
            setSubscriptionType(details.subscriptionType);
            
            // Update Superwall status
            if (Superwall.shared) {
              const entitlements = new Set(['Premium Access']);
              Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
            }
            
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
        setIsSubscribed(true);
        setIsTrialActive(details.isTrialActive);
        setSubscriptionType(details.subscriptionType);
        
        // Update Superwall status
        if (Superwall.shared) {
          const entitlements = new Set(['Premium Access']);
          Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
        }
        
        // Create or update user profile
        await createUserProfile(session.user);
        
        return true;
      }
      
      console.log('No active subscription found for authenticated user');
      setIsSubscribed(false);
      setIsTrialActive(false);
      setSubscriptionType(null);
      
      if (Superwall.shared) {
        Superwall.shared.subscriptionStatus = 'inactive';
      }
      
      return false;

    } catch (error) {
      console.error('Error in subscription flow:', error);
      setIsSubscribed(false);
      setIsTrialActive(false);
      setSubscriptionType(null);
      if (Superwall.shared) {
        Superwall.shared.subscriptionStatus = 'inactive';
      }
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
      
      // Only reset RevenueCat user if we're not already in anonymous state
      try {
        // We'll use AsyncStorage to track if we've previously identified a non-anonymous user
        AsyncStorage.getItem('strikelab_rc_identified').then(identified => {
          if (identified === 'true') {
            console.log('Previously identified non-anonymous user, resetting RevenueCat user');
            resetUser().then(() => {
              AsyncStorage.removeItem('strikelab_rc_identified');
            }).catch(error => {
              console.log('Safe to ignore RevenueCat reset error for anonymous user:', error.message);
            });
          } else {
            console.log('No previously identified user, skipping RevenueCat reset');
          }
        });
      } catch (error) {
        console.error('Error handling RevenueCat user state:', error);
      }
      
      setIsSubscribed(false);
      setIsTrialActive(false);
      setSubscriptionType(null);
      if (Superwall.shared) {
        Superwall.shared.subscriptionStatus = 'inactive';
      }
    }
  }, [session]);

  const presentPaywall = async (identifier: string) => {
    console.log('PaywallContext: Attempting to present paywall with identifier:', identifier);
    try {
      if (!Superwall.shared) {
        throw new Error('Superwall.shared is not available');
      }

      // Create a promise to handle the Superwall callback
      await Superwall.shared.register(identifier).then(async () => {
        console.log('PaywallContext: Paywall callback executed - purchase completed or paywall dismissed');
        
        try {
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
              }
              
              // Ensure session is valid before checking subscription
              try {
                await ensureSessionValid();
              } catch (sessionError) {
                console.error(`PaywallContext: Session validation failed (attempt ${attempts + 1}):`, sessionError);
                attempts++;
                continue;
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
            console.log('PaywallContext: Failed to verify subscription after all attempts');
            
            // Special handling for sandbox testing
            if (__DEV__ || process.env.EXPO_PUBLIC_ENVIRONMENT === 'sandbox') {
              console.log('PaywallContext: In testing environment - ensuring subscription is set');
              
              // Get the subscription type from Superwall's callback if possible
              // This requires checking the product identifier or receipt
              try {
                const receipt = await Superwall.shared.getAppStoreReceipt();
                console.log('PaywallContext: Checking receipt for subscription type:', receipt);
                
                // Check if it's an annual subscription with trial
                const isAnnualWithTrial = receipt.includes('annual') || receipt.includes('yearly');
                
                await setJustSubscribedFlag();
                setIsSubscribed(true);
                setIsTrialActive(isAnnualWithTrial); // Only set trial active for annual plan
                setSubscriptionType(isAnnualWithTrial ? 'annual' : 'monthly');
                
                console.log('PaywallContext: Set subscription type to:', isAnnualWithTrial ? 'annual (with trial)' : 'monthly');
                
                await AsyncStorage.setItem(IS_SUBSCRIBED_KEY, 'true');
                if (Superwall.shared) {
                  const entitlements = new Set(['Premium Access']);
                  Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
                }
              } catch (receiptError) {
                // Fallback if we can't determine the subscription type
                console.log('PaywallContext: Could not determine subscription type, defaulting to monthly');
                await setJustSubscribedFlag();
                setIsSubscribed(true);
                setIsTrialActive(false);
                setSubscriptionType('monthly');
                await AsyncStorage.setItem(IS_SUBSCRIBED_KEY, 'true');
                if (Superwall.shared) {
                  const entitlements = new Set(['Premium Access']);
                  Superwall.shared.subscriptionStatus = { type: 'active', entitlements };
                }
              }
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