
-- 1) ab_assignments: restrict SELECT, tighten INSERT
DROP POLICY IF EXISTS "Anyone can view ab assignments" ON public.ab_assignments;
DROP POLICY IF EXISTS "Anyone can insert ab assignment" ON public.ab_assignments;

CREATE POLICY "Users view their own ab assignments"
ON public.ab_assignments FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND anon_id IS NOT NULL)
);

CREATE POLICY "Insert ab assignment for self"
ON public.ab_assignments FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND anon_id IS NULL)
  OR (auth.uid() IS NULL AND user_id IS NULL AND anon_id IS NOT NULL)
);

-- 2) ab_events: tighten INSERT
DROP POLICY IF EXISTS "Anyone can log ab event" ON public.ab_events;

CREATE POLICY "Log ab event for self"
ON public.ab_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND anon_id IS NULL)
  OR (auth.uid() IS NULL AND user_id IS NULL AND anon_id IS NOT NULL)
);

-- 3) student_profiles: allow user to delete own
CREATE POLICY "Users can delete their own student profile"
ON public.student_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4) team_invites: invitee can view their own invite by email
CREATE POLICY "Invitees view their own invite"
ON public.team_invites FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 5) Lock down SECURITY DEFINER queue helpers + fix search_path
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
