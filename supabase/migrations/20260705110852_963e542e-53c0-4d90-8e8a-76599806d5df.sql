ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media_path text,
  ADD COLUMN IF NOT EXISTS media_name text,
  ADD COLUMN IF NOT EXISTS media_size bigint;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS avatar_path text,
  ADD COLUMN IF NOT EXISTS banner_path text;

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON public.posts USING gin (tags);
CREATE INDEX IF NOT EXISTS posts_featured_created_idx ON public.posts (featured, created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_profile_username_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Username cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_username_change_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_username_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_username_change();

CREATE OR REPLACE FUNCTION public.prevent_post_author_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'Post author cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_post_author_change_trigger ON public.posts;
CREATE TRIGGER prevent_post_author_change_trigger
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_post_author_change();

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Members can update all posts" ON public.posts;
DROP POLICY IF EXISTS "Members can delete all posts" ON public.posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.posts;

CREATE POLICY "Members can create posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Members can update all posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can delete all posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can update all profiles except usernames" ON public.profiles;

CREATE POLICY "Members can update all profiles except usernames"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Members can update media" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete media" ON storage.objects;

CREATE POLICY "Members can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Members can update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Members can delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media');