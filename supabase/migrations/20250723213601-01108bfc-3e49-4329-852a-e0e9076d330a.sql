-- Make account_id nullable since we're removing it from the UI
ALTER TABLE public.brokerage_accounts 
ALTER COLUMN account_id DROP NOT NULL;

-- Update existing records to have a default account_id based on username
UPDATE public.brokerage_accounts 
SET account_id = COALESCE(username, 'default_' || id::text)
WHERE account_id IS NULL;