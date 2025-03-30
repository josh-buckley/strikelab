import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import OnboardingProgressBar from './OnboardingProgressBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';

// Define the props for the onboarding screen
interface OnboardingScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const OnboardingScreen6: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';

  // Sample category data for preview
  const sampleCategories = [
    { name: 'Punches', level: 8, xp: 750 },
    { name: 'Kicks', level: 5, xp: 320 },
    { name: 'Elbows', level: 3, xp: 890 },
    { name: 'Knees', level: 6, xp: 450 }
  ];

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
          gain levels
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Track your progress with XP and levels
        </ThemedText>

        <View style={styles.tilesContainer}>
          {sampleCategories.map((category) => (
            <View
              key={category.name}
              style={[styles.tile, { backgroundColor: '#141414' }]}
            >
              <ThemedView style={styles.tileContent}>
                <ThemedView style={[styles.tileBackground, { backgroundColor: '#1c1c1e' }]}>
                  <ThemedView style={[styles.tileHeader, { backgroundColor: '#1c1c1e' }]}>
                    <ThemedText style={[styles.tileName, { backgroundColor: '#1c1c1e' }]}>
                      {category.name}
                    </ThemedText>
                    <ThemedView style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e' }}>
                      <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e' }]}>
                        Lv.
                      </ThemedText>
                      <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e', fontSize: 17, fontFamily: 'PoppinsSemiBold', marginLeft: -2, color: '#FFD700' }]}>
                        {category.level}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedView style={styles.progressBarContainer}>
                    <ThemedView style={styles.progressBar}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.8)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { 
                            width: `${(category.xp % 1000) / 10}%`,
                          }
                        ]}
                      />
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.xpNeeded}>
                    {1000 - (category.xp % 1000)} xp left
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </View>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <ThemedText style={styles.infoTitle}>How it works:</ThemedText>
          
          <View style={styles.infoItem}>
            <View style={[styles.bulletPoint, { backgroundColor: '#FFD700' }]} />
            <ThemedText style={styles.infoText}>Earn XP for every technique you practice</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.bulletPoint, { backgroundColor: '#FFD700' }]} />
            <ThemedText style={styles.infoText}>Level up from 1-100 for each category</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.bulletPoint, { backgroundColor: '#FFD700' }]} />
            <ThemedText style={styles.infoText}>Higher intensity workouts earn more XP</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.bulletPoint, { backgroundColor: '#FFD700' }]} />
            <ThemedText style={styles.infoText}>Balance your training to level up evenly</ThemedText>
          </View>
        </View>

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
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  tile: {
    width: '48%',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tileContent: {
    padding: 4,
  },
  tileBackground: {
    padding: 10,
    borderRadius: 6,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileName: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tileLevel: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  progressBarContainer: {
    padding: 2,
    backgroundColor: '#2c2c2e',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2c2c2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  xpNeeded: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'left',
    marginTop: 2,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#fff',
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

export default OnboardingScreen6; 