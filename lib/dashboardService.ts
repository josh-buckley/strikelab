import { supabase } from './supabase';

// ---- Types ----

export interface QuickStats {
  workoutsThisWeek: number;
  totalWorkouts: number;
  currentStreak: number;
  firstWorkoutDate: string | null;
}

export interface TrainingTypeBreakdown {
  trainingType: string;
  count: number;
}

export interface RecentWorkout {
  id: string;
  name: string;
  createdAt: string;
  durationSeconds: number;
  comboCount: number;
  trainingTypes: string[];
  notes: string;
}

export interface RecentTemplate {
  id: string;
  name: string;
}

export interface SparringIntensity {
  intensity: string;
  rounds: number;
}

// ---- Helpers ----

function getStartOfWeek(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

// ---- Fetchers ----

// Weekly rounds from workout_combos
export async function fetchWeeklyRounds(userId: string): Promise<number> {
  const startOfWeek = getStartOfWeek();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_combos (rounds)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());

  if (error || !data) return 0;

  let total = 0;
  for (const workout of data) {
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      total += c.rounds || 0;
    }
  }
  return total;
}

// Weekly rounds split by category
export async function fetchWeeklyRoundsBreakdown(
  userId: string
): Promise<{ sparring: number; partner: number; pads: number }> {
  const startOfWeek = getStartOfWeek();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_combos (training_type, rounds)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());

  if (error || !data) return { sparring: 0, partner: 0, pads: 0 };

  let sparring = 0;
  let partner = 0;
  let pads = 0;

  for (const workout of data) {
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      const type: string = (c.training_type || '').toLowerCase();
      const r = c.rounds || 0;
      if (type.includes('sparring')) {
        sparring += r;
      } else if (type.includes('partner')) {
        partner += r;
      } else if (type.includes('pad') || type.includes('mitts')) {
        pads += r;
      }
    }
  }

  return { sparring, partner, pads };
}

// Training type breakdown for this week
export async function fetchTrainingTypeBreakdown(
  userId: string
): Promise<TrainingTypeBreakdown[]> {
  const startOfWeek = getStartOfWeek();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_combos (training_type)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const workout of data) {
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      const type = c.training_type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([trainingType, count]) => ({ trainingType, count }))
    .sort((a, b) => b.count - a.count);
}

// Distinct techniques used this week
export async function fetchTechniqueDiversity(userId: string): Promise<number> {
  const startOfWeek = getStartOfWeek();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_combos (techniques)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());

  if (error || !data) return 0;

  const techSet = new Set<string>();
  for (const workout of data) {
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      if (c.techniques) {
        // techniques can be a string like "Jab - Cross" or an array
        const names = typeof c.techniques === 'string'
          ? c.techniques.split(' - ')
          : c.techniques;
        if (Array.isArray(names)) {
          names.forEach((n: string) => n && techSet.add(n));
        } else if (typeof names === 'string') {
          techSet.add(names);
        }
      }
    }
  }
  return techSet.size;
}

export interface TopCombo {
  techniques: string;
  count: number;
}

// Most used technique combination (all time)
export async function fetchTopCombo(userId: string): Promise<TopCombo | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      created_at,
      workout_combos (techniques)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  const counts: Record<string, { count: number; latest: string }> = {};
  for (const workout of data) {
    const createdAt = (workout as any).created_at;
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      const raw = c.techniques;
      if (!raw) continue;

      // techniques is stored as an array: ["Jab", "Cross"]
      const names: string[] = Array.isArray(raw) ? raw : String(raw).split(' - ');
      const key = names.filter(Boolean).join(' → ');
      if (!key) continue;

      if (!counts[key] || createdAt > counts[key].latest) {
        counts[key] = {
          count: (counts[key]?.count || 0) + 1,
          latest: counts[key]?.latest && counts[key].latest > createdAt ? counts[key].latest : createdAt,
        };
      } else {
        counts[key].count += 1;
      }
    }
  }

  const entries = Object.entries(counts).sort((a, b) => {
    // sort by count desc, then by latest desc for ties
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return b[1].latest.localeCompare(a[1].latest);
  });

  if (entries.length === 0) return null;

  return {
    techniques: entries[0][0],
    count: entries[0][1].count,
  };
}

// Recent workout templates
export async function fetchRecentTemplates(
  userId: string,
  limit = 3
): Promise<RecentTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((t: any) => ({ id: t.id, name: t.name }));
}

// Sparring log breakdown for this week
export async function fetchSparringLog(
  userId: string
): Promise<{ totalRounds: number; intensities: SparringIntensity[] }> {
  const startOfWeek = getStartOfWeek();

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_combos (training_type, rounds, round_minutes)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());

  if (error || !data) return { totalRounds: 0, intensities: [] };

  const intensityMap: Record<string, number> = {};
  let totalRounds = 0;

  for (const workout of data) {
    const combos = (workout as any).workout_combos || [];
    for (const c of combos) {
      const type: string = (c.training_type || '').toLowerCase();
      if (type.includes('sparring')) {
        // Extract intensity: "Light Sparring" → "Light", "Hard Sparring" → "Hard"
        const intensity = c.training_type.replace(/\s*sparring\s*/i, '').trim() || 'Sparring';
        const rounds = c.rounds || 1;
        intensityMap[intensity] = (intensityMap[intensity] || 0) + rounds;
        totalRounds += rounds;
      }
    }
  }

  const intensities = Object.entries(intensityMap)
    .map(([intensity, rounds]) => ({ intensity, rounds }))
    .sort((a, b) => b.rounds - a.rounds);

  return { totalRounds, intensities };
}

// ---- Quick Stats & Recent Workout ----

export async function fetchQuickStats(userId: string): Promise<QuickStats> {
  const now = new Date();
  const startOfWeek = getStartOfWeek();

  const { count: workoutsThisWeek } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString())
    .lte('created_at', now.toISOString());

  const { count: totalWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get first workout date
  const { data: firstWorkout } = await supabase
    .from('workouts')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  // Fetch all workout dates for streak calculation
  const { data: workouts } = await supabase
    .from('workouts')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  let currentStreak = 0;
  if (workouts && workouts.length > 0) {
    const first = workouts[0] as any;
    const mostRecent = new Date(first.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      mostRecent.toDateString() === today.toDateString() ||
      mostRecent.toDateString() === yesterday.toDateString()
    ) {
      currentStreak = 1;
      let prevDate = mostRecent;
      for (let i = 1; i < workouts.length; i++) {
        const currDate = new Date((workouts[i] as any).created_at);
        const diffDays = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          currentStreak++;
          prevDate = currDate;
        } else if (diffDays === 0) {
          continue;
        } else {
          break;
        }
      }
    }
  }

  return {
    workoutsThisWeek: workoutsThisWeek || 0,
    totalWorkouts: totalWorkouts || 0,
    currentStreak,
    firstWorkoutDate: (firstWorkout as any)?.created_at || null,
  };
}

export async function fetchRecentWorkout(userId: string): Promise<RecentWorkout | null> {
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      id,
      name,
      created_at,
      workout_combos (
        training_type,
        duration_minutes,
        duration_seconds
      ),
      workout_notes (
        notes
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !workout) return null;

  const w = workout as any;
  const combos: any[] = w.workout_combos || [];
  const durationSeconds = combos.reduce(
    (sum: number, c: any) => sum + (c.duration_minutes || 0) * 60 + (c.duration_seconds || 0),
    0
  );
  const trainingTypes = Array.from(
    new Set(combos.map((c: any) => c.training_type).filter(Boolean))
  ) as string[];

  const n = (w.workout_notes && w.workout_notes.length > 0) 
    ? w.workout_notes[0].notes 
    : '';

  return {
    id: w.id,
    name: w.name,
    createdAt: w.created_at,
    durationSeconds,
    comboCount: combos.length,
    trainingTypes,
    notes: n,
  };
}
