import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ROUTES } from '@/lib/routes';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import * as AppleAuthentication from 'expo-apple-authentication';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAuth } from '@/lib/AuthProvider';
import { ensureUserProfile } from '@/lib/userProfile';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { presentPaywall, isSubscribed } = usePaywall();
  const { markOnboardingCompleted } = useAuth();

  // New useEffect to present paywall on mount
  useEffect(() => {
    const showPaywall = async () => {
      console.log('Login: Component mounted, attempting to present paywall');
      try {
        await presentPaywall('test_paywall');
        console.log('Login: Paywall presentation finished (succeeded or dismissed).');
      } catch (paywallError) {
        console.error('Login: Error presenting paywall on mount:', paywallError);
        // Decide if an error message should be shown to the user
        // setError('Could not load subscription options. Please try logging in.');
      }
    };

    // Run the function to show the paywall
    showPaywall();
    
    // Empty dependency array ensures this runs only once on mount
  }, []); // Removed presentPaywall from dependencies as it's stable from context

  const signInWithEmail = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Login: Attempting to sign in with email and password');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login: Authentication error:', error);
        setError(error.message);
        setLoading(false); // Ensure loading is set to false on error
        return;
      }
      
      console.log('Login: Sign in successful.');

      // Check subscription status AFTER successful login
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isSubscribed) {
          console.log('Login: User is subscribed post-login, marking onboarding completed');
          await markOnboardingCompleted();
        } else {
          console.log('Login: User is NOT subscribed post-login');
          // Paywall should have been shown on mount. If they are here and not subscribed,
          // the layout should handle redirecting them back if necessary, or allow access to free features.
        }
      }
      
      // Explicitly redirect to index page after successful authentication
      console.log('Email sign-in successful, redirecting to home page');
      router.replace('/(tabs)');
      
    } catch (err) {
      console.error('Login: Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      // Ensure loading is always set to false in the finally block
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
        setLoading(false);
        return;
      }

      try {
        // Ensure we have a valid session before proceeding
        let attempt = 0;
        let initialSession = null;
        while (!initialSession && attempt < 5) {
          const { data: sessionData } = await supabase.auth.getSession();
          initialSession = sessionData.session;
          if (!initialSession) {
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!initialSession) {
          throw new Error('No valid session after signup and retries');
        }

        // Use shared profile creation function
        console.log('Login: Ensuring user profile exists...');
        const profileResult = await ensureUserProfile(user);

        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Failed to create user profile');
        }

        console.log('Account setup complete. User can now use the app.');
        router.replace('/(tabs)');

      } catch (initError) {
        console.error('Error during data initialization:', initError);
        // Clean up the created user if data initialization fails
        await supabase.auth.signOut();
        const { error: deleteError } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: user.id });
        if (deleteError) {
          console.error('Failed to clean up user after init error:', deleteError);
        } else {
          console.log('Cleaned up user after init error.');
        }

        setError('Failed to initialize user data. Please try signing up again.');
      }

    } catch (error: any) {
      console.error('Detailed signup error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      if (error.message.includes('User already registered')) {
        setError('Email already in use. Please sign in or use a different email.');
      } else {
        setError(error.message || 'An error occurred during signup');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting Apple Sign In process...');
      
      console.log('Requesting Apple authentication...');
      let appleCredential;
      try {
        appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        console.log('Apple credential obtained successfully');
      } catch (appleError: any) {
        console.error('Error during Apple authentication step:', JSON.stringify({ code: appleError.code, message: appleError.message }, null, 2));
        // Don't throw, set error and return
        setError(`Apple sign in cancelled or failed: ${appleError.message || 'Unknown error'}`);
        setLoading(false);
        return; 
      }
      
      if (!appleCredential.identityToken) {
        console.error('No identity token received from Apple');
        throw new Error('No identity token received from Apple'); // Still throw critical errors
      }
      
      const tokenPreview = appleCredential.identityToken.substring(0, 20) + '...' + appleCredential.identityToken.substring(appleCredential.identityToken.length - 20);
      console.log('Successfully received Apple credentials. Token preview:', tokenPreview);
      console.log('Attempting to sign in with Supabase using Apple token...');
      
      let supabaseResponse;
      try {
        supabaseResponse = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: appleCredential.identityToken,
        });
        console.log('Supabase auth response received');
      } catch (supabaseError: any) {
        console.error('Exception during Supabase auth call:', JSON.stringify({ message: supabaseError.message, stack: supabaseError.stack }, null, 2));
        throw new Error(`Supabase authentication call failed: ${supabaseError.message}`);
      }
      
      const { data, error: signInError } = supabaseResponse;

      if (signInError) {
        console.error('Supabase auth error with Apple Sign In:', JSON.stringify({ code: signInError.code, name: signInError.name, message: signInError.message, status: signInError.status }, null, 2));
        throw signInError;
      }
      
      if (!data.user) {
        console.error('No user returned from Supabase after Apple Sign In');
        throw new Error('No user returned from authentication');
      }

      console.log('Successfully authenticated with Apple and Supabase', data.user.id);
      
      console.log('Login: Apple Sign in successful.');

      // Check subscription status AFTER successful login
      // Use the isSubscribed value obtained at the top level
      // Remove invalid hook call: const { isSubscribed: currentSubscriptionStatus } = usePaywall();

      if (isSubscribed) { // Use the top-level isSubscribed directly
        console.log('Apple Login: User is subscribed post-login, marking onboarding completed');
        await markOnboardingCompleted();
      } else {
        console.log('Apple Login: User is NOT subscribed post-login');
        // Paywall was shown on mount. Layout/gates handle limitations.
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
      // Avoid Alert here unless absolutely necessary for user feedback
      // Alert.alert('Sign In Error', `Failed to sign in with Apple: ${errorMessage}`);
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
          <ThemedText style={[styles.buttonText, { color: '#000' }]}>{
            loading ? 'Loading...' : 'Sign In'
          }</ThemedText>
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
          <ThemedText style={styles.buttonText}>{
            loading ? 'Loading...' : 'Create Account'
          }</ThemedText>
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