ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS university_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.offers
  ADD CONSTRAINT offers_scope_check CHECK (scope IN ('local','national','online'));

CREATE INDEX IF NOT EXISTS idx_offers_scope ON public.offers(scope);
CREATE INDEX IF NOT EXISTS idx_offers_university_ids ON public.offers USING GIN(university_ids);