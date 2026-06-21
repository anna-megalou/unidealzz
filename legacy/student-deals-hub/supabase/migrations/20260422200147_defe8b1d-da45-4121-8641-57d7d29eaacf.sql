CREATE TABLE public.partnership_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partnership request"
ON public.partnership_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view partnership requests"
ON public.partnership_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));