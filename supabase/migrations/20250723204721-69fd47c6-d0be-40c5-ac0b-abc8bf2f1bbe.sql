-- Add brokerage information to profiles table
ALTER TABLE public.profiles 
ADD COLUMN connected_brokers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN total_accounts INTEGER DEFAULT 0,
ADD COLUMN verified_trader BOOLEAN DEFAULT false;

-- Enable real-time updates for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Create function to update profile when brokerage account is added/removed
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for brokerage account changes
CREATE TRIGGER update_profile_on_brokerage_insert
  AFTER INSERT ON public.brokerage_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_brokerage_info();

CREATE TRIGGER update_profile_on_brokerage_update
  AFTER UPDATE ON public.brokerage_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_brokerage_info();

CREATE TRIGGER update_profile_on_brokerage_delete
  AFTER DELETE ON public.brokerage_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_brokerage_info();

-- Update existing profiles with current brokerage information
UPDATE public.profiles 
SET 
  connected_brokers = COALESCE(broker_data.brokers, '[]'::jsonb),
  total_accounts = COALESCE(broker_data.account_count, 0),
  verified_trader = COALESCE(broker_data.account_count, 0) > 0
FROM (
  SELECT 
    ba.user_id,
    jsonb_agg(
      jsonb_build_object(
        'broker_name', ba.broker_name,
        'account_id', ba.account_id,
        'is_active', ba.is_active,
        'last_sync_at', ba.last_sync_at
      )
    ) as brokers,
    COUNT(*) as account_count
  FROM public.brokerage_accounts ba
  WHERE ba.is_active = true
  GROUP BY ba.user_id
) broker_data
WHERE profiles.user_id = broker_data.user_id;