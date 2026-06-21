-- Lightweight admin activity log
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created_at ON public.activity_log (created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all activity
CREATE POLICY "Admins view activity log"
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No direct INSERT policy: writes go through SECURITY DEFINER RPC.

-- RPC: log an activity entry (admin-only)
CREATE OR REPLACE FUNCTION public.log_activity(
  _action TEXT,
  _summary TEXT,
  _entity TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _id UUID;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  INSERT INTO public.activity_log (actor_id, action, summary, entity, entity_id, metadata)
  VALUES (_uid, _action, _summary, _entity, _entity_id, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;