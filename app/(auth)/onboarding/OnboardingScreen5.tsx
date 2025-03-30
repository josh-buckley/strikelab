import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import OnboardingProgressBar from './OnboardingProgressBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

// Define the props for the onboarding screen
interface OnboardingScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const OnboardingScreen5: React.FC<OnboardingScreenProps> = ({
  onNext,
  onBack,
  currentStep,
  totalSteps
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  const [rating, setRating] = useState<number>(5);
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  
  // Animated value for the thumb position
  const translateX = useRef(new Animated.Value(0)).current;
  
  // Function to handle slider value change
  const handleSliderChange = (value: number) => {
    // Ensure value is between 1 and 10
    const newValue = Math.max(1, Math.min(10, Math.round(value)));
    setRating(newValue);
  };

  // Get description based on rating
  const getRatingDescription = () => {
    if (rating <= 3) return "Still learning the basics";
    if (rating <= 6) return "Comfortable with fundamentals";
    if (rating <= 8) return "Skilled practitioner";
    return "Expert level";
  };
  
  // Handle pan gesture for the slider thumb
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );
  
  // Handle the end of the gesture
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Calculate the new rating based on the position
      const { translationX } = event.nativeEvent;
      
      // Reset the animation value
      translateX.setValue(0);
      
      if (sliderWidth > 0) {
        // Calculate the step size
        const stepSize = sliderWidth / 9;
        
        // Calculate the current position
        const currentPosition = ((rating - 1) / 9) * sliderWidth;
        
        // Calculate the new position
        const newPosition = currentPosition + translationX;
        
        // Calculate the new rating
        const newRating = Math.round((newPosition / sliderWidth) * 9) + 1;
        
        // Update the rating
        handleSliderChange(newRating);
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            skill assessment
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            How would you rate your current skill level?
          </ThemedText>

          <View 
            style={styles.sliderContainer}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              setSliderWidth(width);
            }}
          >
            <View style={styles.sliderLabels}>
              <ThemedText style={styles.sliderLabel}>Beginner</ThemedText>
              <ThemedText style={styles.sliderLabel}>Expert</ThemedText>
            </View>
            
            <View style={styles.customSlider}>
              {/* Track */}
              <View style={[styles.sliderTrack, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
              
              {/* Markers */}
              {[...Array(10)].map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sliderMarker,
                    {
                      left: `${(index / 9) * 100}%`,
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                    }
                  ]}
                  onPress={() => handleSliderChange(index + 1)}
                />
              ))}
              
              {/* Thumb with PanGestureHandler */}
              <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
              >
                <Animated.View
                  style={[
                    styles.sliderThumb,
                    {
                      left: `${((rating - 1) / 9) * 100}%`,
                      backgroundColor: '#FFD700',
                      borderColor: isDarkMode ? '#000' : '#fff',
                      transform: [
                        {
                          translateX: translateX.interpolate({
                            inputRange: [-sliderWidth, sliderWidth],
                            outputRange: [-sliderWidth, sliderWidth],
                            extrapolate: 'clamp'
                          })
                        }
                      ]
                    }
                  ]}
                />
              </PanGestureHandler>
            </View>
            
            <View style={styles.sliderValues}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity 
                  key={value} 
                  onPress={() => handleSliderChange(value)}
                  style={styles.valueButton}
                >
                  <ThemedText 
                    style={[
                      styles.valueText, 
                      { 
                        color: value === rating ? '#FFD700' : isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontFamily: value === rating ? 'PoppinsSemiBold' : 'Poppins',
                      }
                    ]}
                  >
                    {value}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueDescription}>
              {getRatingDescription()}
            </ThemedText>
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
    </GestureHandlerRootView>
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
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#999',
  },
  customSlider: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    height: 6,
    width: '100%',
    borderRadius: 3,
  },
  sliderFilledTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    left: 0,
  },
  sliderMarker: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 1.5,
    marginLeft: -1.5,
    top: 14,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    borderWidth: 2,
    top: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  valueButton: {
    width: 24,
    alignItems: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 20,
  },
  valueText: {
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  valueDescription: {
    fontSize: 24,
    fontFamily: 'PoppinsSemiBold',
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 32,
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

export default OnboardingScreen5; 