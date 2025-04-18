import { Stack } from 'expo-router';

export default function CreateWorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="name" />
      <Stack.Screen name="techniques" />
      <Stack.Screen name="notes" />
    </Stack>
  );
} 