-- Add login credential fields to brokerage_accounts table
ALTER TABLE public.brokerage_accounts 
ADD COLUMN username TEXT,
ADD COLUMN password_encrypted TEXT;

-- Make api_key_encrypted optional since we're adding login as alternative
-- (it's already nullable, so no change needed)