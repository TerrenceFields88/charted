
-- 1. Replace overly broad public SELECT policies on storage.objects to prevent bucket listing
-- Public file access via CDN URLs continues to work; only list/enumerate via API is restricted to authenticated users
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Photo images are publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated can view photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated can view videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos');

-- 2. Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.sanitize_content(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, uuid, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_credential(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_brokerage_account_encrypted(uuid, text, text, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.calculate_trading_performance(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM anon, public;

-- 3. Harden counter RPCs (no-ops kept for backward compat, but reject unauthorized callers)
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM likes WHERE likes.post_id = increment_post_likes.post_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  -- No-op: trigger maintains count
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- No-op: trigger maintains count on DELETE
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_post_comments(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM comments WHERE comments.post_id = increment_post_comments.post_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  -- No-op: trigger maintains count
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_post_likes(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.decrement_post_likes(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_post_comments(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.increment_post_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_comments(uuid) TO authenticated;
