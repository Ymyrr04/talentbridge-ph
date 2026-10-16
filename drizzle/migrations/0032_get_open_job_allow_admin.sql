CREATE OR REPLACE FUNCTION public.get_open_job(_id uuid)
 RETURNS TABLE(id uuid, title text, description text, employment_type text, project_duration text, rate_min numeric, rate_max numeric, hours_min integer, hours_max integer, time_zones text[], experience_level text, must_have_tools text[], created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT j.id, j.title, j.description, j.employment_type, j.project_duration, j.rate_min, j.rate_max,
    j.hours_min, j.hours_max, j.time_zones, j.experience_level, j.must_have_tools, j.created_at
  FROM job_posts j WHERE j.id = _id AND j.status = 'open'
    AND (public.has_role(auth.uid(),'applicant') OR public.has_role(auth.uid(),'admin'))
$function$;