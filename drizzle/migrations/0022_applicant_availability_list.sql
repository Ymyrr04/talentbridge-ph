ALTER TABLE public.applicant_profiles ADD COLUMN availability_list text[];
UPDATE public.applicant_profiles SET availability_list = ARRAY[availability] WHERE availability IS NOT NULL;
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_availability_list_check
  CHECK (availability_list IS NULL OR availability_list <@ ARRAY['full_time','part_time','project']::text[]);
ALTER TABLE public.applicant_profiles DROP CONSTRAINT applicant_profiles_time_zones_check;
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_time_zones_check
  CHECK (time_zones IS NULL OR time_zones <@ ARRAY['any','us','australia','uk_eu']::text[]);
COMMENT ON COLUMN public.applicant_profiles.availability IS 'DEPRECATED: replaced by availability_list';
COMMENT ON COLUMN public.applicant_profiles.english_level IS 'DEPRECATED: no longer collected';