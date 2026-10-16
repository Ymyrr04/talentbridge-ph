ALTER TABLE public.job_posts ADD COLUMN must_have_tools text[];
CREATE OR REPLACE FUNCTION public.valid_tool_list(_t text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT _t IS NULL OR (
    coalesce(array_length(_t,1),0) <= 10
    AND NOT EXISTS (SELECT 1 FROM unnest(_t) x WHERE x IS NULL OR char_length(x) NOT BETWEEN 1 AND 40)
    AND (SELECT count(DISTINCT lower(x)) FROM unnest(_t) x) = coalesce(array_length(_t,1),0)
  )
$$;
ALTER TABLE public.job_posts ADD CONSTRAINT job_posts_must_have_tools_check CHECK (public.valid_tool_list(must_have_tools));