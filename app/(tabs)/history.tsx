import React, { useMemo, useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';

// Calculate grid dimensions
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 24;
const DAYS_IN_YEAR = 365;
const COLUMNS = 16;
const CONTAINER_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const SPACING = Math.floor(CONTAINER_WIDTH / COLUMNS) - 3;
const DOT_SIZE = 4;

export default function HistoryScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    };

    animate();
  }, []);

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('workouts')
          .select('completed_at')
          .eq('user_id', user?.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: true });

        if (fetchError) throw fetchError;

        const completedDates = data
          .map(workout => workout.completed_at?.split('T')[0])
          .filter((date): date is string => date !== undefined);

        setWorkoutDays(completedDates);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError('Failed to load workout history');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    
    const daysIn = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const sessionsCompleted = workoutDays.length;

    return { daysIn, daysLeft, sessionsCompleted };
  }, [workoutDays]);

  const currentYear = new Date().getFullYear();
  const daysInYear = 365 + (currentYear % 4 === 0 ? 1 : 0);

  const dots = Array.from({ length: daysInYear }, (_, index) => {
    const date = new Date(currentYear, 0, index + 1);
    const dateString = date.toISOString().split('T')[0];
    const hasWorkout = workoutDays.includes(dateString);
    const isPast = date <= new Date();
    const isToday = new Date().toISOString().split('T')[0] === dateString;

    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isToday ? '#FFFF00' : (hasWorkout ? '#FFFFFF' : '#666'),
            opacity: hasWorkout || isToday ? 1 : 0.3,
          },
        ]}
      />
    );
  });

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700', color: '#fff' }]}>
          training days
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.calendar}>
        {isLoading ? (
          <View style={styles.centerContent}>
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
          </View>
        ) : (
          <>
            <ThemedView style={[styles.dotsContainer, { gap: SPACING }]}>{dots}</ThemedView>
            <ThemedView style={styles.statsContainer}>
              <ThemedText style={styles.year}>{currentYear}</ThemedText>
              <ThemedView style={styles.stats}>
                <ThemedView style={styles.statRow}>
                  <ThemedText style={[styles.statNumber, { color: '#FFD700' }]}>{stats.daysIn}</ThemedText>
                  <ThemedText style={styles.statText}> days in.</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statRow}>
                  <ThemedText style={styles.statNumber}>{stats.sessionsCompleted}</ThemedText>
                  <ThemedText style={styles.statText}> training sessions completed.</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statRow}>
                  <ThemedText style={styles.statNumber}>{stats.daysLeft}</ThemedText>
                  <ThemedText style={styles.statText}> days left.</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
  },
  calendar: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  dotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CONTAINER_WIDTH,
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  statsContainer: {
    paddingTop: 0,
    alignItems: 'flex-end',
  },
  year: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 4,
  },
  stats: {
    gap: 2,
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#fff',
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
}); 