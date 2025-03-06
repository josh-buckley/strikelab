import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, Animated, ScrollView, Image, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ROUTES } from '@/lib/routes';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAuth } from '@/lib/AuthProvider';

type Answer = {
  text: string;
  selected?: boolean;
  isOther?: boolean;
};

type TypewriterScreen = {
  id: string;
  lines: {
    text: string;
    delay?: number;
    isInput?: boolean;
    inputPlaceholder?: string;
    options?: string[];
    isSequential?: boolean;
  }[];
};

type OnboardingScreen = {
  id: string;
  title?: string;
  subtitle?: string;
  question?: string;
  answers?: Answer[];
  illustration?: string;
  isTypewriter?: boolean;
  typewriterData?: TypewriterScreen;
  isInput?: boolean;
  inputPlaceholder?: string;
  headerText?: string;
  example?: {
    type: string;
    mode: string;
    techniques: string[];
  };
  builder?: {
    categories: string[];
    selectedTechniques: string[];
    mode: string;
    rounds: string;
    duration: string;
  };
  categories?: { name: string; level: number }[];
  features?: {
    title: string;
    description: string;
  }[];
  caption?: string;
};

const SCREENS: OnboardingScreen[] = [
  {
    id: 'intro',
    isTypewriter: true,
    typewriterData: {
      id: 'name',
      lines: [
        { text: 'Hello there.', delay: 1000 },
        { text: 'What\'s your name?', delay: 1000 },
        { text: '', isInput: true, inputPlaceholder: '' }
      ]
    }
  },
  {
    id: 'experience-check',
    isTypewriter: true,
    typewriterData: {
      id: 'exp-check',
      lines: [
        { text: '{name}...', delay: 1000 },
        { text: 'How long have you been training {name}?', delay: 1000 },
        { 
          text: '', 
          options: [
            'I\'ve never trained before',
            'A few months',
            'About a year',
            'Several years',
            '5+ years'
          ]
        }
      ]
    }
  },
  {
    id: 'enjoyment',
    isTypewriter: true,
    typewriterData: {
      id: 'enjoyment',
      lines: [
        { text: 'What is your favorite part of training?', delay: 1000 },
        { 
          text: '', 
          options: [
            'Learning new techniques',
            'Getting better at sparring',
            'Improving my fitness',
            'Improving my mental health',
            'Making new friends'
          ]
        }
      ]
    }
  },
  {
    id: 'fighter-type',
    isTypewriter: true,
    typewriterData: {
      id: 'fighter-type',
      lines: [
        { text: 'What type of fighter are you?', delay: 1000 },
        { 
          text: '', 
          options: [
            'I\'m a muay thai fighter',
            'I\'m a kickboxer',
            'I\'m a boxer',
            'I\'m a mixed martial artist'
          ]
        }
      ]
    }
  },
  {
    id: 'challenge',
    isTypewriter: true,
    typewriterData: {
      id: 'challenge',
      lines: [
        { text: 'Interesting...', delay: 1000 },
        { text: 'When training, have you ever had any of these thoughts?', delay: 1000 },
        { 
          text: '', 
          options: [
            '"I\'m not improving like I used to"',
            '"My skills aren\'t developing as fast as others"',
            '"I\'m training hard but improving slow"',
            '"I\'m not reaching my potential"'
          ]
        }
      ]
    }
  },
  {
    id: 'solution',
    isTypewriter: true,
    typewriterData: {
      id: 'solution',
      lines: [
        { text: 'The good news is, we have the solution.'},
        { text: '\n\nWelcome to the strikelab.',},
      ]
    }
  },
  {
    id: 'stats',
    isTypewriter: true,
    typewriterData: {
      id: 'stats',
      lines: [
        { text: 'Research has shown that logging and reviewing training can increase the speed of a fighter\'s improvement by up to 76%.'}
      ]
    }
  },
  {
    id: 'us',
    isTypewriter: true,
    typewriterData: {
      id: 'us',
      lines: [
        { text: 'So, we have built the only tailor-made app for fighters to log their workouts and learn from their training.'},
        { text: '\n\nTrain. \nTrack. \nTransform.'}
      ]
    }
  },
  {
    id: 'strikes',
    title: 'Create new combos',
    illustration: 'PLACEHOLDER_STRIKES',
  },
  {
    id: 'voice',
    title: 'Use your voice',
    illustration: 'PLACEHOLDER_VOICE',
  },
  {
    id: 'workouts',
    title: 'Easily log workouts',
    illustration: 'PLACEHOLDER_WORKOUTS',
  },
  {
    id: 'notes',
    title: 'Write your notes',
    illustration: 'PLACEHOLDER_NOTES',
  },
  {
    id: 'history',
    title: 'Review your history',
    illustration: 'PLACEHOLDER_HISTORY',
  },
  {
    id: 'xp',
    title: 'Gain xp and levels',
    illustration: 'PLACEHOLDER_XP',
  },
  {
    id: 'chat',
    title: 'Chat with a coach',
    illustration: 'PLACEHOLDER_CHAT',
  }
];

const useStyles = () => {
  const { height } = useWindowDimensions();
  
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    contentContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    progressContainer: {
      paddingHorizontal: 24,
      marginBottom: 40,
      alignItems: 'center',
    },
    progressBarBackground: {
      width: '60%',
      height: 6,
      backgroundColor: '#2c2c2e',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: 0,
    },
    textContainer: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 0,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 40,
      fontFamily: 'PoppinsSemiBold',
      marginBottom: 4,
    },

    pointsContainer: {
      width: '100%',
      gap: 20,
      paddingHorizontal: 20,
    },
    point: {
      fontSize: 18,
      color: '#999',
      textAlign: 'left',
      lineHeight: 24,
    },
    nextButton: {
      position: 'absolute',
      bottom: 40,
      right: 24,
      minWidth: 56,
      height: 56,
      paddingHorizontal: 24,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    buttonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: '600',
    },
    exampleContainer: {
      width: '100%',
      backgroundColor: '#1c1c1e',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    exampleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    exampleType: {
      fontSize: 16,
      fontFamily: 'PoppinsSemiBold',
    },
    exampleMode: {
      fontSize: 14,
      color: '#999',
      fontFamily: 'Poppins',
    },
    techniquesContainer: {
      gap: 8,
    },
    techniqueRow: {
      alignItems: 'flex-start',
    },
    techniqueText: {
      fontSize: 14,
      color: '#999',
      fontFamily: 'Poppins',
      lineHeight: 20,
    },
    chainIndicator: {
      alignItems: 'flex-start',
      paddingVertical: 4,
      paddingLeft: 4,
    },
    builderContainer: {
      width: '100%',
      backgroundColor: '#1c1c1e',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    categoryList: {
      maxHeight: 36,
      marginBottom: 16,
    },
    categoryListContent: {
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 5,
      borderRadius: 12,
    },
    categoryChipText: {
      fontSize: 14,
      fontFamily: 'Poppins',
    },
    selectedTechniquesContainer: {
      backgroundColor: '#2c2c2e',
      borderRadius: 12,
      padding: 16,
    },
    selectedTechniquesText: {
      fontSize: 16,
      fontFamily: 'PoppinsSemiBold',
      textAlign: 'center',
      marginBottom: 8,
    },
    builderDetails: {
      alignItems: 'center',
    },
    builderMode: {
      fontSize: 14,
      color: '#999',
      fontFamily: 'Poppins',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 24,
    },
    tile: {
      width: '48%',
      borderRadius: 8,
      marginBottom: 6,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    tileContent: {
      padding: 6,
    },
    tileBackground: {
      padding: 10,
      borderRadius: 6,
    },
    tileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    tileName: {
      fontSize: 15,
      fontFamily: 'PoppinsSemiBold',
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    tileLevel: {
      fontSize: 13,
      color: '#999',
      fontFamily: 'Poppins',
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    progressBar: {
      height: 4,
      backgroundColor: '#2c2c2e',
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    solutionContainer: {
      width: '100%',
      overflow: 'hidden',
      marginTop: 0,
      marginBottom: 0,
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: height * 0.85,
      position: 'relative',
      alignItems: 'center',
      marginTop: 0,
    },
    solutionImage: {
      width: '100%',
      height: '100%',
      alignSelf: 'center',
    },
    fadeGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '40%',
    },
    solutionTitle: {
      marginBottom: 8,
    },
    solutionSubtitle: {
      marginBottom: 8,
    },
    thoughtsContainer: {
      width: '100%',
      gap: 16,
      paddingHorizontal: 24,
      marginTop: 0,
      marginBottom: 32,
    },
    thoughtBubble: {
      backgroundColor: '#1c1c1e',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: '#2c2c2e',
    },
    thoughtText: {
      fontSize: 16,
      color: '#fff',
      textAlign: 'left',
      fontFamily: 'Poppins',
      lineHeight: 24,
    },
    featureBubble: {
      backgroundColor: '#1c1c1e',
      borderRadius: 16,
      padding: 16,
    },
    featureTitle: {
      fontSize: 18,
      color: '#fff',
      fontFamily: 'PoppinsSemiBold',
      marginBottom: 8,
    },
    featureDescription: {
      fontSize: 16,
      color: '#999',
      fontFamily: 'Poppins',
      lineHeight: 22,
    },
    caption: {
      fontSize: 16,
      color: '#999',
      textAlign: 'center',
      fontFamily: 'Poppins',
      lineHeight: 22,
      marginTop: 16,
    },
    answersContainer: {
      width: '100%',
      gap: 16,
      paddingHorizontal: 24,
      marginTop: 8,
      marginBottom: 32,
    },
    answerBubble: {
      backgroundColor: '#1c1c1e',
      borderRadius: 8,
      padding: 16,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: '#2c2c2e',
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedAnswerBubble: {
      backgroundColor: '#1c1c1e',
      borderColor: '#FFD700',
      borderWidth: 1,
    },
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#2c2c2e',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedCheckCircle: {
      borderColor: '#FFD700',
      backgroundColor: '#1c1c1e',
    },
    answerText: {
      fontSize: 16,
      color: '#fff',
      textAlign: 'left',
      fontFamily: 'Poppins',
      lineHeight: 24,
      flex: 1,
    },
    selectedAnswerText: {
      color: '#FFD700',
    },
    question: {
      fontSize: 18,
      color: '#666',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 26,
      paddingHorizontal: 24,
      fontFamily: 'PoppinsSemiBold',
    },
    disabledNextButton: {
      opacity: 0.5,
    },
    answerContent: {
      flex: 1,
    },
    otherInput: {
      marginTop: 8,
      fontSize: 16,
      color: '#FFD700',
      fontFamily: 'Poppins',
      padding: 8,
      borderRadius: 4,
      backgroundColor: '#2c2c2e',
    },
    titleContainer: {
      marginTop: 0,
      width: '100%',
      paddingHorizontal: 24,
    },
    headerText: {
      fontSize: 42,
      lineHeight: 52,
      textAlign: 'left',
    },
    headerInput: {
      fontSize: 36,
      lineHeight: 44,
      fontFamily: 'Poppins',
      fontWeight: '700',
      padding: 0,
      paddingTop: 4,
      color: '#fff',
      textAlignVertical: 'center',
      textAlign: 'left',
      textDecorationLine: 'line-through',
      textDecorationColor: '#FFD700',
    },
    placeholder: {
      opacity: 0.3,
    },
    typewriterContainer: {
      width: '100%',
      paddingHorizontal: 24,
      gap: 8,
    },
    typewriterLine: {
      marginBottom: 4,
    },
    typewriterText: {
      fontSize: 36,
      lineHeight: 44,
      fontFamily: 'PoppinsSemiBold',
      color: '#fff',
    },
    optionsContainer: {
      marginTop: 16,
      gap: 8,
      width: '100%',
    },
    optionButton: {
      backgroundColor: '#1c1c1e',
      borderRadius: 8,
      padding: 20,
      borderWidth: 1,
      borderColor: '#2c2c2e',
    },
    selectedOption: {
      borderColor: '#FFD700',
    },
    optionText: {
      fontSize: 18,
      color: '#fff',
      fontFamily: 'Poppins',
    },
    selectedOptionText: {
      color: '#FFD700',
    },
    imageHeaderContainer: {
      width: '100%',
      marginBottom: 24,
    },
    headerTextContainer: {
      paddingHorizontal: 24,
      marginBottom: 0,
    },
    subtitle: {
      fontSize: 20,
      color: '#666',
      textAlign: 'center',
      lineHeight: 28,
      fontFamily: 'PoppinsSemiBold',
      marginBottom: 8,
    },
  });
};

export default function Onboarding() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [otherAnswers, setOtherAnswers] = useState<{[key: string]: string}>({});
  const [inputAnswer, setInputAnswer] = useState('');
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { presentPaywall, isSubscribed } = usePaywall();
  const { width } = useWindowDimensions();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useStyles();
  const { markOnboardingCompleted } = useAuth();
  
  // Add new state
  const [typewriterState, setTypewriterState] = useState<{
    currentLine: number;
    isTyping: boolean;
    completedLines: string[];
    selectedOption: string | null;
    name: string;
    optionsShown: number;
  }>({
    currentLine: 0,
    isTyping: false,
    completedLines: [],
    selectedOption: null,
    name: '',
    optionsShown: 0
  });
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const pointsAnimRef = useRef<Animated.Value[]>([]);
  
  // Add option animations at the top level
  const optionAnimations = useRef<Animated.Value[]>([]);
  
  // Initialize option animations
  useEffect(() => {
    // Initialize animation values if needed
    while (optionAnimations.current.length < 10) { // Support up to 10 options
      optionAnimations.current.push(new Animated.Value(0));
    }
  }, []);
  
  // Handle option animations
  useEffect(() => {
    // Reset animations when options shown changes
    const numShown = typewriterState.optionsShown;
    optionAnimations.current.forEach((anim, index) => {
      if (index < numShown) {
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          mass: 1,
          stiffness: 100,
        }).start();
      } else {
        anim.setValue(0);
      }
    });
  }, [typewriterState.optionsShown]);

  // Animate progress when screen changes
  useEffect(() => {
    const progress = currentScreen / (SCREENS.length - 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      damping: 20,
      mass: 1,
      stiffness: 100,
    }).start();
  }, [currentScreen]);

  // Reset and initialize point animations when screen changes
  useEffect(() => {
    const screen = SCREENS[currentScreen];
    const numItems = screen.answers?.length || screen.features?.length || 0;
    pointsAnimRef.current = Array(numItems).fill(null).map(() => new Animated.Value(0));
  }, [currentScreen]);

  // Animate content when screen changes
  useEffect(() => {
    // Reset position and animations
    slideAnim.setValue(width);
    fadeAnim.setValue(0);
    subtitleAnim.setValue(0);
    pointsAnimRef.current.forEach(anim => anim?.setValue(0));
    
    // Reset options shown count
    setTypewriterState(prev => ({
      ...prev,
      optionsShown: 0
    }));
    
    // Reset option animations
    optionAnimations.current.forEach(anim => {
      anim.setValue(0);
    });
    
    // Animate everything in parallel for smoother transition
    Animated.parallel([
      // Slide in from right
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 1,
        stiffness: 100,
      }),
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Animate subtitle/question immediately
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    // Animate answers or features if they exist
    const screen = SCREENS[currentScreen];
    const items = screen.answers || screen.features;
    if (items) {
      items.forEach((_, index) => {
        if (pointsAnimRef.current[index]) {
          Animated.timing(pointsAnimRef.current[index], {
            toValue: 1,
            duration: 400,
            delay: 200 + (index * 200), // Reduced delay between items
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [currentScreen, width]);

  // Add new effect for input focus
  useEffect(() => {
    if (SCREENS[currentScreen].isInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (SCREENS[currentScreen].isTypewriter) {
      const screen = SCREENS[currentScreen].typewriterData!;
      startTypewriterAnimation(screen);
    }
  }, [currentScreen]);

  const startTypewriterAnimation = (screen: TypewriterScreen) => {
    setTypewriterState(prev => ({
      ...prev,
      currentLine: 0,
      isTyping: true,
      completedLines: [],
      selectedOption: null,
      optionsShown: 0  // Reset options shown count
    }));

    // Start the animation sequence
    animateNextLine(screen, 0);
  };

  const animateNextLine = async (screen: TypewriterScreen, lineIndex: number) => {
    if (lineIndex >= screen.lines.length) return;

    const line = screen.lines[lineIndex];
    const text = line.text.replace('{name}', typewriterState.name);

    if (line.isInput) {
      // For input fields, show immediately after previous animation
      setTypewriterState(prev => ({
        ...prev,
        currentLine: lineIndex,
        completedLines: [...prev.completedLines, text]
      }));
      return;
    }

    if (line.options) {
      // For options, first add the empty container
      setTypewriterState(prev => ({
        ...prev,
        currentLine: lineIndex,
        completedLines: [...prev.completedLines, text]
      }));

      // Then animate each option with a delay
      for (let i = 0; i < line.options.length; i++) {
        await new Promise<void>(resolve => {
          setTimeout(() => {
            setTypewriterState(prev => ({
              ...prev,
              optionsShown: (prev.optionsShown || 0) + 1
            }));
            resolve();
          }, 105); // Reduced from 150ms to 105ms (30% faster)
        });
      }
      return;
    }

    // Create a promise for the typing animation
    await new Promise<void>((resolve) => {
      const typeChar = (index: number) => {
        if (index > text.length) {
          resolve();
          return;
        }

        // Add haptic feedback for each character
        if (index < text.length) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }

        const currentText = text.slice(0, index);
        setTypewriterState(prev => ({
          ...prev,
          currentLine: lineIndex,
          completedLines: [...prev.completedLines.slice(0, -1), currentText]
        }));

        // Schedule next character (reduced from 50ms to 35ms - 30% faster)
        setTimeout(() => typeChar(index + 1), 35);
      };

      // Start typing animation
      setTypewriterState(prev => ({
        ...prev,
        completedLines: [...prev.completedLines, '']
      }));
      typeChar(0);
    });

    // After the line is complete, wait for the specified delay (30% faster)
    await new Promise<void>(resolve => {
      setTimeout(resolve, line.delay ? line.delay * 0.7 : 700); // Reduced from 1000ms to 700ms when no delay specified
    });

    // Move to the next line
    animateNextLine(screen, lineIndex + 1);
  };

  const handleNext = async () => {
    // Add tactile feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently handle haptics errors
    }

    if (currentScreen === SCREENS.length - 1) {
      console.log('Onboarding complete, navigating to paywall');
      
      // Mark onboarding as completed when user reaches the end
      await markOnboardingCompleted();
      console.log('Onboarding marked as completed');
      
      router.replace({
        pathname: ROUTES.AUTH.PAYWALL,
        params: { fromOnboarding: 'true' }
      });
      return;
    } else {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handleAnswerSelect = (screenId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [screenId]: answerIndex
    }));
  };

  const handleOtherAnswerChange = (screenId: string, text: string) => {
    setOtherAnswers(prev => ({
      ...prev,
      [screenId]: text
    }));
  };

  const renderProgressBar = () => {
    const width = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });
    
    return (
      <ThemedView style={styles.progressContainer}>
        <ThemedView style={styles.progressBarBackground}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              {
                width,
                backgroundColor: colors.text
              }
            ]}
          />
        </ThemedView>
      </ThemedView>
    );
  };

  const renderAnswers = (screen: OnboardingScreen) => {
    if (!screen.answers) return null;

    return (
      <ThemedView style={styles.answersContainer}>
        {screen.answers.map((answer, index) => {
          const isSelected = selectedAnswers[screen.id] === index;
          const isOther = answer.isOther;
          
          return (
            <Animated.View
              key={index}
              style={{
                opacity: pointsAnimRef.current[index] || new Animated.Value(0),
                transform: [{
                  translateY: (pointsAnimRef.current[index] || new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0]
                  })
                }]
              }}
            >
              <Pressable
                onPress={() => handleAnswerSelect(screen.id, index)}
                style={[
                  styles.answerBubble,
                  isSelected && styles.selectedAnswerBubble
                ]}
              >
                <ThemedView style={[
                  styles.checkCircle,
                  isSelected && styles.selectedCheckCircle
                ]}>
                  {isSelected && (
                    <IconSymbol
                      name="checkmark"
                      size={10}
                      color="#FFD700"
                    />
                  )}
                </ThemedView>
                <ThemedView style={styles.answerContent}>
                  <ThemedText style={[
                    styles.answerText,
                    isSelected && styles.selectedAnswerText
                  ]}>
                    {answer.text}
                  </ThemedText>
                  {isOther && isSelected && (
                    <TextInput
                      style={styles.otherInput}
                      placeholder="Type your answer..."
                      placeholderTextColor="#666"
                      value={otherAnswers[screen.id] || ''}
                      onChangeText={(text) => handleOtherAnswerChange(screen.id, text)}
                      autoFocus
                    />
                  )}
                </ThemedView>
              </Pressable>
            </Animated.View>
          );
        })}
      </ThemedView>
    );
  };

  const renderFeatures = (features: { title: string; description: string }[], caption?: string) => {
    return (
      <ThemedView style={styles.thoughtsContainer}>
        {features.map((feature, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: pointsAnimRef.current[index] || new Animated.Value(0),
              transform: [{
                translateY: (pointsAnimRef.current[index] || new Animated.Value(0)).interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0]
                })
              }]
            }}
          >
            <ThemedView style={styles.featureBubble}>
              <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
              <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
            </ThemedView>
          </Animated.View>
        ))}
        {caption && (
          <Animated.View
            style={{
              opacity: pointsAnimRef.current[features.length] || new Animated.Value(0),
              transform: [{
                translateY: (pointsAnimRef.current[features.length] || new Animated.Value(0)).interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0]
                })
              }]
            }}
          >
            <ThemedText style={styles.caption}>{caption}</ThemedText>
          </Animated.View>
        )}
      </ThemedView>
    );
  };

  const renderInputScreen = (screen: OnboardingScreen) => {
    if (!screen.isInput) return null;

    return (
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.headerText}>{screen.headerText}</ThemedText>
        <TextInput
          ref={inputRef}
          value={inputAnswer}
          onChangeText={setInputAnswer}
          placeholder={screen.inputPlaceholder}
          placeholderTextColor={colors.icon}
          style={[
            styles.headerInput, 
            { color: colors.text },
            !inputAnswer && styles.placeholder
          ]}
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />
      </ThemedView>
    );
  };

  const renderTypewriterScreen = (screen: TypewriterScreen) => {
    return (
      <ThemedView style={styles.typewriterContainer}>
        {typewriterState.completedLines.map((line, index) => {
          // Skip empty lines and duplicates, but keep input/option lines
          if (!line && !screen.lines[index]?.isInput && !screen.lines[index]?.options) return null;
          if (index > 0 && line === typewriterState.completedLines[index - 1] && !screen.lines[index]?.options) return null;
          
          // Don't render partial lines that are just the start of the next line
          if (index < screen.lines.length - 1 && screen.lines[index + 1]?.text && line === screen.lines[index + 1].text.substring(0, line.length)) return null;

          return (
            <Animated.View
              key={index}
              style={[
                styles.typewriterLine,
                {
                  opacity: fadeAnim
                }
              ]}
            >
              {line && <ThemedText style={styles.typewriterText}>{line}</ThemedText>}
              {screen.lines[index]?.isInput && (
                <TextInput
                  style={[styles.headerInput, { marginTop: 24 }]}
                  value={typewriterState.name}
                  onChangeText={(text) => setTypewriterState(prev => ({ ...prev, name: text }))}
                  placeholder={screen.lines[index].inputPlaceholder}
                  placeholderTextColor="#666"
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                  autoFocus
                />
              )}
              {screen.lines[index]?.options && (
                <Animated.View 
                  style={[
                    styles.optionsContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }]
                    }
                  ]}
                >
                  {screen.lines[index].options!.map((option, optIndex) => (
                    <Animated.View
                      key={optIndex}
                      style={{
                        opacity: optionAnimations.current[optIndex]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1]
                        }) || 0,
                        transform: [{
                          translateY: optionAnimations.current[optIndex]?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          }) || 20
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          typewriterState.selectedOption === option && styles.selectedOption
                        ]}
                        onPress={() => {
                          setTypewriterState(prev => ({ ...prev, selectedOption: option }));
                          if (option === 'Just starting') {
                            // Skip experience length screen
                            setCurrentScreen(prev => prev + 2);
                          } else {
                            handleNext();
                          }
                        }}
                      >
                        <ThemedText style={[
                          styles.optionText,
                          typewriterState.selectedOption === option && styles.selectedOptionText
                        ]}>
                          {option}
                        </ThemedText>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ThemedView>
    );
  };

  const isNextDisabled = () => {
    const currentScreenData = SCREENS[currentScreen];
    
    if (currentScreenData.isInput) {
      return !inputAnswer.trim();
    }
    
    if (!currentScreenData.answers) return false;
    
    const selectedAnswerIndex = selectedAnswers[currentScreenData.id];
    if (selectedAnswerIndex === undefined) return true;
    
    const selectedAnswer = currentScreenData.answers[selectedAnswerIndex];
    if (selectedAnswer.isOther && !otherAnswers[currentScreenData.id]) return true;
    
    return false;
  };

  return (
    <ThemedView style={styles.container}>
      {renderProgressBar()}
      <ThemedView style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <ThemedView style={styles.textContainer}>
              {SCREENS[currentScreen].isTypewriter ? (
                renderTypewriterScreen(SCREENS[currentScreen].typewriterData!)
              ) : (
                <>
                  {(SCREENS[currentScreen].id === 'strikes' ||
                    SCREENS[currentScreen].id === 'voice' ||
                    SCREENS[currentScreen].id === 'workouts' ||
                    SCREENS[currentScreen].id === 'notes' ||
                    SCREENS[currentScreen].id === 'history' ||
                    SCREENS[currentScreen].id === 'xp' ||
                    SCREENS[currentScreen].id === 'chat') && (
                    <ThemedView style={styles.imageHeaderContainer}>
                      <ThemedView style={styles.headerTextContainer}>
                        <Animated.View
                          style={{
                            opacity: subtitleAnim,
                            transform: [{
                              translateY: subtitleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0]
                              })
                            }]
                          }}
                        >
                          <ThemedText type="title" style={styles.title}>
                            {SCREENS[currentScreen].title}
                          </ThemedText>
                          {SCREENS[currentScreen].subtitle && (
                            <ThemedText style={styles.subtitle}>
                              {SCREENS[currentScreen].subtitle}
                            </ThemedText>
                          )}
                        </Animated.View>
                      </ThemedView>

                      <ThemedView style={styles.imageContainer}>
                        <Image 
                          source={
                            SCREENS[currentScreen].id === 'strikes' ? require('@/assets/images/strikes.png') :
                            SCREENS[currentScreen].id === 'voice' ? require('@/assets/images/voice.png') :
                            SCREENS[currentScreen].id === 'workouts' ? require('@/assets/images/workouts.png') :
                            SCREENS[currentScreen].id === 'notes' ? require('@/assets/images/notes.png') :
                            SCREENS[currentScreen].id === 'history' ? require('@/assets/images/history.png') :
                            SCREENS[currentScreen].id === 'xp' ? require('@/assets/images/xp.png') :
                            require('@/assets/images/chat.png')
                          }
                          style={styles.solutionImage}
                          resizeMode="contain"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0)', colors.background]}
                          style={styles.fadeGradient}
                          pointerEvents="none"
                          locations={[0.5, 1]}
                        />
                      </ThemedView>
                    </ThemedView>
                  )}

                  {SCREENS[currentScreen].answers && renderAnswers(SCREENS[currentScreen])}
                  {SCREENS[currentScreen].features && renderFeatures(SCREENS[currentScreen].features, SCREENS[currentScreen].caption)}
                </>
              )}
            </ThemedView>
          </ScrollView>
        </Animated.View>
      </ThemedView>
      
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: colors.text },
          isNextDisabled() && styles.disabledNextButton
        ]}
        onPress={handleNext}
        disabled={isNextDisabled()}
      >
        {currentScreen === SCREENS.length - 1 ? (
          <ThemedText style={styles.buttonText}>Begin Training</ThemedText>
        ) : (
          <IconSymbol
            name="arrow.right"
            size={24}
            color={colorScheme === 'dark' ? '#000' : '#fff'}
          />
        )}
      </TouchableOpacity>
    </ThemedView>
  );
} 