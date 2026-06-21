CREATE OR REPLACE FUNCTION public.get_verified_students_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.student_profiles WHERE verified_at IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_students_count() TO anon, authenticated;