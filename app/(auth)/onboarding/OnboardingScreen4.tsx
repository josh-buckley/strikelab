import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const OnboardingScreen4: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  const [stance, setStance] = useState<'orthodox' | 'southpaw' | null>(null);

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
          fighting stance
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Select your preferred fighting stance
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
              stance === 'orthodox' && [styles.selectedOption, { backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderWidth: 1 }]
            ]}
            onPress={() => setStance('orthodox')}
          >
            <View style={styles.optionContent}>
              <View style={[styles.stanceImageContainer, {
                backgroundColor: stance === 'orthodox' ? 'rgba(255, 215, 0, 0.2)' : colors.tint + '15',
                borderColor: stance === 'orthodox' ? '#FFD700' : 'transparent',
                borderWidth: 1,
                borderRadius: 24,
              }]}>
                <View style={styles.stanceIconContainer}>
                  <Ionicons 
                    name="hand-left" 
                    size={20} 
                    color={stance === 'orthodox' ? '#FFD700' : colors.text} 
                    style={{ marginRight: 2 }}
                  />
                  <Ionicons 
                    name="hand-right" 
                    size={20} 
                    color={stance === 'orthodox' ? '#FFD700' : colors.text} 
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={[
                  styles.optionTitle, 
                  { color: stance === 'orthodox' ? '#FFD700' : colors.text }
                ]}>
                  Orthodox
                </ThemedText>
                <ThemedText style={[
                  styles.optionSubtitle, 
                  { color: stance === 'orthodox' ? '#999' : '#666' }
                ]}>
                  Left foot and hand forward
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
              stance === 'southpaw' && [styles.selectedOption, { backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderWidth: 1 }]
            ]}
            onPress={() => setStance('southpaw')}
          >
            <View style={styles.optionContent}>
              <View style={[styles.stanceImageContainer, {
                backgroundColor: stance === 'southpaw' ? 'rgba(255, 215, 0, 0.2)' : colors.tint + '15',
                borderColor: stance === 'southpaw' ? '#FFD700' : 'transparent',
                borderWidth: 1,
                borderRadius: 24,
              }]}>
                <View style={[styles.stanceIconContainer, { flexDirection: 'row-reverse' }]}>
                  <Ionicons 
                    name="hand-left" 
                    size={20} 
                    color={stance === 'southpaw' ? '#FFD700' : colors.text} 
                    style={{ marginLeft: 2 }}
                  />
                  <Ionicons 
                    name="hand-right" 
                    size={20} 
                    color={stance === 'southpaw' ? '#FFD700' : colors.text} 
                    style={{ marginRight: 2 }}
                  />
                </View>
              </View>
              <View style={styles.optionTextContainer}>
                <ThemedText style={[
                  styles.optionTitle, 
                  { color: stance === 'southpaw' ? '#FFD700' : colors.text }
                ]}>
                  Southpaw
                </ThemedText>
                <ThemedText style={[
                  styles.optionSubtitle, 
                  { color: stance === 'southpaw' ? '#999' : '#666' }
                ]}>
                  Right foot and hand forward
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            { 
              backgroundColor: stance ? '#1a1a1a' : 'rgba(26, 26, 26, 0.5)',
              borderColor: stance ? '#FFD700' : 'rgba(255, 215, 0, 0.3)',
              borderWidth: 1,
            }
          ]} 
          onPress={onNext}
          disabled={!stance}
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
  stanceImageContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stanceIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

export default OnboardingScreen4; 