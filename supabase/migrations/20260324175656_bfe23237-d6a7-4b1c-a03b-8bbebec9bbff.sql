-- Create a security definer function to decrypt credentials
CREATE OR REPLACE FUNCTION public.decrypt_credential(
  p_encrypted text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted::bytea, p_key);
EXCEPTION
  WHEN OTHERS THEN
    -- Return the raw value for legacy unencrypted data
    RETURN p_encrypted;
END;
$$;