ALTER TABLE public.job_posts ADD COLUMN portfolio_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_applications ADD COLUMN portfolio_url text;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_portfolio_url_check
  CHECK (portfolio_url IS NULL OR (portfolio_url LIKE 'https://%' AND char_length(portfolio_url) <= 300));

DROP FUNCTION public.apply_to_job(uuid, uuid, text);
CREATE FUNCTION public.apply_to_job(_job_id uuid, _profile_id uuid, _note text, _portfolio_url text DEFAULT NULL)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE new_id uuid; req boolean; url text := nullif(btrim(coalesce(_portfolio_url,'')), '');
BEGIN
  IF NOT public.has_role(auth.uid(),'applicant') THEN RAISE EXCEPTION 'Only applicants can apply.'; END IF;
  SELECT portfolio_required INTO req FROM job_posts WHERE id = _job_id AND status = 'open';
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
END $function$;
GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid, uuid, text, text) TO authenticated;

DROP FUNCTION public.browse_jobs();
CREATE FUNCTION public.browse_jobs()
 RETURNS TABLE(id uuid, title text, description text, created_at timestamp with time zone, employment_type text, rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, portfolio_required boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jp.id, jp.title, jp.description, jp.created_at, jp.employment_type, jp.rate_min, jp.rate_max, jp.hours_min, jp.hours_max, jp.portfolio_required
  FROM public.job_posts jp
  WHERE jp.status = 'open' AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
  ORDER BY jp.created_at DESC
$function$;
GRANT EXECUTE ON FUNCTION public.browse_jobs() TO authenticated;

DROP FUNCTION public.get_open_job(uuid);
CREATE FUNCTION public.get_open_job(_id uuid)
 RETURNS TABLE(id uuid, title text, description text, employment_type text, project_duration text, rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, time_zones text[], experience_level text, must_have_tools text[], created_at timestamp with time zone, portfolio_required boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT j.id, j.title, j.description, j.employment_type, j.project_duration, j.rate_min, j.rate_max,
    j.hours_min, j.hours_max, j.time_zones, j.experience_level, j.must_have_tools, j.created_at, j.portfolio_required
  FROM job_posts j WHERE j.id = _id AND j.status = 'open'
    AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
$function$;
GRANT EXECUTE ON FUNCTION public.get_open_job(uuid) TO authenticated;

DROP FUNCTION public.incoming_applications();
CREATE FUNCTION public.incoming_applications()
 RETURNS TABLE(id uuid, job_id uuid, job_title text, applicant_name text, role_title text, hourly_rate numeric, cover_note text, status text, created_at timestamp with time zone, cv_path text, cv_original_filename text, portfolio_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT a.id, a.job_id, j.title, p.name, ap.role_title, ap.hourly_rate, a.cover_note, a.status, a.created_at,
    c.cv_path, c.cv_original_filename, a.portfolio_url
  FROM job_applications a
  JOIN job_posts j ON j.id = a.job_id
  JOIN profiles p ON p.id = a.applicant_id
  JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  LEFT JOIN applicant_cvs c ON c.owner_id = a.applicant_id
  WHERE j.owner_id = auth.uid()
  ORDER BY a.created_at DESC
$function$;
GRANT EXECUTE ON FUNCTION public.incoming_applications() TO authenticated;