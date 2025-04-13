-- Create policies for storage.objects
-- Policy to allow authenticated users to upload to specific buckets
CREATE POLICY "Allow authenticated uploads to public content buckets" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id IN ('team-images', 'research-pdfs', 'research-previews', 'newsletter-pdfs', 'newsletter-previews')
);

-- Policy to allow authenticated users to select from specific buckets
CREATE POLICY "Allow authenticated users to view public content" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id IN ('team-images', 'research-pdfs', 'research-previews', 'newsletter-pdfs', 'newsletter-previews')
);

-- Policy to allow authenticated users to update their own objects
CREATE POLICY "Allow authenticated users to update their own objects" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id IN ('team-images', 'research-pdfs', 'research-previews', 'newsletter-pdfs', 'newsletter-previews')
  AND auth.uid() = owner
);

-- Policy to allow authenticated users to delete their own objects
CREATE POLICY "Allow authenticated users to delete their own objects" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id IN ('team-images', 'research-pdfs', 'research-previews', 'newsletter-pdfs', 'newsletter-previews')
  AND auth.uid() = owner
);

-- Policy to allow public access to view content
CREATE POLICY "Allow public access to view content" 
ON storage.objects
FOR SELECT 
TO anon
USING (
  bucket_id IN ('team-images', 'research-pdfs', 'research-previews', 'newsletter-pdfs', 'newsletter-previews')
);
