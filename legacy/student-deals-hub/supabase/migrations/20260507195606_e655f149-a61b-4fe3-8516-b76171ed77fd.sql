
CREATE TABLE public.ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL,
  variant text NOT NULL,
  user_id uuid,
  anon_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ab_assignments_user_uniq ON public.ab_assignments (experiment_key, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX ab_assignments_anon_uniq ON public.ab_assignments (experiment_key, anon_id) WHERE anon_id IS NOT NULL;

CREATE TABLE public.ab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL,
  variant text NOT NULL,
  event_type text NOT NULL,
  user_id uuid,
  anon_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ab_events_exp_idx ON public.ab_events (experiment_key, created_at DESC);
CREATE INDEX ab_events_exp_var_type_idx ON public.ab_events (experiment_key, variant, event_type);

ALTER TABLE public.ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ab assignment"
  ON public.ab_assignments FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view ab assignments"
  ON public.ab_assignments FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage ab assignments"
  ON public.ab_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can log ab event"
  ON public.ab_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins view ab events"
  ON public.ab_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
