-- Fix the function search path security issue for the new story function
CREATE OR REPLACE FUNCTION set_story_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If it's a story, set expiration to 24 hours from now
  IF NEW.post_type = 'story' THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$;