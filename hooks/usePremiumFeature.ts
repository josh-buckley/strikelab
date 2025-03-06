import { usePaywall } from '@/contexts/PaywallContext';

export function usePremiumFeature() {
  const { isSubscribed, presentPaywall, loading } = usePaywall();

  const checkAccess = async (featureId: string): Promise<boolean> => {
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