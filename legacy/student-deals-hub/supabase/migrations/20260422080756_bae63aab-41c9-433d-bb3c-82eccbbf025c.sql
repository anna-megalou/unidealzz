DROP POLICY IF EXISTS "Universities are viewable by everyone" ON public.universities;

CREATE POLICY "Universities are publicly viewable"
ON public.universities
FOR SELECT
TO anon, authenticated
USING (true);