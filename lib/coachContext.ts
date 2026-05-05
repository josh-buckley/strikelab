import { supabase } from './supabase';
import {
  fetchQuickStats,
  fetchWeeklyRoundsBreakdown,
  fetchRecentWorkout,
  fetchTopCombo,
  QuickStats,
  RecentWorkout,
  TopCombo,
} from './dashboardService';

export interface CoachContext {
  stats: QuickStats | null;
  roundsBreakdown: { sparring: number; partner: number; pads: number };
  recentWorkout: RecentWorkout | null;
  topCombo: TopCombo | null;
  recentWorkouts: RecentWorkout[];
}

// Fetch all relevant user data for coach context
export async function fetchCoachContext(userId: string): Promise<CoachContext> {
  const [stats, roundsBreakdown, recentWorkout, topCombo] = await Promise.all([
    fetchQuickStats(userId),
    fetchWeeklyRoundsBreakdown(userId),
    fetchRecentWorkout(userId),
    fetchTopCombo(userId).catch(() => null),
  ]);

  // Fetch last 5 workouts for broader context
  const recentWorkouts = await fetchRecentWorkouts(userId, 5);

  return {
    stats,
    roundsBreakdown,
    recentWorkout,
    topCombo,
    recentWorkouts,
  };
}

// Fetch last N workouts with combos and notes
async function fetchRecentWorkouts(userId: string, limit: number): Promise<RecentWorkout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      name,
      created_at,
      workout_combos (training_type, rounds, duration_minutes, duration_seconds, techniques),
      workout_notes (notes)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((w: any) => {
    const combos = w.workout_combos || [];
    const totalSeconds = combos.reduce((sum: number, c: any) =>
      sum + ((c.duration_minutes || 0) * 60) + (c.duration_seconds || 0), 0);
    const types = [...new Set(combos.map((c: any) => c.training_type).filter(Boolean))];
    const notesData = w.workout_notes?.[0];
    return {
      id: w.id,
      name: w.name,
      createdAt: w.created_at,
      durationSeconds: totalSeconds,
      comboCount: combos.length,
      trainingTypes: types as string[],
      notes: notesData?.notes || '',
    };
  });
}

// Format context into a compact string for the AI system prompt
export function formatCoachContext(ctx: CoachContext): string {
  const parts: string[] = [];

  // Quick stats
  if (ctx.stats) {
    parts.push(`Training stats: ${ctx.stats.totalWorkouts} total workouts, ${ctx.stats.workoutsThisWeek} this week, ${ctx.stats.currentStreak}-day streak.`);
  }

  // Rounds this week
  const rounds = ctx.roundsBreakdown;
  if (rounds.sparring + rounds.partner + rounds.pads > 0) {
    parts.push(`Rounds this week: ${rounds.sparring} sparring, ${rounds.partner} partner, ${rounds.pads} pad.`);
  }

  // Top combo
  if (ctx.topCombo) {
    parts.push(`Most-used combo: "${ctx.topCombo.techniques}" (used ${ctx.topCombo.count}x).`);
  }

  // Recent workouts
  if (ctx.recentWorkouts.length > 0) {
    const workoutLines = ctx.recentWorkouts.map((w) => {
      const date = new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const types = w.trainingTypes.length > 0 ? w.trainingTypes.join(', ') : 'training';
      const mins = Math.floor(w.durationSeconds / 60);
      let line = `${date}: "${w.name}" — ${types}, ${mins}min, ${w.comboCount} combos`;
      if (w.notes) line += `. Notes: "${w.notes}"`;
      return line;
    });
    parts.push(`Recent workouts:\n${workoutLines.map(l => `  - ${l}`).join('\n')}`);
  }

  return parts.join('\n\n');
}
