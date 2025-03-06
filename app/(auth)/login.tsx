import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ROUTES } from '@/lib/routes';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import Superwall from '@superwall/react-native-superwall';
import * as Crypto from 'expo-crypto';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAuth } from '@/lib/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isSubscribed, presentPaywall, clearJustSubscribedFlag, checkJustSubscribedFlag, checkSubscription } = usePaywall();
  const { session, markOnboardingCompleted } = useAuth();

  // Clear the justSubscribed flag when a session is established
  useEffect(() => {
    if (session) {
      console.log('Login: Session established, clearing justSubscribed flag');
      clearJustSubscribedFlag();
      
      // If user is subscribed, also mark onboarding as completed to prevent redirection
      if (isSubscribed) {
        console.log('Login: User is subscribed, marking onboarding as completed');
        markOnboardingCompleted().catch(err => 
          console.error('Failed to mark onboarding completed:', err)
        );
      }
    }
  }, [session, isSubscribed]);

  // Remove the redirect for unsubscribed users
  // We now want users to be able to log in after subscribing
  // The layout will handle redirecting unsubscribed users to the paywall after login

  const handleTestPaywall = async () => {
    console.log('Test paywall button clicked');
    try {
      console.log('Superwall.shared available:', !!Superwall.shared);
      
      // Simple implementation directly from React Native docs
      await Superwall.shared.register('test_paywall').then(() => {
        // This will only run if:
        // 1. No paywall is configured for this placement
        // 2. The user is already paying
        // 3. The paywall is Non-Gated and was dismissed
        // 4. The paywall is Gated and the user purchased
        console.log('Feature callback executed - user has access');
      });

    } catch (error) {
      console.error('Error in handleTestPaywall:', error);
      setError('Failed to present paywall: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const signInWithEmail = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Login: Attempting to sign in with email and password');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login: Authentication error:', error);
        setError(error.message);
        return;
      }

      console.log('Login: Sign in successful, checking if user just subscribed');
      // After successful login, check if user just subscribed and clear the flag
      const wasJustSubscribed = await checkJustSubscribedFlag();
      
      if (wasJustSubscribed) {
        console.log('Login: User has just subscribed flag set, clearing it and checking subscription status');
        
        // If this was after a subscription, force check subscription status again
        // This is important for connecting the anonymous purchase to the user account
        await checkSubscription();
        
        // Clear the flag after successful login and subscription check
        await clearJustSubscribedFlag();
        console.log('Login: justSubscribed flag cleared after successful login');
      } else {
        console.log('Login: User did not have justSubscribed flag set');
      }
      
      // Explicitly mark onboarding as completed for subscribers
      if (isSubscribed) {
        console.log('Login: User is subscribed, marking onboarding as completed');
        await markOnboardingCompleted();
      }
      
      // Explicitly redirect to index page after successful authentication
      console.log('Email sign-in successful, redirecting to home page');
      router.replace('/(tabs)');
      
    } catch (err) {
      console.error('Login: Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  async function signUpWithEmail() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting signup process...');
      
      // First sign up the user
      const { error: signUpError, data: { user } } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Signup auth error:', signUpError);
        throw signUpError;
      }
      
      if (!user) {
        console.error('No user data returned from signup');
        throw new Error('No user data returned');
      }

      console.log('User created successfully:', user.id);

      // Check if email confirmation is required before proceeding
      if (user.identities?.length === 0) {
        console.log('Email confirmation required');
        setError('Please check your email to confirm your account before signing in');
        return;
      }

      try {
        // Ensure we have a valid session before proceeding
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!initialSession) {
          throw new Error('No valid session after signup');
        }

        // Create initial user profile with retry logic
        let profileCreated = false;
        for (let i = 0; i < 3 && !profileCreated; i++) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              stance: 'orthodox',
            });

          if (!profileError) {
            profileCreated = true;
            console.log('User profile created successfully');
          } else if (i < 2) {
            console.log(`Profile creation attempt ${i + 1} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          } else {
            throw profileError;
          }
        }

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

        if (categoryError) {
          console.error('Error initializing category progress:', categoryError);
          throw categoryError;
        }

        console.log('Category progress initialized successfully');

        // Initialize daily XP tracker
        const today = new Date().toISOString().split('T')[0];
        const { error: trackerError } = await supabase
          .from('daily_xp_tracker')
          .insert({
            user_id: user.id,
            date: today,
            workout_count: 0
          });

        if (trackerError) {
          console.error('Error initializing daily XP tracker:', trackerError);
          throw trackerError;
        }

        console.log('Daily XP tracker initialized successfully');

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

        if (levelsError) {
          console.error('Error initializing user levels:', levelsError);
          throw levelsError;
        }

        console.log('User levels initialized successfully');

        // Verify all data was created correctly
        const { data: verifyProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: verifyCategories } = await supabase
          .from('category_progress')
          .select('*')
          .eq('user_id', user.id);

        if (!verifyProfile || !verifyCategories || verifyCategories.length !== categories.length) {
          throw new Error('Data verification failed');
        }

        // Now that everything is initialized, let PaywallContext handle the subscription check
        // The navigation will be handled by the layout based on subscription status
        console.log('Account setup complete, proceeding to subscription check');

      } catch (initError) {
        console.error('Error during data initialization:', initError);
        // Clean up the created user if data initialization fails
        await supabase.auth.signOut();
        throw new Error('Failed to initialize user data. Please try again.');
      }

    } catch (error: any) {
      console.error('Detailed signup error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting Apple Sign In process...');
      
      // Get credentials from Apple Sign In - following official Supabase documentation
      console.log('Requesting Apple authentication...');
      let appleCredential;
      try {
        appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          // No nonce provided here - letting Apple generate one internally
        });
        console.log('Apple credential obtained successfully');
      } catch (appleError: any) {
        console.error('Error during Apple authentication step:', JSON.stringify({
          code: appleError.code,
          message: appleError.message
        }, null, 2));
        throw new Error(`Apple authentication failed: ${appleError.message || 'Unknown error'}`);
      }
      
      if (!appleCredential.identityToken) {
        console.error('No identity token received from Apple');
        throw new Error('No identity token received from Apple');
      }
      
      // For debugging only - log a small portion of the token
      const tokenPreview = appleCredential.identityToken.substring(0, 20) + '...' + 
                           appleCredential.identityToken.substring(appleCredential.identityToken.length - 20);
      console.log('Successfully received Apple credentials. Token preview:', tokenPreview);
      console.log('Attempting to sign in with Supabase using Apple token...');
      
      // Sign in with Supabase using ONLY the token - exactly as in the documentation
      let supabaseResponse;
      try {
        supabaseResponse = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: appleCredential.identityToken,
          // No nonce provided - exactly following the Supabase documentation
        });
        console.log('Supabase auth response received');
      } catch (supabaseError: any) {
        console.error('Exception during Supabase auth call:', JSON.stringify({
          message: supabaseError.message,
          stack: supabaseError.stack
        }, null, 2));
        throw new Error(`Supabase authentication call failed: ${supabaseError.message}`);
      }
      
      const { data, error: signInError } = supabaseResponse;

      if (signInError) {
        console.error('Supabase auth error with Apple Sign In:', JSON.stringify({
          code: signInError.code,
          name: signInError.name,
          message: signInError.message,
          status: signInError.status
        }, null, 2));
        throw signInError;
      }
      
      if (!data.user) {
        console.error('No user returned from Supabase after Apple Sign In');
        throw new Error('No user returned from authentication');
      }

      console.log('Successfully authenticated with Apple and Supabase', data.user.id);
      
      // Check if this was after a subscription
      const wasJustSubscribed = await checkJustSubscribedFlag();
      if (wasJustSubscribed) {
        console.log('Login: User has just subscribed flag set, checking subscription status');
        await checkSubscription();
        await clearJustSubscribedFlag();
      }
      
      // After successful Apple sign-in, mark onboarding as completed for subscribers
      if (isSubscribed) {
        console.log('Apple Login: User is subscribed, marking onboarding as completed');
        await markOnboardingCompleted();
      }
      
      // Explicitly redirect to index page after successful authentication
      console.log('Apple sign-in successful, redirecting to home page');
      router.replace('/(tabs)');
      
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        status: error.status,
        details: error.details
      };
      console.error('Error during Apple sign in:', JSON.stringify(errorDetails, null, 2));
      const errorMessage = error.message || 'Unknown error occurred';
      setError(`Apple Sign In failed: ${errorMessage}`);
      Alert.alert('Sign In Error', `Failed to sign in with Apple: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700' }]}>
          strikelab
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.content, { paddingTop: 24 }]}>
        {/* Email and password fields commented out for testing
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: error ? '#FF4B4B' : '#FFD700',
              borderWidth: 1
            }
          ]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: error ? '#FF4B4B' : '#FFD700',
              borderWidth: 1
            }
          ]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        */}

        {error && (
          <ThemedText style={styles.error}>{error}</ThemedText>
        )}

        {/* Email signin buttons commented out for testing
        <TouchableOpacity
          style={[
            styles.button,
            styles.signInButton,
            { opacity: loading ? 0.7 : 1 }
          ]}
          onPress={signInWithEmail}
          disabled={loading || !email || !password}
        >
          <ThemedText style={[styles.buttonText, { color: '#000' }]}>
            {loading ? 'Loading...' : 'Sign In'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.signUpButton,
            { opacity: loading ? 0.7 : 1 }
          ]}
          onPress={signUpWithEmail}
          disabled={loading || !email || !password}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Loading...' : 'Create Account'}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.orDivider}>or</ThemedText>
        */}

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={colorScheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 56,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 32,
    lineHeight: 28,
    fontFamily: 'PoppinsSemiBold',
  },
  input: {
    height: 56,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Poppins',
    borderWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInButton: {
    backgroundColor: '#fff',
    marginTop: 24,
  },
  signUpButton: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  error: {
    color: '#FF4B4B',
    marginTop: -8,
    marginBottom: 16,
    fontSize: 14,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 16,
  },
  orDivider: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
    fontFamily: 'PoppinsSemiBold',
  },
}); 