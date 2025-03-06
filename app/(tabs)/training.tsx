import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, ScrollView, Keyboard, FlatList, Animated, Easing, Modal, Platform, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { Tabs } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';

type Note = {
  id: string;
  workout_id: string;
  notes: string;
  strikes_mentioned: string[];
  created_at: string;
  workout_name: string;
};

type WorkoutCombo = {
  id: string;
  sequence_number: number;
  training_type: string;
  training_mode: string;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  rounds: number | null;
  round_minutes: number | null;
  round_seconds: number | null;
  techniques: string[] | null;
  xp: number;
  completed: boolean;
  distance?: number;
  distanceUnit?: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  created_at: string;
  notes?: {
    id: string;
    notes: string;
    strikes_mentioned: string[];
  } | null;
  training_types: string[];
  combos?: WorkoutCombo[];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const renderComboDetails = (combo: WorkoutCombo) => {
  if (!combo.training_mode) return '';
  
  switch (combo.training_mode) {
    case 'Reps':
      if (!combo.reps) return '';
      return `${combo.sets || 1} x ${combo.reps} reps`;
    case 'Time':
      if (!combo.duration_minutes && !combo.duration_seconds) return '';
      return `${combo.duration_minutes || 0}:${String(combo.duration_seconds || 0).padStart(2, '0')}`;
    case 'Rounds':
      if (!combo.rounds || (!combo.round_minutes && !combo.round_seconds)) return '';
      return `${combo.rounds} round${combo.rounds > 1 ? 's' : ''} x ${combo.round_minutes || 0}:${String(combo.round_seconds || 0).padStart(2, '0')}`;
    case 'Distance':
      if (!combo.distance || !combo.distanceUnit) return '';
      return `${combo.distance} ${combo.distanceUnit}`;
    default:
      return '';
  }
};

type WorkoutCardProps = {
  item: WorkoutTemplate;
  expandedWorkoutId: string | null;
  onPress: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
};

const deleteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    // Delete workout notes first (due to foreign key constraint)
    const { error: notesError } = await supabase
      .from('workout_notes')
      .delete()
      .eq('workout_id', workoutId);

    if (notesError) {
      console.error('Error deleting workout notes:', notesError);
      return false;
    }

    // Delete workout combos
    const { error: combosError } = await supabase
      .from('workout_combos')
      .delete()
      .eq('workout_id', workoutId);

    if (combosError) {
      console.error('Error deleting workout combos:', combosError);
      return false;
    }

    // Finally delete the workout
    const { error: workoutError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);

    if (workoutError) {
      console.error('Error deleting workout:', workoutError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkout:', error);
    return false;
  }
};

const deleteNote = async (noteId: string) => {
  try {
    const { error } = await supabase
      .from('workout_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};

const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
  const scale = dragX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.deleteAction}>
      <Animated.View style={[styles.deleteIconContainer, { transform: [{ scale }] }]}>
        <IconSymbol name="trash" size={24} color="#fff" />
      </Animated.View>
    </View>
  );
};

const WorkoutCard: React.FC<WorkoutCardProps> = React.memo(({ item, expandedWorkoutId, onPress, onDelete }) => {
  const swipeableRef = useRef<Swipeable>(null);
  const isExpanded = expandedWorkoutId === item.id;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const handleDelete = async () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWorkout(item.id);
            if (success) {
              await onDelete(item.id);
              swipeableRef.current?.close();
            } else {
              Alert.alert('Error', 'Failed to delete workout');
              swipeableRef.current?.close();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const renderCombo = useCallback((combo: WorkoutCombo, index: number) => (
    <ThemedView key={combo.id} style={styles.comboItem}>
      <ThemedView style={styles.comboHeader}>
        <ThemedView style={styles.comboNumberContainer}>
          <ThemedText style={styles.comboNumber}>{index + 1}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.comboInfo}>
          <ThemedText style={styles.comboType}>{combo.training_type}</ThemedText>
          {renderComboDetails(combo) && (
            <ThemedText style={styles.comboMode}>
              {combo.training_mode} • {renderComboDetails(combo)}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      {combo.techniques && combo.techniques.length > 0 && (
        <ThemedView style={styles.techniquesContainer}>
          {combo.techniques.map((technique: string, techniqueIndex: number) => (
            <ThemedView key={techniqueIndex} style={styles.techniqueRow}>
              <ThemedView style={[styles.fakeInput, styles.techniqueInput]}>
                <ThemedText style={styles.techniqueText}>{technique}</ThemedText>
              </ThemedView>
              {techniqueIndex < combo.techniques!.length - 1 && (
                <ThemedView style={styles.chainIndicator}>
                  <IconSymbol name="arrow.down" size={12} color="#FFD700" />
                </ThemedView>
              )}
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  ), []);

  const expandedContent = useMemo(() => (
    <Animated.View style={[
      styles.expandedContent,
      {
        opacity: expandAnim,
        transform: [{
          translateY: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 4]
          })
        }]
      }
    ]}>
      {item.combos && item.combos.length > 0 && (
        <ThemedView style={styles.combosContainer}>
          {item.combos.map((combo, index) => renderCombo(combo, index))}
        </ThemedView>
      )}

      {item.notes && (
        <ThemedView style={styles.workoutNotesContainer}>
          <ThemedView style={styles.workoutNotesHeader}>
            <IconSymbol name="text.alignleft" size={16} color="#666" />
            <ThemedText style={styles.workoutNotesTitle}>Notes</ThemedText>
          </ThemedView>
          <View style={styles.noteTextContainer}>
            {item.notes.notes.split(/\s+/).map((word, index, array) => {
              const match = word.match(/^(@[\w-]+)([^\w-]*)$/);
              if (match && match[1]) {
                return (
                  <React.Fragment key={index}>
                    <ThemedText style={[styles.noteText, styles.mentionText]}>{match[1]}</ThemedText>
                    {match[2] && <ThemedText style={styles.noteText}>{match[2]}</ThemedText>}
                    {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={index}>
                  <ThemedText style={styles.noteText}>{word}</ThemedText>
                  {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
                </React.Fragment>
              );
            })}
          </View>
        </ThemedView>
      )}
    </Animated.View>
  ), [item.combos, item.notes, expandAnim, renderCombo]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleDelete}
      overshootRight={false}
    >
      <ThemedView style={styles.workoutCard}>
        <TouchableOpacity 
          onPress={() => onPress(item.id)}
          style={styles.workoutCardContent}
          activeOpacity={1}
        >
          <ThemedView style={styles.workoutHeader}>
            <ThemedView style={styles.workoutInfo}>
              <ThemedText style={styles.workoutName}>{item.name}</ThemedText>
              <ThemedText style={styles.workoutDate}>
                {formatDate(item.created_at)}
              </ThemedText>
            </ThemedView>
            <Animated.View style={{
              transform: [{
                rotate: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg']
                })
              }]
            }}>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </Animated.View>
          </ThemedView>

          {!isExpanded && item.training_types.length > 0 && (
            <ThemedView style={styles.trainingTypesList}>
              {item.training_types.map((type, index) => (
                <ThemedView key={index} style={styles.trainingTypeChip}>
                  <IconSymbol 
                    name={
                      type === 'Heavy Bag' ? 'figure.boxing' :
                      type === 'Thai Pads' ? 'figure.mixed.cardio' :
                      type === 'Focus Mitts' ? 'figure.core.training' :
                      type === 'Shadow Boxing' ? 'figure.cooldown' :
                      type === 'Partner Drills' ? 'figure.cross.training' :
                      'figure.boxing'
                    } 
                    size={12} 
                    color="#FFD700" 
                  />
                  <ThemedText style={styles.trainingTypeText}>{type}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          )}

          {isExpanded && expandedContent}
        </TouchableOpacity>
      </ThemedView>
    </Swipeable>
  );
});

type NoteCardProps = {
  item: Note;
  onDelete: (id: string) => Promise<void>;
};

const NoteCard: React.FC<NoteCardProps> = ({ item, onDelete }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNote(item.id);
            if (success) {
              await onDelete(item.id);
            } else {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleDelete}
      overshootRight={false}
    >
      <ThemedView key={item.id} style={styles.noteCard}>
        <ThemedView style={styles.noteHeader}>
          <ThemedText style={styles.workoutName}>{item.workout_name}</ThemedText>
          <ThemedText style={styles.workoutDate}>{formatDate(item.created_at)}</ThemedText>
        </ThemedView>
        {item.strikes_mentioned && item.strikes_mentioned.length > 0 && (
          <ThemedView style={styles.strikesList}>
            {item.strikes_mentioned.map((strike, index) => (
              <ThemedView key={index} style={styles.strikeChip}>
                <IconSymbol 
                  name={
                    strike.includes('punch') ? 'figure.boxing' :
                    strike.includes('kick') ? 'figure.kickboxing' :
                    strike.includes('knee') ? 'figure.core.training' :
                    strike.includes('elbow') ? 'figure.cross.training' :
                    'figure.boxing'
                  } 
                  size={12} 
                  color="#FFD700" 
                />
                <ThemedText style={styles.strikeChipText}>{strike}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
        <View style={styles.noteTextContainer}>
          {item.notes.split(/\s+/).map((word, index, array) => {
            const match = word.match(/^(@[\w-]+)([^\w-]*)$/);
            if (match && match[1]) {
              return (
                <React.Fragment key={index}>
                  <ThemedText style={[styles.noteText, styles.mentionText]}>{match[1]}</ThemedText>
                  {match[2] && <ThemedText style={styles.noteText}>{match[2]}</ThemedText>}
                  {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={index}>
                <ThemedText style={styles.noteText}>{word}</ThemedText>
                {index < array.length - 1 && <ThemedText style={styles.noteText}>{' '}</ThemedText>}
              </React.Fragment>
            );
          })}
        </View>
      </ThemedView>
    </Swipeable>
  );
};

export default function TrainingScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { session } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrike, setSelectedStrike] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingNotes, setShowingNotes] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const strikethroughAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNotes();
      fetchWorkouts();
    }
  }, [session?.user]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedStrike, selectedType, notes, workouts, showingNotes, selectedDateRange]);

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    };

    animate();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: notesError } = await supabase
        .from('workout_notes')
        .select(`
          *,
          workouts!inner (
            name,
            user_id
          )
        `)
        .eq('workouts.user_id', session!.user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      const formattedNotes = data.map(note => ({
        id: note.id,
        workout_id: note.workout_id,
        notes: note.notes,
        strikes_mentioned: note.strikes_mentioned || [],
        created_at: note.created_at,
        workout_name: note.workouts?.name || 'Unnamed Workout'
      }));

      setNotes(formattedNotes);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          created_at,
          workout_notes (
            id,
            notes,
            strikes_mentioned
          ),
          workout_combos (
            id,
            sequence_number,
            training_type,
            training_mode,
            sets,
            reps,
            duration_minutes,
            duration_seconds,
            rounds,
            round_minutes,
            round_seconds,
            techniques,
            xp,
            completed,
            distance,
            distance_unit
          )
        `)
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });

      if (workoutsError) throw workoutsError;

      // Format the data
      const formattedWorkouts = workoutsData.map(workout => ({
        id: workout.id,
        name: workout.name,
        created_at: workout.created_at,
        notes: workout.workout_notes?.[0] || null,
        training_types: Array.from(new Set(workout.workout_combos?.map(combo => combo.training_type) || [])),
        combos: workout.workout_combos?.sort((a, b) => a.sequence_number - b.sequence_number) || []
      }));
      
      setWorkouts(formattedWorkouts);
      setFilteredWorkouts(formattedWorkouts);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutPress = (workoutId: string) => {
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  const isDateInRange = (date: string, range: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        return checkDate.getTime() === today.getTime();
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return checkDate.getTime() === yesterday.getTime();
      }
      case 'thisWeek': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return checkDate >= weekStart && checkDate <= today;
      }
      case 'thisMonth': {
        return checkDate.getMonth() === today.getMonth() && 
               checkDate.getFullYear() === today.getFullYear();
      }
      default:
        return true;
    }
  };

  const filterItems = () => {
    if (showingNotes) {
      let filtered = [...notes];

      if (searchQuery) {
        filtered = filtered.filter(note => 
          note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.workout_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedStrike) {
        filtered = filtered.filter(note => 
          note.strikes_mentioned.includes(selectedStrike)
        );
      }

      // Apply date range filter
      if (selectedDateRange) {
        filtered = filtered.filter(note => 
          isDateInRange(note.created_at, selectedDateRange)
        );
      }

      setFilteredNotes(filtered);
    } else {
      let filtered = [...workouts];
      
      if (searchQuery.trim()) {
        filtered = filtered.filter(workout => 
          workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workout.training_types.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (selectedType) {
        filtered = filtered.filter(workout => 
          workout.training_types.includes(selectedType)
        );
      }

      // Apply date range filter
      if (selectedDateRange) {
        filtered = filtered.filter(workout => 
          isDateInRange(workout.created_at, selectedDateRange)
        );
      }

      setFilteredWorkouts(filtered);
    }
  };

  const clearFilters = () => {
    setSelectedDateRange(null);
    setSelectedStrike(null);
    setSelectedType(null);
  };

  const getUniqueStrikes = () => {
    const strikes = new Set<string>();
    notes.forEach(note => {
      note.strikes_mentioned.forEach(strike => strikes.add(strike));
    });
    return Array.from(strikes).sort();
  };

  const getUniqueTypes = () => {
    const types = new Set<string>();
    workouts.forEach(workout => {
      workout.training_types.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  };

  const handleWorkoutDelete = async (workoutId: string) => {
    setWorkouts(prevWorkouts => prevWorkouts.filter(workout => workout.id !== workoutId));
    setFilteredWorkouts(prevWorkouts => prevWorkouts.filter(workout => workout.id !== workoutId));
  };

  const handleNoteDelete = async (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    setFilteredNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };

  const toggleView = (showNotes: boolean) => {
    setShowingNotes(showNotes);
    Animated.spring(strikethroughAnim, {
      toValue: showNotes ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTitles}>
          <TouchableOpacity 
            onPress={() => toggleView(false)}
            style={styles.headerButton}
          >
            <ThemedText 
              style={[
                styles.title, 
                { 
                  color: '#fff',
                  opacity: showingNotes ? 0.7 : 1 
                }
              ]}
            >
              workouts
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: '#FFD700', marginHorizontal: 12, fontWeight: '200' }]}>/</ThemedText>
          <TouchableOpacity 
            onPress={() => toggleView(true)}
            style={styles.headerButton}
          >
            <ThemedText 
              style={[
                styles.title, 
                { 
                  color: '#fff',
                  opacity: showingNotes ? 1 : 0.7 
                }
              ]}
            >
              notes
            </ThemedText>
          </TouchableOpacity>
          <Animated.View style={[
            styles.strikethrough,
            {
              width: 152,
              transform: [
                {
                  translateX: strikethroughAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 168]
                  })
                },
                { translateY: -1 },
                {
                  scaleX: strikethroughAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 90/140]
                  })
                }
              ]
            }
          ]} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <ThemedView style={styles.searchRow}>
          <ThemedView style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#666" />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={showingNotes ? "Search notes..." : "Search workouts..."}
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onBlur={Keyboard.dismiss}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </ThemedView>

          <TouchableOpacity 
            style={[
              styles.filterButton,
              (selectedDateRange || selectedStrike || selectedType) && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconSymbol 
              name="line.3.horizontal.decrease" 
              size={20} 
              color={(selectedDateRange || selectedStrike || selectedType) ? '#FFD700' : colors.text} 
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedView style={styles.filterModal}>
              <ThemedView style={[styles.filterHeader, { backgroundColor: '#1c1c1e' }]}>
                <ThemedText style={[styles.filterTitle, { backgroundColor: '#1c1c1e' }]}>Filters</ThemedText>
                <TouchableOpacity onPress={clearFilters}>
                  <ThemedText style={[styles.clearText, { backgroundColor: '#1c1c1e' }]}>Clear all</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>Date Range</ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateRangeList}
                  contentContainerStyle={styles.dateRangeListContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.dateRangeChip,
                      !selectedDateRange && { backgroundColor: colors.text }
                    ]}
                    onPress={() => setSelectedDateRange(null)}
                  >
                    <ThemedText style={[
                      styles.dateRangeChipText,
                      !selectedDateRange && { color: '#000' }
                    ]}>
                      All Time
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateRangeChip,
                      selectedDateRange === 'today' && { backgroundColor: colors.text }
                    ]}
                    onPress={() => setSelectedDateRange(selectedDateRange === 'today' ? null : 'today')}
                  >
                    <ThemedText style={[
                      styles.dateRangeChipText,
                      selectedDateRange === 'today' && { color: '#000' }
                    ]}>
                      Today
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateRangeChip,
                      selectedDateRange === 'yesterday' && { backgroundColor: colors.text }
                    ]}
                    onPress={() => setSelectedDateRange(selectedDateRange === 'yesterday' ? null : 'yesterday')}
                  >
                    <ThemedText style={[
                      styles.dateRangeChipText,
                      selectedDateRange === 'yesterday' && { color: '#000' }
                    ]}>
                      Yesterday
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateRangeChip,
                      selectedDateRange === 'thisWeek' && { backgroundColor: colors.text }
                    ]}
                    onPress={() => setSelectedDateRange(selectedDateRange === 'thisWeek' ? null : 'thisWeek')}
                  >
                    <ThemedText style={[
                      styles.dateRangeChipText,
                      selectedDateRange === 'thisWeek' && { color: '#000' }
                    ]}>
                      This Week
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateRangeChip,
                      selectedDateRange === 'thisMonth' && { backgroundColor: colors.text }
                    ]}
                    onPress={() => setSelectedDateRange(selectedDateRange === 'thisMonth' ? null : 'thisMonth')}
                  >
                    <ThemedText style={[
                      styles.dateRangeChipText,
                      selectedDateRange === 'thisMonth' && { color: '#000' }
                    ]}>
                      This Month
                    </ThemedText>
                  </TouchableOpacity>
                </ScrollView>
              </ThemedView>

              <ThemedView style={styles.filterSection}>
                <ThemedText style={styles.filterSectionTitle}>
                  {showingNotes ? 'Strikes' : 'Training Types'}
                </ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryList}
                  contentContainerStyle={styles.categoryListContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !selectedStrike && !selectedType && { backgroundColor: colors.text }
                    ]}
                    onPress={() => showingNotes ? setSelectedStrike(null) : setSelectedType(null)}
                  >
                    <ThemedText style={[
                      styles.categoryChipText,
                      !selectedStrike && !selectedType && { color: '#000' }
                    ]}>
                      All
                    </ThemedText>
                  </TouchableOpacity>
                  {showingNotes ? 
                    getUniqueStrikes().map(strike => (
                      <TouchableOpacity
                        key={strike}
                        style={[
                          styles.categoryChip,
                          selectedStrike === strike && { backgroundColor: colors.text }
                        ]}
                        onPress={() => setSelectedStrike(strike === selectedStrike ? null : strike)}
                      >
                        <ThemedText style={[
                          styles.categoryChipText,
                          selectedStrike === strike && { color: '#000' }
                        ]}>
                          {strike.charAt(0).toUpperCase() + strike.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    )) :
                    getUniqueTypes().map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.categoryChip,
                          selectedType === type && { backgroundColor: colors.text }
                        ]}
                        onPress={() => setSelectedType(type === selectedType ? null : type)}
                      >
                        <ThemedText style={[
                          styles.categoryChipText,
                          selectedType === type && { color: '#000' }
                        ]}>
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>
              </ThemedView>

              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Animated.View style={[
            styles.loadingCircle,
            {
              transform: [{
                rotate: rotateAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }
          ]} />
        </View>
      ) : showingNotes ? (
        <FlatList
          data={filteredNotes}
          renderItem={({ item }) => (
            <NoteCard 
              item={item}
              onDelete={handleNoteDelete}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesListContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListEmptyComponent={
            !loading && (
              <ThemedText style={styles.emptyText}>No notes found</ThemedText>
            )
          }
        />
      ) : (
        <FlatList
          data={filteredWorkouts}
          renderItem={({ item }) => (
            <WorkoutCard 
              item={item} 
              expandedWorkoutId={expandedWorkoutId}
              onPress={handleWorkoutPress}
              onDelete={handleWorkoutDelete}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListEmptyComponent={
            !loading && (
              <ThemedText style={styles.emptyText}>No workouts found</ThemedText>
            )
          }
        />
      )}
    </ThemedView>
  );
}

TrainingScreen.displayName = 'TrainingScreen';

// Add tab screen options
TrainingScreen.options = {
  tabBarIcon: ({ color }: { color: string }) => <IconSymbol name="pencil" size={28} color={color} />,
  title: 'Training'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerButton: {
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  categoryList: {
    maxHeight: 36,
    marginTop: 0,
    backgroundColor: '#1c1c1e',
  },
  categoryListContent: {
    paddingRight: 12,
    gap: 8,
    backgroundColor: '#1c1c1e',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#2c2c2e',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  notesList: {
    flex: 1,
  },
  notesListContent: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  noteCard: {
    padding: 12,
    paddingTop: 6,
  },
  workoutCard: {
    padding: 12,
    paddingTop: 6,
  },
  workoutCardContent: {
    gap: 12,
    paddingBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  workoutName: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
  workoutDate: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
  },
  trainingTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trainingTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trainingTypeText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#fff',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  mentionText: {
    color: '#FFD700',
  },
  workoutNotes: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 4,
    height: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    transform: [{ translateY: -1 }],
  },
  loadingCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  separator: {
    height: 1,
    backgroundColor: '#2c2c2e',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3c3c3e',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFD700',
    borderStyle: 'solid',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
  },
  clearText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#FFD700',
  },
  filterSection: {
    gap: 12,
    backgroundColor: '#1c1c1e',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#999',
    backgroundColor: '#1c1c1e',
  },
  applyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  dateRangeList: {
    maxHeight: 36,
    marginTop: 0,
    backgroundColor: '#1c1c1e',
  },
  dateRangeListContent: {
    paddingRight: 12,
    gap: 8,
    backgroundColor: '#1c1c1e',
  },
  dateRangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#2c2c2e',
  },
  dateRangeChipText: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  combosContainer: {
    gap: 16,
  },
  comboItem: {
    gap: 12,
  },
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  comboNumberContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboNumber: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
    textAlign: 'center',
  },
  comboInfo: {
    flex: 1,
    gap: 4,
  },
  comboType: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  comboMode: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
  },
  techniquesContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
    width: '100%',
    paddingLeft: 44,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIndicator: {
    alignItems: 'center',
    paddingVertical: 2,
    height: 24,
    justifyContent: 'center',
    width: 160,
  },
  techniqueText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#ffffff',
    textAlign: 'center',
  },
  expandedContent: {
    gap: 24,
  },
  workoutNotesContainer: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 16,
    marginLeft: 0,
  },
  workoutNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutNotesTitle: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#666',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
  },
  deleteIconContainer: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fakeInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  strikesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  strikeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  strikeChipText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#fff',
  },
}); 