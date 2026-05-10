import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, View, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { sendMessage } from '@/lib/openai';

// Function to generate tags from notes using LLM
async function generateTags(notes: string): Promise<string[]> {
  try {
    const response = await sendMessage([
      {
        role: 'user',
        content: `You are a Muay Thai technique analyzer. Given a training note, extract relevant techniques and concepts that were discussed or implied.

Return a JSON object with an array of tags. Include both:
1. Specific techniques mentioned (e.g., Jab, Cross, Switch Kick)
2. General categories when discussed (e.g., Punches, Kicks, Defense)

Rules:
- Capitalize each word in the tags
- Only include techniques/concepts that are explicitly mentioned or strongly implied
- Return ONLY a JSON object in this exact format: { "tags": ["Tag1", "Tag2", "Tag3"] }
- If no techniques are mentioned, return { "tags": [] }

Analyze this note: "${notes}"`
      }
    ]);
    
    try {
      const parsedContent = JSON.parse(response);
      return parsedContent.tags || [];
    } catch (parseError) {
      console.error('Failed to parse tags response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

export default function NotesScreen() {
  const { workoutName, notes, setNotes, combos } = useWorkout();
  const { session } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    animate();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!session?.user) {
      setError('Not signed in');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Generate tags from notes
      const generatedTags = notes.trim() ? await generateTags(notes.trim()) : [];

      // 1. Create the workout
      const { data: workout, error: workoutError } = await (supabase
        .from('workouts') as any)
        .insert({
          user_id: session.user.id,
          name: workoutName || 'Workout',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // 2. Save notes if they exist
      const workoutId = (workout as any).id;
      if (notes.trim()) {
        const { error: notesError } = await (supabase
          .from('workout_notes') as any)
          .insert({
            workout_id: workoutId,
            notes: notes.trim(),
            strikes_mentioned: generatedTags
          });

        if (notesError) {
          console.error('Error saving notes:', notesError);
        }
      }

      // 3. Create all combos
      const comboInserts = combos.map((combo: any, index: number) => ({
        workout_id: workoutId,
        sequence_number: index + 1,
        training_type: combo.type,
        training_mode: combo.mode,
        sets: combo.sets ? parseInt(combo.sets) || 1 : null,
        reps: combo.reps ? parseInt(combo.reps) || 1 : null,
        duration_minutes: combo.minutes ? parseInt(combo.minutes) || 0 : null,
        duration_seconds: combo.seconds ? parseInt(combo.seconds) || 0 : null,
        rounds: combo.rounds ? parseInt(combo.rounds) || 1 : null,
        round_minutes: combo.roundMinutes ? parseInt(combo.roundMinutes) || 0 : null,
        round_seconds: combo.roundSeconds ? parseInt(combo.roundSeconds) || 0 : null,
        techniques: combo.techniques ? combo.techniques.split(' - ') : null,
        xp: 0,
        completed: true,
        distance: combo.distance ? parseFloat(combo.distance) || null : null,
        distance_unit: combo.distanceUnit || null
      }));

      if (comboInserts.length > 0) {
        const { error: combosError } = await (supabase
          .from('workout_combos') as any)
          .insert(comboInserts);

        if (combosError) throw combosError;
      }

      // Navigate home
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error saving workout:', err);
      setError('Failed to save workout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <IconSymbol name="arrow.left" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Content */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.content}>
          <ThemedText 
            type="title" 
            style={[
              styles.title, 
              { 
                textTransform: 'lowercase',
                textDecorationLine: 'line-through',
                textDecorationColor: '#FFD700'
              }
            ]}>
            training notes
          </ThemedText>
          
          <ThemedView style={styles.inputContainer}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: '#2c2c2e',
                  borderRadius: 16,
                }
              ]}
              placeholder="Enter your notes and coach feedback here..."
              placeholderTextColor={colors.icon}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={(e) => {
                e.preventDefault();
                Keyboard.dismiss();
              }}
              editable={!isProcessing}
            />

            {error && (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            )}
            
            {/* Continue Button */}
            <TouchableOpacity 
              style={[styles.continueButton, isProcessing && { opacity: 0.5 }]}
              onPress={handleContinue}
              disabled={isProcessing}>
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
              <IconSymbol name={isProcessing ? "ellipsis" : "arrow.right"} size={20} color={colors.text} />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    height: 400,
  },
  input: {
    height: '100%',
    fontSize: 16,
    padding: 16,
    fontFamily: 'Poppins',
  },
  continueButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  rotatingCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  errorText: {
    color: '#ff3b30',
    fontFamily: 'Poppins',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
}); 
