-- Create a function to handle point transfers between users
CREATE OR REPLACE FUNCTION public.transfer_points_between_users(
  sender_user_id UUID,
  recipient_user_id UUID,
  transfer_company_id UUID,
  points_amount INTEGER,
  transfer_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  -- Check if both users are members of the company
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE company_id = transfer_company_id AND user_id = sender_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender is not a member of this company');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE company_id = transfer_company_id AND user_id = recipient_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient is not a member of this company');
  END IF;
  
  -- Get sender's current points
  SELECT points INTO sender_current_points 
  FROM public.company_members 
  WHERE company_id = transfer_company_id AND user_id = sender_user_id;
  
  -- Check if sender has enough points
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
    -- Deduct points from sender
    UPDATE public.company_members 
    SET points = points - points_amount
    WHERE company_id = transfer_company_id AND user_id = sender_user_id;
    
    -- Add points to recipient
    UPDATE public.company_members 
    SET points = points + points_amount
    WHERE company_id = transfer_company_id AND user_id = recipient_user_id;
    
    -- Create transaction record
    INSERT INTO public.point_transactions (
      company_id, 
      sender_id, 
      recipient_id, 
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
$$;