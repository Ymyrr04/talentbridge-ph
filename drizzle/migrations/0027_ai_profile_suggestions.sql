CREATE TABLE public.ai_suggestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_suggestion_runs_owner_idx ON public.ai_suggestion_runs (owner_id, created_at DESC);
GRANT SELECT ON public.ai_suggestion_runs TO authenticated;
GRANT ALL ON public.ai_suggestion_runs TO service_role;
ALTER TABLE public.ai_suggestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own runs" ON public.ai_suggestion_runs FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.profile_suggestions (
  owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_path text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.profile_suggestions TO authenticated;
GRANT ALL ON public.profile_suggestions TO service_role;
ALTER TABLE public.profile_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own suggestions" ON public.profile_suggestions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner deletes own suggestions" ON public.profile_suggestions FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.clear_suggestions_on_cv_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' OR NEW.cv_path IS DISTINCT FROM OLD.cv_path THEN
    DELETE FROM profile_suggestions WHERE owner_id = OLD.owner_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER applicant_cvs_clear_suggestions AFTER UPDATE OR DELETE ON public.applicant_cvs
FOR EACH ROW EXECUTE FUNCTION public.clear_suggestions_on_cv_change();

-- Atomically claims one of 5 daily runs for the caller; false when over the limit.
CREATE OR REPLACE FUNCTION public.claim_suggestion_run()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'applicant') THEN RAISE EXCEPTION 'Only applicants can use profile suggestions.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('ai_runs:' || auth.uid()::text));
  IF (SELECT count(*) FROM ai_suggestion_runs WHERE owner_id = auth.uid() AND created_at > now() - interval '24 hours') >= 5 THEN
    RETURN false;
  END IF;
  INSERT INTO ai_suggestion_runs (owner_id) VALUES (auth.uid());
  RETURN true;
END $$;

-- Saves suggestions for the caller, only for their current CV.
CREATE OR REPLACE FUNCTION public.save_profile_suggestions(_cv_path text, _payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applicant_cvs WHERE owner_id = auth.uid() AND cv_path = _cv_path) THEN
    RAISE EXCEPTION 'Your CV changed. Please try again.';
  END IF;
  INSERT INTO profile_suggestions (owner_id, cv_path, payload) VALUES (auth.uid(), _cv_path, _payload)
  ON CONFLICT (owner_id) DO UPDATE SET cv_path = EXCLUDED.cv_path, payload = EXCLUDED.payload, created_at = now();
END $$;