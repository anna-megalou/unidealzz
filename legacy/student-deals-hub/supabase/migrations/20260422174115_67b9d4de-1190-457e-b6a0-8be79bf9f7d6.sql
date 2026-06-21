ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS brands_archived_at_idx ON public.brands (archived_at);