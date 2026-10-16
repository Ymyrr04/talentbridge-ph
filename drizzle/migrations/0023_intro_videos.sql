ALTER TABLE public.applicant_profiles ADD COLUMN video_path text, ADD COLUMN video_duration_seconds integer
  CHECK (video_duration_seconds IS NULL OR (video_duration_seconds >= 0 AND video_duration_seconds <= 120));

CREATE POLICY "Owner uploads intro videos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'intro-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner deletes intro videos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'intro-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read intro videos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'intro-videos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.job_applications a JOIN public.job_posts j ON j.id = a.job_id
               WHERE a.applicant_profile_id::text = (storage.foldername(name))[2] AND j.owner_id = auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.incoming_application_videos()
 RETURNS TABLE(application_id uuid, video_path text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.id, ap.video_path FROM job_applications a
  JOIN job_posts j ON j.id = a.job_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE j.owner_id = auth.uid() AND ap.video_path IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.incoming_application_videos() TO authenticated;