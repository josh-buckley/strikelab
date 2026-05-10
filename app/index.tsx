import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Index() {
  const colorScheme = useColorScheme();

  // Navigation is centralized in app/_layout.tsx.
  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }} />
  );
}
