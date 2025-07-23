-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_profile_brokerage_info()
RETURNS TRIGGER AS $$
DECLARE
  broker_info JSONB;
  account_count INTEGER;
BEGIN
  -- Get current brokerage account info for the user
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'broker_name', broker_name,
        'account_id', account_id,
        'is_active', is_active,
        'last_sync_at', last_sync_at
      )
    ), '[]'::jsonb),
    COUNT(*)
  INTO broker_info, account_count
  FROM public.brokerage_accounts 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = true;

  -- Update the profile with the new brokerage information
  UPDATE public.profiles 
  SET 
    connected_brokers = broker_info,
    total_accounts = account_count,
    verified_trader = (account_count > 0),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';