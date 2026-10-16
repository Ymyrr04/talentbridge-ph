CREATE OR REPLACE FUNCTION public.valid_highlights(_h text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT _h IS NULL OR (coalesce(array_length(_h,1),0) <= 8
    AND NOT EXISTS (SELECT 1 FROM unnest(_h) h WHERE h IS NULL OR char_length(h) NOT BETWEEN 1 AND 160))
$function$;