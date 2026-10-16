CREATE TABLE public.job_views (
  job_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, viewer_id)
);
GRANT ALL ON public.job_views TO service_role;
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_job_view(_job_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.has_role(auth.uid(),'applicant') AND EXISTS (SELECT 1 FROM job_posts WHERE id=_job_id AND status='open') THEN
    INSERT INTO job_views (job_id, viewer_id) VALUES (_job_id, auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_open_job(_id uuid)
RETURNS TABLE(id uuid, title text, description text, employment_type text, project_duration text,
  rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, time_zones text[],
  experience_level text, must_have_tools text[], created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT j.id, j.title, j.description, j.employment_type, j.project_duration, j.rate_min, j.rate_max,
    j.hours_min, j.hours_max, j.time_zones, j.experience_level, j.must_have_tools, j.created_at
  FROM job_posts j WHERE j.id = _id AND j.status = 'open' AND public.has_role(auth.uid(),'applicant')
$$;

DROP FUNCTION public.browse_jobs();
CREATE FUNCTION public.browse_jobs()
RETURNS TABLE(id uuid, title text, description text, created_at timestamptz, employment_type text,
  rate_min numeric, rate_max numeric, hours_min integer, hours_max integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jp.id, jp.title, jp.description, jp.created_at, jp.employment_type, jp.rate_min, jp.rate_max, jp.hours_min, jp.hours_max
  FROM public.job_posts jp
  WHERE jp.status = 'open' AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
  ORDER BY jp.created_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.record_job_view(uuid), public.get_open_job(uuid), public.browse_jobs() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_job_view(uuid), public.get_open_job(uuid), public.browse_jobs() TO authenticated;