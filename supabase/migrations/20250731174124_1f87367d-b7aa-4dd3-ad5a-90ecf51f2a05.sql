-- Create security audit log for sensitive actions
CREATE TABLE IF NOT EXISTS public.security_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.security_audit
FOR INSERT WITH CHECK (true);

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.security_audit
FOR SELECT USING (auth.uid() = user_id);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit (
    user_id,
    action,
    table_name,
    record_id,
    details
  )
  VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_details
  );
END;
$$;

-- Add triggers for security-sensitive operations
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'profile_updated',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'old_username', OLD.username,
        'new_username', NEW.username,
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE key IN ('username', 'display_name', 'bio', 'avatar_url')
          AND to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
        )
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- Add trigger for brokerage account changes
CREATE OR REPLACE FUNCTION public.audit_brokerage_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'brokerage_account_added',
      'brokerage_accounts',
      NEW.id,
      jsonb_build_object('broker_name', NEW.broker_name)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'brokerage_account_removed',
      'brokerage_accounts',
      NEW.id,
      jsonb_build_object('broker_name', NEW.broker_name)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_brokerage_changes_trigger
  AFTER INSERT OR UPDATE ON public.brokerage_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_brokerage_changes();