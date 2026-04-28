
REVOKE EXECUTE ON FUNCTION public.audit_brokerage_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_profile_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_comment_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_like_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_verified_trader_self_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_story_expiration() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_follower_count() FROM anon, authenticated, public;
