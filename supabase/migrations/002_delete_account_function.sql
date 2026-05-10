-- Creates a callable RPC function that deletes the currently authenticated user
-- from auth.users, which cascades to all public.users data via ON DELETE CASCADE.
-- The SECURITY DEFINER allows it to bypass RLS while still restricting
-- deletion to the caller's own auth.uid().
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
