CREATE TABLE public.applicant_cvs (
  owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  cv_path text NOT NULL,
  cv_original_filename text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applicant_cvs TO authenticated;
GRANT ALL ON public.applicant_cvs TO service_role;
ALTER TABLE public.applicant_cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads CV" ON public.applicant_cvs FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Applicant inserts own CV" ON public.applicant_cvs FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(),'applicant'));
CREATE POLICY "Owner updates CV" ON public.applicant_cvs FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes CV" ON public.applicant_cvs FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER applicant_cvs_updated BEFORE UPDATE ON public.applicant_cvs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.applicant_cvs (owner_id, cv_path, cv_original_filename, updated_at)
SELECT DISTINCT ON (owner_id) owner_id, cv_path, cv_original_filename, updated_at
FROM public.applicant_profiles WHERE cv_path IS NOT NULL
ORDER BY owner_id, updated_at DESC;

CREATE OR REPLACE FUNCTION public.require_cv_to_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'published' AND NOT EXISTS (SELECT 1 FROM applicant_cvs WHERE owner_id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Upload your CV in Settings before publishing.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER applicant_profiles_require_cv BEFORE INSERT OR UPDATE OF status, owner_id ON public.applicant_profiles
FOR EACH ROW EXECUTE FUNCTION public.require_cv_to_publish();

COMMENT ON COLUMN public.applicant_profiles.cv_path IS 'DEPRECATED: replaced by applicant_cvs.cv_path';
COMMENT ON COLUMN public.applicant_profiles.cv_original_filename IS 'DEPRECATED: replaced by applicant_cvs.cv_original_filename';