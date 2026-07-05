DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'posts'
      AND constraint_name = 'posts_author_id_profiles_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_author_id_profiles_id_fkey
      FOREIGN KEY (author_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;