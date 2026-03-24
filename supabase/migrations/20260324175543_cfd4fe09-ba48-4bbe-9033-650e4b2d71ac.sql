-- Create a security definer function to insert brokerage accounts with encrypted credentials
CREATE OR REPLACE FUNCTION public.create_brokerage_account_encrypted(
  p_user_id uuid,
  p_broker_name text,
  p_username text,
  p_password text,
  p_api_key text,
  p_encryption_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  INSERT INTO brokerage_accounts (
    user_id,
    broker_name,
    username,
    account_id,
    password_encrypted,
    api_key_encrypted,
    last_sync_at
  ) VALUES (
    p_user_id,
    p_broker_name,
    p_username,
    p_username,
    CASE WHEN p_password != '' THEN pgp_sym_encrypt(p_password, p_encryption_key) ELSE NULL END,
    CASE WHEN p_api_key != '' THEN pgp_sym_encrypt(p_api_key, p_encryption_key) ELSE NULL END,
    now()
  )
  RETURNING id INTO v_account_id;

  RETURN v_account_id;
END;
$$;