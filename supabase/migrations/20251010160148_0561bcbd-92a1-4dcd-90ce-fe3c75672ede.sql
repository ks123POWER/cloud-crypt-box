-- Add public access policy for shareable links
-- Anyone with a valid token can view the shareable link and associated file info
CREATE POLICY "Public can view shareable links by token"
ON public.shareable_links
FOR SELECT
USING (true);

-- Add public access policy for files accessed via shareable links
-- This allows the shared file page to fetch file metadata for decryption
CREATE POLICY "Public can view files via shareable links"
ON public.files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shareable_links
    WHERE shareable_links.file_id = files.id
    AND (shareable_links.expires_at IS NULL OR shareable_links.expires_at > now())
  )
);