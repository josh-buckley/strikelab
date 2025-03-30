import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ currentStep, totalSteps }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  
  // Calculate the progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.progressBackground, 
          { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
        ]}
      >
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progressPercentage}%`,
              backgroundColor: colors.tint 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '75%',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 25,
    zIndex: 10,
    alignSelf: 'center',
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  }
});

export default OnboardingProgressBar; 