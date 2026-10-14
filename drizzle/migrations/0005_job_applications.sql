CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_profile_id uuid NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
  cover_note text NOT NULL DEFAULT '' CHECK (char_length(cover_note) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicant or admin reads applications" ON public.job_applications FOR SELECT TO authenticated
  USING (applicant_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Applicant withdraws own application" ON public.job_applications FOR DELETE TO authenticated
  USING (applicant_id = auth.uid());
CREATE TRIGGER job_applications_updated BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.apply_to_job(_job_id uuid, _profile_id uuid, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'applicant') THEN RAISE EXCEPTION 'Only applicants can apply.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM job_posts WHERE id = _job_id AND status = 'open') THEN RAISE EXCEPTION 'This job is no longer open.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM applicant_profiles WHERE id = _profile_id AND owner_id = auth.uid() AND status = 'published') THEN
    RAISE EXCEPTION 'Choose one of your published profiles.'; END IF;
  IF EXISTS (SELECT 1 FROM job_applications WHERE job_id = _job_id AND applicant_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already applied to this job.'; END IF;
  INSERT INTO job_applications (job_id, applicant_id, applicant_profile_id, cover_note)
  VALUES (_job_id, auth.uid(), _profile_id, left(coalesce(_note,''), 2000)) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.my_applications()
RETURNS TABLE(id uuid, job_id uuid, job_title text, job_status text, role_title text, cover_note text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.job_id, j.title, j.status, ap.role_title, a.cover_note, a.status, a.created_at
  FROM job_applications a JOIN job_posts j ON j.id = a.job_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE a.applicant_id = auth.uid() ORDER BY a.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.incoming_applications()
RETURNS TABLE(id uuid, job_id uuid, job_title text, applicant_name text, applicant_email text, role_title text, hourly_rate numeric, cover_note text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.job_id, j.title, p.name, p.email, ap.role_title, ap.hourly_rate, a.cover_note, a.status, a.created_at
  FROM job_applications a JOIN job_posts j ON j.id = a.job_id
  JOIN profiles p ON p.id = a.applicant_id JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  WHERE j.owner_id = auth.uid() ORDER BY a.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.set_application_status(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _status NOT IN ('pending','shortlisted','rejected') THEN RAISE EXCEPTION 'Invalid status.'; END IF;
  UPDATE job_applications a SET status = _status
  FROM job_posts j WHERE a.id = _id AND j.id = a.job_id AND j.owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found.'; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_to_job(uuid,uuid,text), public.my_applications(), public.incoming_applications(), public.set_application_status(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid,uuid,text), public.my_applications(), public.incoming_applications(), public.set_application_status(uuid,text) TO authenticated;