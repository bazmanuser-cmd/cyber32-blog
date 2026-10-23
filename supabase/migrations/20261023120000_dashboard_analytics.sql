CREATE OR REPLACE FUNCTION public.get_my_post_analytics()
RETURNS TABLE (
  post_id uuid,
  title text,
  category text,
  created_at timestamptz,
  view_count integer,
  comment_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.category,
    p.created_at,
    p.view_count,
    count(c.id)
  FROM public.posts AS p
  LEFT JOIN public.comments AS c ON c.post_id = p.id
  WHERE p.author_id = auth.uid()
  GROUP BY p.id
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_post_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_post_analytics() TO authenticated;
