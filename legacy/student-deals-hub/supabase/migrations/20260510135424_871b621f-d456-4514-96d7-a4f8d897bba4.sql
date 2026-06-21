
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  IF NEW.email IN ('t8230093@aueb.gr', 't8230135@aueb.gr') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Persist marketing opt-in choice from signup metadata
  INSERT INTO public.user_settings (user_id, marketing_opt_in)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
