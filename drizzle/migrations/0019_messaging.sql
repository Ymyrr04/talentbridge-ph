ALTER TABLE public.job_applications DROP CONSTRAINT job_applications_status_check;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_status_check CHECK (status IN ('pending','contacted','shortlisted','rejected'));

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.job_applications(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants or admin read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR applicant_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_participant(_conv uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM conversations WHERE id = _conv AND (client_id = _user OR applicant_id = _user))
$$;

CREATE POLICY "Participants or admin read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_participant(conversation_id, auth.uid()) AND read_at IS NULL);

CREATE OR REPLACE FUNCTION public.touch_conversation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id; RETURN NEW; END $$;
CREATE TRIGGER messages_touch AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

CREATE OR REPLACE FUNCTION public.start_conversation(_application_id uuid, _body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE conv uuid; app record;
BEGIN
  SELECT a.id, a.applicant_id, a.status, j.owner_id INTO app
    FROM job_applications a JOIN job_posts j ON j.id = a.job_id WHERE a.id = _application_id;
  IF app.id IS NULL OR app.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Application not found.'; END IF;
  IF char_length(btrim(coalesce(_body,''))) = 0 OR char_length(_body) > 2000 THEN RAISE EXCEPTION 'Message must be 1–2000 characters.'; END IF;
  SELECT id INTO conv FROM conversations WHERE application_id = _application_id;
  IF conv IS NULL THEN
    INSERT INTO conversations (application_id, client_id, applicant_id) VALUES (_application_id, auth.uid(), app.applicant_id)
    ON CONFLICT (application_id) DO NOTHING RETURNING id INTO conv;
    IF conv IS NULL THEN SELECT id INTO conv FROM conversations WHERE application_id = _application_id; END IF;
  END IF;
  INSERT INTO messages (conversation_id, sender_id, body) VALUES (conv, auth.uid(), _body);
  IF app.status = 'pending' THEN UPDATE job_applications SET status = 'contacted' WHERE id = _application_id; END IF;
  RETURN conv;
END $$;

CREATE OR REPLACE FUNCTION public.mark_read(_conversation_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_participant(_conversation_id, auth.uid()) THEN RETURN; END IF;
  UPDATE messages SET read_at = now() WHERE conversation_id = _conversation_id AND sender_id <> auth.uid() AND read_at IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.my_conversations() RETURNS TABLE(
  id uuid, application_id uuid, job_title text, other_name text, role_title text,
  last_body text, last_sender_id uuid, last_message_at timestamptz, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.id, c.application_id, j.title,
    CASE WHEN c.client_id = auth.uid() THEN pa.name ELSE pc.name END,
    ap.role_title,
    lm.body, lm.sender_id, c.last_message_at,
    (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> auth.uid() AND m.read_at IS NULL)
  FROM conversations c
  JOIN job_applications a ON a.id = c.application_id
  JOIN job_posts j ON j.id = a.job_id
  JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
  JOIN profiles pa ON pa.id = c.applicant_id
  JOIN profiles pc ON pc.id = c.client_id
  LEFT JOIN LATERAL (SELECT m.body, m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) lm ON true
  WHERE c.client_id = auth.uid() OR c.applicant_id = auth.uid()
  ORDER BY c.last_message_at DESC
$$;

CREATE OR REPLACE FUNCTION public.unread_message_count() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*) FROM messages m JOIN conversations c ON c.id = m.conversation_id
  WHERE (c.client_id = auth.uid() OR c.applicant_id = auth.uid()) AND m.sender_id <> auth.uid() AND m.read_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.set_application_status(_id uuid, _status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _status NOT IN ('pending','contacted','shortlisted','rejected') THEN RAISE EXCEPTION 'Invalid status.'; END IF;
  UPDATE job_applications a SET status = _status
  FROM job_posts j WHERE a.id = _id AND j.id = a.job_id AND j.owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found.'; END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;