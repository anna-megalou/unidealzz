-- Add new role values for staff
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'curator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';