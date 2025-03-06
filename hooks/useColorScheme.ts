import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const colorScheme = useNativeColorScheme();
  
  // Force dark mode in development
  if (__DEV__) {
    return 'dark';
  }
  
  return colorScheme;
}
