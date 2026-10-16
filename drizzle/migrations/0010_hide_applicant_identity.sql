DROP FUNCTION public.browse_talent();
CREATE OR REPLACE FUNCTION public.browse_talent()
RETURNS TABLE (id uuid, role_title text, hourly_rate numeric, updated_at timestamptz, initials text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ap.id, ap.role_title, ap.hourly_rate, ap.updated_at,
    upper(coalesce((regexp_match(p.name, '^\s*(\S)'))[1], '?'))
    || upper(coalesce((regexp_match(p.name, '^\s*\S+\s+(\S)'))[1], ''))
  FROM public.applicant_profiles ap JOIN public.profiles p ON p.id = ap.owner_id
  WHERE ap.status = 'published'
    AND (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'))
  ORDER BY ap.updated_at DESC
$$;
REVOKE ALL ON FUNCTION public.browse_talent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.browse_talent() TO authenticated;

DROP FUNCTION public.incoming_applications();
CREATE OR REPLACE FUNCTION public.incoming_applications()
RETURNS TABLE(id uuid, job_id uuid, job_title text, applicant_name text, role_title text, hourly_rate numeric, cover_note text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.job_id, j.title, p.name, ap.role_title, ap.hourly_rate, a.cover_note, a.status, a.created_at
  FROM job_applications a JOIN job_posts j ON j.id = a.job_id
  JOIN profiles p ON p.id = a.applicant_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE j.owner_id = auth.uid() ORDER BY a.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.incoming_applications() TO authenticated;