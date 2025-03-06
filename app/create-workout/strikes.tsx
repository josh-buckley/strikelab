import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { withTiming, useAnimatedStyle, FadeIn, SlideInDown, useSharedValue } from 'react-native-reanimated';
import React from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { techniques, getTechniquesByCategory } from '@/data/strikes';
import type { Category, Technique, Side, Target, Range } from '@/data/strikes';
import { IconSymbolName } from '@/components/ui/IconSymbol';
import { useWorkout } from '@/contexts/WorkoutContext';

function TechniqueRow({ 
  technique, 
  isExpanded, 
  onPress, 
  onAddPress, 
  colors,
  modifiedName,
  renderOptions
}: { 
  technique: Technique;
  isExpanded: boolean;
  onPress: () => void;
  onAddPress: () => void;
  colors: { text: string };
  modifiedName?: string;
  renderOptions: () => React.ReactNode;
}) {
  const buttonBackground = useSharedValue('#2c2c2e');

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ 
      rotate: withTiming(isExpanded ? '90deg' : '0deg', { duration: 200 })
    }]
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: buttonBackground.value,
  }));

  const handleAddPress = () => {
    onAddPress();
    buttonBackground.value = '#fff';
    setTimeout(() => {
      buttonBackground.value = withTiming('#2c2c2e', { duration: 150 });
    }, 50);
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.techniqueItem}
        activeOpacity={1}
        onPress={onPress}>
        <ThemedView style={styles.techniqueContent}>
          <TouchableOpacity 
            style={[styles.techniqueIcon, { width: 'auto', height: 32, borderRadius: 8 }]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddPress();
            }}
          >
            <Animated.View style={[
              styles.techniqueIconBackground, 
              buttonStyle,
              { 
                paddingHorizontal: 16, 
                paddingVertical: 2, 
                borderRadius: 8,
                height: '100%'
              }
            ]}>
              <ThemedText style={{ 
                color: buttonBackground.value === '#fff' ? '#2c2c2e' : '#fff',
                fontSize: 14,
                fontFamily: 'Poppins',
                lineHeight: 28
              }}>
                Add
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
          <ThemedText style={styles.techniqueName}>
            {modifiedName || technique.name}
          </ThemedText>
          <Animated.View style={chevronStyle}>
            <IconSymbol name="chevron.right" size={20} color={colors.text} />
          </Animated.View>
        </ThemedView>
      </TouchableOpacity>
      {isExpanded && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={styles.expandedContent}>
          {renderOptions()}
        </Animated.View>
      )}
    </View>
  );
}

const getCategoryIcon = (category: Category): IconSymbolName => {
  switch (category) {
    case 'Punches':
      return 'hand.raised';
    case 'Kicks':
      return 'figure.walk';
    case 'Elbows':
      return 'arrow.triangle.2.circlepath';
    case 'Knees':
      return 'arrow.up.forward';
    case 'Footwork':
      return 'figure.walk';
    case 'Clinch':
      return 'person.2';
    case 'Defensive':
      return 'shield';
    case 'Sweeps':
      return 'arrow.left.and.right';
    case 'Feints':
      return 'eye';
    default:
      return 'plus';
  }
};

export default function StrikesScreen() {
  const params = useLocalSearchParams<{ 
    comboId?: string;
    existingTechniques?: string;
  }>();
  const { combos, setCombos } = useWorkout();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>('Punches');
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>(() => {
    // Initialize with existing techniques if available
    if (params.existingTechniques) {
      return params.existingTechniques.split(' - ').filter(Boolean);
    }
    return [];
  });
  const [modifiedNames, setModifiedNames] = useState<Record<string, string>>({});
  const buttonBackground = useSharedValue('#2c2c2e');

  const categories: Category[] = [
    'Punches',
    'Kicks',
    'Elbows',
    'Knees',
    'Footwork',
    'Clinch',
    'Defensive',
    'Sweeps',
    'Feints'
  ];

  // Filter techniques based on search query and category
  const displayedTechniques = useMemo(() => {
    let filtered = selectedCategory 
      ? getTechniquesByCategory(selectedCategory)
      : [...techniques].sort((a, b) => a.name.localeCompare(b.name));

    if (searchQuery) {
      filtered = filtered.filter(technique => 
        technique.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: buttonBackground.value,
  }));

  // Create a single shared rotation value
  const chevronRotation = useSharedValue('0deg');

  // Create a simple animated style for the chevron
  const getChevronStyle = (techniqueId: string) => useAnimatedStyle(() => ({
    transform: [{ 
      rotate: expandedTechnique === techniqueId ? withTiming('90deg', { duration: 200 }) : withTiming('0deg', { duration: 200 })
    }]
  }), [expandedTechnique, techniqueId]);

  const handleTechniquePress = (techniqueId: string) => {
    if (expandedTechnique === techniqueId) {
      setExpandedTechnique(null);
      // Reset modified name when collapsing
      setModifiedNames(prev => {
        const { [techniqueId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setExpandedTechnique(techniqueId);
    }
    setSelectedSide(null);
    setSelectedTarget(null);
    setSelectedRange(null);
  };

  const handleCategoryPress = (category: Category | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleSidePress = (side: Side) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedSide === side) {
      setSelectedSide(null);
      // Remove side from name
      const technique = techniques.find(t => t.id === expandedTechnique!);
      if (technique) {
        const currentName = modifiedNames[technique.id] || technique.name;
        // Extract any existing range prefix
        const rangeMatch = currentName.match(/^(Close|Mid|Long)-range\s+/);
        const rangePrefix = rangeMatch ? rangeMatch[0] : '';
        // Remove the side prefix but keep the range prefix if it exists
        const nameWithoutSide = currentName
          .replace(/^(Close|Mid|Long)-range\s+/, '') // Temporarily remove range
          .replace(/^(Left|Right)\s+/, '') // Remove side
        const newName = rangePrefix ? `${rangePrefix}${nameWithoutSide}` : nameWithoutSide;
        setModifiedNames(prev => ({
          ...prev,
          [technique.id]: newName
        }));
      }
    } else {
      setSelectedSide(side);
      // Add side to name
      const technique = techniques.find(t => t.id === expandedTechnique!);
      if (technique) {
        const currentName = modifiedNames[technique.id] || technique.name;
        // Extract any existing range prefix
        const rangeMatch = currentName.match(/^(Close|Mid|Long)-range\s+/);
        const rangePrefix = rangeMatch ? rangeMatch[0] : '';
        // Remove any existing side prefix but keep the range prefix if it exists
        const nameWithoutSide = currentName
          .replace(/^(Close|Mid|Long)-range\s+/, '') // Temporarily remove range
          .replace(/^(Left|Right)\s+/, '') // Remove any existing side
        // Add the new side prefix after range prefix
        const sideName = side.charAt(0).toUpperCase() + side.slice(1);
        const newName = rangePrefix ? `${rangePrefix}${sideName} ${nameWithoutSide}` : `${sideName} ${nameWithoutSide}`;
        setModifiedNames(prev => ({
          ...prev,
          [technique.id]: newName
        }));
      }
    }
  };

  const handleTargetPress = (target: Target, techniqueId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTarget === target) {
      setSelectedTarget(null);
      // Remove target from name
      const technique = techniques.find(t => t.id === techniqueId);
      if (technique) {
        const currentName = modifiedNames[techniqueId] || technique.name;
        // Extract any existing range prefix
        const rangeMatch = currentName.match(/^(Close|Mid|Long)-range\s+/);
        const rangePrefix = rangeMatch ? rangeMatch[0] : '';
        // Remove target suffix
        const nameWithoutTarget = currentName.replace(/\s+to the\s+\w+$/, '');
        setModifiedNames(prev => ({
          ...prev,
          [techniqueId]: nameWithoutTarget
        }));
      }
    } else {
      setSelectedTarget(target);
      // Add target to name
      const technique = techniques.find(t => t.id === techniqueId);
      if (technique) {
        const currentName = modifiedNames[techniqueId] || technique.name;
        // Extract any existing range prefix
        const rangeMatch = currentName.match(/^(Close|Mid|Long)-range\s+/);
        const rangePrefix = rangeMatch ? rangeMatch[0] : '';
        // Remove any existing target
        const baseName = currentName.replace(/\s+to the\s+\w+$/, '');
        // Reconstruct name with range (if it existed) and new target
        setModifiedNames(prev => ({
          ...prev,
          [techniqueId]: `${baseName} to the ${target}`
        }));
      }
    }
  };

  const handleRangePress = (range: Range, techniqueId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedRange === range) {
      setSelectedRange(null);
      // Remove range prefix from name
      const technique = techniques.find(t => t.id === techniqueId);
      if (technique) {
        const currentName = modifiedNames[techniqueId] || technique.name;
        // Remove range prefix if present
        const nameWithoutRange = currentName.replace(/^(Close|Mid|Long)-range\s+/, '');
        setModifiedNames(prev => ({
          ...prev,
          [techniqueId]: nameWithoutRange
        }));
      }
    } else {
      setSelectedRange(range);
      // Add range prefix to name
      const technique = techniques.find(t => t.id === techniqueId);
      if (technique) {
        const currentName = modifiedNames[techniqueId] || technique.name;
        // Remove any existing range prefix if present
        const nameWithoutRange = currentName.replace(/^(Close|Mid|Long)-range\s+/, '');
        // Add the new range prefix
        const rangeName = range.charAt(0).toUpperCase() + range.slice(1);
        setModifiedNames(prev => ({
          ...prev,
          [techniqueId]: `${rangeName}-range ${nameWithoutRange}`
        }));
      }
    }
  };

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  };

  const handleAddToCombo = (technique: Technique) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Use modified name if it exists, otherwise use original name
    const techniqueName = modifiedNames[technique.id] || technique.name;
    setSelectedTechniques([...selectedTechniques, techniqueName]);
  };

  const handleCompleteCombo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!params.comboId) {
      console.warn('No comboId found');
      return;
    }
    
    // Update the combo in the context
    const updatedCombos = combos.map(combo => {
      if (combo.id === params.comboId) {
        return {
          ...combo,
          techniques: selectedTechniques.join(' - ')
        };
      }
      return combo;
    });
    
    setCombos(updatedCombos);
    router.back();
  };

  const handleAddButtonPress = (technique: Technique) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleAddToCombo(technique);
  };

  const renderTechniqueOptions = (technique: Technique) => {
    return (
      <ThemedView style={styles.optionsContainer}>
        {technique.side === 'both' && (
          <ThemedView style={styles.optionSection}>
            <ThemedView style={styles.optionTitleRow}>
              <ThemedText style={styles.optionTitle}>Side</ThemedText>
              <ThemedText style={styles.optionalText}>(optional)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.optionButtons}>
              {['left', 'right'].map((side) => (
                <TouchableOpacity
                  key={side}
                  style={[
                    styles.optionButton,
                    selectedSide === side && styles.optionButtonSelected,
                    { backgroundColor: selectedSide === side ? colors.text : '#2c2c2e' }
                  ]}
                  onPress={() => handleSidePress(side as Side)}
                >
                  <ThemedText style={[
                    styles.optionButtonText,
                    selectedSide === side && styles.optionButtonTextSelected
                  ]}>
                    {side.charAt(0).toUpperCase() + side.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {technique.targets[0] !== 'n/a' && (
          <ThemedView style={styles.optionSection}>
            <ThemedView style={styles.optionTitleRow}>
              <ThemedText style={styles.optionTitle}>Target</ThemedText>
              <ThemedText style={styles.optionalText}>(optional)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.optionButtons}>
              {technique.targets.map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.optionButton,
                    selectedTarget === target && styles.optionButtonSelected,
                    { backgroundColor: selectedTarget === target ? colors.text : '#2c2c2e' }
                  ]}
                  onPress={() => handleTargetPress(target, technique.id)}
                >
                  <ThemedText style={[
                    styles.optionButtonText,
                    selectedTarget === target && styles.optionButtonTextSelected
                  ]}>
                    {target}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {technique.ranges[0] !== 'n/a' && (
          <ThemedView style={styles.optionSection}>
            <ThemedView style={styles.optionTitleRow}>
              <ThemedText style={styles.optionTitle}>Range</ThemedText>
              <ThemedText style={styles.optionalText}>(optional)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.optionButtons}>
              {technique.ranges.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.optionButton,
                    selectedRange === range && styles.optionButtonSelected,
                    { backgroundColor: selectedRange === range ? colors.text : '#2c2c2e' }
                  ]}
                  onPress={() => handleRangePress(range, technique.id)}
                >
                  <ThemedText style={[
                    styles.optionButtonText,
                    selectedRange === range && styles.optionButtonTextSelected
                  ]}>
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  const handleRemoveLastTechnique = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTechniques(prev => prev.slice(0, -1));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.contentHeader}>
        <ThemedText type="title" style={[
          styles.title,
          { 
            textDecorationLine: 'line-through', 
            textDecorationColor: '#FFD700',
            textTransform: 'lowercase'
          }
        ]}>library</ThemedText>
        <ThemedText style={styles.subtitle}>Select your strikes</ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <ThemedView style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#666" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search strikes..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              style={styles.clearButton}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null && styles.categoryChipSelected,
            { backgroundColor: selectedCategory === null ? colors.text : '#2c2c2e' }
          ]}
          onPress={() => handleCategoryPress(null)}>
          <ThemedText style={[
            styles.categoryChipText,
            selectedCategory === null && styles.categoryChipTextSelected,
            { color: selectedCategory === null ? '#000' : colors.text }
          ]}>
            All
          </ThemedText>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
              { backgroundColor: selectedCategory === category ? colors.text : '#2c2c2e' }
            ]}
            onPress={() => handleCategoryPress(category)}>
            <ThemedText style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextSelected
            ]}>
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} 
        contentContainerStyle={[
          styles.contentContainer,
          selectedTechniques.length > 0 && { paddingBottom: 200 }
        ]}>
        {displayedTechniques.map((technique) => (
          <View key={technique.id}>
            <TechniqueRow
              technique={technique}
              isExpanded={expandedTechnique === technique.id}
              onPress={() => handleTechniquePress(technique.id)}
              onAddPress={() => handleAddButtonPress(technique)}
              colors={colors}
              modifiedName={modifiedNames[technique.id]}
              renderOptions={() => renderTechniqueOptions(technique)}
            />
            <ThemedView style={styles.separator} />
          </View>
        ))}
      </ScrollView>

      {selectedTechniques.length > 0 && (
        <Animated.View 
          entering={SlideInDown.duration(200).withInitialValues({ y: 100 })}
          style={styles.selectedTechniquesContainer}>
          <ThemedView style={styles.selectedTechniquesHeader}>
            <TouchableOpacity 
              onPress={handleRemoveLastTechnique}
              style={styles.backspaceButton}>
              <IconSymbol name="delete.left" size={20} color={colors.text} />
            </TouchableOpacity>
          </ThemedView>
          <ScrollView 
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <ThemedText style={styles.selectedTechniquesText}>
              {selectedTechniques.map((technique, index) => (
                <React.Fragment key={index}>
                  {technique}
                  {index < selectedTechniques.length - 1 && (
                    <ThemedText style={{ color: '#FFD700' }}> → </ThemedText>
                  )}
                </React.Fragment>
              ))}
            </ThemedText>
          </ScrollView>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteCombo}>
            <ThemedText style={styles.completeButtonText}>Add to workout</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
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
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  doneButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  contentHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  subtitle: {
    color: '#999',
    marginTop: 2,
  },
  categoryItem: {
    borderRadius: 16,
    marginBottom: 8,
    marginHorizontal: 24,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 0,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  techniqueItem: {
    borderRadius: 12,
    marginHorizontal: 0,
  },
  techniqueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  techniqueIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  techniqueIconBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
  },
  techniqueName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  optionsContainer: {
    paddingRight: 16,
    paddingTop: 0,
    paddingLeft: 0,
    marginTop: -8,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'PoppinsSemiBold',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginLeft: 4,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#fff',
  },
  optionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  optionButtonTextSelected: {
    color: '#000',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryChipSelected: {
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  categoryChipTextSelected: {
    color: '#000',
  },
  categoryList: {
    maxHeight: 36,
    marginBottom: 16,
  },
  categoryListContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    margin: -4,
  },
  separator: {
    height: 1,
    backgroundColor: '#2c2c2e',
    marginHorizontal: 0,
  },
  selectedTechniquesContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    minHeight: 120,
    maxHeight: '50%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#1c1c1e',
    justifyContent: 'flex-end',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedTechniquesText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    textAlign: 'center',
    flexShrink: 1,
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#262626',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  selectedTechniquesHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  backspaceButton: {
    padding: 0,
    margin: -12,
  },
  expandedContent: {
    paddingVertical: 0,
    paddingRight: 16,
    paddingLeft: 0,
  },
  title: {
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    textTransform: 'lowercase',
  },
}); 