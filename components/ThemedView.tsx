import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = lightColor && darkColor
    ? colorScheme === 'dark' ? darkColor : lightColor
    : colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
