CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  requested text := NEW.raw_user_meta_data ->> 'role';
  r public.app_role;
BEGIN
  IF requested IS NULL OR requested NOT IN ('applicant','client') THEN
    RAISE EXCEPTION 'Invalid signup role.' USING ERRCODE = 'check_violation';
  END IF;
  IF lower(NEW.email) = 'mark@outsta.io' THEN r := 'admin';
  ELSE r := requested::public.app_role; END IF;
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END $function$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon, authenticated;
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;