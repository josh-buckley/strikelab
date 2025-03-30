import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
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

const OnboardingScreen7: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';

  // Sample data for the preview
  const warmupTypes = ['Running', 'Warm-Up', 'Skipping'];
  const trainingTypes = ['Heavy Bag', 'Thai Pads', 'Focus Mitts', 'Partner Drills', 'Shadow Boxing'];
  const sparringTypes = ['Technical Sparring', 'Light Sparring', 'Hard Sparring'];
  const trainingModes = ['Rounds', 'Time', 'Reps', 'Distance'];

  return (
    <ThemedView style={styles.container}>  
      <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: colors.tint + '15' }]} 
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700' }]}>
            workout builder
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Create custom training sessions
          </ThemedText>

          <ThemedView style={styles.expandedContent}>
            <ThemedView style={styles.optionSection}>
              <ThemedText style={styles.optionTitle}>Type</ThemedText>
              <ThemedView style={styles.optionGroups}>
                <ThemedView style={styles.optionGroup}>
                  <ThemedText style={styles.optionSubtitle}>Warm Ups</ThemedText>
                  <ThemedView style={styles.optionButtonGroup}>
                    {warmupTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionButton,
                          { backgroundColor: '#2c2c2e' }
                        ]}
                      >
                        <Ionicons 
                          name="walk" 
                          size={14} 
                          color="#FFD700" 
                        />
                        <ThemedText style={styles.optionButtonText}>
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.optionGroup}>
                  <ThemedText style={styles.optionSubtitle}>Training</ThemedText>
                  <ThemedView style={styles.optionButtonGroup}>
                    {trainingTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionButton,
                          type === 'Heavy Bag' && styles.optionButtonSelected,
                          { backgroundColor: type === 'Heavy Bag' ? '#ffffff' : '#2c2c2e' }
                        ]}
                      >
                        <Ionicons 
                          name="fitness" 
                          size={14} 
                          color="#FFD700" 
                        />
                        <ThemedText style={[
                          styles.optionButtonText,
                          type === 'Heavy Bag' && { color: '#000000' }
                        ]}>
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.optionGroup}>
                  <ThemedText style={styles.optionSubtitle}>Sparring</ThemedText>
                  <ThemedView style={styles.optionButtonGroup}>
                    {sparringTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionButton,
                          { backgroundColor: '#2c2c2e' }
                        ]}
                      >
                        <Ionicons 
                          name="people" 
                          size={14} 
                          color="#FFD700" 
                        />
                        <ThemedText style={styles.optionButtonText}>
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.optionSection}>
              <ThemedView style={styles.optionTitleRow}>
                <ThemedText style={styles.optionTitle}>Mode</ThemedText>
                <ThemedText style={styles.optionalText}>(optional)</ThemedText>
              </ThemedView>
              <ThemedView style={styles.optionButtons}>
                {trainingModes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.optionButton,
                      mode === 'Time' && styles.optionButtonSelected,
                      { backgroundColor: mode === 'Time' ? '#ffffff' : '#2c2c2e' }
                    ]}
                  >
                    <Ionicons 
                      name={
                        mode === 'Time' ? 'time' :
                        mode === 'Distance' ? 'walk' :
                        mode === 'Rounds' ? 'timer' :
                        'repeat'
                      } 
                      size={14} 
                      color="#FFD700" 
                    />
                    <ThemedText style={[
                      styles.optionButtonText,
                      mode === 'Time' && { color: '#000000' }
                    ]}>
                      {mode}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Duration</ThemedText>
              <ThemedView style={styles.timeInputs}>
                <ThemedView style={styles.timeInput}>
                  <ThemedText style={styles.timeInputText}>15</ThemedText>
                </ThemedView>
                <ThemedText style={styles.timeColon}>:</ThemedText>
                <ThemedView style={styles.timeInput}>
                  <ThemedText style={styles.timeInputText}>00</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity 
            style={[
              styles.continueButton, 
              { 
                backgroundColor: '#1a1a1a',
                borderColor: '#FFD700',
                borderWidth: 1,
              }
            ]} 
            onPress={onNext}
          >
            <ThemedText style={[
              styles.continueButtonText, 
              { color: '#FFFFFF' }
            ]}>
              Continue
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
  },
  expandedContent: {
    gap: 12,
    marginBottom: 30,
  },
  optionSection: {
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'PoppinsSemiBold',
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  optionButtonSelected: {
    backgroundColor: '#fff',
  },
  optionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionalText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  optionGroups: {
    gap: 12,
  },
  optionGroup: {
    gap: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 2,
  },
  optionButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'PoppinsSemiBold',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 50,
    height: 32,
    textAlign: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3c3c3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#ffffff',
  },
  timeColon: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
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

export default OnboardingScreen7; 