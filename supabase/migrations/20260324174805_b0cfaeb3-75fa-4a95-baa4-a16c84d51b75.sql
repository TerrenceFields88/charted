
-- Fix 1: Remove sensitive brokerage data from publicly readable profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS connected_brokers;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_accounts;

-- Fix 2: Restrict security_audit INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit;
CREATE POLICY "Service role can insert audit logs"
  ON public.security_audit FOR INSERT
  TO service_role
  WITH CHECK (true);
