-- Fix double points deduction by removing manual point updates from transfer function
-- Let database triggers handle the point deduction/addition automatically
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
  
  -- Only create transaction record - let triggers handle point updates to avoid double deduction
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
$function$;