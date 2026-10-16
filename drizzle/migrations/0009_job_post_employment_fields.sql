ALTER TABLE public.job_posts
  ADD COLUMN experience_level text CHECK (experience_level IN ('any','under_1','1_3','3_5','5_plus')),
  ADD COLUMN employment_type text CHECK (employment_type IN ('full_time','part_time','project')),
  ADD COLUMN project_duration text CHECK (project_duration IN ('under_1','1_3','3_6','6_plus')),
  ADD COLUMN time_zones text[] CHECK (time_zones <@ ARRAY['us','australia','uk_eu']::text[]),
  ADD CONSTRAINT job_posts_project_duration_only_project CHECK (project_duration IS NULL OR employment_type = 'project');