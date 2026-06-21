
CREATE TABLE IF NOT EXISTS public.favorite_brand_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  offer_id uuid not null,
  sent_at timestamptz not null default now(),
  unique (user_id, offer_id)
);

ALTER TABLE public.favorite_brand_alerts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages favorite alerts sent"
ON public.favorite_brand_alerts_sent
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users view their own favorite alerts sent"
ON public.favorite_brand_alerts_sent
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fbas_user ON public.favorite_brand_alerts_sent(user_id);

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS favorite_brand_alerts_opt_in boolean NOT NULL DEFAULT true;
