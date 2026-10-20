ALTER TABLE public.job_posts ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending','approved','flagged'));
ALTER TABLE public.job_posts ALTER COLUMN moderation_status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.admin_moderate_job(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only.'; END IF;
  IF _status NOT IN ('pending','approved','flagged') THEN RAISE EXCEPTION 'Invalid status.'; END IF;
  UPDATE job_posts SET moderation_status = _status WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_job(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only.'; END IF;
  DELETE FROM messages WHERE conversation_id IN (SELECT c.id FROM conversations c JOIN job_applications a ON a.id = c.application_id WHERE a.job_id = _id);
  DELETE FROM conversations WHERE application_id IN (SELECT id FROM job_applications WHERE job_id = _id);
  DELETE FROM job_applications WHERE job_id = _id;
  DELETE FROM job_views WHERE job_id = _id;
  DELETE FROM job_posts WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found.'; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_moderate_job(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_job(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_job(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_jobs()
 RETURNS TABLE(id uuid, title text, description text, created_at timestamp with time zone, employment_type text, rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, portfolio_required boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT jp.id, jp.title, jp.description, jp.created_at, jp.employment_type, jp.rate_min, jp.rate_max, jp.hours_min, jp.hours_max, jp.portfolio_required
  FROM public.job_posts jp
  WHERE jp.status = 'open' AND jp.moderation_status <> 'flagged'
    AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
  ORDER BY jp.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.get_open_job(_id uuid)
 RETURNS TABLE(id uuid, title text, description text, employment_type text, project_duration text, rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, time_zones text[], experience_level text, must_have_tools text[], created_at timestamp with time zone, portfolio_required boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT j.id, j.title, j.description, j.employment_type, j.project_duration, j.rate_min, j.rate_max,
    j.hours_min, j.hours_max, j.time_zones, j.experience_level, j.must_have_tools, j.created_at, j.portfolio_required
  FROM job_posts j WHERE j.id = _id AND j.status = 'open' AND j.moderation_status <> 'flagged'
    AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
$$;

CREATE OR REPLACE FUNCTION public.apply_to_job(_job_id uuid, _profile_id uuid, _note text, _portfolio_url text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid; req boolean; url text := nullif(btrim(coalesce(_portfolio_url,'')), '');
BEGIN
  IF NOT public.has_role(auth.uid(),'applicant') THEN RAISE EXCEPTION 'Only applicants can apply.'; END IF;
  SELECT portfolio_required INTO req FROM job_posts WHERE id = _job_id AND status = 'open' AND moderation_status <> 'flagged';
  IF NOT FOUND THEN RAISE EXCEPTION 'This job is no longer open.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM applicant_profiles WHERE id = _profile_id AND owner_id = auth.uid() AND status = 'published') THEN
    RAISE EXCEPTION 'Choose one of your published profiles.'; END IF;
  IF EXISTS (SELECT 1 FROM job_applications WHERE job_id = _job_id AND applicant_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already applied to this job.'; END IF;
  IF req AND url IS NULL THEN RAISE EXCEPTION 'This job requires a portfolio link.'; END IF;
  IF url IS NOT NULL AND (url NOT LIKE 'https://%' OR char_length(url) > 300) THEN
    RAISE EXCEPTION 'Portfolio link must start with https:// and be at most 300 characters.'; END IF;
  INSERT INTO job_applications (job_id, applicant_id, applicant_profile_id, cover_note, portfolio_url)
  VALUES (_job_id, auth.uid(), _profile_id, left(coalesce(_note,''), 2000), url) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.protect_job_moderation()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN NEW.moderation_status := 'pending';
    ELSE NEW.moderation_status := OLD.moderation_status; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.protect_job_moderation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER job_posts_protect_moderation BEFORE INSERT OR UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.protect_job_moderation();