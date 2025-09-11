-- Fix security warning by setting search_path for transfer_points_between_users function
CREATE OR REPLACE FUNCTION public.transfer_points_between_users(
  sender_user_id uuid, 
  recipient_user_id uuid, 
  transfer_company_id uuid, 
  points_amount integer, 
  transfer_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  sender_current_points INTEGER;
  result JSONB;
BEGIN
  -- Validate input parameters
  IF sender_user_id IS NULL OR recipient_user_id IS NULL OR transfer_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input parameters');
  END IF;
  
  IF points_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points amount must be positive');
  END IF;
  
  IF sender_user_id = recipient_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer points to yourself');
  END IF;
  
  -- Check if both users are members of the company using profiles table
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = transfer_company_id AND id = sender_user_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender is not a member of this company');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = transfer_company_id AND id = recipient_user_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient is not a member of this company');
  END IF;
  
  -- Get sender's current monthly points (available for giving)
  SELECT monthly_points INTO sender_current_points 
  FROM public.profiles 
  WHERE company_id = transfer_company_id AND id = sender_user_id;
  
  -- Check if sender has enough monthly points
  IF sender_current_points < points_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient points',
      'current_points', sender_current_points,
      'required_points', points_amount
    );
  END IF;
  
  -- Start atomic transaction
  BEGIN
    -- Deduct monthly points from sender
    UPDATE public.profiles 
    SET monthly_points = monthly_points - points_amount
    WHERE company_id = transfer_company_id AND id = sender_user_id;
    
    -- Add recognition points to recipient
    UPDATE public.profiles 
    SET points = points + points_amount
    WHERE company_id = transfer_company_id AND id = recipient_user_id;
    
    -- Create transaction record
    INSERT INTO public.point_transactions (
      company_id, 
      sender_profile_id, 
      recipient_profile_id, 
      points, 
      description
    ) VALUES (
      transfer_company_id,
      sender_user_id,
      recipient_user_id,
      points_amount,
      transfer_description
    );
    
    -- Return success
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Points transferred successfully',
      'points_transferred', points_amount
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle any errors during the transaction
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Transfer failed: ' || SQLERRM
    );
  END;
END;
$function$;