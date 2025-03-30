import React from 'react';
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

const OnboardingScreen8: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';

  // Sample workout data
  const sampleWorkout = {
    id: '1',
    name: 'Friday Morning',
    date: 'Jan 18, 2025',
    types: ['Heavy Bag', 'Partner Drills'],
    expanded: true,
    combos: [
      { 
        id: '1', 
        number: 1, 
        type: 'Heavy Bag', 
        mode: 'Rounds • 3 rounds x 2:00' 
      },
      { 
        id: '2', 
        number: 2, 
        type: 'Partner Drills', 
        mode: 'Time • 5:00',
        techniques: ['Jab', 'Cross']
      }
    ],
    notes: "Great session today! Focused on @jab and @cross combinations. Need to work on my @roundhouse kick technique. Feeling stronger with each session."
  };

  // Function to render notes with highlighted technique mentions
  const renderNotes = (notes: string) => {
    return notes.split(/\s+/).map((word, index, array) => {
      const match = word.match(/^(@[\w-]+)([^\w-]*)$/);
      if (match && match[1]) {
        return (
          <React.Fragment key={index}>
            <ThemedText style={[styles.noteText, styles.mentionText]}>{match[1]}</ThemedText>
            {match[2] && <ThemedText style={styles.noteText}>{match[2]}</ThemedText>}
            {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={index}>
          <ThemedText style={styles.noteText}>{word}</ThemedText>
          {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
        </React.Fragment>
      );
    });
  };

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
          workout history
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Track and review all your training sessions
        </ThemedText>

        <ThemedView style={styles.historyContainer}>
          <ThemedView style={styles.workoutCard}>
            <ThemedView style={styles.workoutHeader}>
              <ThemedView style={styles.workoutInfo}>
                <ThemedText style={styles.workoutName}>{sampleWorkout.name}</ThemedText>
                <ThemedText style={styles.workoutDate}>{sampleWorkout.date}</ThemedText>
              </ThemedView>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#666"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </ThemedView>

            <ThemedView style={styles.trainingTypesList}>
              {sampleWorkout.types.map((type, index) => (
                <ThemedView key={index} style={styles.trainingTypeChip}>
                  <Ionicons 
                    name={
                      type === 'Heavy Bag' ? 'fitness' :
                      type === 'Thai Pads' ? 'body' :
                      type === 'Focus Mitts' ? 'hand-left' :
                      type === 'Partner Drills' ? 'people' :
                      'fitness'
                    } 
                    size={12} 
                    color="#FFD700" 
                  />
                  <ThemedText style={styles.trainingTypeText}>{type}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.combosContainer}>
              {sampleWorkout.combos.map((combo) => (
                <ThemedView key={combo.id} style={styles.comboItem}>
                  <ThemedView style={styles.comboHeader}>
                    <ThemedView style={styles.comboNumberContainer}>
                      <ThemedText style={styles.comboNumber}>{combo.number}</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.comboInfo}>
                      <ThemedText style={styles.comboType}>{combo.type}</ThemedText>
                      <ThemedText style={styles.comboMode}>{combo.mode}</ThemedText>
                      
                      {combo.techniques && (
                        <ThemedView style={styles.techniquesContainer}>
                          {combo.techniques.map((technique, techniqueIndex, array) => (
                            <ThemedView key={techniqueIndex} style={styles.techniqueRow}>
                              <ThemedView style={styles.techniqueItem}>
                                <ThemedText style={styles.techniqueText}>{technique}</ThemedText>
                              </ThemedView>
                              {techniqueIndex < array.length - 1 && (
                                <ThemedView style={styles.chainIndicator}>
                                  <Ionicons name="arrow-down" size={12} color="#FFD700" />
                                </ThemedView>
                              )}
                            </ThemedView>
                          ))}
                        </ThemedView>
                      )}
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.notesContainer}>
              <ThemedView style={styles.notesHeader}>
                <Ionicons name="text-outline" size={16} color="#666" />
                <ThemedText style={styles.notesTitle}>Notes</ThemedText>
              </ThemedView>
              <ThemedView style={styles.noteTextContainer}>
                {renderNotes(sampleWorkout.notes)}
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
  historyContainer: {
    width: '100%',
    marginBottom: 30,
  },
  workoutCard: {
    backgroundColor: 'transparent',
    padding: 0,
    gap: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  workoutName: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
  workoutDate: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
  },
  trainingTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trainingTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trainingTypeText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  combosContainer: {
    gap: 12,
  },
  comboItem: {
    gap: 8,
  },
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  comboNumberContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboNumber: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
    textAlign: 'center',
  },
  comboInfo: {
    flex: 1,
    gap: 4,
  },
  comboType: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  comboMode: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
  },
  techniquesContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  techniqueRow: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 120,
  },
  techniqueItem: {
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3c3c3e',
    width: 120,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  techniqueText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#ffffff',
  },
  chainIndicator: {
    alignItems: 'center',
    paddingVertical: 2,
    height: 24,
    justifyContent: 'center',
    width: 120,
  },
  notesContainer: {
    gap: 8,
    paddingTop: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
  },
  noteTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  mentionText: {
    color: '#FFD700',
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

export default OnboardingScreen8; 