import { useLocalSearchParams, router } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TechniquesScreen() {
  const { workoutName } = useLocalSearchParams<{ workoutName: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleBack = () => {
    router.back();
  };

  const handleAddCombo = () => {
    router.push("/create-workout/strikes");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>

        <ThemedView style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="slider.horizontal.3" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="doc.text" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.text }]}>
            <ThemedText style={styles.startButtonText}>Start</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText type="title">{workoutName}</ThemedText>
        <ThemedText style={styles.subtitle}>
          Set up this workout by adding some exercises to it
        </ThemedText>

        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.background }]}
          onPress={handleAddCombo}>
          <ThemedView style={styles.addButtonContent}>
            <ThemedView style={[styles.plusCircle, { borderColor: colors.text }]}>
              <IconSymbol name="plus" size={20} color={colors.text} />
            </ThemedView>
            <ThemedText style={styles.addButtonText}>Add combo</ThemedText>
            <ThemedView style={styles.rightIcons}>
              <IconSymbol name="chevron.right" size={20} color={colors.text} />
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  startButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  subtitle: {
    color: '#999',
    marginTop: 2,
    marginBottom: 24,
  },
  addButton: {
    borderRadius: 16,
    padding: 16,
    marginLeft: -16,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); 