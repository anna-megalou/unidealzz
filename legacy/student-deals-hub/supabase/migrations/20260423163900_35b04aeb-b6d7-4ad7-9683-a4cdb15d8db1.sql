-- Track purchases & savings per student
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  claimed_offer_id UUID REFERENCES public.claimed_offers(id) ON DELETE SET NULL,
  merchant TEXT NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid >= 0),
  amount_saved NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_saved >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','auto')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_user_date ON public.purchases(user_id, purchased_at DESC);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own purchases"
  ON public.purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own purchases"
  ON public.purchases FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own purchases"
  ON public.purchases FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();