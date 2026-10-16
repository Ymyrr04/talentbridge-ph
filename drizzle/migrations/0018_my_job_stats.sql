CREATE OR REPLACE FUNCTION public.my_job_stats()
RETURNS TABLE(id uuid, title text, status text, created_at timestamptz, rate_min numeric, rate_max numeric, views bigint, applicants bigint, pending bigint, shortlisted bigint, rejected bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT j.id, j.title, j.status, j.created_at, j.rate_min, j.rate_max,
    (SELECT count(*) FROM job_views v WHERE v.job_id = j.id),
    (SELECT count(*) FROM job_applications a WHERE a.job_id = j.id),
    (SELECT count(*) FROM job_applications a WHERE a.job_id = j.id AND a.status = 'pending'),
    (SELECT count(*) FROM job_applications a WHERE a.job_id = j.id AND a.status = 'shortlisted'),
    (SELECT count(*) FROM job_applications a WHERE a.job_id = j.id AND a.status = 'rejected')
  FROM job_posts j
  WHERE j.owner_id = auth.uid() AND (public.has_role(auth.uid(),'client') OR public.has_role(auth.uid(),'admin'))
  ORDER BY j.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.my_job_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_job_stats() TO authenticated;