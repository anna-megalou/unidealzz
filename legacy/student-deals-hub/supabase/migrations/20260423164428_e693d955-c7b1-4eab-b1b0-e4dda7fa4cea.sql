ALTER TABLE public.user_settings
ADD COLUMN savings_goal NUMERIC(10,2) NOT NULL DEFAULT 2000 CHECK (savings_goal >= 0);