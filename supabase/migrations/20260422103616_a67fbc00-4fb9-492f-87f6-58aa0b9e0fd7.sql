-- Allow company admins to manage logos under their own company_id prefix in the public 'logos' bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Company admins can upload logos') THEN
    CREATE POLICY "Company admins can upload logos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'logos'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
          AND profiles.status = 'active'
          AND profiles.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Company admins can update logos') THEN
    CREATE POLICY "Company admins can update logos"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'logos'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
          AND profiles.status = 'active'
          AND profiles.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Company admins can delete logos') THEN
    CREATE POLICY "Company admins can delete logos"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'logos'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
          AND profiles.status = 'active'
          AND profiles.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Logos are publicly viewable') THEN
    CREATE POLICY "Logos are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'logos');
  END IF;
END $$;