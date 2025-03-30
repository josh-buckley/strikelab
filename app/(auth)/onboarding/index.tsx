import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/AuthProvider';
import { ROUTES } from '@/lib/routes';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Import all onboarding screens
import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';
import OnboardingScreen4 from './OnboardingScreen4';
import OnboardingScreen5 from './OnboardingScreen5';
import OnboardingScreen6 from './OnboardingScreen6';
import OnboardingScreen7 from './OnboardingScreen7';
import OnboardingScreen8 from './OnboardingScreen8';
import OnboardingScreen9 from './OnboardingScreen9';

// Define the props for the onboarding screens
interface OnboardingScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

// Create a minimal intro screen component
const IntroScreen: React.FC<OnboardingScreenProps> = ({ onNext }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <ThemedView style={styles.introContainer}>
      <View style={styles.centerContent}>
        <View style={styles.logoWrapper}>
          <ThemedText style={[styles.logoText, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700' }]}>
            strikelab
          </ThemedText>
        </View>
        <ThemedText style={styles.tagline}>
          The fighter's edge - in your pocket.
        </ThemedText>
      </View>
      
      <TouchableOpacity 
        style={styles.continueButton} 
        onPress={onNext}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.continueButtonText}>
          Get Started
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

// Define the screens in the onboarding flow, now including the intro screen
const SCREENS = [
  IntroScreen,
  OnboardingScreen1,
  OnboardingScreen2,
  OnboardingScreen3,
  OnboardingScreen4,
  OnboardingScreen5,
  OnboardingScreen6,
  OnboardingScreen7,
  OnboardingScreen8,
  OnboardingScreen9,
  // Add more screens as they are refactored
];

const Onboarding: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { markOnboardingCompleted } = useAuth();

  // Function to handle navigation to the next screen
  const handleNext = async () => {
    if (currentScreen === SCREENS.length - 1) {
      // Last screen, complete onboarding
      await markOnboardingCompleted();
      router.replace({
        pathname: ROUTES.AUTH.PAYWALL,
        params: { fromOnboarding: 'true' }
      });
      return;
    }
    
    // Move to the next screen
    setCurrentScreen(prev => prev + 1);
  };

  // Function to handle navigation to the previous screen
  const handleBack = () => {
    if (currentScreen === 0) {
      // First screen, can't go back
      return;
    }
    
    // Move to the previous screen
    setCurrentScreen(prev => prev - 1);
  };

  // Get the current screen component
  const CurrentScreenComponent = SCREENS[currentScreen] as React.FC<OnboardingScreenProps>;

  // Don't show progress bar on intro screen
  const showProgressBar = currentScreen > 0;
  const adjustedCurrentStep = currentScreen > 0 ? currentScreen : 1;
  const totalStepsWithoutIntro = SCREENS.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <CurrentScreenComponent 
          onNext={handleNext}
          onBack={handleBack}
          currentStep={adjustedCurrentStep}
          totalSteps={totalStepsWithoutIntro}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 46,
    fontFamily: 'PoppinsSemiBold',
    color: '#FFFFFF',
    lineHeight: 56,
    paddingTop: 10,
    includeFontPadding: true,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Poppins',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#FFFFFF',
  },
});

export default Onboarding; 