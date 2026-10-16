CREATE TABLE public.tool_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  is_seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tool_catalog_name_ci ON public.tool_catalog (lower(name));
CREATE TABLE public.tool_catalog_usage (
  tool_id uuid NOT NULL REFERENCES public.tool_catalog(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, client_id)
);
GRANT SELECT ON public.tool_catalog, public.tool_catalog_usage TO authenticated;
GRANT ALL ON public.tool_catalog, public.tool_catalog_usage TO service_role;
ALTER TABLE public.tool_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_catalog_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read tool catalog" ON public.tool_catalog FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read tool usage" ON public.tool_catalog_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.tool_catalog (name, is_seeded)
SELECT unnest(ARRAY['Excel','Google Workspace','QuickBooks','Xero','Canva','HubSpot','Shopify','WordPress','Slack','Zapier','Make','n8n','Notion','Asana','Trello','ClickUp','Salesforce','Zendesk','Gorgias','Figma','Photoshop','CapCut','ChatGPT']), true;

-- Normalizes spelling to the catalog's and records usage.
CREATE OR REPLACE FUNCTION public.learn_job_tools() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t text; tid uuid; tname text; out_list text[] := '{}';
BEGIN
  IF NEW.must_have_tools IS NULL THEN RETURN NEW; END IF;
  FOREACH t IN ARRAY NEW.must_have_tools LOOP
    t := btrim(t);
    CONTINUE WHEN t = '' OR char_length(t) > 40;
    INSERT INTO tool_catalog (name) VALUES (t) ON CONFLICT ((lower(name))) DO NOTHING;
    SELECT id, name INTO tid, tname FROM tool_catalog WHERE lower(name) = lower(t);
    INSERT INTO tool_catalog_usage (tool_id, client_id) VALUES (tid, NEW.owner_id) ON CONFLICT DO NOTHING;
    out_list := out_list || tname;
  END LOOP;
  NEW.must_have_tools := out_list;
  RETURN NEW;
END $$;
CREATE TRIGGER job_posts_learn_tools BEFORE INSERT OR UPDATE OF must_have_tools ON public.job_posts
FOR EACH ROW EXECUTE FUNCTION public.learn_job_tools();

CREATE OR REPLACE FUNCTION public.suggest_tools(_q text)
RETURNS TABLE(name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.name FROM tool_catalog c
  LEFT JOIN tool_catalog_usage u ON u.tool_id = c.id
  WHERE (public.has_role(auth.uid(),'client') OR public.has_role(auth.uid(),'admin'))
    AND c.name ILIKE '%' || replace(replace(replace(coalesce(_q,''),'\','\\'),'%','\%'),'_','\_') || '%'
  GROUP BY c.id, c.name, c.is_seeded
  HAVING c.is_seeded OR count(DISTINCT u.client_id) >= 2
  ORDER BY count(DISTINCT u.client_id) DESC, c.name
  LIMIT 8
$$;
REVOKE EXECUTE ON FUNCTION public.suggest_tools(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.suggest_tools(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.learn_job_tools() FROM anon, authenticated, public;