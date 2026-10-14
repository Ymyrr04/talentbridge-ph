CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'role';
  r public.app_role;
BEGIN
  IF lower(NEW.email) = 'mark@outsta.io' THEN r := 'admin';
  ELSIF requested = 'client' THEN r := 'client';
  ELSE r := 'applicant'; END IF;
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END $$;