import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import OnboardingProgressBar from './OnboardingProgressBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/AuthProvider';

// Define the props for the onboarding screen
interface OnboardingScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const OnboardingScreen9: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { markOnboardingCompleted } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Updated function to mark onboarding complete *before* navigating
  const handleGetStarted = async () => {
    if (isLoading) return; 
    
    console.log('OnboardingScreen9: Get Started pressed. Marking complete then navigating...');
    setIsLoading(true);
    try {
      // 1. Mark onboarding as completed in the backend/state
      await markOnboardingCompleted();
      console.log('OnboardingScreen9: Onboarding marked as completed.');
      
      // 2. Navigate to login page
      console.log('OnboardingScreen9: Navigating to login.');
      router.replace(ROUTES.AUTH.LOGIN);
      // Component likely unmounts, no need to setIsLoading(false) here

    } catch (error) {
      console.error('OnboardingScreen9: Error marking complete or navigating:', error);
      // Provide feedback if possible, or just reset loading state
      setIsLoading(false); 
    }
  };

  // Original rendering logic
  return (
    <ThemedView style={styles.container}>  
      <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: colors.tint + '15' }]} 
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ThemedView style={styles.contentContainer}>
        <ThemedText style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700' }]}>
          coach ai
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your personal training assistant
        </ThemedText>

        <ThemedView style={styles.coachContainer}>
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ThemedText style={{ 
              fontSize: 32, 
              fontWeight: 'bold',
              textDecorationLine: 'line-through',
              textDecorationStyle: 'solid',
              textDecorationColor: '#FFD700',
              lineHeight: 36,
              includeFontPadding: true
            }}>
              strikelab
            </ThemedText>
            <View style={{ opacity: 0.2 }}>
              <ThemedText style={{ 
                fontSize: 32, 
                fontWeight: 'bold',
                lineHeight: 32,
                includeFontPadding: true,
                marginTop: -8
              }}>
                coach
              </ThemedText>
            </View>
          </View>

          <View style={styles.emptyChat} />

          <View 
            style={{ 
              flexDirection: 'row',
              backgroundColor: '#262626',
              borderRadius: 24,
              padding: 8,
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <View style={{ minHeight: 40, justifyContent: 'center' }}>
                <TextInput
                  style={{ 
                    color: colors.text,
                    fontSize: 16,
                    maxHeight: 100,
                    paddingVertical: 8
                  }}
                  placeholder="Message"
                  placeholderTextColor="#666"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  editable={false}
                />
              </View>
            </View>
            <TouchableOpacity 
              style={{ 
                backgroundColor: message.trim() ? '#FFD700' : '#333',
                padding: 8,
                borderRadius: 14,
                marginLeft: 4
              }}
              disabled={true}
            >
              <Ionicons name="arrow-up" size={16} color={message.trim() ? '#000000' : '#666'} />
            </TouchableOpacity>
          </View>

          <View style={styles.featureContainer}>
            <ThemedText style={styles.featureTitle}>How Coach AI Works</ThemedText>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' }]}>
                <Ionicons name="stats-chart" size={20} color="#FFD700" />
              </View>
              <ThemedText style={styles.featureText}>Analyzes your workout history and training patterns</ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' }]}>
                <Ionicons name="document-text" size={20} color="#FFD700" />
              </View>
              <ThemedText style={styles.featureText}>Learns from your training notes and technique mentions</ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' }]}>
                <Ionicons name="fitness" size={20} color="#FFD700" />
              </View>
              <ThemedText style={styles.featureText}>Provides personalized technique advice based on your progress</ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' }]}>
                <Ionicons name="bulb" size={20} color="#FFD700" />
              </View>
              <ThemedText style={styles.featureText}>Suggests workouts tailored to your skill level and goals</ThemedText>
            </View>
          </View>
        </ThemedView>

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            { 
              backgroundColor: '#1a1a1a',
              borderColor: '#FFD700',
              borderWidth: 1,
              opacity: isLoading ? 0.7 : 1
            }
          ]} 
          onPress={handleGetStarted}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.continueButtonText, 
            { color: '#FFFFFF' }
          ]}>
            {isLoading ? 'Processing...' : 'Get Started'} 
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  coachContainer: {
    flex: 1,
    marginBottom: 20,
  },
  emptyChat: {
    flex: 1,
    marginBottom: 10,
  },
  featureContainer: {
    width: '100%',
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    flex: 1,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
});

export default OnboardingScreen9; 