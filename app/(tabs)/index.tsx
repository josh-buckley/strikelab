import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { getCurrentRank, getNextRank } from '@/data/ranks';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/AuthProvider';
import { XPChartModal } from '@/components/XPChartModal';

type CategoryData = {
  name: string;
  level: number;
  xp: number;
};

const getProgressColor = (xp: number): [string, string] => {
  return ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.8)'];
};

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { signOut, session } = useAuth();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [xpChartData, setXpChartData] = useState<{ labels: string[]; data: number[]; }>({
    labels: [],
    data: []
  });

  useEffect(() => {
    if (session?.user) {
      console.log('Session user found, fetching levels...');
      fetchUserLevels();
    } else {
      console.log('No session user found');
    }
  }, [session?.user]);

  useEffect(() => {
    let glowAnimationInstance: Animated.CompositeAnimation | null = null;
    let rotateAnimationInstance: Animated.CompositeAnimation | null = null;

    if (isFocused) {
      // Reset animations
      glowAnimation.setValue(0);
      rotateAnimation.setValue(0);

      // Start glow animation
      const animateGlow = () => {
        glowAnimationInstance = Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          })
        ]);
        
        glowAnimationInstance.start(() => {
          if (isFocused) {
            animateGlow();
          }
        });
      };

      // Start rotate animation
      rotateAnimationInstance = Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      );

      animateGlow();
      rotateAnimationInstance.start();
    }

    return () => {
      glowAnimationInstance?.stop();
      rotateAnimationInstance?.stop();
    };
  }, [isFocused]);

  async function fetchUserLevels() {
    try {
      console.log('Fetching user levels...');
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) {
        // If the error is PGRST116 (no rows returned), the levels might still be being created
        if (error.code === 'PGRST116') {
          console.log('Levels not found, waiting for creation...');
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchUserLevels();
        }
        throw error;
      }

      // Transform the data into the expected format based on the actual database schema
      const categoryData = [
        { 
          name: 'Punches', 
          level: data?.punches_level || 1,
          xp: data?.punches_xp || 0
        },
        { 
          name: 'Kicks', 
          level: data?.kicks_level || 1,
          xp: data?.kicks_xp || 0
        },
        { 
          name: 'Elbows', 
          level: data?.elbows_level || 1,
          xp: data?.elbows_xp || 0
        },
        { 
          name: 'Knees', 
          level: data?.knees_level || 1,
          xp: data?.knees_xp || 0
        },
        { 
          name: 'Footwork', 
          level: data?.footwork_level || 1,
          xp: data?.footwork_xp || 0
        },
        { 
          name: 'Clinch', 
          level: data?.clinch_level || 1,
          xp: data?.clinch_xp || 0
        },
        { 
          name: 'Defense', 
          level: data?.defensive_level || 1,
          xp: data?.defensive_xp || 0
        },
        { 
          name: 'Sweeps', 
          level: data?.sweeps_level || 1,
          xp: data?.sweeps_xp || 0
        },
        { 
          name: 'Feints', 
          level: data?.feints_level || 1,
          xp: data?.feints_xp || 0
        }
      ];

      console.log('Setting categories:', categoryData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching user levels:', error);
      // Don't throw the error, just log it and let the UI show default values
    }
  }

  const handleCreateWorkout = () => {
    // Navigate using absolute path, which Expo Router should now resolve
    // correctly due to the nested Stack setup in app/(tabs)/_layout.tsx
    router.navigate('/create-workout/name'); 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSignOut = async () => {
    console.log('Sign out button pressed');
    try {
      await signOut();
      console.log('Sign out completed');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error in handleSignOut:', error);
    }
  };

  const handleTestOnboarding = () => {
    router.replace('/(auth)/onboarding');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const totalLevel = categories.reduce((sum, category) => sum + category.level, 0);
  const currentRank = getCurrentRank(totalLevel);
  const nextRank = getNextRank(totalLevel);

  // Add logging for render
  console.log('Rendering HomeScreen with categories:', categories);

  // Function to fetch XP history for a category
  const fetchXPHistory = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('xp_history')
        .select('xp_gained, created_at')
        .eq('user_id', session!.user.id)
        .eq('category', category.toLowerCase())
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      if (data) {
        const labels = data.map(entry => {
          const date = new Date(entry.created_at);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        
        // Calculate cumulative XP
        let cumulativeXP = 0;
        const xpData = data.map(entry => {
          cumulativeXP += entry.xp_gained;
          return cumulativeXP;
        });

        setXpChartData({
          labels,
          data: xpData
        });
      }
    } catch (error) {
      console.error('Error fetching XP history:', error);
    }
  };

  const handleTilePress = async (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    await fetchXPHistory(category);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={[styles.title, { textDecorationLine: 'line-through', textDecorationColor: '#FFD700' }]}>
          strikelab
        </ThemedText>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.headerButton}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[styles.tile, { backgroundColor: '#141414' }]}
              onPress={() => handleTilePress(category.name)}
            >
              <ThemedView style={styles.tileContent}>
                <ThemedView style={[styles.tileBackground, { backgroundColor: '#1c1c1e' }]}>
                  <ThemedView style={[styles.tileHeader, { backgroundColor: '#1c1c1e' }]}>
                    <ThemedText style={[styles.tileName, { backgroundColor: '#1c1c1e' }]}>
                      {category.name}
                    </ThemedText>
                    <ThemedView style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e' }}>
                      <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e' }]}>
                        Lv.
                      </ThemedText>
                      <ThemedText style={[styles.tileLevel, { backgroundColor: '#1c1c1e', fontSize: 17, fontFamily: 'PoppinsSemiBold', marginLeft: -2, color: '#FFD700' }]}>
                        {category.level}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedView style={styles.progressBarContainer}>
                    <ThemedView style={styles.progressBar}>
                      <LinearGradient
                        colors={getProgressColor(category.xp)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { 
                            width: `${(category.xp % 1000) / 10}%`,
                          }
                        ]}
                      />
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.xpNeeded}>
                    {1000 - (category.xp % 1000)} xp left
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <XPChartModal
          visible={selectedCategory !== null}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory || ''}
          xpData={xpChartData}
          currentLevel={categories.find(c => c.name === selectedCategory)?.level || 1}
          totalXP={categories.find(c => c.name === selectedCategory)?.xp || 0}
        />

        <View style={styles.fabContainer}>
          <Animated.View style={[
            styles.rotatingCircle,
            {
              transform: [{
                rotate: rotateAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }
          ]} />
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleCreateWorkout}
          >
            <IconSymbol name="plus" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 3,
  },
  tile: {
    width: '49.2%',
    borderRadius: 8,
    marginBottom: 3,
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
    padding: 4,
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
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tileLevel: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  progressBarContainer: {
    padding: 2,
    backgroundColor: '#2c2c2e',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2c2c2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '4%',
    left: 16,
    right: 16,
    flexDirection: 'row',
  },
  actionButton: {
    height: 52,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  xpNeeded: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'left',
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: '4%',
    right: 16,
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#262626',
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
  rotatingCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: '#FFD700',
  },
  contentContainer: {
    flex: 1,
  },
}); 