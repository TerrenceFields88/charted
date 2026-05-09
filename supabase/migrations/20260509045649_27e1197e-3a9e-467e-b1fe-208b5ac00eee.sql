-- Table tracking who has paid access to the Liquid Edge / Learn course
CREATE TABLE public.learn_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  source text NOT NULL DEFAULT 'whop',
  whop_membership_id text UNIQUE,
  whop_plan_id text,
  status text NOT NULL DEFAULT 'active',
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learn_access_user_id ON public.learn_access (user_id) WHERE status = 'active';
CREATE INDEX idx_learn_access_email ON public.learn_access (lower(email)) WHERE status = 'active';

ALTER TABLE public.learn_access ENABLE ROW LEVEL SECURITY;

-- Users can see their own access record (matched by user_id OR by email)
CREATE POLICY "Users can view their own learn access"
ON public.learn_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR lower(email) = lower((auth.jwt() ->> 'email'))
);

-- No client-side inserts/updates/deletes — only the webhook (service role) writes
CREATE TRIGGER update_learn_access_updated_at
BEFORE UPDATE ON public.learn_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper RPC: does the current authenticated user have active learn access?
CREATE OR REPLACE FUNCTION public.has_learn_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.learn_access
    WHERE status = 'active'
      AND (
        user_id = auth.uid()
        OR lower(email) = lower((auth.jwt() ->> 'email'))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_learn_access() TO authenticated;