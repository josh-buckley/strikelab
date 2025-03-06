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
import { techniques } from '@/data/strikes';
import type { Technique } from '@/data/strikes';
import { sendMessage } from '@/lib/openai';

const TAG_GENERATION_PROMPT = `You are a Muay Thai technique analyzer. Given a training note, extract relevant techniques and concepts that were discussed or implied.

Return a JSON object with an array of tags. Include both:
1. Specific techniques mentioned (e.g., Jab, Cross, Switch Kick)
2. General categories when discussed (e.g., Punches, Kicks, Defense)

Rules:
- Capitalize each word in the tags
- Only include techniques/concepts that are explicitly mentioned or strongly implied
- Return ONLY a JSON object in this exact format: { "tags": ["Tag1", "Tag2", "Tag3"] }
- If no techniques are mentioned, return { "tags": [] }

Example input: "Coach said my jab is getting snappier but I need to work on my teep timing"
Example output: { "tags": ["Jab", "Teep", "Punches", "Kicks"] }

Example input: "Worked on defensive footwork and catching kicks"
Example output: { "tags": ["Defense", "Footwork", "Catch", "Kicks"] }

Note: `;

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
      // Parse the response content as JSON
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
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const [isProcessing, setIsProcessing] = useState(false);

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
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Generate tags from notes
      const generatedTags = await generateTags(notes.trim());
      
      // Calculate XP for each combo and prepare workout data
      const workoutData = {
        name: workoutName,
        combos: combos.map(combo => {
          // Base XP calculation
          let baseXP = 0;
          
          if (combo.techniques) {
            // Split techniques string into array
            const techniqueNames = combo.techniques.split(' - ');
            
            // Calculate XP for each technique based on complexity
            baseXP = techniqueNames.reduce((total, techniqueName) => {
              const technique = techniques.find((t: Technique) => t.name === techniqueName);
              if (!technique) return total;

              // Base XP by category
              let techniqueXP = 0;
              switch (technique.category) {
                case 'Punches':
                  techniqueXP = 80;
                  break;
                case 'Kicks':
                  techniqueXP = 120;
                  break;
                case 'Elbows':
                  techniqueXP = 100;
                  break;
                case 'Knees':
                  techniqueXP = 100;
                  break;
                case 'Sweeps':
                  techniqueXP = 150;
                  break;
                case 'Clinch':
                  techniqueXP = 120;
                  break;
                case 'Defensive':
                  techniqueXP = 100;
                  break;
                case 'Footwork':
                  techniqueXP = 80;
                  break;
                case 'Feints':
                  techniqueXP = 60;
                  break;
                default:
                  techniqueXP = 100;
              }

              // Bonus XP for versatility
              if (technique.targets.length > 1) {
                techniqueXP *= 1.1;
              }
              if (technique.ranges.length > 1) {
                techniqueXP *= 1.1;
              }

              // Bonus XP for special variations
              if (technique.name.toLowerCase().includes('spinning') || 
                  technique.name.toLowerCase().includes('jump') ||
                  technique.name.toLowerCase().includes('switch') ||
                  technique.name.toLowerCase().includes('flying')) {
                techniqueXP *= 1.25;
              }

              return total + techniqueXP;
            }, 0);

          } else if (combo.type === 'Skipping') {
            baseXP = 50;
          }
          
          // Apply multipliers based on mode
          if (combo.mode === 'Reps' && combo.sets && combo.reps) {
            baseXP *= parseInt(combo.sets);
          } else if (combo.mode === 'Rounds' && combo.rounds) {
            baseXP *= parseInt(combo.rounds);
          } else if (combo.mode === 'Time') {
            const minutes = parseInt(combo.minutes || '0');
            const seconds = parseInt(combo.seconds || '0');
            const totalMinutes = Math.max(1, minutes + seconds / 60);
            baseXP *= totalMinutes;
          }

          return {
            ...combo,
            xp: Math.round(baseXP)
          };
        }),
        notes: {
          text: notes.trim(),
          strikes_mentioned: generatedTags
        },
        totalXP: 0
      };
      
      // Calculate total XP
      workoutData.totalXP = workoutData.combos.reduce((sum, combo) => sum + (combo as any).xp, 0);
      
      // Navigate to XP summary with the workout data
      router.push({
        pathname: "/create-workout/xp-summary",
        params: {
          workoutData: JSON.stringify(workoutData)
        }
      });
    } catch (error) {
      console.error('Error processing workout:', error);
      // TODO: Show error toast/alert to user
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
}); 