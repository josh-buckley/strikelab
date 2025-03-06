import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

// First try to get API key from environment variables, then from EAS secrets
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY in environment variables or EAS secrets');
  // Instead of throwing an error, provide a fallback or limited functionality
  // For development purposes, you can disable features or use a mock
}

// Only initialize genAI if we have an API key
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface GeminiFile {
  name: string;
  uri: string;
  state: {
    name: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  };
}

async function fileToGenerativePart(videoUri: string) {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error('Video file does not exist');
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      inlineData: {
        data: base64,
        mimeType: 'video/mp4'
      }
    };
  } catch (error) {
    console.error('Error processing video file:', error);
    throw error;
  }
}

export async function analyzeVideoWithGemini(videoUri: string): Promise<string> {
  try {
    // If we don't have genAI initialized, return a default message
    if (!genAI) {
      return "API key not available. Video analysis is only available in production builds.";
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert martial arts coach. Analyze this technique video and respond using only this exact format:

**Strengths:**
[Positive observations about the specific technique or strike the user is performing, spoken in the second person]

**Areas to Focus On:**
[2-3 key points for improvement, spoken in the second person, don't be mean but be honest. Mention the specific technique or movement that needs improvement (e.g. 'jab', 'knee', 'roundhouse kick', etc.)]

Do not include any introductory text or additional commentary.`;

    const videoPart = await fileToGenerativePart(videoUri);
    
    const result = await model.generateContent([
      prompt,
      videoPart
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing video:', error);
    // Return a user-friendly error message
    return "Sorry, there was an error analyzing your video. Please try again later.";
  }
} 