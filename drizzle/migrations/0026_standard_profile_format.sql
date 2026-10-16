CREATE OR REPLACE FUNCTION public.valid_highlights(_h text[])
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT _h IS NULL OR (coalesce(array_length(_h,1),0) <= 5
    AND NOT EXISTS (SELECT 1 FROM unnest(_h) h WHERE h IS NULL OR char_length(h) NOT BETWEEN 1 AND 160))
$$;
ALTER TABLE public.applicant_profiles
  ADD COLUMN years_experience integer CHECK (years_experience BETWEEN 0 AND 50),
  ADD COLUMN field text CHECK (char_length(field) <= 60),
  ADD COLUMN highlights text[] CHECK (public.valid_highlights(highlights));
COMMENT ON COLUMN public.applicant_profiles.summary IS 'DEPRECATED: replaced by highlights';

CREATE OR REPLACE FUNCTION public.set_experience_level()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.years_experience IS NOT NULL THEN
    NEW.experience_level := CASE WHEN NEW.years_experience = 0 THEN 'under_1'
      WHEN NEW.years_experience <= 2 THEN '1_3' WHEN NEW.years_experience <= 4 THEN '3_5' ELSE '5_plus' END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER applicant_profiles_experience BEFORE INSERT OR UPDATE ON public.applicant_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_experience_level();

CREATE OR REPLACE FUNCTION public.incoming_application_profiles()
RETURNS TABLE(application_id uuid, years_experience integer, field text, highlights text[], availability_list text[], hours_per_week integer, time_zones text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.id, ap.years_experience, ap.field, ap.highlights, ap.availability_list, ap.hours_per_week, ap.time_zones
  FROM job_applications a JOIN job_posts j ON j.id = a.job_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE j.owner_id = auth.uid()
$$;