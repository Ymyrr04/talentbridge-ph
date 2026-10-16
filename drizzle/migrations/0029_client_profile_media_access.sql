CREATE OR REPLACE FUNCTION public.client_can_view_profile_media(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_applications a
    JOIN job_posts j ON j.id = a.job_id
    WHERE a.applicant_profile_id = _profile_id AND j.owner_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.client_can_view_profile_media(uuid) TO authenticated;

DROP POLICY IF EXISTS "Clients view applicant intro videos" ON storage.objects;
CREATE POLICY "Clients view applicant intro videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'intro-videos' AND public.client_can_view_profile_media(((storage.foldername(name))[2])::uuid));

DROP POLICY IF EXISTS "Clients view applicant voice intros" ON storage.objects;
CREATE POLICY "Clients view applicant voice intros"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-intros' AND public.client_can_view_profile_media(((storage.foldername(name))[2])::uuid));