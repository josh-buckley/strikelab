import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product identifiers
export const ENTITLEMENT_ID = 'Premium Access';
export const PRODUCT_IDS = {
  MONTHLY: 'com.joshbuckley.strikelab.premium.monthly',
  ANNUAL: 'com.joshbuckley.strikelab.premium.annual'
} as const;

let isInitialized = false;

// Initialize RevenueCat with your API keys
export async function initializeRevenueCat() {
  if (isInitialized) {
    console.log('RevenueCat already initialized');
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      throw new Error('RevenueCat API key not found');
    }

    console.log('Configuring RevenueCat...');
    await Purchases.configure({ apiKey });
    console.log('RevenueCat configured successfully');

    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    isInitialized = true;
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    throw error;
  }
}

// Ensure RevenueCat is initialized before any operation
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeRevenueCat();
  }
}

// Get customer info (subscription status)
export async function getCustomerInfo(): Promise<CustomerInfo> {
  await ensureInitialized();
  return await Purchases.getCustomerInfo();
}

// Check if user has active subscription
export async function hasActiveSubscription(): Promise<boolean> {
  await ensureInitialized();
  const customerInfo = await getCustomerInfo();
  return customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
}

// Get available packages
export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  await ensureInitialized();
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch (error) {
    console.error('Error getting available packages:', error);
    return [];
  }
}

// Purchase a package
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  await ensureInitialized();
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
    console.log('Purchase successful:', {
      productId: productIdentifier,
      hasAccess: customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive
    });
    return { success: true, customerInfo };
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Error purchasing package:', error);
    }
    return { 
      success: false, 
      error: error.userCancelled ? 'cancelled' : error.message 
    };
  }
}

// Identify user for RevenueCat
export async function identifyUser(userId: string) {
  await ensureInitialized();
  try {
    // Log in to RevenueCat with the user ID
    await Purchases.logIn(userId);
    
    // Mark that we've identified a non-anonymous user
    await AsyncStorage.setItem('strikelab_rc_identified', 'true');
    
    console.log('User identified with RevenueCat:', userId);
  } catch (error) {
    console.error('Error identifying user with RevenueCat:', error);
    throw error;
  }
}

// Reset user identification when logging out
export async function resetUser() {
  if (!isInitialized) return;
  try {
    await Purchases.logOut();
    // Clear the identified flag
    await AsyncStorage.removeItem('strikelab_rc_identified');
  } catch (error) {
    console.error('Error resetting RevenueCat user:', error);
    throw error;
  }
}

// Get subscription details
export async function getSubscriptionDetails(): Promise<{
  isSubscribed: boolean;
  isTrialActive: boolean;
  subscriptionType: 'monthly' | 'annual' | null;
}> {
  await ensureInitialized();
  const customerInfo = await getCustomerInfo();
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isSubscribed: false,
      isTrialActive: false,
      subscriptionType: null
    };
  }

  return {
    isSubscribed: true,
    isTrialActive: entitlement.periodType === 'TRIAL',
    subscriptionType: entitlement.productIdentifier === PRODUCT_IDS.MONTHLY ? 'monthly' : 'annual'
  };
}

// Restore purchases
export async function restorePurchases(): Promise<boolean> {
  await ensureInitialized();
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return false;
  }
}

// Set up customer info listener
export function setupCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
) {
  if (!isInitialized) {
    console.warn('Attempting to set up listener before RevenueCat is initialized');
    return () => {};
  }

  Purchases.addCustomerInfoUpdateListener(callback);
  return () => {
    // Cleanup will be handled automatically
  };
}

// Sync purchases from StoreKit to RevenueCat
// This is essential when Superwall handles purchases - RevenueCat needs to be notified
export async function syncPurchases(): Promise<void> {
  await ensureInitialized();
  try {
    console.log('RevenueCat: Syncing purchases...');
    await Purchases.syncPurchases();
    console.log('RevenueCat: Purchases synced successfully');
  } catch (error) {
    console.error('Error syncing purchases with RevenueCat:', error);
    throw error;
  }
}

// Log purchase from Superwall/StoreKit (legacy, use syncPurchases instead)
export async function logPurchase(receipt: string): Promise<void> {
  await syncPurchases();
} 