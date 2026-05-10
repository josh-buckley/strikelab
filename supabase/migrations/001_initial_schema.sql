-- StrikeLab Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (references auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stance TEXT NOT NULL DEFAULT 'orthodox',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User levels table (tracks XP and levels per category)
CREATE TABLE IF NOT EXISTS public.user_levels (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  punches_level INTEGER DEFAULT 1,
  punches_xp INTEGER DEFAULT 0,
  kicks_level INTEGER DEFAULT 1,
  kicks_xp INTEGER DEFAULT 0,
  elbows_level INTEGER DEFAULT 1,
  elbows_xp INTEGER DEFAULT 0,
  knees_level INTEGER DEFAULT 1,
  knees_xp INTEGER DEFAULT 0,
  footwork_level INTEGER DEFAULT 1,
  footwork_xp INTEGER DEFAULT 0,
  clinch_level INTEGER DEFAULT 1,
  clinch_xp INTEGER DEFAULT 0,
  defensive_level INTEGER DEFAULT 1,
  defensive_xp INTEGER DEFAULT 0,
  sweeps_level INTEGER DEFAULT 1,
  sweeps_xp INTEGER DEFAULT 0,
  feints_level INTEGER DEFAULT 1,
  feints_xp INTEGER DEFAULT 0
);

-- User progress table (body part progress)
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, body_part)
);

-- Category progress table
CREATE TABLE IF NOT EXISTS public.category_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily XP tracker
CREATE TABLE IF NOT EXISTS public.daily_xp_tracker (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_xp INTEGER DEFAULT 0
);

-- Workout logs table
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  technique_key TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  reps INTEGER,
  duration_seconds INTEGER,
  is_sparring BOOLEAN DEFAULT FALSE,
  sparring_intensity TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout templates table
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template components table
CREATE TABLE IF NOT EXISTS public.template_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  technique_key TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_sparring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout combos table
CREATE TABLE IF NOT EXISTS public.workout_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  training_type TEXT NOT NULL,
  training_mode TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  duration_seconds INTEGER,
  rounds INTEGER,
  round_minutes INTEGER,
  round_seconds INTEGER,
  techniques TEXT[],
  xp INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  distance NUMERIC,
  distance_unit TEXT
);

-- XP history table
CREATE TABLE IF NOT EXISTS public.xp_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  xp_gained INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'canceled', 'trial')),
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_xp_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_levels table
CREATE POLICY "Users can view own levels" ON public.user_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own levels" ON public.user_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own levels" ON public.user_levels
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_progress table
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for category_progress table
CREATE POLICY "Users can view own category progress" ON public.category_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category progress" ON public.category_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category progress" ON public.category_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_xp_tracker table
CREATE POLICY "Users can view own daily xp" ON public.daily_xp_tracker
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily xp" ON public.daily_xp_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily xp" ON public.daily_xp_tracker
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for workouts table
CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_logs table
CREATE POLICY "Users can view own workout logs" ON public.workout_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can update own workout logs" ON public.workout_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_logs.workout_id AND workouts.user_id = auth.uid())
  );

-- RLS Policies for workout_templates table
CREATE POLICY "Users can view own templates" ON public.workout_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.workout_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.workout_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.workout_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for template_components table
CREATE POLICY "Users can view own template components" ON public.template_components
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_components.template_id AND workout_templates.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own template components" ON public.template_components
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_components.template_id AND workout_templates.user_id = auth.uid())
  );

CREATE POLICY "Users can update own template components" ON public.template_components
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_components.template_id AND workout_templates.user_id = auth.uid())
  );

-- RLS Policies for workout_combos table
CREATE POLICY "Users can view own workout combos" ON public.workout_combos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_combos.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own workout combos" ON public.workout_combos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_combos.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can update own workout combos" ON public.workout_combos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_combos.workout_id AND workouts.user_id = auth.uid())
  );

-- RLS Policies for xp_history table
CREATE POLICY "Users can view own xp history" ON public.xp_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp history" ON public.xp_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_template_components_template_id ON public.template_components(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_combos_workout_id ON public.workout_combos(workout_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON public.xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_xp_tracker_user_date ON public.daily_xp_tracker(user_id, date);

-- Function to delete a user (for cleanup on failed signup)
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;
