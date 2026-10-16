CREATE OR REPLACE FUNCTION public.suggest_tools(_q text)
 RETURNS TABLE(name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT c.name FROM tool_catalog c
  LEFT JOIN tool_catalog_usage u ON u.tool_id = c.id
  WHERE (public.has_role(auth.uid(),'client') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'applicant'))
    AND c.name ILIKE '%' || replace(replace(replace(coalesce(_q,''),'\','\\'),'%','\%'),'_','\_') || '%'
  GROUP BY c.id, c.name, c.is_seeded
  HAVING c.is_seeded OR count(DISTINCT u.client_id) >= 2
  ORDER BY count(DISTINCT u.client_id) DESC, c.name
  LIMIT 8
$function$;