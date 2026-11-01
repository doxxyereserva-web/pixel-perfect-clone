ALTER TABLE public.creations ADD COLUMN file_bucket text NOT NULL DEFAULT 'creations';
ALTER TABLE public.creations ADD COLUMN security_status text NOT NULL DEFAULT 'pending' CHECK (security_status IN ('pending','checked','review_required','rejected'));
ALTER TABLE public.creations ADD COLUMN security_summary text NOT NULL DEFAULT 'Not analyzed';
ALTER TABLE public.creations ADD COLUMN scanned_sha256 text;
CREATE TABLE public.creation_scans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 creation_id uuid NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL,
 sha256 text NOT NULL,
 status text NOT NULL CHECK (status IN ('checked','review_required','rejected')),
 summary text NOT NULL,
 findings jsonb NOT NULL DEFAULT '[]'::jsonb,
 scanner_version text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creation_scans TO authenticated;
GRANT ALL ON public.creation_scans TO service_role;
ALTER TABLE public.creation_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read scan results" ON public.creation_scans FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE OR REPLACE FUNCTION public.guard_creation_scan() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF coalesce(auth.role(), '') <> 'service_role' THEN
  IF TG_OP = 'INSERT' THEN
   NEW.security_status := 'pending'; NEW.security_summary := 'Not analyzed'; NEW.scanned_sha256 := NULL;
   IF NEW.file_bucket <> 'creation-quarantine' AND NEW.file_path IS NOT NULL THEN RAISE EXCEPTION 'Upload files to quarantine first'; END IF;
  ELSIF NEW.file_path IS DISTINCT FROM OLD.file_path OR NEW.file_bucket IS DISTINCT FROM OLD.file_bucket OR NEW.file_name IS DISTINCT FROM OLD.file_name OR NEW.external_url IS DISTINCT FROM OLD.external_url THEN
   NEW.security_status := 'pending'; NEW.security_summary := 'File changed; analysis required'; NEW.scanned_sha256 := NULL;
   IF NEW.file_bucket <> 'creation-quarantine' AND NEW.file_path IS NOT NULL THEN RAISE EXCEPTION 'Replacement files must be uploaded to quarantine'; END IF;
  ELSE
   NEW.security_status := OLD.security_status; NEW.security_summary := OLD.security_summary; NEW.scanned_sha256 := OLD.scanned_sha256;
  END IF;
  IF NEW.file_path IS NOT NULL AND split_part(NEW.file_path, '/', 1) <> NEW.owner_id::text THEN RAISE EXCEPTION 'File must belong to the creation owner'; END IF;
 END IF;
 IF NEW.visibility = 'public' AND (NEW.external_url IS NOT NULL OR (NEW.file_path IS NOT NULL AND (NEW.security_status <> 'checked' OR NEW.file_bucket <> 'creation-checked' OR NEW.scanned_sha256 IS NULL))) THEN
  RAISE EXCEPTION 'Only analyzed files can be published; external downloads cannot be verified';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER creations_scan_guard BEFORE INSERT OR UPDATE ON public.creations FOR EACH ROW EXECUTE FUNCTION public.guard_creation_scan();
CREATE POLICY "Unverified creations are not public" ON public.creations AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (owner_id = auth.uid() OR (external_url IS NULL AND (file_path IS NULL OR (security_status = 'checked' AND file_bucket = 'creation-checked' AND scanned_sha256 IS NOT NULL))));
CREATE POLICY "Quarantine owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'creation-quarantine' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Quarantine owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'creation-quarantine' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Quarantine owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'creation-quarantine' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Checked files visible for allowed creations" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'creation-checked' AND EXISTS (SELECT 1 FROM public.creations c WHERE c.file_path = storage.objects.name AND c.file_bucket = 'creation-checked' AND c.security_status = 'checked' AND c.scanned_sha256 IS NOT NULL));
CREATE POLICY "Legacy creation files private only" ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (bucket_id <> 'creations' OR (storage.foldername(name))[1] = auth.uid()::text);
COMMENT ON COLUMN public.creations.security_status IS 'Server-controlled structural/static inspection verdict. checked is not a malware-free guarantee; scripts and unsupported formats require review.';