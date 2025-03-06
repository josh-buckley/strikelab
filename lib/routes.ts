export const ROUTES = {
  AUTH: {
    LOGIN: '/(auth)/login' as const,
    ONBOARDING: '/(auth)/onboarding' as const,
    PAYWALL: '/(auth)/paywall' as const,
  },
  TABS: {
    HOME: '/(tabs)' as const,
    HISTORY: '/(tabs)/history' as const,
    COACH: '/(tabs)/coach' as const,
  },
  CREATE_WORKOUT: '/create-workout' as const,
} as const;

// Helper type for route parameters
export type AppRouteParams = {
  '/(auth)/login': undefined;
  '/(auth)/onboarding': undefined;
  '/(auth)/paywall': undefined;
  '/(tabs)': undefined;
  '/(tabs)/history': undefined;
  '/(tabs)/coach': undefined;
  '/create-workout': undefined;
}; 