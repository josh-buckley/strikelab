import { usePaywall } from '@/contexts/PaywallContext';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';

export function usePremiumFeature() {
  const { isSubscribed, presentPaywall, loading } = usePaywall();

  const checkAccess = async (featureId: string): Promise<boolean> => {
    // If subscriptions are disabled, grant access to everything
    if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
      return true;
    }

    if (loading) {
      return false;
    }

    if (isSubscribed) {
      return true;
    }

    // Show paywall for this feature
    await presentPaywall(featureId);
    return false;
  };

  return {
    checkAccess,
    isSubscribed,
    loading,
  };
} 