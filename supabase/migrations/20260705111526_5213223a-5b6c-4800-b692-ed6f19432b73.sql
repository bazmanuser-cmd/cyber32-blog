CREATE OR REPLACE FUNCTION public.increment_post_view(_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = _post_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO anon, authenticated, service_role;