CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, name text, email text, phone text, role public.app_role, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only.'; END IF;
  RETURN QUERY SELECT p.id, p.name, p.email, p.phone, r.role, p.created_at
    FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id
    ORDER BY p.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;