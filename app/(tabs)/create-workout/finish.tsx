import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export default function FinishWorkoutScreen() {
  const params = useLocalSearchParams<{ 
    workoutXP?: string;
    comboXPs?: string;
  }>();

  useEffect(() => {
    // If we already have the total workout XP, navigate to summary
    if (params.workoutXP) {
      router.replace('/create-workout/xp-summary');
      return;
    }

    // Get all combo XPs from the workout
    const comboXPs = params.comboXPs ? JSON.parse(params.comboXPs) : [];
    
    // Navigate to the XP summary page with the XP data
    router.replace({
      pathname: '/create-workout/xp-summary',
      params: {
        workoutXP: JSON.stringify(comboXPs)
      }
    });
  }, [params.workoutXP, params.comboXPs]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
} 