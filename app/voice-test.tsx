import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, View } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Animated, { 
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedReaction,
  Easing,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useWorkout } from '@/contexts/WorkoutContext';
import type { Combo } from '@/contexts/WorkoutContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// First try to get API key from environment variables, then from EAS secrets
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY in environment variables or EAS secrets');
  // Instead of throwing an error, we'll disable the feature
}

// Only initialize genAI if we have an API key
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `You are a Muay Thai workout parser that converts natural language workout descriptions into structured data. You must ONLY output valid JSON with no additional text, markdown, or formatting.

Given a workout description, extract the following information for each combo/exercise. The description may contain multiple combos/exercises - parse ALL of them into separate combo objects. ONLY include fields that are explicitly mentioned in the input - do not add default or assumed values. If a mode (Rounds/Time/Reps/Distance) is not explicitly specified, do not include any mode or duration-related fields:

- Training type (Partner Drills, Heavy Bag, Thai Pads, Focus Mitts, Shadow Boxing, Warm-Up, Running, Skipping, Sparring)
- For Sparring type specifically:
  - Intensity level (Technical 40%, Light 60%, Medium 80%, Hard 100%)
  - Defaults to "Light Sparring" (60%) if no intensity specified
- Training mode (Rounds, Time, Reps, Distance) - only include if explicitly specified
- Duration details based on mode (only include if specified):
  - For Rounds: number of rounds, minutes per round
  - For Time: total minutes and seconds
  - For Reps: number of sets and reps
  - For Distance: distance and unit (km/mi)
- Techniques in sequence (if applicable)

Your response must be ONLY the JSON object with this exact format:
{
  "combos": [
    {
      "type": "string",
      "sparringIntensity"?: "Technical" | "Light" | "Medium" | "Hard",
      "mode"?: "string",
      "rounds"?: number,
      "roundMinutes"?: number,
      "roundSeconds"?: number,
      "minutes"?: number,
      "seconds"?: number,
      "sets"?: number,
      "reps"?: number,
      "distance"?: number,
      "distanceUnit"?: "km" | "mi",
      "techniques"?: string[]
    }
  ]
}

IMPORTANT: Do NOT wrap your response in markdown code blocks (\`\`\`json ... \`\`\`). Return ONLY the raw JSON.`;

const ProcessingText = ({ text }: { text: string }) => {
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { 
        duration: 1500,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, []);

  const words = text.split(' ');
  
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {words.map((word, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const wordPosition = index / words.length;
          const distance = Math.abs(progress.value - wordPosition);
          const wave = 1 - Math.min(distance * 3, 1); // Creates a wave effect
          
          return {
            color: interpolateColor(
              wave,
              [0, 1],
              ['#999999', '#FFD700']
            )
          };
        });

        return (
          <Animated.Text
            key={index}
            style={[
              {
                fontSize: 24,
                marginRight: 6,
                marginBottom: 4,
                fontFamily: 'Poppins',
                fontWeight: '600'
              },
              animatedStyle
            ]}
          >
            {word}
          </Animated.Text>
        );
      })}
    </View>
  );
};

// Add martial arts text processing function
const processRecognizedText = (text: string): string => {
  let processedText = text.toLowerCase();
  
  // Replace ? kick with question mark kick
  processedText = processedText.replace(/\?\s*kick/g, 'question mark kick');
  
  // Replace faint with feint
  processedText = processedText.replace(/\bfaint\b/g, 'feint');

  // Standardize sparring intensity terms
  processedText = processedText.replace(/\btechnical\s+sparring\b/g, 'technical sparring');
  processedText = processedText.replace(/\blight\s+sparring\b/g, 'light sparring');
  processedText = processedText.replace(/\bmedium\s+sparring\b/g, 'medium sparring');
  processedText = processedText.replace(/\bhard\s+sparring\b/g, 'hard sparring');
  
  // If sparring is mentioned without intensity, default to light
  processedText = processedText.replace(/\bsparring\b(?!\s+(technical|light|medium|hard))/g, 'light sparring');

  // Capitalize first letter of the entire text
  processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);

  return processedText;
};

const parseWorkout = async (text: string) => {
  if (!text) return null;
  
  // If we don't have genAI initialized, return a default message
  if (!genAI) {
    return "Voice parsing is only available in production builds.";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      text
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini:', error);
    return "Sorry, there was an error processing your request. Please try again later.";
  }
};

export default function VoiceTest() {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const voiceEnergy = useSharedValue(0);
  const rotation = useSharedValue(0);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { setCombos } = useWorkout();

  // Start rotation animation when listening
  useEffect(() => {
    if (isListening) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 3000,
          easing: Easing.linear
        }),
        -1
      );
    }
  }, [isListening]);

  const rotatingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}rad` }]
    };
  });

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechVolumeChanged = (e: any) => {
      const energy = Math.min(Math.max(e.value / 100, 0), 1);
      voiceEnergy.value = withTiming(energy, { duration: 100 });
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleWorkoutParsing = async () => {
    if (!text) return;
    
    setIsProcessing(true);
    try {
      const response = await parseWorkout(text);
      if (!response) {
        setError('No response from AI');
        return;
      }

      try {
        // Log the raw response for debugging
        console.log('Raw AI response:', response);
        
        // Clean the response by removing markdown code fences and any leading/trailing whitespace
        const cleanedResponse = response
          .replace(/^```(?:json)?/, '') // Remove opening code fence
          .replace(/```$/, '')          // Remove closing code fence
          .trim();                      // Remove whitespace
        
        const parsedResponse = JSON.parse(cleanedResponse);
        if (parsedResponse.combos) {
          // Add IDs to each combo and format techniques as string
          const combosWithIds = parsedResponse.combos.map((combo: any) => ({
            ...combo,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            minutes: combo.minutes?.toString(),
            seconds: combo.seconds !== undefined ? combo.seconds.toString().padStart(2, '0') : undefined,
            // Convert techniques array to string format if it exists, with capitalized names
            techniques: Array.isArray(combo.techniques) 
              ? combo.techniques
                  .map((t: string) => t.split(' ')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                  )
                  .join(' - ') 
              : undefined,
            // Convert numeric values to strings to match Combo type
            sets: combo.sets?.toString(),
            reps: combo.reps?.toString(),
            rounds: combo.rounds?.toString(),
            roundMinutes: combo.roundMinutes?.toString(),
            roundSeconds: combo.roundSeconds !== undefined ? combo.roundSeconds.toString().padStart(2, '0') : undefined,
            distance: combo.distance?.toString()
          }));
          setCombos(combosWithIds);
          router.push('/create-workout/techniques');
        } else {
          setError('Invalid response format from AI - missing combos array');
          console.error('Invalid response structure:', parsedResponse);
        }
      } catch (e: any) {
        setError(`Failed to parse AI response: ${e.message}`);
        console.error('Parse error:', e);
        console.error('Response that failed to parse:', response);
      }
    } catch (e) {
      setError('Failed to process workout with AI');
      console.error('AI error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const rawResult = e.value?.[0] ?? '';
    const processedResult = processRecognizedText(rawResult);
    setText(processedResult);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    // Special handling for no speech detected error
    if (e.error?.message?.includes('1110')) {
      setError('No speech detected');
    } else {
      setError(e.error?.message ?? 'Unknown error occurred');
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        voiceEnergy.value = withTiming(0, { duration: 300 });
        // Automatically parse when stopping
        if (text.trim()) {
          handleWorkoutParsing();
        }
      } else {
        setError('');
        await Voice.start('en-US');
        setIsListening(true);
      }
    } catch (e) {
      setError('Error toggling voice recognition');
      console.error(e);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // const circles = Array.from({ length: NUM_CIRCLES }).map((_, i) => {
  //   const angle = (2 * Math.PI * i) / NUM_CIRCLES;
  //   const x = SCREEN_WIDTH / 2 + Math.cos(angle) * BASE_RADIUS;
  //   const y = CIRCLE_CENTER_Y + Math.sin(angle) * BASE_RADIUS;
  //   return { x, y };
  // });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={28} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={[
            styles.headerText,
            { 
              textDecorationLine: 'line-through', 
              textDecorationColor: '#FFD700',
              textTransform: 'lowercase',
            }
          ]}>talk through it</ThemedText>
          <View style={styles.subtitleContainer}>
            {isProcessing ? (
              <ProcessingText text={text} />
            ) : (
              <ThemedText style={styles.subtitle}>
                {text || 'e.g. \'I skipped for 5 minutes, then did 3 rounds of 3 minutes doing jab, cross, switch-kick on the heavy bag.\''}
              </ThemedText>
            )}
          </View>
        </ThemedView>

        {/* <View style={styles.blobContainer}>
          <Canvas style={styles.canvas}>
            <Group
              origin={{ x: SCREEN_WIDTH / 2, y: CIRCLE_CENTER_Y }}
              transform={[{ rotate: rotation.value }]}
            >
              {circles.map((circle, i) => (
                <Circle
                  key={i}
                  cx={circle.x}
                  cy={circle.y}
                  r={15 + voiceEnergy.value * 30}
                  color="rgba(255, 215, 0, 0.3)"
                />
              ))}
            </Group>
          </Canvas>
        </View> */}

        <View style={styles.micButtonContainer}>
          {(isListening || isProcessing) && (
            <Animated.View style={[
              styles.rotatingCircle,
              rotatingStyle
            ]} />
          )}
          <TouchableOpacity
            style={[
              styles.micButton,
              { backgroundColor: isListening ? '#ffffff' : '#262626' }
            ]}
            onPress={toggleListening}
            disabled={isProcessing}
          >
            <IconSymbol 
              name={isListening ? "stop.fill" : "mic.fill"}
              size={36} 
              color={isListening ? '#262626' : colors.text} 
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  titleContainer: {
    marginTop: 20,
  },
  headerText: {
    fontSize: 42,
    lineHeight: 52,
  },
  subtitleContainer: {
    marginTop: 24,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 32,
    color: '#999',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  // blobContainer: {
  //   height: 300,
  //   width: SCREEN_WIDTH,
  //   position: 'relative',
  //   marginTop: 40,
  //   backgroundColor: 'transparent',
  // },
  // canvas: {
  //   flex: 1,
  //   backgroundColor: 'transparent',
  // },
  micButtonContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 40,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'solid',
  },
  rotatingCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  errorText: {
    color: '#FFD700',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
});
