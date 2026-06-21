-- Public bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Brand logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

-- Admins can upload
CREATE POLICY "Admins can upload brand logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins can update
CREATE POLICY "Admins can update brand logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins can delete
CREATE POLICY "Admins can delete brand logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);