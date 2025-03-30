import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import OnboardingProgressBar from './OnboardingProgressBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define the props for the onboarding screen
interface OnboardingScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const OnboardingScreen1: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

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
          training experience
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          How long have you been training?
        </ThemedText>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[
              styles.option,
              { 
                backgroundColor: isDarkMode ? '#1a1a1a' : colors.card,
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
              },
              selectedOption === 'beginner' && [styles.selectedOption, { backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderWidth: 1 }]
            ]}
            onPress={() => setSelectedOption('beginner')}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIconContainer, {
                backgroundColor: selectedOption === 'beginner' ? 'rgba(255, 215, 0, 0.2)' : colors.tint + '15',
                borderWidth: 1,
                borderColor: selectedOption === 'beginner' ? '#FFD700' : 'transparent',
              }]}>
                <MaterialCommunityIcons 
                  name="boxing-glove" 
                  size={24} 
                  color={selectedOption === 'beginner' ? '#FFD700' : colors.text} 
                />
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={[
                  styles.optionTitle, 
                  { color: selectedOption === 'beginner' ? '#FFD700' : colors.text }
                ]}>
                  Beginner
                </ThemedText>
                <ThemedText style={[
                  styles.optionSubtitle, 
                  { color: selectedOption === 'beginner' ? '#999' : '#666' }
                ]}>
                  0-6 months
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.option,
              { 
                backgroundColor: isDarkMode ? '#1a1a1a' : colors.card,
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
              },
              selectedOption === 'intermediate' && [styles.selectedOption, { backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderWidth: 1 }]
            ]}
            onPress={() => setSelectedOption('intermediate')}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIconContainer, {
                backgroundColor: selectedOption === 'intermediate' ? 'rgba(255, 215, 0, 0.2)' : colors.tint + '15',
                borderWidth: 1,
                borderColor: selectedOption === 'intermediate' ? '#FFD700' : 'transparent',
              }]}>
                <MaterialCommunityIcons 
                  name="karate" 
                  size={24} 
                  color={selectedOption === 'intermediate' ? '#FFD700' : colors.text} 
                />
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={[
                  styles.optionTitle, 
                  { color: selectedOption === 'intermediate' ? '#FFD700' : colors.text }
                ]}>
                  Intermediate
                </ThemedText>
                <ThemedText style={[
                  styles.optionSubtitle, 
                  { color: selectedOption === 'intermediate' ? '#999' : '#666' }
                ]}>
                  6 months - 2 years
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.option,
              { 
                backgroundColor: isDarkMode ? '#1a1a1a' : colors.card,
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
              },
              selectedOption === 'advanced' && [styles.selectedOption, { backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderWidth: 1 }]
            ]}
            onPress={() => setSelectedOption('advanced')}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionIconContainer, {
                backgroundColor: selectedOption === 'advanced' ? 'rgba(255, 215, 0, 0.2)' : colors.tint + '15',
                borderWidth: 1,
                borderColor: selectedOption === 'advanced' ? '#FFD700' : 'transparent',
              }]}>
                <MaterialCommunityIcons 
                  name="medal" 
                  size={24} 
                  color={selectedOption === 'advanced' ? '#FFD700' : colors.text} 
                />
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={[
                  styles.optionTitle, 
                  { color: selectedOption === 'advanced' ? '#FFD700' : colors.text }
                ]}>
                  Advanced
                </ThemedText>
                <ThemedText style={[
                  styles.optionSubtitle, 
                  { color: selectedOption === 'advanced' ? '#999' : '#666' }
                ]}>
                  2+ years
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            { 
              backgroundColor: selectedOption ? '#1a1a1a' : 'rgba(26, 26, 26, 0.5)',
              borderColor: selectedOption ? '#FFD700' : 'rgba(255, 215, 0, 0.3)',
              borderWidth: 1,
            }
          ]} 
          onPress={onNext}
          disabled={!selectedOption}
        >
          <ThemedText style={[
            styles.continueButtonText, 
            { color: '#FFFFFF' }
          ]}>
            Continue
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
    marginBottom: 30,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  option: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedOption: {
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
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

export default OnboardingScreen1; 