import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const VERIFY_RECEIPT_ENDPOINT = 'https://api.strikelab.app/verify-subscription';

interface VerifyReceiptResponse {
  isValid: boolean;
  productId?: string;
  expirationDate?: string;
  isTrialPeriod?: boolean;
}

/**
 * Verifies an App Store receipt with Apple's servers via our backend
 */
export async function verifyAppStoreReceipt(receipt: string): Promise<VerifyReceiptResponse> {
  try {
    const response = await fetch(VERIFY_RECEIPT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'ios',
        receipt: receipt,
        // Include sandbox flag for development
        sandbox: __DEV__
      })
    });

    if (!response.ok) {
      throw new Error(`Receipt verification failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      isValid: data.isValid,
      productId: data.productId,
      expirationDate: data.expirationDate,
      isTrialPeriod: data.isTrialPeriod
    };
  } catch (error) {
    console.error('Error verifying App Store receipt:', error);
    return { isValid: false };
  }
}

/**
 * Verifies a Play Store purchase token with Google's servers via our backend
 */
export async function verifyPlayStorePurchase(purchase: {
  productId: string;
  purchaseToken: string;
  packageName: string;
}): Promise<VerifyReceiptResponse> {
  try {
    const response = await fetch(VERIFY_RECEIPT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'android',
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        packageName: purchase.packageName
      })
    });

    if (!response.ok) {
      throw new Error(`Purchase verification failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      isValid: data.isValid,
      productId: data.productId,
      expirationDate: data.expirationDate,
      isTrialPeriod: data.isTrialPeriod
    };
  } catch (error) {
    console.error('Error verifying Play Store purchase:', error);
    return { isValid: false };
  }
}

/**
 * Updates the subscription record in our database
 */
export async function updateSubscriptionRecord(
  userId: string,
  verificationResult: VerifyReceiptResponse,
  subscriptionId?: string
) {
  // Implementation will depend on your database structure
  // This is just a placeholder for the concept
  if (verificationResult.isValid) {
    const subscriptionData = {
      user_id: userId,
      status: verificationResult.isTrialPeriod ? 'trial' : 'active',
      product_id: verificationResult.productId,
      updated_at: new Date().toISOString(),
      valid_until: verificationResult.expirationDate,
      trial_end_date: verificationResult.isTrialPeriod ? verificationResult.expirationDate : null
    };

    if (subscriptionId) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', subscriptionId);

      if (error) throw error;
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    }
  }
} 