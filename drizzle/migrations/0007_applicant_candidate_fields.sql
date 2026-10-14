ALTER TABLE public.applicant_profiles
  ADD COLUMN skills text[] CHECK (skills IS NULL OR cardinality(skills) <= 15),
  ADD COLUMN experience_level text CHECK (experience_level IN ('under_1','1_3','3_5','5_plus')),
  ADD COLUMN summary text CHECK (summary IS NULL OR char_length(summary) <= 500),
  ADD COLUMN availability text CHECK (availability IN ('full_time','part_time','project')),
  ADD COLUMN hours_per_week integer CHECK (hours_per_week BETWEEN 1 AND 60),
  ADD COLUMN time_zones text[] CHECK (time_zones IS NULL OR time_zones <@ ARRAY['us','australia','uk_eu']::text[]),
  ADD COLUMN english_level text CHECK (english_level IN ('conversational','fluent','near_native'));