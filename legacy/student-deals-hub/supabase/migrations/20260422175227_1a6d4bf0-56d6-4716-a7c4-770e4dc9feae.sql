CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'curator',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_email_pending_idx
  ON public.team_invites (lower(email)) WHERE status = 'pending';

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage team invites"
  ON public.team_invites
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();