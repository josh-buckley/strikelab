import { router } from 'expo-router';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/AuthProvider';
import {
  fetchQuickStats,
  fetchWeeklyRounds,
  fetchWeeklyRoundsBreakdown,
  fetchRecentWorkout,
  fetchTopCombo,
  QuickStats,
  RecentWorkout,
  TopCombo,
} from '@/lib/dashboardService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

export default function HomeScreen() {
  const { session } = useAuth();

  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [roundsBreakdown, setRoundsBreakdown] = useState({ sparring: 0, partner: 0, pads: 0 });
  const [recentWorkout, setRecentWorkout] = useState<RecentWorkout | null>(null);
  const [topCombo, setTopCombo] = useState<TopCombo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      rotateAnimation.setValue(0);
      const loop = Animated.loop(
        Animated.timing(rotateAnimation, { toValue: 1, duration: 8000, useNativeDriver: true, easing: Easing.linear })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isFocused]);

  useEffect(() => {
    if (session?.user) fetchDashboardData();
    else setDataLoading(false);
  }, [session?.user]);

  async function fetchDashboardData() {
    try {
      setDataLoading(true);
      const userId = session!.user.id;
      const [stats, rounds, breakdown, workout, combo] = await Promise.all([
        fetchQuickStats(userId),
        fetchWeeklyRounds(userId),
        fetchWeeklyRoundsBreakdown(userId),
        fetchRecentWorkout(userId),
        fetchTopCombo(userId),
      ]);
      setQuickStats(stats);
      setRoundsBreakdown(breakdown);
      setRecentWorkout(workout);
      setTopCombo(combo);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

  const averagePerWeek = quickStats?.firstWorkoutDate
    ? ((quickStats?.totalWorkouts || 0) / Math.max(1, (Date.now() - new Date(quickStats.firstWorkoutDate).getTime()) / (7 * 24 * 60 * 60 * 1000))).toFixed(1)
    : '0.0';

  return (
    <ThemedView style={styles.container}>
      {/* Header — left aligned */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          strikelab
        </ThemedText>
        <TouchableOpacity onPress={() => router.push('/account')} style={styles.headerButton}>
          <IconSymbol name="person.circle" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {dataLoading ? (
          <ThemedText style={styles.emptyText}>Loading...</ThemedText>
        ) : (
          <>
            {/* Row 1: Rounds + Average */}
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Rounds This Week</ThemedText>
                <View style={styles.roundBlock}>
                  <View style={styles.roundRow}>
                    <ThemedText style={styles.roundValue}>{roundsBreakdown.sparring}</ThemedText>
                    <ThemedText style={styles.roundType}>Sparring</ThemedText>
                  </View>
                  <View style={styles.roundRow}>
                    <ThemedText style={styles.roundValue}>{roundsBreakdown.partner}</ThemedText>
                    <ThemedText style={styles.roundType}>Partner</ThemedText>
                  </View>
                  <View style={styles.roundRow}>
                    <ThemedText style={styles.roundValue}>{roundsBreakdown.pads}</ThemedText>
                    <ThemedText style={styles.roundType}>Pad</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Average</ThemedText>
                <ThemedText style={styles.cardHero}>{averagePerWeek}</ThemedText>
                <ThemedText style={styles.cardMeta}>workouts / week</ThemedText>
              </View>
            </View>

            {/* Last Session + Coach Feedback — full width, two columns */}
            <View style={styles.weeklyCard}>
              <ThemedText style={styles.cardTitle}>Last Session</ThemedText>
              <View style={styles.sessionRow}>
                <View style={styles.sessionLeft}>
                  {recentWorkout ? (
                    <>
                      <ThemedText style={styles.sessionName} numberOfLines={1}>{recentWorkout.name}</ThemedText>
                      <ThemedText style={styles.cardMeta}>
                        {formatDate(recentWorkout.createdAt)} · {formatDuration(recentWorkout.durationSeconds)}
                      </ThemedText>
                      <ThemedText style={styles.cardMeta}>{recentWorkout.comboCount} combos</ThemedText>
                      {recentWorkout.trainingTypes.length > 0 && (
                        <View style={styles.chipRow}>
                          {recentWorkout.trainingTypes.slice(0, 2).map((type) => (
                            <View key={type} style={styles.chip}>
                              <ThemedText style={styles.chipText}>{type}</ThemedText>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <ThemedText style={styles.cardMeta}>No sessions yet</ThemedText>
                  )}
                </View>

                <View style={styles.sessionRight}>
                  <ThemedText style={styles.coachLabel}>Coach Tip</ThemedText>
                  {recentWorkout?.notes ? (
                    <ThemedText style={styles.coachFeedback}>
                      "{recentWorkout.notes}"
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.coachFeedback}>
                      Log a workout to get feedback from your coach.
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>

            {/* Top Combo — full width */}
            <View style={styles.weeklyCard}>
              <ThemedText style={styles.cardTitle}>Top Combo</ThemedText>
              {topCombo ? (
                <View style={styles.topComboRow}>
                  <ThemedText style={styles.cardHero}>{topCombo.count}</ThemedText>
                  <View style={styles.topComboInfo}>
                    <ThemedText style={styles.topComboName} numberOfLines={2}>{topCombo.techniques}</ThemedText>
                    <ThemedText style={styles.cardMeta}>all time</ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText style={styles.cardMeta}>No data yet</ThemedText>
              )}
            </View>

            {/* Row 3: Streak */}
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Streak</ThemedText>
                <ThemedText style={styles.cardHero}>{quickStats?.currentStreak || 0}</ThemedText>
                <ThemedText style={styles.cardMeta}>days in a row</ThemedText>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <Animated.View style={[styles.rotatingRing, { transform: [{ rotate: rotateAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          <Svg width={88} height={88} viewBox="0 0 88 88">
            <Circle
              cx={44}
              cy={44}
              r={42}
              stroke="#FFD700"
              strokeWidth={1.5}
              strokeDasharray="14 6"
              fill="none"
            />
          </Svg>
        </Animated.View>
        <TouchableOpacity style={styles.fabButton} onPress={() => { router.navigate('/create-workout/name'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
          <IconSymbol name="plus" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
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
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    position: 'absolute',
    right: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Card grid
  cardRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.05)',
  },
  cardTitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  cardHero: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 36,
    color: '#FFD700',
    lineHeight: 42,
    marginBottom: 4,
  },
  cardMeta: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },

  // Rounds card
  roundBlock: { gap: 8 },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  roundValue: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 20,
    color: '#FFD700',
    lineHeight: 24,
  },
  roundType: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#fff',
  },

  // Full-width card
  weeklyCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.05)',
  },

  // Session two-column layout
  sessionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionLeft: { flex: 1 },
  sessionRight: {
    flex: 1.3,
    borderLeftWidth: 1,
    borderLeftColor: '#2c2c2e',
    paddingLeft: 14,
    justifyContent: 'flex-start',
  },
  sessionName: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  topComboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topComboInfo: { flex: 1 },
  topComboName: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    color: '#fff',
  },

  // Coach feedback
  coachLabel: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 12,
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  coachFeedback: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // Empty / loading
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins',
    padding: 24,
    fontStyle: 'italic',
  },

  // FAB
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
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rotatingRing: {
    position: 'absolute',
    width: 88,
    height: 88,
  },
});
