CREATE OR REPLACE FUNCTION public.browse_talent()
RETURNS TABLE (id uuid, name text, role_title text, hourly_rate numeric, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ap.id, p.name, ap.role_title, ap.hourly_rate, ap.updated_at
  FROM public.applicant_profiles ap JOIN public.profiles p ON p.id = ap.owner_id
  WHERE ap.status = 'published'
    AND (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'))
  ORDER BY ap.updated_at DESC
$$;
REVOKE ALL ON FUNCTION public.browse_talent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.browse_talent() TO authenticated;