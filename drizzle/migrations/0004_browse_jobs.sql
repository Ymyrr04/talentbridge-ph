CREATE OR REPLACE FUNCTION public.browse_jobs()
RETURNS TABLE (id uuid, title text, description text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jp.id, jp.title, jp.description, jp.created_at
  FROM public.job_posts jp
  WHERE jp.status = 'open'
    AND (public.has_role(auth.uid(), 'applicant') OR public.has_role(auth.uid(), 'admin'))
  ORDER BY jp.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.browse_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.browse_jobs() TO authenticated;