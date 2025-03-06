import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { View } from 'react-native';
import { supabase } from './supabase';
import { Database } from './database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserProfile = Database['public']['Tables']['users']['Row'];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markOnboardingCompleted: () => Promise<void>;
  isFirstLaunch: boolean;
};

const ONBOARDING_COMPLETED_KEY = 'strikelab_onboarding_completed';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  markOnboardingCompleted: async () => {},
  isFirstLaunch: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextType, 'signOut' | 'refreshProfile' | 'markOnboardingCompleted' | 'isFirstLaunch'>>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
    initialized: false,
  });

  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  // Fetch user profile data
  async function fetchProfile(userId: string, retryCount = 0) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // First check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No valid session found during profile fetch');
        // In production, we'll try to refresh the session
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw refreshError;
          }
          // If refresh successful, continue with profile fetch
        } catch (refreshError) {
          console.error('Session refresh failed:', refreshError);
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Session expired. Please sign in again.'
          }));
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If the error is PGRST116 (no rows returned), the profile might still be being created
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log(`Profile not found, attempt ${retryCount + 1}/3...`);
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, retryCount + 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchProfile(userId, retryCount + 1);
        }
        throw error;
      }

      // Verify the profile data is complete
      if (!data || !data.id || !data.email) {
        throw new Error('Incomplete profile data');
      }

      setState(prev => ({
        ...prev,
        profile: data,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // In production, we want to be more specific about error messages
      let errorMessage = 'Failed to fetch profile';
      if (error instanceof AuthError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }

  // Refresh user profile data
  async function refreshProfile() {
    if (state.user?.id) {
      await fetchProfile(state.user.id);
    }
  }

  // Sign out function
  async function signOut() {
    try {
      console.log('AuthProvider: Starting sign out');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      console.log('AuthProvider: Supabase sign out completed', error ? 'with error' : 'successfully');
      
      if (error) throw error;
      
      // Clear all state after successful sign out
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
        initialized: true,
      });
      console.log('AuthProvider: State cleared after sign out');
      
    } catch (error) {
      console.error('AuthProvider: Error signing out:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof AuthError ? error.message : 'Failed to sign out',
        loading: false,
      }));
    }
  }

  // Initial session check
  useEffect(() => {
    console.log('AuthProvider: Starting initial session check');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check complete', { 
        hasSession: !!session, 
        error: error?.message,
        userId: session?.user?.id 
      });
      
      if (error) {
        console.error('AuthProvider: Session check error:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
          initialized: true,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: session?.user ? true : false, // Keep loading true if we need to fetch profile
        initialized: true,
      }));

      if (session?.user) {
        console.log('AuthProvider: Fetching profile for user:', session.user.id);
        fetchProfile(session.user.id);
      }
    }).catch(error => {
      console.error('AuthProvider: Unexpected error during session check:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check authentication status',
        loading: false,
        initialized: true,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed', { event, hasSession: !!session });
      
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        // Don't reset loading here as we might need to fetch profile
      }));

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider: Processing SIGNED_OUT event');
        setState(prev => ({
          ...prev,
          profile: null,
          loading: false,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Get the subscription status from AsyncStorage to avoid circular dependency
        // with PaywallContext
        const isUserSubscribed = await AsyncStorage.getItem('strikelab_is_subscribed');
        
        const isFirst = await checkFirstLaunch();
        console.log('AuthProvider: First launch check:', isFirst, 'Subscribed:', isUserSubscribed === 'true');
        setIsFirstLaunch(isFirst);
        
        // Only force sign out for first launch if the user is NOT subscribed
        // This prevents subscribed users from being forced back to onboarding
        if (isFirst && state.session && isUserSubscribed !== 'true') {
          console.log('AuthProvider: First launch with existing session, not subscribed - signing out to force onboarding');
          await signOut();
        } else if (isFirst && state.session && isUserSubscribed === 'true') {
          console.log('AuthProvider: First launch with subscription - marking onboarding as completed');
          await markOnboardingCompleted();
        }
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
      }
    };
    
    checkOnboardingStatus();
  }, [state.session]);

  // Add this function inside the AuthProvider component
  async function checkFirstLaunch() {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return hasCompletedOnboarding !== 'true';
    } catch (error) {
      console.error('Error checking first launch status:', error);
      return true; // Default to true if there's an error
    }
  }

  // Add this function inside the AuthProvider component
  async function markOnboardingCompleted() {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  }

  const contextValue = {
    ...state,
    signOut,
    refreshProfile,
    markOnboardingCompleted,
    isFirstLaunch,
  };

  if (!state.initialized) {
    console.log('AuthProvider: Not yet initialized');
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
  }

  console.log('AuthProvider: Rendering with state:', {
    initialized: state.initialized,
    loading: state.loading,
    hasSession: !!state.session,
    hasProfile: !!state.profile,
    error: state.error
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 