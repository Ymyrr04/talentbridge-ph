CREATE OR REPLACE FUNCTION public.client_can_view_cv(_path text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM applicant_cvs c
    JOIN job_applications a ON a.applicant_id = c.owner_id
    JOIN job_posts j ON j.id = a.job_id
    WHERE c.cv_path = _path AND j.owner_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.client_can_view_cv(text) TO authenticated;

CREATE POLICY "Clients view CVs of their applicants"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cv-uploads' AND public.client_can_view_cv(name));

DROP FUNCTION public.incoming_applications();

CREATE FUNCTION public.incoming_applications()
RETURNS TABLE(id uuid, job_id uuid, job_title text, applicant_name text, role_title text, hourly_rate numeric, cover_note text, status text, created_at timestamptz, cv_path text, cv_original_filename text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.id, a.job_id, j.title, p.name, ap.role_title, ap.hourly_rate, a.cover_note, a.status, a.created_at,
    c.cv_path, c.cv_original_filename
  FROM job_applications a
  JOIN job_posts j ON j.id = a.job_id
  JOIN profiles p ON p.id = a.applicant_id
  JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  LEFT JOIN applicant_cvs c ON c.owner_id = a.applicant_id
  WHERE j.owner_id = auth.uid()
  ORDER BY a.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.incoming_applications() TO authenticated;