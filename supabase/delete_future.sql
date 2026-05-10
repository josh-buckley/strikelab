-- Delete workouts after May 9, 2026
DELETE FROM workout_notes
WHERE workout_id IN (
  SELECT id FROM workouts
  WHERE created_at > '2026-05-09 23:59:59+00'
);

DELETE FROM workout_combos
WHERE workout_id IN (
  SELECT id FROM workouts
  WHERE created_at > '2026-05-09 23:59:59+00'
);

DELETE FROM workouts
WHERE created_at > '2026-05-09 23:59:59+00';
