import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Easing, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { analyzeVideoWithGemini } from '../../lib/gemini';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Markdown from 'react-native-markdown-display';
import { Asset } from 'expo-asset';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 24;

function VideoCoachScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [video, setVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const videoIconAnimation = useRef(new Animated.Value(0)).current;
  const tempVideoRef = useRef<Video>(null);

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    };

    if (loading) {
      animate();
    } else {
      rotateAnimation.setValue(0);
    }
  }, [loading]);

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.timing(videoIconAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    };

    animate();
  }, []);

  const markdownStyles = {
    body: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 16,
      fontFamily: 'Poppins',
      lineHeight: 24,
    },
    strong: {
      color: '#FFD700',
      fontSize: 16,
      fontFamily: 'PoppinsSemiBold',
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
      paddingTop: 0,
    },
    heading1: {
      marginBottom: 0,
      paddingBottom: 0,
    },
    heading2: {
      marginBottom: 0,
      paddingBottom: 0,
    },
  };

  const pickVideo = async () => {
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoQuality: 1,
      });

      if (!result.canceled) {
        // Check video duration
        const videoUri = result.assets[0].uri;
        const videoStatus = await new Promise<AVPlaybackStatus>((resolve) => {
          if (tempVideoRef.current) {
            tempVideoRef.current.loadAsync(
              { uri: videoUri },
              {},
              false
            ).then(resolve);
          }
        });

        if (
          videoStatus.isLoaded &&
          videoStatus.durationMillis &&
          videoStatus.durationMillis > 10000
        ) {
          setError('Video must be 10 seconds or less');
          return;
        }

        setVideo(videoUri);
        setFeedback(null);
        analyzeVideo(videoUri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      setError('Error selecting video. Please try again.');
    }
  };

  const analyzeVideo = async (videoUri: string) => {
    if (!videoUri) return;

    setLoading(true);
    try {
      const response = await analyzeVideoWithGemini(videoUri);
      setFeedback(response);
    } catch (error) {
      console.error('Error analyzing video:', error);
      setFeedback('Error analyzing video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoreFeedback = () => {
    if (feedback) {
      // Navigate to coach tab with the feedback as initial message
      router.push({
        pathname: '/(tabs)/coach',
        params: {
          initialMessage: `Explain how I can work on the following:\n\n${feedback}`
        }
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700', color: '#fff' }]}>
          film analysis
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}
        
        {!video ? (
          <ThemedView style={styles.uploadContainer}>
            <ThemedView style={styles.uploadContent}>
              <ThemedView style={styles.iconContainer}>
                <Animated.View style={[
                  styles.rotatingCircle,
                  {
                    transform: [{
                      rotate: videoIconAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }
                ]}>
                  <View style={styles.rotatingBorder} />
                </Animated.View>
                <IconSymbol name="video.fill" size={56} color="#ffffff" />
              </ThemedView>
              <ThemedView style={styles.textContainer}>
                <ThemedText style={styles.uploadTitle}>Upload a video</ThemedText>
                <ThemedText style={styles.uploadSubtitle}>
                  Upload a short clip of you performing a strike ({"<"}10s) and receive instant coach advice
                </ThemedText>
              </ThemedView>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickVideo}
              >
                <IconSymbol name="plus" size={20} color="#FFD700" />
                <ThemedText>Choose Video</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        ) : (
          <>
            <ThemedView style={styles.videoContainer}>
              <Video
                source={{ uri: video }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            </ThemedView>

            {loading ? (
              <ThemedView style={styles.loadingContainer}>
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
                <ThemedText style={styles.loadingText}>Analyzing your technique...</ThemedText>
              </ThemedView>
            ) : (
              <>
                {feedback && (
                  <ThemedView style={styles.feedbackContainer}>
                    <Markdown style={markdownStyles}>{feedback}</Markdown>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={handleMoreFeedback}
                      >
                        <IconSymbol name="sparkles" size={18} color="#FFD700" />
                        <ThemedText style={styles.actionButtonText}>Explain feedback</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={pickVideo}
                      >
                        <IconSymbol name="arrow.counterclockwise" size={18} color="#FFD700" />
                        <ThemedText style={styles.actionButtonText}>Upload video</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </ThemedView>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Video
        ref={tempVideoRef}
        style={{ width: 0, height: 0 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  uploadContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 100,
  },
  uploadContent: {
    alignItems: 'center',
    gap: 40,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  rotatingBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  uploadTitle: {
    fontSize: 28,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 36,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Poppins',
    maxWidth: 280,
    lineHeight: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#FFD700',
  },
  videoContainer: {
    width: SCREEN_WIDTH - (HORIZONTAL_PADDING * 2),
    aspectRatio: 16/9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 20,
  },
  video: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
  },
  tryAgainButton: {
    marginTop: 20,
  },
  feedbackContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
    backgroundColor: '#1c1c1e',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Poppins',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});

export default VideoCoachScreen; 