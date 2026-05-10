-- ============================================================
-- 30 MORE WORKOUTS — on completely new dates
-- Run after the main mock data script
-- ============================================================

DO $$
DECLARE
  uid uuid;
  w uuid;
  t text;
  techs text[];
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'josh_buckley@iinet.net.au';
  IF uid IS NULL THEN RAISE EXCEPTION 'User not found. Check email.'; END IF;

  -- Helper: create a workout with given name, date, and combos array (each combo: "type|rounds|minutes|techniques|xp")
  -- Techniques are pipe-separated, then joined with commas for combo display
  FOREACH t IN ARRAY ARRAY[
    -- January
    '2026-01-06 07:00|Tuesday Recovery|Skipping|Time|0|0||20|Shadow Boxing|Rounds|2|3||25|Heavy Bag|Rounds|2|2|Jab~Cross~Switch Kick|30',
    '2026-01-13 17:30|Wednesday Pads|Thai Pads|Rounds|3|3|Jab~Cross~Left Hook|50|Thai Pads|Rounds|2|3|Teep~Cross~Low Kick|30',
    '2026-01-21 18:00|Thursday Sparring|Warm-Up|Time|0|0||15|Technical Sparring|Rounds|3|3||45',
    '2026-01-28 16:00|Thursday Bag|Skipping|Time|0|0||20|Heavy Bag|Rounds|3|3|Jab~Cross~Left Body Kick|50',

    -- February
    '2026-02-03 07:00|Tuesday Morning|Running|Distance|0|0||15|Shadow Boxing|Rounds|2|3||20|Thai Pads|Rounds|3|3|Jab~Cross~Switch Kick|50',
    '2026-02-10 18:30|Tuesday Sparring|Warm-Up|Time|0|0||10|Partner Drills|Rounds|3|3|Jab~Parry~Counter Cross|50|Light Sparring|Rounds|3|3||50',
    '2026-02-17 07:30|Wednesday Bag|Skipping|Time|0|0||20|Heavy Bag|Rounds|4|3|Cross~Left Hook~Low Kick|60|Heavy Bag|Rounds|3|2|Teep~Cross~Switch Kick~Cross|40',
    '2026-02-25 17:00|Wednesday Pads|Skipping|Time|0|0||20|Thai Pads|Rounds|3|3|Jab~Cross~Left Hook|50|Thai Pads|Rounds|2|3|Jab~Jab~Cross~Low Kick|40',

    -- March
    '2026-03-03 07:00|Tuesday Morning|Skipping|Time|0|0||20|Shadow Boxing|Rounds|3|3||30|Partner Drills|Rounds|3|3|Jab~Cross~Defend~Counter|50',
    '2026-03-10 18:00|Tuesday Sparring|Warm-Up|Time|0|0||15|Medium Sparring|Rounds|4|3||80',
    '2026-03-17 07:30|Wednesday Pads|Skipping|Time|0|0||20|Thai Pads|Rounds|3|3|Teep~Fake Teep~Cross~Left Hook|50|Thai Pads|Rounds|2|3|Jab~Cross~Left Body Kick|40',
    '2026-03-19 17:00|Thursday Bag|Heavy Bag|Rounds|4|3|Jab~Cross~Switch Kick~Low Kick|60|Heavy Bag|Rounds|3|3|Cross~Left Hook~Cross~Low Kick|50',

    -- April
    '2026-04-01 07:00|Wednesday Morning|Shadow Boxing|Rounds|3|3||30|Thai Pads|Rounds|3|3|Jab~Cross~Left Hook|50',
    '2026-04-07 18:00|Tuesday Sparring|Warm-Up|Time|0|0||15|Light Sparring|Rounds|4|3||60|Technical Sparring|Rounds|2|3||30',
    '2026-04-14 07:30|Tuesday Bag|Skipping|Time|0|0||20|Heavy Bag|Rounds|3|3|Jab~Cross~Teep~Cross~Low Kick|50|Heavy Bag|Rounds|2|3|Jab~Slip~Cross~Left Hook|40',
    '2026-04-16 17:00|Thursday Pads|Skipping|Time|0|0||20|Thai Pads|Rounds|3|3|Jab~Cross~Switch Kick~Cross|50|Thai Pads|Rounds|2|3|Teep~Cross~Left Body Kick|40',
    '2026-04-21 07:00|Tuesday Morning|Running|Distance|0|0||15|Shadow Boxing|Rounds|2|3||25|Partner Drills|Rounds|3|3|Low Kick~Check~Return|50',
    '2026-04-23 18:00|Thursday Sparring|Warm-Up|Time|0|0||15|Light Sparring|Rounds|5|3||80',

    -- May (avoiding 1,4,6,9,10)
    '2026-05-05 07:30|Tuesday Morning|Skipping|Time|0|0||20|Heavy Bag|Rounds|3|3|Jab~Jab~Cross~Low Kick|50|Heavy Bag|Rounds|2|3|Teep~Cross~Switch Kick|40',
    '2026-05-08 17:00|Friday Recovery|Running|Distance|0|0||15|Shadow Boxing|Rounds|2|3||20|Heavy Bag|Rounds|2|3|Jab~Cross~Left Hook|30',

    -- June
    '2026-06-02 07:00|Tuesday Morning|Skipping|Time|0|0||20|Thai Pads|Rounds|3|3|Jab~Cross~Switch Kick|50|Thai Pads|Rounds|2|3|Teep~Cross~Left Body Kick|40',
    '2026-06-09 18:00|Tuesday Sparring|Warm-Up|Time|0|0||15|Light Sparring|Rounds|4|3||60|Medium Sparring|Rounds|2|3||40',
    '2026-06-16 07:30|Wednesday Pads|Skipping|Time|0|0||20|Shadow Boxing|Rounds|2|3||20|Thai Pads|Rounds|3|3|Jab~Cross~Left Hook~Low Kick|50',
    '2026-06-23 17:00|Tuesday Bag|Heavy Bag|Rounds|3|3|Jab~Cross~Switch Kick|50|Heavy Bag|Rounds|3|3|Teep~Cross~Left Hook~Low Kick|50|Heavy Bag|Rounds|2|3|Cross~Left Hook~Cross~Low Kick|40',

    -- July
    '2026-07-01 07:00|Wednesday Morning|Skipping|Time|0|0||20|Heavy Bag|Rounds|4|3|Jab~Cross~Jab to the Body~Low Kick|60',
    '2026-07-14 18:00|Tuesday Sparring|Warm-Up|Time|0|0||15|Technical Sparring|Rounds|3|3||45|Light Sparring|Rounds|3|3||50',
    '2026-07-28 17:30|Tuesday Pads|Running|Distance|0|0||15|Thai Pads|Rounds|3|3|Jab~Cross~Switch Kick|50|Thai Pads|Rounds|3|3|Teep~Cross~Low Kick|50',

    -- August
    '2026-08-11 07:00|Tuesday Morning|Skipping|Time|0|0||20|Partner Drills|Rounds|3|3|Jab~Cross~Defend~Counter|50|Light Sparring|Rounds|3|3||50',
    '2026-08-25 18:00|Tuesday Sparring|Warm-Up|Time|0|0||15|Light Sparring|Rounds|5|3||80'
  ] LOOP
    -- Parse the pipe-separated workout
    DECLARE
      parts text[];
      date_str text;
      name_str text;
      combo_parts text[];
      combo_piece text;
      combos_array text[];
    BEGIN
      parts := string_to_array(t, '|');
      date_str := parts[1];
      name_str := parts[2];

      -- Insert workout
      INSERT INTO workouts (id, user_id, name, created_at, completed_at)
      VALUES (gen_random_uuid(), uid, name_str, (date_str || '+00')::timestamptz, (date_str || '+01:00:00')::timestamptz)
      RETURNING id INTO w;

      -- Parse combos (each is 5 fields: type, mode, rounds, mins, techniques, xp)
      FOR i IN 3..array_length(parts, 1) BY 6 LOOP
        IF i + 5 <= array_length(parts, 1) THEN
          INSERT INTO workout_combos (
            workout_id, sequence_number, training_type, training_mode, rounds, round_minutes, techniques, xp, completed
          ) VALUES (
            w,
            (i - 3) / 6 + 1,
            parts[i],
            parts[i+1],
            CASE WHEN parts[i+2] = '0' THEN NULL ELSE parts[i+2]::int END,
            CASE WHEN parts[i+3] = '0' THEN NULL ELSE parts[i+3]::int END,
            CASE WHEN parts[i+4] = '' THEN NULL ELSE string_to_array(parts[i+4], '~') END,
            parts[i+5]::int,
            true
          );
        END IF;
      END LOOP;
    END;
  END LOOP;

  RAISE NOTICE 'Added 30 new workouts on fresh dates across 2026.';
END $$;
