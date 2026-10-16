ALTER TABLE public.applicant_profiles ADD COLUMN voice_path text, ADD COLUMN voice_link text;
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_voice_link_check
  CHECK (voice_link IS NULL OR voice_link ~ '^https://(www\.)?(vocaroo\.com|voca\.ro)/[A-Za-z0-9]+/?$');
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_voice_one_check
  CHECK (voice_path IS NULL OR voice_link IS NULL);

CREATE POLICY "Owner uploads voice intros" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-intros' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner deletes voice intros" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-intros' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read voice intros" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-intros' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.job_applications a JOIN public.job_posts j ON j.id = a.job_id
               WHERE a.applicant_profile_id::text = (storage.foldername(name))[2] AND j.owner_id = auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.incoming_application_voices()
 RETURNS TABLE(application_id uuid, voice_path text, voice_link text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.id, ap.voice_path, ap.voice_link FROM job_applications a
  JOIN job_posts j ON j.id = a.job_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE j.owner_id = auth.uid() AND (ap.voice_path IS NOT NULL OR ap.voice_link IS NOT NULL)
$$;
GRANT EXECUTE ON FUNCTION public.incoming_application_voices() TO authenticated;