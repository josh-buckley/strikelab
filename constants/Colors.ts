/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const gold = '#FFD700';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F1F3F5',
    textSecondary: '#687076',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#A1A1AA',
    tabIconDefault: '#A1A1AA',
    tabIconSelected: tintColorDark,
    card: '#1F2123',
    textSecondary: '#A1A1AA',
  },
  gold,
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors[ColorScheme];
