import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Keyboard, Alert, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  withSpring,
  useSharedValue,
  withSequence,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { techniques } from '@/data/strikes';
import type { Technique } from '@/data/strikes';
import { useWorkout } from '@/contexts/WorkoutContext';
import type { Combo, TrainingType, TrainingMode, DistanceUnit } from '@/contexts/WorkoutContext';

// Add this before the component
let persistedCombos: Combo[] = [];

export default function TechniquesScreen() {
  const { workoutName, combos, setCombos } = useWorkout();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedWarmup, setSelectedWarmup] = useState<TrainingType | null>(null);
  const [selectedMode, setSelectedMode] = useState<TrainingMode | null>(null);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [reps, setReps] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [rounds, setRounds] = useState('');
  const [roundDuration, setRoundDuration] = useState('');
  const [sets, setSets] = useState('');
  const [roundMinutes, setRoundMinutes] = useState('');
  const [roundSeconds, setRoundSeconds] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [editingStrike, setEditingStrike] = useState<{comboId: string, index: number} | null>(null);
  const [expandedActionMenu, setExpandedActionMenu] = useState<string | null>(null);
  
  const slideAnim = useSharedValue(0);

  const warmupTypes: TrainingType[] = ['Running', 'Warm-Up', 'Skipping'];
  const sparringTypes: TrainingType[] = ['Technical Sparring', 'Light Sparring', 'Hard Sparring'];
  const trainingTypes: TrainingType[] = [
    'Heavy Bag',
    'Thai Pads',
    'Focus Mitts',
    'Partner Drills',
    'Shadow Boxing'
  ];

  const baseTrainingModes: TrainingMode[] = ['Rounds', 'Time', 'Reps'];
  const trainingModes: TrainingMode[] = selectedType === 'Running' 
    ? [...baseTrainingModes, 'Distance'] 
    : baseTrainingModes;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardOpen(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardOpen(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFinishWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-workout/notes');
  };

  const handleAddCombo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editingComboId) {
      setEditingComboId(null);
      setSelectedType(null);
      setSelectedMode(null);
      setReps('');
      setMinutes('');
      setSeconds('');
      setRounds('');
      setSets('');
      setRoundMinutes('');
      setRoundSeconds('');
    }
    setIsExpanded(!isExpanded);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleEditCombo = (combo: Combo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // If already editing this combo, save changes and close it
    if (editingComboId === combo.id) {
      // Create updated combo with current values
      const updatedCombo: Combo = {
        ...combo,
        type: selectedType || combo.type,
        mode: selectedMode || combo.mode,
        ...(selectedMode === 'Reps' && { sets, reps }),
        ...(selectedMode === 'Time' && { 
          minutes, 
          seconds: seconds || '00'
        }),
        ...(selectedMode === 'Rounds' && { 
          rounds, 
          roundMinutes, 
          roundSeconds: roundSeconds || '00'
        }),
        ...(selectedMode === 'Distance' && {
          distance,
          distanceUnit
        })
      };

      // Update the combo in the list
      const updatedCombos = combos.map(c => 
        c.id === combo.id ? updatedCombo : c
      );
      setCombos(updatedCombos);
      persistedCombos = updatedCombos;

      // Reset all states
      setEditingComboId(null);
      setSelectedType(null);
      setSelectedMode(null);
      setReps('');
      setMinutes('');
      setSeconds('');
      setRounds('');
      setSets('');
      setRoundMinutes('');
      setRoundSeconds('');
      setDistance('');
      return;
    }
    
    // Otherwise, open it for editing
    setEditingComboId(combo.id);
    setSelectedType(combo.type);
    setSelectedMode(combo.mode);
    
    // Reset all input fields first
    setReps('');
    setMinutes('');
    setSeconds('');
    setRounds('');
    setSets('');
    setRoundMinutes('');
    setRoundSeconds('');
    setDistance('');
    
    // Set the appropriate fields based on mode
    if (combo.mode === 'Reps') {
      setSets(combo.sets || '');
      setReps(combo.reps || '');
    } else if (combo.mode === 'Time') {
      setMinutes(combo.minutes || '');
      setSeconds(combo.seconds || '');
    } else if (combo.mode === 'Rounds') {
      setRounds(combo.rounds || '');
      setRoundMinutes(combo.roundMinutes || '');
      setRoundSeconds(combo.roundSeconds || '');
    } else if (combo.mode === 'Distance') {
      setDistance(combo.distance || '');
      setDistanceUnit(combo.distanceUnit || 'km');
    }
  };

  const isSparringType = (type: TrainingType | null | undefined): boolean => {
    return type === 'Technical Sparring' || type === 'Light Sparring' || type === 'Hard Sparring';
  };

  const isWarmupType = (type: TrainingType | null | undefined): boolean => {
    return type === 'Running' || type === 'Warm-Up';
  };

  const handleCreateCombo = () => {
    if (!selectedType && !selectedWarmup) return;
    
    const newCombo: Combo = {
      id: editingComboId || Date.now().toString(),
      type: selectedWarmup || selectedType || 'Heavy Bag', // Use selectedWarmup if it exists
      mode: selectedMode || 'Rounds', // Default to Rounds if no mode selected
      ...(selectedMode === 'Reps' && { sets, reps }),
      ...(selectedMode === 'Time' && { 
        minutes, 
        seconds: seconds || '00'
      }),
      ...(selectedMode === 'Rounds' && { 
        rounds, 
        roundMinutes, 
        roundSeconds: roundSeconds || '00'
      }),
      ...(selectedMode === 'Distance' && {
        distance,
        distanceUnit
      }),
      techniques: editingComboId ? combos.find(c => c.id === editingComboId)?.techniques : undefined
    };

    console.log('[Create Combo] Creating new combo:', newCombo);

    const updatedCombos = editingComboId 
      ? combos.map(combo => combo.id === editingComboId ? { ...combo, ...newCombo } : combo)
      : [...combos, newCombo];
    
    console.log('[Create Combo] Setting updated combos:', updatedCombos);
    setCombos(updatedCombos);
    persistedCombos = updatedCombos;
    
    // Reset form
    setIsExpanded(false);
    setSelectedType(null);
    setSelectedWarmup(null);
    setSelectedMode(null);
    setEditingComboId(null);
    setReps('');
    setMinutes('');
    setSeconds('');
    setRounds('');
    setSets('');
    setRoundMinutes('');
    setRoundSeconds('');
    setDistance('');

    // Only navigate to strikes page if not editing, not a warm-up, not running, and not sparring
    if (!editingComboId && !selectedWarmup && !isWarmupType(selectedType) && !isSparringType(selectedType)) {
      handleComboStrikesPress(newCombo.id);
    }
  };

  const handleComboStrikesPress = (comboId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const combo = combos.find(c => c.id === comboId);
    if (isWarmupType(combo?.type) || isSparringType(combo?.type)) {
      return;
    }
    router.push({
      pathname: "/create-workout/strikes",
      params: { 
        comboId,
        workoutName,
        existingTechniques: combo?.techniques || ''
      }
    });
  };

  const handleDeleteCombo = (comboId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Combo',
      'Are you sure you want to delete this combo?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('[Delete Combo] Deleting combo:', comboId);
            const updatedCombos = combos.filter(combo => combo.id !== comboId);
            console.log('[Delete Combo] Updated combos:', updatedCombos);
            setCombos(updatedCombos);
            persistedCombos = updatedCombos;
          }
        }
      ]
    );
  };

  const handleDuplicateCombo = (combo: Combo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Duplicate Combo] Duplicating combo:', combo);
    
    const duplicatedCombo: Combo = {
      ...combo,
      id: Date.now().toString(),
    };
    
    const updatedCombos = [...combos, duplicatedCombo];
    console.log('[Duplicate Combo] Updated combos:', updatedCombos);
    
    setCombos(updatedCombos);
    persistedCombos = updatedCombos;
  };

  const handleStrikeChange = (comboId: string, index: number, newValue: string) => {
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;

    const techniques = combo.techniques ? combo.techniques.split(' - ') : [];
    techniques[index] = newValue;
    
    const updatedCombos = combos.map(c => {
      if (c.id === comboId) {
        return {
          ...c,
          techniques: techniques.join(' - ')
        };
      }
      return c;
    });
    
    setCombos(updatedCombos);
  };

  const handleActionMenuPress = (comboId: string, e: any) => {
    e.stopPropagation();
    setExpandedActionMenu(expandedActionMenu === comboId ? null : comboId);
  };

  const renderCombo = (combo: Combo, index: number) => {
    console.log('[Render Combo] Rendering combo:', { combo, index });
    const isEditing = editingComboId === combo.id;
    const isMenuOpen = activeMenuId === combo.id;
    let details = '';
    if (combo.mode === 'Reps') {
      if (combo.sets && combo.reps) {
        details = `${combo.sets} × ${combo.reps}`;
      }
    } else if (combo.mode === 'Time') {
      if (combo.minutes || combo.seconds) {
        details = `${combo.minutes || '0'}:${combo.seconds || '00'}`;
      }
    } else if (combo.mode === 'Rounds') {
      if (combo.rounds) {
        details = combo.roundMinutes || combo.roundSeconds 
          ? `${combo.rounds} × ${combo.roundMinutes || '0'}:${combo.roundSeconds || '00'}`
          : `${combo.rounds} rounds`;
      }
    } else if (combo.mode === 'Distance') {
      if (combo.distance) {
        details = `${combo.distance} ${combo.distanceUnit || 'km'}`;
      }
    }

    const handleMenuPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveMenuId(isMenuOpen ? null : combo.id);
    };

    const handleMenuAction = (action: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActiveMenuId(null);
      action();
    };

    return (
      <TouchableOpacity 
        key={combo.id} 
        style={[styles.comboItem, { backgroundColor: '#1c1c1e' }]}
        onPress={() => {
          console.log('[Combo Action] Pressed combo for editing:', combo.id);
          handleComboStrikesPress(combo.id);
        }}>
        <ThemedView style={styles.comboContent}>
          <ThemedText style={styles.comboNumber}>{index + 1}</ThemedText>
          <ThemedView style={styles.comboDetails}>
            <ThemedView style={styles.comboHeader}>
              <ThemedView style={styles.comboInfo}>
                {isEditing ? (
                  <>
                    <ThemedView style={styles.optionSection}>
                      <ThemedText style={styles.optionTitle}>Type</ThemedText>
                      <ThemedView style={styles.optionGroups}>
                        <ThemedView style={styles.optionGroup}>
                          <ThemedText style={styles.optionSubtitle}>Warm Ups</ThemedText>
                          <ThemedView style={styles.optionButtonGroup}>
                            {warmupTypes.map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={[
                                  styles.optionButton,
                                  selectedWarmup === type && styles.optionButtonSelected,
                                  { backgroundColor: selectedWarmup === type ? '#ffffff' : '#2c2c2e' }
                                ]}
                                onPress={() => {
                                  const newWarmup = selectedWarmup === type ? null : type;
                                  setSelectedWarmup(newWarmup);
                                  // Clear training type when selecting warmup
                                  if (newWarmup) {
                                    setSelectedType(null);
                                  }
                                }}
                              >
                                <IconSymbol 
                                  name={
                                    type === 'Running' ? 'figure.run' :
                                    'figure.walk'
                                  } 
                                  size={14} 
                                  color="#FFD700" 
                                />
                                <ThemedText style={[
                                  styles.optionButtonText,
                                  selectedWarmup === type && { color: '#000000' }
                                ]}>
                                  {type}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.optionGroup}>
                          <ThemedText style={styles.optionSubtitle}>Training</ThemedText>
                          <ThemedView style={styles.optionButtonGroup}>
                            {trainingTypes.map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={[
                                  styles.optionButton,
                                  selectedType === type && styles.optionButtonSelected,
                                  { backgroundColor: selectedType === type ? '#ffffff' : '#2c2c2e' }
                                ]}
                                onPress={() => {
                                  const newType = selectedType === type ? null : type;
                                  setSelectedType(newType);
                                  // Clear warmup type when selecting training type
                                  if (newType) {
                                    setSelectedWarmup(null);
                                  }
                                  // Clear distance fields if unselecting Running or selecting non-Running type
                                  if (selectedType === 'Running' || (type !== 'Running' && newType === type)) {
                                    setSelectedMode(null);
                                    setDistance('');
                                  }
                                }}
                              >
                                <IconSymbol 
                                  name={
                                    type === 'Heavy Bag' ? 'figure.boxing' :
                                    type === 'Thai Pads' ? 'figure.mixed.cardio' :
                                    type === 'Focus Mitts' ? 'figure.core.training' :
                                    type === 'Shadow Boxing' ? 'figure.cooldown' :
                                    type === 'Partner Drills' ? 'figure.cross.training' :
                                    'figure.boxing'
                                  } 
                                  size={14} 
                                  color="#FFD700" 
                                />
                                <ThemedText style={[
                                  styles.optionButtonText,
                                  selectedType === type && { color: '#000000' }
                                ]}>
                                  {type}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.optionGroup}>
                          <ThemedText style={styles.optionSubtitle}>Sparring</ThemedText>
                          <ThemedView style={styles.optionButtonGroup}>
                            {sparringTypes.map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={[
                                  styles.optionButton,
                                  selectedType === type && styles.optionButtonSelected,
                                  { backgroundColor: selectedType === type ? '#ffffff' : '#2c2c2e' }
                                ]}
                                onPress={() => {
                                  const newType = selectedType === type ? null : type;
                                  setSelectedType(newType);
                                  // Clear warmup type when selecting training type
                                  if (newType) {
                                    setSelectedWarmup(null);
                                  }
                                }}
                              >
                                <IconSymbol 
                                  name="figure.kickboxing"
                                  size={14} 
                                  color="#FFD700" 
                                />
                                <ThemedText style={[
                                  styles.optionButtonText,
                                  selectedType === type && { color: '#000000' }
                                ]}>
                                  {type}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={styles.optionSection}>
                      <ThemedView style={styles.optionTitleRow}>
                        <ThemedText style={styles.optionTitle}>Mode</ThemedText>
                        <ThemedText style={styles.optionalText}>(optional)</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.optionButtons}>
                        {trainingModes.map((mode) => (
                          <TouchableOpacity
                            key={mode}
                            style={[
                              styles.optionButton,
                              selectedMode === mode && styles.optionButtonSelected,
                              { backgroundColor: selectedMode === mode ? '#ffffff' : '#2c2c2e' }
                            ]}
                            onPress={() => setSelectedMode(selectedMode === mode ? null : mode)}
                          >
                            <IconSymbol 
                              name={
                                mode === 'Time' ? 'clock' :
                                mode === 'Distance' ? 'figure.run' :
                                mode === 'Rounds' ? 'timer' :
                                'number'
                              } 
                              size={14} 
                              color="#FFD700" 
                            />
                            <ThemedText style={[
                              styles.optionButtonText,
                              selectedMode === mode && { color: '#000000' }
                            ]}>
                              {mode}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>

                    {renderModeInput()}
                  </>
                ) : (
                  <>
                    <ThemedView style={styles.typeRow}>
                      <ThemedText style={styles.comboType}>{combo.type}</ThemedText>
                    </ThemedView>
                    {details && (
                      <ThemedView style={styles.modeRow}>
                        <ThemedView style={styles.modeIcon}>
                          <IconSymbol 
                            name={
                              combo.mode === 'Reps' ? 'repeat'
                              : combo.mode === 'Time' ? 'clock'
                              : combo.mode === 'Rounds' ? 'timer'
                              : combo.mode === 'Distance' ? 'figure.walk'
                              : 'clock'
                            }
                            size={14} 
                            color="#999" 
                          />
                        </ThemedView>
                        <ThemedText style={styles.comboMode}>{details}</ThemedText>
                      </ThemedView>
                    )}
                    {!isWarmupType(combo.type) && !isSparringType(combo.type) && combo.type !== 'Skipping' && (
                      <ThemedView style={[
                        styles.techniquesContainer,
                        !details && { marginTop: 2 }
                      ]}>
                        {combo.techniques ? (
                          combo.techniques.split(' - ').map((technique, techniqueIndex, array) => (
                            <ThemedView key={techniqueIndex} style={styles.techniqueRow}>
                              <TextInput
                                value={technique}
                                onChangeText={(newValue) => handleStrikeChange(combo.id, techniqueIndex, newValue)}
                                style={[
                                  styles.timeInput,
                                  styles.techniqueInput
                                ]}
                                placeholderTextColor="#666"
                              />
                              {techniqueIndex < array.length - 1 && (
                                <ThemedView style={styles.chainIndicator}>
                                  <IconSymbol 
                                    name="arrow.down" 
                                    size={14} 
                                    color="#FFD700" 
                                  />
                                </ThemedView>
                              )}
                            </ThemedView>
                          ))
                        ) : !isSparringType(combo.type) ? (
                          <ThemedText style={styles.comboTechniques}>
                            No strikes added
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                    )}
                  </>
                )}
              </ThemedView>
              <ThemedView style={styles.comboActions}>
                {expandedActionMenu === combo.id ? (
                  <>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDuplicateCombo(combo);
                      }}
                      style={styles.comboActionButton}>
                      <IconSymbol 
                        name="doc.on.doc"
                        size={16} 
                        color="#FFD700" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditCombo(combo);
                      }}
                      style={styles.comboActionButton}>
                      <IconSymbol 
                        name="timer"
                        size={16} 
                        color="#FFD700" 
                      />
                    </TouchableOpacity>
                    {!isWarmupType(combo.type) && !isSparringType(combo.type) && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleComboStrikesPress(combo.id);
                        }}
                        style={styles.comboActionButton}>
                        <IconSymbol 
                          name="figure.kickboxing"
                          size={16} 
                          color="#FFD700" 
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCombo(combo.id);
                      }}
                      style={styles.comboActionButton}>
                      <IconSymbol 
                        name="trash"
                        size={16} 
                        color="#FFD700" 
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    onPress={(e) => handleActionMenuPress(combo.id, e)}
                    style={styles.comboActionButton}>
                    <IconSymbol 
                      name="ellipsis"
                      size={16} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderModeInput = () => {
    switch (selectedMode) {
      case 'Distance':
        return (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Distance</ThemedText>
            <ThemedView style={styles.timeInputs}>
              <TextInput
                value={distance}
                onChangeText={setDistance}
                placeholder="0.0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={4}
                onSubmitEditing={dismissKeyboard}
                style={[styles.timeInput, { width: 80 }]}
              />
              <ThemedView style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    distanceUnit === 'km' && styles.unitButtonSelected,
                    { backgroundColor: distanceUnit === 'km' ? colors.text : '#2c2c2e' }
                  ]}
                  onPress={() => setDistanceUnit('km')}
                >
                  <ThemedText style={[
                    styles.unitButtonText,
                    distanceUnit === 'km' && { color: '#000' }
                  ]}>km</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    distanceUnit === 'mi' && styles.unitButtonSelected,
                    { backgroundColor: distanceUnit === 'mi' ? colors.text : '#2c2c2e' }
                  ]}
                  onPress={() => setDistanceUnit('mi')}
                >
                  <ThemedText style={[
                    styles.unitButtonText,
                    distanceUnit === 'mi' && { color: '#000' }
                  ]}>mi</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        );
      case 'Reps':
        return (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Sets & Reps</ThemedText>
            <ThemedView style={styles.timeInputs}>
              <TextInput
                value={sets}
                onChangeText={setSets}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
              <ThemedText style={styles.timeColon}>×</ThemedText>
              <TextInput
                value={reps}
                onChangeText={setReps}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
            </ThemedView>
          </ThemedView>
        );
      case 'Time':
        return (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Duration</ThemedText>
            <ThemedView style={styles.timeInputs}>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
              <ThemedText style={styles.timeColon}>:</ThemedText>
              <TextInput
                value={seconds}
                onChangeText={setSeconds}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
            </ThemedView>
          </ThemedView>
        );
      case 'Rounds':
        return (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Number of Rounds</ThemedText>
            <TextInput
              value={rounds}
              onChangeText={setRounds}
              placeholder="00"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={2}
              onSubmitEditing={dismissKeyboard}
              style={styles.timeInput}
            />
            <ThemedText style={[styles.inputLabel, { marginTop: 16 }]}>Round Duration</ThemedText>
            <ThemedView style={styles.timeInputs}>
              <TextInput
                value={roundMinutes}
                onChangeText={setRoundMinutes}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
              <ThemedText style={styles.timeColon}>:</ThemedText>
              <TextInput
                value={roundSeconds}
                onChangeText={setRoundSeconds}
                placeholder="00"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                onSubmitEditing={dismissKeyboard}
                style={styles.timeInput}
              />
            </ThemedView>
          </ThemedView>
        );
      default:
        return null;
    }
  };

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded ? '90deg' : '0deg', {
            duration: 200,
          }),
        },
      ],
    };
  });

  const plusCircleStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isExpanded ? colors.text : 'transparent', {
        duration: 200,
      }),
      borderColor: colors.text,
      borderWidth: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    };
  });

  const expandedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded ? 1 : 0, {
        duration: 200,
      }),
      transform: [
        {
          translateY: withTiming(isExpanded ? 0 : 10, {
            duration: 200,
          }),
        },
      ],
      height: withTiming(isExpanded ? 'auto' : 0, {
        duration: 200,
      }),
      marginTop: withTiming(isExpanded ? 16 : 0, {
        duration: 200,
      }),
    };
  });

  const rotateAnimation = useSharedValue(0);

  useEffect(() => {
    rotateAnimation.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.linear
      }),
      -1
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${rotateAnimation.value * 360}deg`
    }]
  }));

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>

        <ThemedView style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.finishButton, { 
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: '#FFD700'
            }]}
            onPress={handleFinishWorkout}
            activeOpacity={1}
          >
            <IconSymbol 
              name="flag.checkered" 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardOpen ? 400 : 50 }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ThemedView style={styles.content}>
            <ThemedText type="title" style={[
              styles.title,
              { 
                textDecorationLine: 'line-through', 
                textDecorationColor: '#FFD700',
              }
            ]}>{workoutName}</ThemedText>


            {combos.map((combo, index) => renderCombo(combo, index))}

            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.background }]}
              onPress={handleAddCombo}
              activeOpacity={1}>
              <ThemedView style={styles.addButtonContent}>
                <Animated.View style={plusCircleStyle}>
                  <IconSymbol 
                    name="plus" 
                    size={20} 
                    color={isExpanded ? colors.background : colors.text} 
                  />
                </Animated.View>
                <ThemedText style={styles.addButtonText}>Add Combo</ThemedText>
                <ThemedView style={styles.rightIcons}>
                  <Animated.View style={chevronStyle}>
                    <IconSymbol 
                      name="chevron.right"
                      size={20} 
                      color={colors.text} 
                    />
                  </Animated.View>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>

            <Animated.View style={[styles.expandedContentWrapper, expandedContentStyle]}>
              <ThemedView style={styles.expandedContent}>
                <ThemedView style={styles.optionSection}>
                  <ThemedText style={styles.optionTitle}>Type</ThemedText>
                  <ThemedView style={styles.optionGroups}>
                    <ThemedView style={styles.optionGroup}>
                      <ThemedText style={styles.optionSubtitle}>Warm Ups</ThemedText>
                      <ThemedView style={styles.optionButtonGroup}>
                        {warmupTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.optionButton,
                              selectedWarmup === type && styles.optionButtonSelected,
                              { backgroundColor: selectedWarmup === type ? '#ffffff' : '#2c2c2e' }
                            ]}
                            onPress={() => {
                              const newWarmup = selectedWarmup === type ? null : type;
                              setSelectedWarmup(newWarmup);
                              // Clear training type when selecting warmup
                              if (newWarmup) {
                                setSelectedType(null);
                              }
                            }}
                          >
                            <IconSymbol 
                              name={
                                type === 'Running' ? 'figure.run' :
                                'figure.walk'
                              } 
                              size={14} 
                              color="#FFD700" 
                            />
                            <ThemedText style={[
                              styles.optionButtonText,
                              selectedWarmup === type && { color: '#000000' }
                            ]}>
                              {type}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={styles.optionGroup}>
                      <ThemedText style={styles.optionSubtitle}>Training</ThemedText>
                      <ThemedView style={styles.optionButtonGroup}>
                        {trainingTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.optionButton,
                              selectedType === type && styles.optionButtonSelected,
                              { backgroundColor: selectedType === type ? '#ffffff' : '#2c2c2e' }
                            ]}
                            onPress={() => {
                              const newType = selectedType === type ? null : type;
                              setSelectedType(newType);
                              // Clear warmup type when selecting training type
                              if (newType) {
                                setSelectedWarmup(null);
                              }
                              // Clear distance fields if unselecting Running or selecting non-Running type
                              if (selectedType === 'Running' || (type !== 'Running' && newType === type)) {
                                setSelectedMode(null);
                                setDistance('');
                              }
                            }}
                          >
                            <IconSymbol 
                              name={
                                type === 'Heavy Bag' ? 'figure.boxing' :
                                type === 'Thai Pads' ? 'figure.mixed.cardio' :
                                type === 'Focus Mitts' ? 'figure.core.training' :
                                type === 'Shadow Boxing' ? 'figure.cooldown' :
                                type === 'Partner Drills' ? 'figure.cross.training' :
                                'figure.boxing'
                              } 
                              size={14} 
                              color="#FFD700" 
                            />
                            <ThemedText style={[
                              styles.optionButtonText,
                              selectedType === type && { color: '#000000' }
                            ]}>
                              {type}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={styles.optionGroup}>
                      <ThemedText style={styles.optionSubtitle}>Sparring</ThemedText>
                      <ThemedView style={styles.optionButtonGroup}>
                        {sparringTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.optionButton,
                              selectedType === type && styles.optionButtonSelected,
                              { backgroundColor: selectedType === type ? '#ffffff' : '#2c2c2e' }
                            ]}
                            onPress={() => {
                              const newType = selectedType === type ? null : type;
                              setSelectedType(newType);
                              // Clear warmup type when selecting training type
                              if (newType) {
                                setSelectedWarmup(null);
                              }
                            }}
                          >
                            <IconSymbol 
                              name="figure.kickboxing"
                              size={14} 
                              color="#FFD700" 
                            />
                            <ThemedText style={[
                              styles.optionButtonText,
                              selectedType === type && { color: '#000000' }
                            ]}>
                              {type}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.optionSection}>
                  <ThemedView style={styles.optionTitleRow}>
                    <ThemedText style={styles.optionTitle}>Mode</ThemedText>
                    <ThemedText style={styles.optionalText}>(optional)</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.optionButtons}>
                    {trainingModes.map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.optionButton,
                          selectedMode === mode && styles.optionButtonSelected,
                          { backgroundColor: selectedMode === mode ? '#ffffff' : '#2c2c2e' }
                        ]}
                        onPress={() => setSelectedMode(selectedMode === mode ? null : mode)}
                      >
                        <IconSymbol 
                          name={
                            mode === 'Time' ? 'clock' :
                            mode === 'Distance' ? 'figure.run' :
                            mode === 'Rounds' ? 'timer' :
                            'number'
                          } 
                          size={14} 
                          color="#FFD700" 
                        />
                        <ThemedText style={[
                          styles.optionButtonText,
                          selectedMode === mode && { color: '#000000' }
                        ]}>
                          {mode}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>

                {renderModeInput()}

                {(selectedType || selectedWarmup) && (
                  <TouchableOpacity
                    style={[
                      styles.createButton, 
                      { 
                        backgroundColor: '#2c2c2e', 
                        paddingHorizontal: 10, 
                        paddingVertical: 4, 
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#FFD700'
                      }
                    ]}
                    onPress={handleCreateCombo}>
                    <ThemedText style={{ color: colors.text, fontSize: 14, fontFamily: 'Poppins' }}>
                      {editingComboId 
                        ? 'Save Changes' 
                        : selectedWarmup
                          ? 'Add Warm Up'
                          : isWarmupType(selectedType)
                            ? 'Add Warm Up'
                            : selectedType === 'Running'
                              ? 'Add Running'
                              : isSparringType(selectedType)
                                ? 'Add Sparring'
                                : 'Add Strikes'
                      }
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            </Animated.View>
          </ThemedView>
        </TouchableWithoutFeedback>
      </ScrollView>
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
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  expandedContentWrapper: {
    overflow: 'hidden',
    marginTop: -8,
  },
  expandedContent: {
    gap: 16,
  },
  optionSection: {
    gap: 8,
  },
  optionTitle: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'PoppinsSemiBold',
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  optionButtonSelected: {
    backgroundColor: '#fff',
  },
  optionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'PoppinsSemiBold',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    fontFamily: 'Poppins',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 50,
    textAlign: 'center',
    fontFamily: 'Poppins',
    backgroundColor: '#1c1c1e',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    color: '#ffffff',
  },
  timeColon: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  comboItem: {
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: -16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  comboContent: {
    padding: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
  },
  comboNumber: {
    fontSize: 32,
    color: '#666',
    width: 40,
    textAlign: 'left',
    fontFamily: 'PoppinsSemiBold',
    marginRight: 12,
    lineHeight: 40,
  },
  comboDetails: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -4,
  },
  comboHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comboInfo: {
    gap: 4,
    flex: 1,
    paddingRight: 16,
  },
  comboType: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    flex: 0,
  },
  comboMode: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    marginTop: -2,
  },
  comboTechniques: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Poppins',
    marginTop: 2,
    lineHeight: 20,
  },
  comboActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: 80,
    alignSelf: 'flex-start',
    marginTop: -3,
    marginRight: -10
  },
  comboActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  comboStrikesButton: {
    padding: 8,
    margin: -8,
  },
  menuContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  menuDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionalText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techniquesContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  chainIndicator: {
    alignItems: 'center',
    paddingVertical: 2,
    height: 24,
    justifyContent: 'center',
    width: 160,
  },
  techniqueRow: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 160,
  },
  techniqueInput: {
    width: 160,
    minWidth: 160,
    maxWidth: 160,
    height: 32,
    marginVertical: 2,
    fontSize: 14,
  },
  title: {
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitButtonSelected: {
    backgroundColor: '#fff',
  },
  unitButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  modeIcon: {
    marginTop: -2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 2,
  },
  optionButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionGroups: {
    gap: 16,
  },
  optionGroup: {
    gap: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#2c2c2e',
    marginVertical: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  voiceModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  voiceModalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  voiceTranscriptContainer: {
    flex: 1,
    width: '100%',
    padding: 16,
    marginBottom: 24,
  },
  transcribedText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  micButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    opacity: 0,
  },
  finishButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 