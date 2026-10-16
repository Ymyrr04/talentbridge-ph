ALTER TABLE public.job_posts
  ADD COLUMN rate_min numeric, ADD COLUMN rate_max numeric,
  ADD COLUMN hours_min integer, ADD COLUMN hours_max integer;
UPDATE public.job_posts SET rate_min = hourly_rate, rate_max = hourly_rate, hours_min = hours_per_week, hours_max = hours_per_week
  WHERE hourly_rate IS NOT NULL OR hours_per_week IS NOT NULL;
ALTER TABLE public.job_posts
  ADD CONSTRAINT job_posts_rate_min_range CHECK (rate_min BETWEEN 1 AND 500),
  ADD CONSTRAINT job_posts_rate_max_range CHECK (rate_max BETWEEN 1 AND 500),
  ADD CONSTRAINT job_posts_hours_min_range CHECK (hours_min BETWEEN 1 AND 60),
  ADD CONSTRAINT job_posts_hours_max_range CHECK (hours_max BETWEEN 1 AND 60),
  ADD CONSTRAINT job_posts_rate_order CHECK (rate_max >= rate_min),
  ADD CONSTRAINT job_posts_hours_order CHECK (hours_max >= hours_min);
ALTER TABLE public.job_posts DROP CONSTRAINT job_posts_open_requires_rate_hours;
ALTER TABLE public.job_posts ADD CONSTRAINT job_posts_open_requires_ranges
  CHECK (status <> 'open' OR (rate_min IS NOT NULL AND rate_max IS NOT NULL AND hours_min IS NOT NULL AND hours_max IS NOT NULL)) NOT VALID;
COMMENT ON COLUMN public.job_posts.hourly_rate IS 'DEPRECATED: replaced by rate_min / rate_max';
COMMENT ON COLUMN public.job_posts.hours_per_week IS 'DEPRECATED: replaced by hours_min / hours_max';