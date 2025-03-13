import { View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { techniques } from '@/data/strikes';
import type { Technique } from '@/data/strikes';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';
import Constants from 'expo-constants';

// First try to get API key from environment variables, then from EAS secrets
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY in environment variables or EAS secrets');
  // Instead of throwing an error, we'll disable the feature
}

const DAILY_MESSAGE_LIMIT = 25;

// Only initialize genAI if we have an API key
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default function CoachScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { session } = useAuth();
  const { initialMessage } = useLocalSearchParams<{ initialMessage: string }>();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const [loadingText, setLoadingText] = useState('Reviewing fight knowledge...');

  // Fetch daily message count on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchDailyMessageCount();
    }
  }, [session?.user]);

  const fetchDailyMessageCount = async () => {
    if (!session?.user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, ensure there's a record for today
      const { data: existingRecord, error: existingError } = await supabase
        .from('daily_coach_messages')
        .select('message_count')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw existingError;
      }

      if (!existingRecord) {
        // Create a new record for today
        const { error: insertError } = await supabase
          .from('daily_coach_messages')
          .insert({
            user_id: session.user.id,
            date: today,
            message_count: 0
          });

        if (insertError) throw insertError;
        setDailyMessageCount(0);
      } else {
        setDailyMessageCount(existingRecord.message_count);
      }
    } catch (error) {
      console.error('Error fetching daily message count:', error);
      Alert.alert('Error', 'Failed to fetch message count');
    } finally {
      setIsLoadingCount(false);
    }
  };

  const incrementMessageCount = async () => {
    if (!session?.user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_coach_messages')
        .upsert(
          {
            user_id: session.user.id,
            date: today,
            message_count: dailyMessageCount + 1
          },
          {
            onConflict: 'user_id,date',
            ignoreDuplicates: false
          }
        );

      if (error) throw error;
      setDailyMessageCount(prev => prev + 1);
    } catch (error) {
      console.error('Error incrementing message count:', error);
      Alert.alert('Error', 'Failed to update message count');
    }
  };

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

    if (isLoading) {
      animate();
      const texts = [
        'Reviewing fight knowledge...',
        'Analysing fight science...',
        'Breaking down fight mechanics...'
      ];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setLoadingText(texts[index]);
      }, 5000);

      return () => clearInterval(interval);
    } else {
      rotateAnimation.setValue(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handleSend = async (messageToSend?: string) => {
    const messageContent = messageToSend || message;
    if (!messageContent.trim() && !selectedImage) return;
    
    if (!session?.user) {
      Alert.alert('Error', 'Please sign in to use the coach');
      return;
    }

    if (dailyMessageCount >= DAILY_MESSAGE_LIMIT) {
      Alert.alert(
        'Daily Limit Reached',
        'You have reached your daily limit of 25 messages. Please try again tomorrow.'
      );
      return;
    }

    const userMessage = messageContent.trim();
    setMessage('');
    setSelectedImage(null);
    
    // Only show the user's message in the UI
    const newMessages = [
      ...messages,
      { role: 'user' as const, content: userMessage }
    ];
    setMessages(newMessages);
    
    setIsLoading(true);
    try {
      // Extract technique names from the message
      const techniqueNames = techniques
        .map((t: Technique) => t.name.toLowerCase())
        .filter((name: string) => userMessage.toLowerCase().includes(name.toLowerCase()));

      let context = '';
      
      // Only fetch workout data if the query is about training history or specific techniques used
      const isHistoryQuery = userMessage.toLowerCase().includes('did') || 
        userMessage.toLowerCase().includes('done') ||
        userMessage.toLowerCase().includes('recent') ||
        userMessage.toLowerCase().includes('last') ||
        userMessage.toLowerCase().includes('previous') ||
        userMessage.toLowerCase().includes('history') ||
        userMessage.toLowerCase().includes('log') ||
        userMessage.toLowerCase().includes('trained') ||
        userMessage.toLowerCase().includes('workout') ||
        userMessage.toLowerCase().includes('session');

      if (isHistoryQuery) {
        // Fetch recent workouts (last 7 days by default)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: recentWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            id,
            name,
            created_at,
            total_xp,
            workout_combos (
              training_type,
              training_mode,
              techniques,
              sets,
              reps,
              rounds,
              round_minutes,
              round_seconds,
              duration_minutes,
              duration_seconds
            )
          `)
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: false });

        if (workoutsError) throw workoutsError;

        if (recentWorkouts.length > 0) {
          // First stage - Workout formatting
          context += `Recent Workouts\n\n`;
          recentWorkouts.forEach(workout => {
            const date = new Date(workout.created_at);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const day = date.getDate();
            const formattedDate = `${dayOfWeek}, ${month} ${day}${getOrdinalSuffix(day)}`;

            // Group techniques by category
            const techniquesByCategory = new Map<string, Set<string>>();
            let totalRounds = 0;
            let totalDuration = 0;

            workout.workout_combos?.forEach(combo => {
              if (!combo.techniques) return;
              
              // Track rounds and duration
              if (combo.rounds) totalRounds += combo.rounds;
              if (combo.duration_minutes) totalDuration += (combo.duration_minutes * 60);
              if (combo.duration_seconds) totalDuration += combo.duration_seconds;
              if (combo.round_minutes) totalDuration += (combo.rounds * combo.round_minutes * 60);
              if (combo.round_seconds) totalDuration += (combo.rounds * combo.round_seconds);

              combo.techniques.forEach((technique: string) => {
                const foundTechnique = techniques.find(t => t.name === technique);
                if (foundTechnique) {
                  if (!techniquesByCategory.has(foundTechnique.category)) {
                    techniquesByCategory.set(foundTechnique.category, new Set());
                  }
                  techniquesByCategory.get(foundTechnique.category)?.add(technique);
                }
              });
            });

            context += `${formattedDate}\n`;
            context += `Total XP: ${workout.total_xp}\n`;
            if (totalRounds > 0) context += `Rounds: ${totalRounds}\n`;
            if (totalDuration > 0) {
              const minutes = Math.floor(totalDuration / 60);
              const seconds = totalDuration % 60;
              context += `Duration: ${minutes}m ${seconds}s\n`;
            }

            techniquesByCategory.forEach((techniques, category) => {
              const techniqueList = Array.from(techniques);
              context += `${category}: ${techniqueList.join(', ')}\n`;
            });

            // Add training types and modes
            const trainingTypes = new Set(workout.workout_combos?.map(combo => combo.training_type).filter(Boolean));
            const trainingModes = new Set(workout.workout_combos?.map(combo => combo.training_mode).filter(Boolean));
            
            if (trainingTypes.size > 0) {
              context += `Training Types: ${Array.from(trainingTypes).join(', ')}\n`;
            }
            if (trainingModes.size > 0) {
              context += `Training Modes: ${Array.from(trainingModes).join(', ')}\n`;
            }
            
            context += '\n';
          });

          // Fetch relevant workout notes
          const { data: relevantNotes, error: notesError } = await supabase
            .from('workout_notes')
            .select(`
              notes,
              strikes_mentioned,
              workouts!inner (
                created_at
              )
            `)
            .or(
              techniqueNames.length ? 
                `strikes_mentioned.cs.{${techniqueNames.join(',')}}` : 
                'created_at.gte.' + oneWeekAgo.toISOString()
            )
            .order('workouts(created_at)', { ascending: false });

          if (notesError) throw notesError;

          // Second stage - Notes formatting
          if (relevantNotes?.length) {
            context += `Recent Training Notes\n\n`;
            relevantNotes.forEach(note => {
              const workout = (note as any).workouts as { created_at: string };
              const date = new Date(workout.created_at);
              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
              const month = date.toLocaleDateString('en-US', { month: 'long' });
              const day = date.getDate();
              const formattedDate = `${dayOfWeek}, ${month} ${day}${getOrdinalSuffix(day)}`;
              
              context += `${formattedDate}\n\n`;
              context += `${note.notes}\n\n`;
              if (note.strikes_mentioned && note.strikes_mentioned.length > 0) {
                context += `Techniques mentioned: ${note.strikes_mentioned.join(', ')}\n\n`;
              }
            });
          }
        }
      }

      // Create messages array for AI with context
      const messagesWithContext = [
        ...messages,
        ...(context ? [{ role: 'user' as const, content: context }] : []),
        { role: 'user' as const, content: userMessage }
      ];

      // Convert messages to a single string for Gemini
      const prompt = messagesWithContext.map(msg => {
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
      }).join('\n\n');

      const formattedPrompt = `You are an expert kickboxing and muay thai coach. Respond to the user's questions and provide technical advice. Focus on specific, actionable feedback. Make sure your responses are easily readable. Don't ever ouput a single asterisk to represent a dot point. Use technical terms when appropriate. Keep the responses relatively brief and be encouraging.\n\n${prompt}`;

      // Check if genAI is available
      if (!genAI) {
        setIsLoading(false);
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: "Coach AI is only available in production builds. Please try again later." }
        ]);
        return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        formattedPrompt
      ]);
      const response = await result.response;
      
      // Log the response text
      console.log('AI Response:', response.text());
      
      // Update UI with just the user message and AI response
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: response.text() }
      ]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
      
      // Increment message count after successful response
      await incrementMessageCount();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to get response from AI coach. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => {


    const renderContent = (content: string) => {
      // Replace multiple spaces with a single space first
      content = content.replace(/\s{2,}/g, ' ');
      
      // Then handle single asterisks that are bullet points (not part of bold text)
      content = content.replace(/^[*]\s/gm, '• ');
      content = content.replace(/\n[*]\s/g, '\n• ');
      
      // Add single line break before numbered headers and ensure it's preserved
      content = content.replace(/([^.\n])\s*(\d+\.\s*\*\*)/g, '$1\n$2');
      
      // Split on bold text, including any numbers before it
      const parts = content.split(/(\d+\.\s*\*\*.*?\*\*|\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.includes('**')) {
          // Extract the text between asterisks, preserving any numbers before it
          const text = part.replace(/(\d+\.\s*)?(\*\*)(.*?)(\*\*)/, '$1$3');
          return (
            <ThemedText key={index} style={{ 
              fontFamily: 'PoppinsSemiBold',
              fontSize: 16, 
              lineHeight: 24,
              color: '#FFD700',
              marginTop: text.match(/^\d+\./) ? 4 : 0  // Reduced margin even further for numbered headers
            }}>
              {text}
            </ThemedText>
          );
        }
        return (
          <ThemedText key={index} style={{ 
            fontSize: 16, 
            lineHeight: 24, 
            fontFamily: 'Poppins',
            color: message.role === 'user' ? '#FFFFFF' : colors.text
          }}>
            {part}
          </ThemedText>
        );
      });
    };

    return (
      <View style={{
        backgroundColor: message.role === 'user' ? '#262626' : '#1a1a1a',
        padding: 16,
        borderRadius: 16,
        marginVertical: 8,
        maxWidth: '85%',
        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
      }}>
        {renderContent(message.content)}
      </View>
    );
  };

  const ExamplePrompt = ({ text }: { text: string }) => (
    <TouchableOpacity 
      style={{ 
        backgroundColor: '#262626',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 8
      }}
      onPress={() => {
        setMessage(text);
      }}
    >
      <ThemedText style={{ fontSize: 14 }}>{text}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: 16,
            paddingTop: '15%'
          }}
          keyboardShouldPersistTaps="never"
          keyboardDismissMode="on-drag"
        >
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ThemedText style={{ 
                fontSize: 32, 
                fontWeight: 'bold',
                textDecorationLine: 'line-through',
                textDecorationStyle: 'solid',
                textDecorationColor: '#FFD700',
                lineHeight: 36,
                includeFontPadding: true
              }}>
                strikelab
              </ThemedText>
              <View style={{ opacity: 0.2 }}>
                <ThemedText style={{ 
                  fontSize: 32, 
                  fontWeight: 'bold',
                  lineHeight: 32,
                  includeFontPadding: true,
                  marginTop: -8
                }}>
                  coach
                </ThemedText>
              </View>
              {(DAILY_MESSAGE_LIMIT - dailyMessageCount) <= 10 && (
                <ThemedText style={{ 
                  marginTop: 8, 
                  opacity: 0.6 
                }}>
                  {DAILY_MESSAGE_LIMIT - dailyMessageCount} messages remaining today
                </ThemedText>
              )}
            </View>
          ) : (
            <>
              {(DAILY_MESSAGE_LIMIT - dailyMessageCount) <= 10 && (
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <ThemedText style={{ opacity: 0.6 }}>
                    {DAILY_MESSAGE_LIMIT - dailyMessageCount} messages remaining today
                  </ThemedText>
                </View>
              )}
              {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
            </>
          )}
          {isLoading && (
            <View style={{ 
              padding: 16, 
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
              <Animated.View style={[
                {
                  width: 31,
                  height: 31,
                  borderRadius: 15.5,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderTopColor: '#FFD700',
                },
                {
                  transform: [{
                    rotate: rotateAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]} />
              <ThemedText style={{ 
                fontSize: 16,
                opacity: 0.7
              }}>
                {loadingText}
              </ThemedText>
            </View>
          )}
        </ScrollView>

        <View style={{ 
          paddingHorizontal: 16, 
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 16 : 8 
        }}>
          {messages.length === 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
              contentContainerStyle={{ paddingHorizontal: 8 }}
            >
              <ExamplePrompt text="What combos did I do this week?" />
              <ExamplePrompt text="List my recent coach feedback." />
              <ExamplePrompt text="How to improve my jab?" />
            </ScrollView>
          )}

          <View 
            style={{ 
              flexDirection: 'row',
              backgroundColor: '#262626',
              borderRadius: 24,
              padding: 8,
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              {selectedImage ? (
                <View style={{ 
                  backgroundColor: '#333',
                  borderRadius: 8,
                  marginBottom: 8,
                  width: 80,
                  height: 80
                }}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ 
                      width: 80,
                      height: 80,
                      borderRadius: 8
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={{ 
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onPress={() => setSelectedImage(null)}
                  >
                    <IconSymbol name="xmark" size={12} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={{ minHeight: 40, justifyContent: 'center' }}>
                <TextInput
                  style={{ 
                    color: colors.text,
                    fontSize: 16,
                    maxHeight: 100,
                    paddingVertical: 8
                  }}
                  placeholder="Message"
                  placeholderTextColor="#666"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onSubmitEditing={() => handleSend()}
                />
              </View>
            </View>
            <TouchableOpacity 
              style={{ 
                backgroundColor: message.trim() || selectedImage ? '#FFD700' : '#333',
                padding: 8,
                borderRadius: 14,
                marginLeft: 4
              }}
              onPress={() => handleSend()}
              disabled={!message.trim() && !selectedImage}
            >
              <IconSymbol 
                name="arrow.up" 
                size={16} 
                color={message.trim() || selectedImage ? '#000000' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 