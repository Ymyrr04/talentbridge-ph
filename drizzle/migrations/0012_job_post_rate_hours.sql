ALTER TABLE public.job_posts
  ADD COLUMN hourly_rate numeric CHECK (hourly_rate BETWEEN 1 AND 500),
  ADD COLUMN hours_per_week integer CHECK (hours_per_week BETWEEN 1 AND 60);
ALTER TABLE public.job_posts ADD CONSTRAINT job_posts_open_requires_rate_hours
  CHECK (status <> 'open' OR (hourly_rate IS NOT NULL AND hours_per_week IS NOT NULL)) NOT VALID;