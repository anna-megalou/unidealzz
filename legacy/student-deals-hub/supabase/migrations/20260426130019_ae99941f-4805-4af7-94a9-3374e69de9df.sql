-- Update handle_new_user trigger to grant team-invite roles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  -- Check for a pending team invite matching this email
  SELECT id, role INTO _invite
  FROM public.team_invites
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
  ORDER BY invited_at DESC
  LIMIT 1;

  IF _invite.id IS NOT NULL THEN
    -- Assign the invited staff role (admin / curator / analyst)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _invite.role)
    ON CONFLICT DO NOTHING;

    -- Mark invite as accepted
    UPDATE public.team_invites
    SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = _invite.id;
  ELSE
    -- Default: regular student
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Hardcoded admin emails (kept from existing logic)
  IF NEW.email IN ('t8230093@aueb.gr', 't8230135@aueb.gr') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;