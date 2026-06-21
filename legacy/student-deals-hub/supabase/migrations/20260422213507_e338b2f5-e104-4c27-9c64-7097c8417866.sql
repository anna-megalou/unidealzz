CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users add their own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove their own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_offer ON public.favorites(offer_id);