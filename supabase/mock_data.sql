-- ============================================================
-- STRIKELAB MOCK DATA — Complete
-- Run in Supabase SQL Editor
-- Clears existing data then creates 21 workouts Jan-May 2026
-- ============================================================

DO $$
DECLARE
  uid uuid;
  w uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'josh_buckley@iinet.net.au';
  IF uid IS NULL THEN RAISE EXCEPTION 'User not found. Check email.'; END IF;

  DELETE FROM workout_notes WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = uid);
  DELETE FROM workout_combos WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = uid);
  DELETE FROM workouts WHERE user_id = uid;
  DELETE FROM workout_templates WHERE user_id = uid;
  DELETE FROM user_levels WHERE user_id = uid;
  DELETE FROM xp_history WHERE user_id = uid;

  -- ========== JANUARY 2026 ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'New Year Kickoff', '2026-01-10 08:00:00+00', '2026-01-10 09:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Shadow Boxing', 'Rounds', 3, 3, NULL, 30, true),
    (w, 3, 'Heavy Bag', 'Rounds', 3, 3, ARRAY['Jab','Cross','Switch Kick'], 50, true),
    (w, 4, 'Heavy Bag', 'Rounds', 2, 3, ARRAY['Teep','Cross','Low Kick'], 40, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Good to be back. A bit rusty on the switch kick — focus on hip rotation and speed rather than power.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Saturday Sparring', '2026-01-17 10:00:00+00', '2026-01-17 11:30:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Running', 'Distance', NULL, NULL, NULL, 15, true),
    (w, 2, 'Warm-Up', 'Time', NULL, NULL, NULL, 15, true),
    (w, 3, 'Light Sparring', 'Rounds', 5, 3, NULL, 80, true),
    (w, 4, 'Technical Sparring', 'Rounds', 2, 3, NULL, 30, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Great energy. Your teep is becoming a real weapon — used it well to disrupt their rhythm. Build combos off the teep.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Morning', '2026-01-26 07:00:00+00', '2026-01-26 08:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Shadow Boxing', 'Rounds', 2, 3, NULL, 20, true),
    (w, 3, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Cross','Left Hook'], 50, true);

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Friday Session', '2026-01-31 17:00:00+00', '2026-01-31 18:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Cross','Switch Kick'], 50, true),
    (w, 3, 'Heavy Bag', 'Rounds', 2, 3, ARRAY['Teep','Cross','Low Kick'], 40, true);

  -- ========== FEBRUARY 2026 ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Valentines Bag Work', '2026-02-14 16:00:00+00', '2026-02-14 17:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Heavy Bag', 'Rounds', 4, 3, ARRAY['Jab','Cross','Jab to the Body','Low Kick'], 60, true),
    (w, 3, 'Heavy Bag', 'Rounds', 2, 2, ARRAY['Cross','Left Hook','Cross'], 30, true);

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Wednesday Sparring', '2026-02-19 18:30:00+00', '2026-02-19 19:45:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Warm-Up', 'Time', NULL, NULL, NULL, 15, true),
    (w, 2, 'Technical Sparring', 'Rounds', 3, 3, NULL, 45, true),
    (w, 3, 'Light Sparring', 'Rounds', 3, 3, NULL, 50, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Good use of angles in sparring. Your lateral movement is improving — keep working on circling out after combinations.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Partner Drills', '2026-02-24 07:00:00+00', '2026-02-24 08:15:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Shadow Boxing', 'Rounds', 2, 3, NULL, 20, true),
    (w, 2, 'Partner Drills', 'Rounds', 3, 3, ARRAY['Jab','Parry','Counter'], 50, true),
    (w, 3, 'Partner Drills', 'Rounds', 3, 3, ARRAY['Low Kick','Check','Return'], 50, true);

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Friday Pad Session', '2026-02-28 17:00:00+00', '2026-02-28 18:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Thai Pads', 'Rounds', 4, 3, ARRAY['Jab','Cross','Switch Kick'], 60, true);

  -- ========== MARCH 2026 ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Tuesday Bag Session', '2026-03-24 07:30:00+00', '2026-03-24 08:30:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Running', 'Distance', NULL, NULL, NULL, 15, true),
    (w, 2, 'Heavy Bag', 'Rounds', 3, 3, ARRAY['Jab','Cross','Left Hook'], 50, true),
    (w, 3, 'Heavy Bag', 'Rounds', 3, 3, ARRAY['Teep','Cross','Low Kick'], 50, true);

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Friday Sparring', '2026-03-27 18:00:00+00', '2026-03-27 19:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Warm-Up', 'Time', NULL, NULL, NULL, 15, true),
    (w, 2, 'Light Sparring', 'Rounds', 5, 3, NULL, 80, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Footwork is improving but still flat-footed between exchanges. Stay on the balls of your feet.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Morning', '2026-03-30 07:00:00+00', '2026-03-30 08:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Cross','Low Kick'], 50, true),
    (w, 3, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Teep','Cross','Switch Kick'], 50, true);

  -- ========== APRIL 2026 (2-3 weeks ago) ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Morning', '2026-04-27 07:00:00+00', '2026-04-27 08:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Cross'], 50, true),
    (w, 3, 'Thai Pads', 'Rounds', 2, 3, ARRAY['Jab','Cross','Switch Kick'], 40, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Keep left hand up when throwing cross to the body');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Wednesday Sparring', '2026-04-29 18:00:00+00', '2026-04-29 19:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Warm-Up', 'Reps', NULL, NULL, NULL, 10, true),
    (w, 2, 'Light Sparring', 'Rounds', 5, 3, NULL, 80, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Manage distance better — when getting out of range, do not move as far out. You are over-retreating.');

  -- ========== MAY 2026 (1-2 weeks ago) ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Friday Bag Work', '2026-05-01 16:00:00+00', '2026-05-01 17:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Heavy Bag', 'Rounds', 3, 3, ARRAY['Jab','Cross','Left Hook'], 50, true),
    (w, 3, 'Heavy Bag', 'Rounds', 2, 3, ARRAY['Teep','Cross','Switch Kick'], 40, true),
    (w, 4, 'Heavy Bag', 'Rounds', 2, 3, ARRAY['Jab','Cross','Jab to the Body','Right Teep to the Legs'], 40, true);

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Partner Work', '2026-05-04 07:00:00+00', '2026-05-04 08:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Partner Drills', 'Rounds', 3, 3, ARRAY['Catch','Parry','Counter Cross'], 50, true),
    (w, 2, 'Partner Drills', 'Rounds', 3, 3, ARRAY['Low Kick','Check','Return Low Kick'], 50, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Your checks are improving. Return the kick faster after checking — do not let your leg hang.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Wednesday Pads', '2026-05-06 07:30:00+00', '2026-05-06 08:30:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Shadow Boxing', 'Rounds', 3, 3, NULL, 30, true),
    (w, 2, 'Thai Pads', 'Rounds', 2, 3, ARRAY['Jab','Cross','Left Hook'], 40, true),
    (w, 3, 'Thai Pads', 'Rounds', 2, 3, ARRAY['Teep','Switch Kick','Cross'], 40, true),
    (w, 4, 'Thai Pads', 'Rounds', 2, 3, ARRAY['Jab','Slip','Cross','Left Body Kick'], 40, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Nice combination work. The jab-slip-cross is becoming natural. Work on getting your hip over more on the switch kick.');

  -- ========== THIS WEEK ==========

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Monday Pads', '2026-05-09 07:00:00+00', '2026-05-09 08:00:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Cross','Switch Kick'], 50, true),
    (w, 3, 'Thai Pads', 'Rounds', 3, 3, ARRAY['Jab','Jab','Cross','Low Kick'], 50, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Combinations flowing well. Keep chin tucked when throwing the cross.');

  INSERT INTO workouts (id, user_id, name, created_at, completed_at) VALUES (gen_random_uuid(), uid, 'Wednesday Morning', '2026-05-10 07:30:00+00', '2026-05-10 08:30:00+00') RETURNING id INTO w;
  INSERT INTO workout_combos (workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed) VALUES
    (w, 1, 'Skipping', 'Time', NULL, NULL, NULL, 20, true),
    (w, 2, 'Partner Drills', 'Rounds', 3, 3, ARRAY['Jab','Cross','Defend','Counter'], 50, true),
    (w, 3, 'Light Sparring', 'Rounds', 3, 3, NULL, 50, true);
  INSERT INTO workout_notes (workout_id, notes) VALUES (w, 'Your jab is setting everything up nicely. Try doubling up the jab before the cross — it freezes opponents and creates openings for the switch kick.');

  -- ========== TEMPLATES ==========

  INSERT INTO workout_templates (id, user_id, name, created_at) VALUES
    (gen_random_uuid(), uid, 'Standard Pad Session', '2026-04-20 00:00:00+00'),
    (gen_random_uuid(), uid, 'Sparring Warm-Up', '2026-04-10 00:00:00+00'),
    (gen_random_uuid(), uid, 'Bag Power Rounds', '2026-04-25 00:00:00+00');

  -- ========== USER LEVELS ==========

  INSERT INTO user_levels (user_id, punches_level, punches_xp, kicks_level, kicks_xp, elbows_level, elbows_xp, knees_level, knees_xp, footwork_level, footwork_xp, clinch_level, clinch_xp, defensive_level, defensive_xp, sweeps_level, sweeps_xp, feints_level, feints_xp)
  VALUES (uid, 3, 450, 2, 280, 1, 90, 1, 120, 2, 200, 1, 60, 2, 180, 1, 40, 1, 30);

  -- ========== XP HISTORY ==========

  INSERT INTO xp_history (user_id, category, xp_gained, created_at) VALUES
    (uid, 'punches', 50, '2026-04-27'),
    (uid, 'punches', 60, '2026-05-01'),
    (uid, 'punches', 50, '2026-05-04'),
    (uid, 'punches', 50, '2026-05-09'),
    (uid, 'kicks', 40, '2026-04-27'),
    (uid, 'kicks', 45, '2026-05-06'),
    (uid, 'kicks', 40, '2026-05-09'),
    (uid, 'defensive', 30, '2026-04-29'),
    (uid, 'defensive', 40, '2026-05-04'),
    (uid, 'defensive', 30, '2026-05-10'),
    (uid, 'footwork', 35, '2026-05-01'),
    (uid, 'footwork', 30, '2026-05-06'),
    (uid, 'clinch', 20, '2026-03-27'),
    (uid, 'elbows', 25, '2026-02-14'),
    (uid, 'knees', 30, '2026-03-30'),
    (uid, 'sweeps', 15, '2026-04-27'),
    (uid, 'feints', 10, '2026-05-09');

  RAISE NOTICE 'Done: 21 workouts (Jan-May 2026), 3 templates, user levels, XP history.';
END $$;
