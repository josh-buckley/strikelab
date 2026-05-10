// RevenueCat wrapper - DISABLED (subscriptions disabled via feature flag)
// This file exports no-op functions to prevent import errors
// When ENABLE_SUBSCRIPTIONS is true, this file should be restored to its original version

export const ENTITLEMENT_ID = 'Premium Access';
export const PRODUCT_IDS = {
  MONTHLY: 'com.joshbuckley.strikelab.premium.monthly',
  ANNUAL: 'com.joshbuckley.strikelab.premium.annual'
} as const;

// No-op implementations (subscriptions disabled)
export async function initializeRevenueCat() {
  console.log('RevenueCat: initializeRevenueCat called but subscriptions are disabled');
}

export async function getCustomerInfo(): Promise<any> {
  console.log('RevenueCat: getCustomerInfo called but subscriptions are disabled');
  return {} as any;
}

export async function hasActiveSubscription(): Promise<boolean> {
  console.log('RevenueCat: hasActiveSubscription called but subscriptions are disabled');
  return false;
}

export async function getAvailablePackages(): Promise<any[]> {
  console.log('RevenueCat: getAvailablePackages called but subscriptions are disabled');
  return [];
}

export async function purchasePackage(_pkg: any): Promise<{
  success: boolean;
  customerInfo?: any;
  error?: string;
}> {
  console.log('RevenueCat: purchasePackage called but subscriptions are disabled');
  return { success: false, error: 'Subscriptions are disabled' };
}

export async function identifyUser(_userId: string) {
  console.log('RevenueCat: identifyUser called but subscriptions are disabled');
}

export async function resetUser() {
  console.log('RevenueCat: resetUser called but subscriptions are disabled');
}

export async function getSubscriptionDetails(): Promise<{
  isSubscribed: boolean;
  isTrialActive: boolean;
  subscriptionType: 'monthly' | 'annual' | null;
}> {
  console.log('RevenueCat: getSubscriptionDetails called but subscriptions are disabled');
  return {
    isSubscribed: false,
    isTrialActive: false,
    subscriptionType: null
  };
}

export async function restorePurchases(): Promise<boolean> {
  console.log('RevenueCat: restorePurchases called but subscriptions are disabled');
  return false;
}

export function setupCustomerInfoListener(_callback: (customerInfo: any) => void) {
  console.log('RevenueCat: setupCustomerInfoListener called but subscriptions are disabled');
  return () => {};
}

export async function syncPurchases(): Promise<void> {
  console.log('RevenueCat: syncPurchases called but subscriptions are disabled');
}

export async function logPurchase(_receipt: string): Promise<void> {
  console.log('RevenueCat: logPurchase called but subscriptions are disabled');
}
