import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Creates or ensures a user profile exists with all required related data.
 * This function is idempotent - it will not create duplicate data.
 *
 * Creates:
 * - User profile in 'users' table
 * - User levels in 'user_levels' table
 * - Category progress for all 9 categories
 * - Daily XP tracker entry for today
 *
 * @param user - The Supabase User object
 * @param options - Optional overrides for default values
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function ensureUserProfile(
  user: User,
  options?: {
    stance?: 'orthodox' | 'southpaw';
  }
): Promise<{ success: boolean; error?: string }> {
  const { stance = 'orthodox' } = options || {};

  console.log('ensureUserProfile: Starting for user:', user.id);

  try {
    // 1. Check/Create user profile
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new users
      console.error('ensureUserProfile: Error checking profile:', profileCheckError);
      throw profileCheckError;
    }

    if (!existingProfile) {
      console.log('ensureUserProfile: Creating new profile');
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          stance,
        });

      if (profileError) {
        // Check if it's a duplicate key error (profile was created between check and insert)
        if (profileError.code === '23505') {
          console.log('ensureUserProfile: Profile already exists (race condition), continuing');
        } else {
          console.error('ensureUserProfile: Error creating profile:', profileError);
          throw profileError;
        }
      } else {
        console.log('ensureUserProfile: Profile created successfully');
      }
    } else {
      console.log('ensureUserProfile: Profile already exists');
    }

    // 2. Check/Create user levels
    const { data: existingLevels, error: levelsCheckError } = await supabase
      .from('user_levels')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (levelsCheckError && levelsCheckError.code !== 'PGRST116') {
      console.error('ensureUserProfile: Error checking user levels:', levelsCheckError);
      throw levelsCheckError;
    }

    if (!existingLevels) {
      console.log('ensureUserProfile: Creating user levels');
      const { error: levelsError } = await supabase
        .from('user_levels')
        .insert({
          user_id: user.id,
          punches_level: 1,
          punches_xp: 0,
          kicks_level: 1,
          kicks_xp: 0,
          elbows_level: 1,
          elbows_xp: 0,
          knees_level: 1,
          knees_xp: 0,
          footwork_level: 1,
          footwork_xp: 0,
          clinch_level: 1,
          clinch_xp: 0,
          defensive_level: 1,
          defensive_xp: 0,
          sweeps_level: 1,
          sweeps_xp: 0,
          feints_level: 1,
          feints_xp: 0,
        });

      if (levelsError && levelsError.code !== '23505') {
        console.error('ensureUserProfile: Error creating user levels:', levelsError);
        throw levelsError;
      }
      console.log('ensureUserProfile: User levels created successfully');
    } else {
      console.log('ensureUserProfile: User levels already exist');
    }

    // 3. Check/Create category progress
    const categories = [
      'punches', 'kicks', 'elbows', 'knees', 'footwork',
      'clinch', 'defensive', 'sweeps', 'feints'
    ];

    const { data: existingCategories, error: categoriesCheckError } = await supabase
      .from('category_progress')
      .select('name')
      .eq('user_id', user.id);

    if (categoriesCheckError) {
      console.error('ensureUserProfile: Error checking category progress:', categoriesCheckError);
      throw categoriesCheckError;
    }

    const existingCategoryNames = new Set(existingCategories?.map(c => c.name) || []);
    const missingCategories = categories.filter(cat => !existingCategoryNames.has(cat));

    if (missingCategories.length > 0) {
      console.log('ensureUserProfile: Creating missing category progress:', missingCategories);
      const categoryEntries = missingCategories.map(category => ({
        user_id: user.id,
        name: category,
        xp: 0,
        level: 1,
      }));

      const { error: categoryError } = await supabase
        .from('category_progress')
        .insert(categoryEntries);

      if (categoryError && categoryError.code !== '23505') {
        console.error('ensureUserProfile: Error creating category progress:', categoryError);
        throw categoryError;
      }
      console.log('ensureUserProfile: Category progress created successfully');
    } else {
      console.log('ensureUserProfile: All category progress already exists');
    }

    // 4. Check/Create daily XP tracker for today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingTracker, error: trackerCheckError } = await supabase
      .from('daily_xp_tracker')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (trackerCheckError && trackerCheckError.code !== 'PGRST116') {
      console.error('ensureUserProfile: Error checking daily XP tracker:', trackerCheckError);
      throw trackerCheckError;
    }

    if (!existingTracker) {
      console.log('ensureUserProfile: Creating daily XP tracker for today');
      const { error: trackerError } = await supabase
        .from('daily_xp_tracker')
        .insert({
          user_id: user.id,
          date: today,
          workout_count: 0,
        });

      if (trackerError && trackerError.code !== '23505') {
        console.error('ensureUserProfile: Error creating daily XP tracker:', trackerError);
        throw trackerError;
      }
      console.log('ensureUserProfile: Daily XP tracker created successfully');
    } else {
      console.log('ensureUserProfile: Daily XP tracker already exists for today');
    }

    console.log('ensureUserProfile: All user data ensured successfully');
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ensureUserProfile: Failed to ensure user profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
