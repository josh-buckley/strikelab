import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ViewStyle, TextStyle, Animated, Easing, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { withTiming, useAnimatedProps, withSpring, useSharedValue, useAnimatedStyle, AnimatedStyleProp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { techniques } from '@/data/strikes';
import { useWorkout } from '@/contexts/WorkoutContext';
import { categorizeStrikes } from '@/lib/openai';

// XP required for each level follows the formula: baseXP * (multiplier ^ (level - 1))
const BASE_XP = 1000; // XP required for level 2
const XP_MULTIPLIER = 1.2; // Each level requires 20% more XP than the previous

const calculateLevel = (xp: number): number => {
  if (xp === 0) return 1;
  // Using logarithms to solve for level in the exponential formula
  // xp = BASE_XP * (XP_MULTIPLIER ^ (level - 1))
  // log(xp/BASE_XP) = (level - 1) * log(XP_MULTIPLIER)
  // level = log(xp/BASE_XP) / log(XP_MULTIPLIER) + 1
  const level = Math.floor(Math.log(xp / BASE_XP) / Math.log(XP_MULTIPLIER) + 1);
  return Math.max(1, level);
};

const calculateXPRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  // XP for level N is BASE_XP * (XP_MULTIPLIER ^ (N-1))
  return Math.round(BASE_XP * Math.pow(XP_MULTIPLIER, level - 1));
};

const calculateProgressPercent = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  // Get XP threshold for previous level (where current progress starts from)
  const previousLevelXP = calculateXPRequiredForLevel(currentLevel);
  // Get XP threshold for next level
  const nextLevelXP = calculateXPRequiredForLevel(currentLevel + 1);
  
  // Calculate how much XP we have gained in the current level
  const xpIntoCurrentLevel = xp - previousLevelXP;
  // Calculate how much XP is needed to level up
  const xpRequiredForLevelUp = nextLevelXP - previousLevelXP;
  
  // Calculate progress percentage
  const progress = (xpIntoCurrentLevel / xpRequiredForLevelUp) * 100;
  
  // Ensure progress is between 0 and 100
  return Math.min(100, Math.max(0, progress));
};

const useNumberAnimation = (end: number, duration: number = 1500) => {
  const [current, setCurrent] = useState(0);
  const stepRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const animate = () => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      setCurrent(Math.round(end * easedProgress));

      if (currentStep < steps) {
        stepRef.current = setTimeout(animate, stepDuration);
      }
    };

    animate();

    return () => {
      if (stepRef.current) {
        clearTimeout(stepRef.current);
      }
    };
  }, [end, duration]);

  return current;
};

const useProgressAnimation = (startXP: number, endXP: number, duration: number = 2500) => {
  const [current, setCurrent] = useState(startXP);
  const animationRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      
      if (elapsed >= duration) {
        setCurrent(endXP);
        return;
      }

      const progress = elapsed / duration;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      const newXP = Math.round(startXP + (endXP - startXP) * easedProgress);
      
      setCurrent(newXP);
      animationRef.current = setTimeout(animate, 1000 / 60); // 60 FPS
    };

    animate();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [startXP, endXP, duration]);

  return current;
};

const XPTile = ({ 
  category, 
  gainedXP, 
  prevLevel, 
  updatedLevel 
}: { 
  category: string; 
  gainedXP: number;
  prevLevel: { level: number; xp: number };
  updatedLevel: { level: number; xp: number };
}) => {
  const currentXP = useProgressAnimation(prevLevel.xp, updatedLevel.xp);
  const progressPercent = calculateProgressPercent(currentXP);
  const lastProgressRef = useRef(progressPercent);
  const animatedXP = useNumberAnimation(gainedXP, 2000);

  useEffect(() => {
    // Trigger haptic feedback when progress changes significantly
    if (Math.abs(progressPercent - lastProgressRef.current) > 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastProgressRef.current = progressPercent;
    }
  }, [progressPercent]);

  return (
    <View style={styles.tileWrapper}>
      <TouchableOpacity
        style={[styles.tile, { backgroundColor: '#141414' }]}
      >
        <ThemedView style={styles.tileContent}>
          <ThemedView style={[styles.tileBackground, { backgroundColor: '#1c1c1e' }]}>
            <ThemedView style={[styles.tileHeader, { backgroundColor: '#1c1c1e' }]}>
              <ThemedText style={[styles.tileName, { backgroundColor: '#1c1c1e' }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </ThemedText>
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e' }}>
                <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e' }]}>
                  Lv.
                </ThemedText>
                <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e', fontSize: 17, fontFamily: 'PoppinsSemiBold', marginLeft: -2, color: '#FFD700' }]}>
                  {updatedLevel.level}
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
                    { width: `${progressPercent}%` }
                  ]}
                />
              </ThemedView>
            </ThemedView>
            <ThemedText style={styles.xpGained}>
              <ThemedText style={[styles.xpGained, { color: '#FFFFFF' }]}>
                +{animatedXP}{' '}
              </ThemedText>
              <ThemedText style={[styles.xpGained, { color: '#FFD700' }]}>
                xp
              </ThemedText>
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    </View>
  );
};

type XPHistoryRecord = {
  user_id: string;
  category: string;
  xp_gained: number;
  created_at: string;
};

export default function XPSummaryScreen() {
  const { workoutData } = useLocalSearchParams<{ workoutData: string }>();
  const { workoutName, setWorkoutName, setCombos, setNotes } = useWorkout();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { session } = useAuth();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xpBreakdown, setXpBreakdown] = useState<Record<string, number>>({});
  const [levelUps, setLevelUps] = useState<Record<string, { from: number; to: number }>>({});
  const [previousLevels, setPreviousLevels] = useState<Record<string, { level: number; xp: number }>>({});
  const [updatedLevels, setUpdatedLevels] = useState<Record<string, { level: number; xp: number }>>({});
  const xpValues = useSharedValue<Record<number, number>>({});
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    saveWorkout();
  }, []);

  useEffect(() => {
    // Start the loading spinner animation
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

    // Cleanup the animation when component unmounts
    return () => {
      rotateAnimation.setValue(0);
    };
  }, []); // Empty dependency array to run once on mount

  const saveWorkout = async () => {
    console.log('[XP Summary] Starting saveWorkout');
    if (!session?.user) {
      console.log('[XP Summary] No user session found');
      setError('No user session found');
      setSaving(false);
      return;
    }

    try {
      const parsedWorkoutData = JSON.parse(workoutData);
      console.log('[XP Summary] Parsed workout data:', parsedWorkoutData);
      const { combos, totalXP, notes } = parsedWorkoutData;
      console.log('[XP Summary] Extracted notes:', notes);

      // Create the workout
      console.log('[XP Summary] Creating workout...');
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: session.user.id,
          name: workoutName,
          total_xp: totalXP,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workoutError) {
        console.error('[XP Summary] Error creating workout:', workoutError);
        throw workoutError;
      }
      console.log('[XP Summary] Created workout:', workout);

      // Save notes if they exist
      if (notes?.text) {
        console.log('[XP Summary] Saving notes for workout:', workout.id);
        const { data: noteData, error: notesError } = await supabase
          .from('workout_notes')
          .insert({
            workout_id: workout.id,
            notes: notes.text,
            strikes_mentioned: notes.strikes_mentioned || []
          })
          .select();

        if (notesError) {
          console.error('[XP Summary] Error saving notes:', notesError);
          // Continue with the rest of the save process even if notes fail
        } else {
          console.log('[XP Summary] Successfully saved notes:', noteData);
        }
      } else {
        console.log('[XP Summary] No notes to save');
      }

      // Create all combos
      console.log('[XP Summary] Creating combos...');
      const comboInserts = combos.map((combo: any, index: number) => ({
        workout_id: workout.id,
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
        xp: Math.round(combo.xp) || 0,
        completed: true,
        distance: combo.distance ? parseFloat(combo.distance) || null : null,
        distance_unit: combo.distanceUnit || null
      }));

      const { error: combosError } = await supabase
        .from('workout_combos')
        .insert(comboInserts);

      if (combosError) throw combosError;

      // Get current user levels before updating
      const { data: userLevels, error: levelsError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (levelsError) throw levelsError;

      // Store previous levels
      const prevLevels: Record<string, { level: number; xp: number }> = {};
      const categoryXP: Record<string, number> = {
        punches: 0,
        kicks: 0,
        elbows: 0,
        knees: 0,
        footwork: 0,
        clinch: 0,
        defensive: 0,
        sweeps: 0,
        feints: 0
      };

      // Process each combo's techniques
      for (const combo of combos) {
        if (combo.type === 'Skipping') {
          categoryXP.footwork += combo.xp;
          continue;
        }

        if (!combo.techniques) continue;

        const techniqueNames = combo.techniques.split(' - ');
        const xpPerTechnique = combo.xp / techniqueNames.length;

        // Collect unknown techniques
        const unknownTechniques: string[] = [];
        
        for (const techniqueName of techniqueNames) {
          const technique = techniques.find(t => t.name === techniqueName);
          if (technique) {
            const category = technique.category.toLowerCase();
            categoryXP[category] += xpPerTechnique;
          } else {
            unknownTechniques.push(techniqueName);
          }
        }

        // If we have unknown techniques, categorize them using the LLM
        if (unknownTechniques.length > 0) {
          console.log('[XP Summary] Categorizing unknown techniques:', unknownTechniques);
          const categorizedStrikes = await categorizeStrikes(unknownTechniques);
          
          for (const strike of categorizedStrikes) {
            if (strike.confidence >= 0.7) { // Only use categorizations with high confidence
              const category = strike.category.toLowerCase();
              categoryXP[category] += xpPerTechnique;
              console.log(`[XP Summary] Categorized "${strike.name}" as ${strike.category} with confidence ${strike.confidence}`);
            } else {
              console.log(`[XP Summary] Low confidence categorization for "${strike.name}" (${strike.confidence}), skipping XP attribution`);
            }
          }
        }
      }

      // Store previous and calculate updated levels
      const updLevels: Record<string, { level: number; xp: number }> = {};
      Object.entries(categoryXP).forEach(([category, xp]) => {
        if (xp > 0) {
          const xpField = `${category}_xp`;
          const levelField = `${category}_level`;
          const currentXP = userLevels[xpField] || 0;
          const currentLevel = userLevels[levelField] || 1;
          
          prevLevels[category] = {
            level: currentLevel,
            xp: currentXP
          };
          
          const newXP = Math.round(currentXP + xp);
          const newLevel = calculateLevel(newXP);
          
          updLevels[category] = {
            level: newLevel,
            xp: newXP
          };
        }
      });

      setPreviousLevels(prevLevels);
      setUpdatedLevels(updLevels);
      setXpBreakdown(categoryXP);

      // Track level ups
      const newLevelUps: Record<string, { from: number; to: number }> = {};

      // Update user levels and XP
      const updates: Record<string, number> = {};
      const xpHistoryRecords: XPHistoryRecord[] = [];

      Object.entries(categoryXP).forEach(([category, xp]) => {
        if (xp > 0) {
          const xpField = `${category}_xp`;
          const levelField = `${category}_level`;
          const currentXP = userLevels[xpField] || 0;
          const newXP = Math.round(currentXP + xp);
          
          // Calculate new level based on total XP
          const currentLevel = userLevels[levelField] || 1;
          const newLevel = calculateLevel(newXP);
          
          updates[xpField] = newXP;
          if (newLevel !== currentLevel) {
            updates[levelField] = newLevel;
            newLevelUps[category] = { from: currentLevel, to: newLevel };
          }

          // Add XP history record
          xpHistoryRecords.push({
            user_id: session.user.id,
            category,
            xp_gained: Math.round(xp),
            created_at: new Date().toISOString()
          });
        }
      });

      setLevelUps(newLevelUps);

      // Save XP history records
      if (xpHistoryRecords.length > 0) {
        const { error: historyError } = await supabase
          .from('xp_history')
          .insert(xpHistoryRecords);

        if (historyError) {
          console.error('[XP Summary] Error saving XP history:', historyError);
          // Continue with the rest of the save process even if history fails
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('user_levels')
          .update(updates)
          .eq('user_id', session.user.id);

        if (updateError) throw updateError;
      }

      // Clear the workout context
      setWorkoutName('');
      setCombos([]);
      setNotes('');

      setSaving(false);
    } catch (error: any) {
      console.error('Error saving workout:', error);
      setError(error.message);
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (saving) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <Animated.View style={[
          styles.loadingCircle,
          {
            transform: [{
              rotate: rotateAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }]
          }
        ]} />
        <ThemedText style={styles.loadingText}>Calculating XP...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.error}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}>
          <ThemedText>Return Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>xp gained</ThemedText>

        <ScrollView style={styles.scrollView}>
          <ThemedView style={styles.grid}>
            {Object.entries(xpBreakdown).map(([category, gainedXP]) => {
              if (gainedXP <= 0) return null;
              
              const prevLevel = previousLevels[category];
              const updatedLevel = updatedLevels[category];

              return (
                <XPTile
                  key={category}
                  category={category}
                  gainedXP={gainedXP}
                  prevLevel={prevLevel}
                  updatedLevel={updatedLevel}
                />
              );
            })}
          </ThemedView>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace('/(tabs)');
            }}>
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
            <IconSymbol name="arrow.right" size={28} color={colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    textTransform: 'lowercase',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'column',
    gap: 3,
  },
  tileWrapper: {
    marginBottom: 3,
    borderRadius: 8,
  },
  tile: {
    width: '100%',
    borderRadius: 8,
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
  xpGained: {
    fontSize: 14,
    color: '#FFD700',
    fontFamily: 'PoppinsSemiBold',
    textAlign: 'right',
    marginTop: 2,
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
  button: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
  },
  continueButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 16,
    marginRight: 8,
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