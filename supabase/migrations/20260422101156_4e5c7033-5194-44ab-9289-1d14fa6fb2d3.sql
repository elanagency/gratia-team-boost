
-- 1. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recognition-images', 'recognition-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies
CREATE POLICY "Recognition images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recognition-images');

CREATE POLICY "Authenticated users can upload recognition images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recognition-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own recognition images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recognition-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Add image_url column to point_transactions
ALTER TABLE public.point_transactions
ADD COLUMN IF NOT EXISTS image_url text;

-- 4. Update transfer_points_between_users RPC to accept image_url
CREATE OR REPLACE FUNCTION public.transfer_points_between_users(
  sender_user_id uuid,
  recipient_user_id uuid,
  transfer_company_id uuid,
  points_amount integer,
  transfer_description text,
  transfer_gif_url text DEFAULT NULL::text,
  transfer_image_url text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_current_points INTEGER;
BEGIN
  IF sender_user_id IS NULL OR recipient_user_id IS NULL OR transfer_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input parameters');
  END IF;

  IF points_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points amount must be positive');
  END IF;

  IF sender_user_id = recipient_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer points to yourself');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_id = transfer_company_id AND id = sender_user_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender is not a member of this company');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_id = transfer_company_id AND id = recipient_user_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient is not a member of this company');
  END IF;

  SELECT monthly_points INTO sender_current_points
  FROM public.profiles
  WHERE company_id = transfer_company_id AND id = sender_user_id;

  IF sender_current_points < points_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'current_points', sender_current_points,
      'required_points', points_amount
    );
  END IF;

  BEGIN
    UPDATE public.profiles
    SET monthly_points = monthly_points - points_amount
    WHERE id = sender_user_id AND company_id = transfer_company_id;

    UPDATE public.profiles
    SET points = points + points_amount
    WHERE id = recipient_user_id AND company_id = transfer_company_id;

    INSERT INTO public.point_transactions (
      company_id,
      sender_profile_id,
      recipient_profile_id,
      points,
      description,
      gif_url,
      image_url
    ) VALUES (
      transfer_company_id,
      sender_user_id,
      recipient_user_id,
      points_amount,
      transfer_description,
      transfer_gif_url,
      transfer_image_url
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Points transferred successfully',
      'points_transferred', points_amount
    );

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transfer failed: ' || SQLERRM
    );
  END;
END;
$function$;
