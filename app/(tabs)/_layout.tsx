import { Stack } from 'expo-router';
import { Platform, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TabsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index"
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="create-workout"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
