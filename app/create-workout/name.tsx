import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Animated, Easing, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useWorkout } from '@/contexts/WorkoutContext';

export default function NameWorkoutScreen() {
  const { workoutName, setWorkoutName } = useWorkout();
  const [isEditing, setIsEditing] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto focus the input on mount
    setTimeout(() => {
      setIsEditing(true);
      inputRef.current?.focus();
    }, 100);

    // Start bounce animation
    const startBounce = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(bounceAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          })
        ])
      ).start();
    };

    const animate = () => {
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    };

    if (workoutName.trim()) {
      animate();
      startBounce();
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }).start();
    }
  }, [workoutName]);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (!workoutName.trim()) return;
    setIsEditing(false);
  };

  const handleVoice = () => {
    if (!workoutName.trim()) return;
    router.push('/voice-test');
  };

  const handleManual = () => {
    if (!workoutName.trim()) return;
    router.push('/create-workout/techniques');
  };

  const handleNamePress = () => {
    setIsEditing(true);
    inputRef.current?.focus();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.headerText}>Today's workout was</ThemedText>
          <TextInput
            ref={inputRef}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="name"
            placeholderTextColor={colors.icon}
            style={[
              styles.headerInput, 
              { color: colors.text },
              !workoutName && styles.placeholder
            ]}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            onBlur={() => setIsEditing(false)}
          />
        </ThemedView>

        <Animated.View style={[
          styles.optionsContainer,
          {
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0]
              })
            }],
            opacity: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            })
          }
        ]}>
          <ThemedView style={styles.buttonWrapper}>
            <Animated.View style={[
              styles.rotatingCircle,
              {
                transform: [{
                  rotate: rotateAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]} />
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleVoice}>
              <IconSymbol 
                name="mic" 
                size={28} 
                color="#fff"
              />
            </TouchableOpacity>
            <Animated.View style={[
              styles.chevronContainer,
              {
                transform: [{
                  translateX: bounceAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10]
                  })
                }]
              }
            ]}>
              <IconSymbol 
                name="chevron.right" 
                size={32} 
                color="#fff"
              />
            </Animated.View>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Animated.View style={[
              styles.rotatingCircle,
              {
                transform: [{
                  rotate: rotateAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]} />
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleManual}>
              <IconSymbol 
                name="hand.draw" 
                size={28} 
                color="#fff"
              />
            </TouchableOpacity>
            <Animated.View style={[
              styles.chevronContainer,
              {
                transform: [{
                  translateX: bounceAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10]
                  })
                }]
              }
            ]}>
              <IconSymbol 
                name="chevron.right" 
                size={32} 
                color="#fff"
              />
            </Animated.View>
          </ThemedView>
        </Animated.View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleContainer: {
    marginTop: 0,
  },
  headerText: {
    fontSize: 42,
    lineHeight: 52,
  },
  nameText: {
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    opacity: 1,
  },
  placeholder: {
    opacity: 0.3,
  },
  headerInput: {
    fontSize: 42,
    lineHeight: 52,
    fontFamily: 'Poppins',
    fontWeight: '700',
    padding: 0,
    paddingTop: 4,
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    textAlignVertical: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    bottom: '50%',
    right: 16,
    gap: 24,
  },
  buttonWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rotatingCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  chevronContainer: {
    position: 'absolute',
    right: -45,
    top: '50%',
    transform: [{ translateY: -16 }],
  },
}); 