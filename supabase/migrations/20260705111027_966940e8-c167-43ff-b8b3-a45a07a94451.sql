CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role_title text NOT NULL,
  telegram_url text,
  is_owner boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  avatar_url text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members are public" ON public.team_members;
DROP POLICY IF EXISTS "Members can manage team roster" ON public.team_members;

CREATE POLICY "Team members are public"
ON public.team_members
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Members can manage team roster"
ON public.team_members
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.prevent_team_member_username_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Team member username cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_team_member_username_change_trigger ON public.team_members;
CREATE TRIGGER prevent_team_member_username_change_trigger
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_team_member_username_change();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();