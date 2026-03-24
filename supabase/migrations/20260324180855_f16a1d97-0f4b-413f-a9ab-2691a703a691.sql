-- Fix: Prevent users from escalating verified_trader status
-- Replace the update policy with one that prevents changing verified_trader
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a trigger to prevent users from changing verified_trader
CREATE OR REPLACE FUNCTION public.prevent_verified_trader_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the caller is not a service_role, prevent changing verified_trader
  IF NEW.verified_trader IS DISTINCT FROM OLD.verified_trader THEN
    -- Check if this is a service_role call by checking current_setting
    IF current_setting('role', true) != 'service_role' THEN
      NEW.verified_trader := OLD.verified_trader;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_verified_trader_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_verified_trader_self_update();

-- Re-create the update policy for authenticated role
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);