CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- Applicant profiles
CREATE TABLE public.applicant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title text NOT NULL CHECK (char_length(btrim(role_title)) BETWEEN 1 AND 80),
  hourly_rate numeric(10,2) NOT NULL CHECK (hourly_rate >= 1 AND hourly_rate <= 500),
  cv_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX applicant_profiles_owner_idx ON public.applicant_profiles(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applicant_profiles TO authenticated;
GRANT ALL ON public.applicant_profiles TO service_role;
ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads applicant profiles" ON public.applicant_profiles FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Applicant inserts own profiles" ON public.applicant_profiles FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'applicant'));
CREATE POLICY "Owner updates applicant profiles" ON public.applicant_profiles FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes applicant profiles" ON public.applicant_profiles FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_applicant_profile_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('applicant_profiles:' || NEW.owner_id::text));
  IF (SELECT count(*) FROM public.applicant_profiles WHERE owner_id = NEW.owner_id AND id <> NEW.id) >= 3 THEN
    RAISE EXCEPTION 'You''ve reached the 3 profile limit.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_applicant_profile_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER applicant_profiles_limit BEFORE INSERT OR UPDATE OF owner_id ON public.applicant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_applicant_profile_limit();
CREATE TRIGGER applicant_profiles_updated BEFORE UPDATE ON public.applicant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Job posts
CREATE TABLE public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_posts_owner_idx ON public.job_posts(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO authenticated;
GRANT ALL ON public.job_posts TO service_role;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads job posts" ON public.job_posts FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Client inserts own job posts" ON public.job_posts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'client'));
CREATE POLICY "Owner updates job posts" ON public.job_posts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes job posts" ON public.job_posts FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE TRIGGER job_posts_updated BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Optional phone on profiles
ALTER TABLE public.profiles ADD COLUMN phone text CHECK (phone IS NULL OR char_length(phone) <= 30);

-- CV storage: {user_id}/file.pdf|docx, owner + admin read
CREATE POLICY "CV owner or admin reads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cv-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "CV owner uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('pdf','docx') AND public.has_role(auth.uid(), 'applicant'));
CREATE POLICY "CV owner updates" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('pdf','docx'));
CREATE POLICY "CV owner deletes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);