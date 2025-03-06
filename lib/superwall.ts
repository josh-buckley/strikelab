import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const SUPERWALL_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY,
  android: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY,
  default: '',
});

export const initializeSuperwall = async () => {
  if (!SUPERWALL_API_KEY) {
    console.error('SuperWall API key not found');
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: SUPERWALL_API_KEY });
    console.log('SuperWall initialized successfully');
  } catch (error) {
    console.error('Error initializing SuperWall:', error);
  }
};

export const identifyUser = async (userId: string) => {
  try {
    await Purchases.logIn(userId);
    console.log('User identified with SuperWall:', userId);
  } catch (error) {
    console.error('Error identifying user with SuperWall:', error);
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

export const presentPaywall = async (paywallIdentifier: string) => {
  try {
    const offering = await Purchases.getOfferings();
    if (offering.current !== null) {
      // Present the paywall UI here
      console.log('Presenting paywall:', paywallIdentifier);
      return offering.current;
    }
  } catch (error) {
    console.error('Error presenting paywall:', error);
  }
}; 