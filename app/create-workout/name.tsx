import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Animated, Easing, Pressable, View } from 'react-native';

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
          <TouchableOpacity style={styles.optionRow} onPress={handleVoice}>
            <View style={styles.optionInfo}>
              <ThemedText style={styles.optionLabel}>Voice Input</ThemedText>
              <ThemedText style={styles.optionDesc}>Record techniques with voice</ThemedText>
            </View>
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
              <IconSymbol name="chevron.right" size={28} color="#666" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={handleManual}>
            <View style={styles.optionInfo}>
              <ThemedText style={styles.optionLabel}>Manual Entry</ThemedText>
              <ThemedText style={styles.optionDesc}>Select techniques yourself</ThemedText>
            </View>
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
              <IconSymbol name="chevron.right" size={28} color="#666" />
            </Animated.View>
          </TouchableOpacity>
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
    fontSize: 28,
    lineHeight: 36,
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
    fontSize: 28,
    lineHeight: 36,
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
    top: '35%',
    left: 24,
    right: 24,
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 18,
    gap: 14,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 3,
  },
  optionDesc: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  chevronContainer: {
    // used for animated chevron on voice option
  },
}); 