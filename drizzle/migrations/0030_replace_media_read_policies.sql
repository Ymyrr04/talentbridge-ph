DROP POLICY IF EXISTS "Clients view applicant intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Clients view applicant voice intros" ON storage.objects;

DROP POLICY IF EXISTS "Read intro videos" ON storage.objects;
CREATE POLICY "Read intro videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'intro-videos'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.client_can_view_profile_media(((storage.foldername(name))[2])::uuid)
  )
);

DROP POLICY IF EXISTS "Read voice intros" ON storage.objects;
CREATE POLICY "Read voice intros"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'voice-intros'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.client_can_view_profile_media(((storage.foldername(name))[2])::uuid)
  )
);