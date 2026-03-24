
-- Drop triggers first, then the function
DROP TRIGGER IF EXISTS update_profile_on_brokerage_insert ON public.brokerage_accounts;
DROP TRIGGER IF EXISTS update_profile_on_brokerage_update ON public.brokerage_accounts;
DROP TRIGGER IF EXISTS update_profile_on_brokerage_delete ON public.brokerage_accounts;
DROP FUNCTION IF EXISTS public.update_profile_brokerage_info();
