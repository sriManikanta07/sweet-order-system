
-- Fix mutable search_path warning
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Replace broad public SELECT with no listing.
-- Public buckets still serve files via direct URL (object storage CDN),
-- but clients cannot enumerate the bucket via the API.
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read banner images" ON storage.objects;
