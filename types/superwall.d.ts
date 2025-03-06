declare module '@superwall/react-native-superwall' {
  type SubscriptionStatus = 
    | 'unknown'
    | 'inactive'
    | { type: 'active', entitlements: Set<string> };

  interface SuperwallOptions {
    isDebugMode?: boolean;
    paywallResponseTimeout?: number;
    subscriptionStatus?: SubscriptionStatus;
  }

  interface SuperwallInstance {
    register(event: string): Promise<void>;
    subscriptionStatus: SubscriptionStatus;
    getAppStoreReceipt(): Promise<string>;
    getPlayStorePurchase(): Promise<any>;
  }

  export default class Superwall {
    static configure(apiKey: string, options?: SuperwallOptions): void;
    static shared: SuperwallInstance;
  }
} 