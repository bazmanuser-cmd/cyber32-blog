-- Protect 2FA secrets: column-level read/write grants on profiles
REVOKE SELECT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, avatar_url, bio, created_at, updated_at, role_title, banner_url, avatar_path, banner_path, two_factor_enabled) ON public.profiles TO anon, authenticated;
GRANT UPDATE (display_name, avatar_url, bio, role_title, banner_url, avatar_path, banner_path, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Members can update all profiles except usernames" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Own profile or team members can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_team_member(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_team_member(auth.uid()));

-- Only team members may publish courses and lessons
DROP POLICY IF EXISTS "members create courses" ON public.courses;
DROP POLICY IF EXISTS "members edit courses" ON public.courses;
DROP POLICY IF EXISTS "members delete courses" ON public.courses;
CREATE POLICY "team creates courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team edits courses" ON public.courses FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team deletes courses" ON public.courses FOR DELETE TO authenticated USING (public.is_team_member(auth.uid()));
DROP POLICY IF EXISTS "members manage lessons" ON public.lessons;
CREATE POLICY "team manages lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- Team roster is no longer public
DROP POLICY IF EXISTS "Members can manage team roster" ON public.team_members;
DROP POLICY IF EXISTS "Team members are public" ON public.team_members;
DROP POLICY IF EXISTS "Admins can read team roster" ON public.team_members;
DROP POLICY IF EXISTS "Admins manage team roster" ON public.team_members;
REVOKE SELECT ON public.team_members FROM anon;
CREATE POLICY "Team reads roster" ON public.team_members FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team manages roster" ON public.team_members FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- Site visit tracking (written only by server code)
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  visitor_hash text NOT NULL,
  device text NOT NULL DEFAULT 'desktop',
  browser text,
  country text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);

-- Panel permissions delegated by the owner to admins
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  user_id uuid NOT NULL,
  permission text NOT NULL CHECK (permission IN ('stats','content','layout','seo','team_form','applications','logs')),
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission)
);
GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or owner reads permissions" ON public.admin_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

-- Owner panel entry restriction
CREATE TABLE IF NOT EXISTS public.panel_access_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'ip' CHECK (mode IN ('ip','device','ip_and_device','ip_or_device')),
  allowed_ips text[] NOT NULL DEFAULT '{}',
  unlock_minutes integer NOT NULL DEFAULT 720 CHECK (unlock_minutes BETWEEN 5 AND 10080),
  apply_to_admins boolean NOT NULL DEFAULT true,
  max_failed_attempts integer NOT NULL DEFAULT 5 CHECK (max_failed_attempts BETWEEN 1 AND 100),
  lockout_minutes integer NOT NULL DEFAULT 30 CHECK (lockout_minutes BETWEEN 1 AND 1440),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.panel_access_config TO authenticated;
GRANT ALL ON public.panel_access_config TO service_role;
ALTER TABLE public.panel_access_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads panel access config" ON public.panel_access_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE TABLE IF NOT EXISTS public.panel_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'دستگاه',
  user_agent text,
  last_ip text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);
GRANT SELECT ON public.panel_devices TO authenticated;
GRANT ALL ON public.panel_devices TO service_role;
ALTER TABLE public.panel_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or owner reads panel devices" ON public.panel_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

CREATE TABLE IF NOT EXISTS public.panel_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  ip text,
  device_id uuid,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS panel_unlocks_user_session_idx ON public.panel_unlocks (user_id, session_id);
GRANT SELECT ON public.panel_unlocks TO authenticated;
GRANT ALL ON public.panel_unlocks TO service_role;
ALTER TABLE public.panel_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or owner reads panel unlocks" ON public.panel_unlocks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

-- Access helpers
CREATE OR REPLACE FUNCTION public.panel_unlocked(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    NOT COALESCE((
      SELECT c.enabled AND (c.apply_to_admins OR public.has_role(_user_id, 'owner'))
      FROM public.panel_access_config c WHERE c.id = 1
    ), false)
    OR EXISTS (
      SELECT 1 FROM public.panel_unlocks u
      WHERE u.user_id = _user_id
        AND u.session_id = COALESCE(auth.jwt() ->> 'session_id', '')
        AND u.expires_at > now()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'owner') AND public.panel_unlocked(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_panel_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.panel_unlocked(_user_id) AND (
    public.has_role(_user_id, 'owner')
    OR (
      public.has_role(_user_id, 'admin')
      AND EXISTS (SELECT 1 FROM public.admin_permissions p WHERE p.user_id = _user_id AND p.permission = _permission)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_setting(_user_id uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _key = 'seo' THEN public.has_panel_permission(_user_id, 'seo')
    WHEN _key = 'layout' THEN public.has_panel_permission(_user_id, 'layout')
    WHEN _key = 'team_application' THEN public.has_panel_permission(_user_id, 'team_form')
    ELSE public.is_verified_owner(_user_id)
  END;
$$;

-- Site settings now follow panel permissions
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Panel inserts settings" ON public.site_settings;
DROP POLICY IF EXISTS "Panel updates settings" ON public.site_settings;
DROP POLICY IF EXISTS "Panel deletes settings" ON public.site_settings;
CREATE POLICY "Panel inserts settings" ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_setting(auth.uid(), key));
CREATE POLICY "Panel updates settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.can_manage_setting(auth.uid(), key)) WITH CHECK (public.can_manage_setting(auth.uid(), key));
CREATE POLICY "Panel deletes settings" ON public.site_settings FOR DELETE TO authenticated
  USING (public.can_manage_setting(auth.uid(), key));

-- Team applications follow panel permissions
DROP POLICY IF EXISTS "Admins can review team applications" ON public.team_applications;
DROP POLICY IF EXISTS "Admins can update team applications" ON public.team_applications;
DROP POLICY IF EXISTS "Admins can delete team applications" ON public.team_applications;
CREATE POLICY "Panel reviews team applications" ON public.team_applications FOR SELECT TO authenticated
  USING (public.has_panel_permission(auth.uid(), 'applications'));
CREATE POLICY "Panel updates team applications" ON public.team_applications FOR UPDATE TO authenticated
  USING (public.has_panel_permission(auth.uid(), 'applications')) WITH CHECK (public.has_panel_permission(auth.uid(), 'applications'));
CREATE POLICY "Panel deletes team applications" ON public.team_applications FOR DELETE TO authenticated
  USING (public.has_panel_permission(auth.uid(), 'applications'));

-- Logs: own events, or everything with the logs permission
DROP POLICY IF EXISTS "own audit visible" ON public.audit_logs;
CREATE POLICY "Own or panel logs visible" ON public.audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_panel_permission(auth.uid(), 'logs'));

-- Owner-only admin role management
CREATE OR REPLACE FUNCTION public.set_admin_role(_target_user_id uuid, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_verified_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    IF public.has_role(_target_user_id, 'owner') THEN
      RAISE EXCEPTION 'Owner admin role cannot be removed';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = 'admin';
    DELETE FROM public.admin_permissions WHERE user_id = _target_user_id;
  END IF;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (auth.uid(), CASE WHEN _enabled THEN 'admin_role_granted' ELSE 'admin_role_revoked' END,
    'user_roles', _target_user_id::text, jsonb_build_object('role', 'admin'));
END;
$$;
REVOKE ALL ON FUNCTION public.set_admin_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_admin_role(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_admin_permission(_target_user_id uuid, _permission text, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_verified_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF _permission NOT IN ('stats','content','layout','seo','team_form','applications','logs') THEN
    RAISE EXCEPTION 'Unknown permission';
  END IF;
  IF _enabled THEN
    IF NOT public.has_role(_target_user_id, 'admin') THEN
      RAISE EXCEPTION 'Target must be an admin first';
    END IF;
    INSERT INTO public.admin_permissions (user_id, permission, granted_by)
    VALUES (_target_user_id, _permission, auth.uid()) ON CONFLICT (user_id, permission) DO NOTHING;
  ELSE
    DELETE FROM public.admin_permissions WHERE user_id = _target_user_id AND permission = _permission;
  END IF;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (auth.uid(), CASE WHEN _enabled THEN 'panel_permission_granted' ELSE 'panel_permission_revoked' END,
    'admin_permissions', _target_user_id::text, jsonb_build_object('permission', _permission));
END;
$$;
REVOKE ALL ON FUNCTION public.set_admin_permission(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_admin_permission(uuid, text, boolean) TO authenticated;

-- Detailed statistics for the panel
CREATE OR REPLACE FUNCTION public.panel_stats(_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  days integer := LEAST(GREATEST(COALESCE(_days, 30), 1), 365);
  local_today date := (now() AT TIME ZONE 'Asia/Tehran')::date;
  since_date date;
  since_ts timestamptz;
  today_ts timestamptz;
  result jsonb;
BEGIN
  IF NOT public.has_panel_permission(auth.uid(), 'stats') THEN
    RAISE EXCEPTION 'Panel permission required';
  END IF;
  since_date := local_today - (days - 1);
  since_ts := since_date::timestamp AT TIME ZONE 'Asia/Tehran';
  today_ts := local_today::timestamp AT TIME ZONE 'Asia/Tehran';

  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'posts', (SELECT count(*) FROM public.posts),
      'news', (SELECT count(*) FROM public.posts WHERE category = 'اخبار'),
      'articles', (SELECT count(*) FROM public.posts WHERE category IS DISTINCT FROM 'اخبار'),
      'post_views', (SELECT COALESCE(sum(view_count), 0) FROM public.posts),
      'users', (SELECT count(*) FROM public.profiles),
      'new_users_period', (SELECT count(*) FROM public.profiles WHERE created_at >= since_ts),
      'team', (SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role IN ('owner','admin','instructor','author')),
      'admins', (SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role = 'admin'),
      'comments', (SELECT count(*) FROM public.comments),
      'comments_period', (SELECT count(*) FROM public.comments WHERE created_at >= since_ts),
      'courses', (SELECT count(*) FROM public.courses),
      'published_courses', (SELECT count(*) FROM public.courses WHERE published),
      'lessons', (SELECT count(*) FROM public.lessons),
      'vip_active', (SELECT count(*) FROM public.vip_subscriptions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now())),
      'vip_pending', (SELECT count(*) FROM public.vip_subscriptions WHERE status = 'pending'),
      'applications', (SELECT count(*) FROM public.team_applications),
      'applications_pending', (SELECT count(*) FROM public.team_applications WHERE status = 'pending'),
      'files', (SELECT count(*) FROM public.user_files),
      'storage_bytes', (SELECT COALESCE(sum(size_bytes), 0) FROM public.user_files),
      'visits_today', (SELECT count(*) FROM public.page_views WHERE created_at >= today_ts),
      'unique_today', (SELECT count(DISTINCT visitor_hash) FROM public.page_views WHERE created_at >= today_ts),
      'visits_period', (SELECT count(*) FROM public.page_views WHERE created_at >= since_ts),
      'unique_period', (SELECT count(DISTINCT visitor_hash) FROM public.page_views WHERE created_at >= since_ts),
      'visits_all', (SELECT count(*) FROM public.page_views),
      'security_events_period', (SELECT count(*) FROM public.audit_logs WHERE created_at >= since_ts),
      'denied_panel_period', (SELECT count(*) FROM public.audit_logs WHERE created_at >= since_ts AND action = 'panel_access_denied')
    ),
    'daily', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'visits', COALESCE(v.visits, 0),
        'unique', COALESCE(v.uniq, 0),
        'signups', COALESCE(s.cnt, 0),
        'comments', COALESCE(c.cnt, 0),
        'posts', COALESCE(p.cnt, 0)
      ) ORDER BY d.day), '[]'::jsonb)
      FROM generate_series(since_date, local_today, interval '1 day') AS d(day)
      LEFT JOIN (SELECT (created_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(*) AS visits, count(DISTINCT visitor_hash) AS uniq
                 FROM public.page_views WHERE created_at >= since_ts GROUP BY 1) v ON v.day = d.day::date
      LEFT JOIN (SELECT (created_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(*) AS cnt
                 FROM public.profiles WHERE created_at >= since_ts GROUP BY 1) s ON s.day = d.day::date
      LEFT JOIN (SELECT (created_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(*) AS cnt
                 FROM public.comments WHERE created_at >= since_ts GROUP BY 1) c ON c.day = d.day::date
      LEFT JOIN (SELECT (created_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(*) AS cnt
                 FROM public.posts WHERE created_at >= since_ts GROUP BY 1) p ON p.day = d.day::date
    ),
    'hours', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('hour', h.hour, 'visits', COALESCE(v.visits, 0)) ORDER BY h.hour), '[]'::jsonb)
      FROM generate_series(0, 23) AS h(hour)
      LEFT JOIN (SELECT extract(hour FROM created_at AT TIME ZONE 'Asia/Tehran')::int AS hour, count(*) AS visits
                 FROM public.page_views WHERE created_at >= since_ts GROUP BY 1) v ON v.hour = h.hour
    ),
    'top_pages', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT path, count(*) AS visits, count(DISTINCT visitor_hash) AS uniq
      FROM public.page_views WHERE created_at >= since_ts GROUP BY path ORDER BY visits DESC LIMIT 12) t),
    'top_posts', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT id, title, category, view_count, created_at FROM public.posts ORDER BY view_count DESC LIMIT 10) t),
    'categories', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT COALESCE(category, 'بدون دسته') AS category, count(*) AS posts, COALESCE(sum(view_count), 0) AS views
      FROM public.posts GROUP BY 1 ORDER BY 2 DESC) t),
    'devices', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT device, count(*) AS visits FROM public.page_views WHERE created_at >= since_ts GROUP BY device ORDER BY visits DESC) t),
    'browsers', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT COALESCE(browser, 'نامشخص') AS browser, count(*) AS visits FROM public.page_views WHERE created_at >= since_ts GROUP BY 1 ORDER BY visits DESC LIMIT 8) t),
    'referrers', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT COALESCE(NULLIF(referrer, ''), 'مستقیم') AS referrer, count(*) AS visits FROM public.page_views WHERE created_at >= since_ts GROUP BY 1 ORDER BY visits DESC LIMIT 10) t),
    'countries', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT COALESCE(NULLIF(country, ''), 'نامشخص') AS country, count(*) AS visits FROM public.page_views WHERE created_at >= since_ts GROUP BY 1 ORDER BY visits DESC LIMIT 10) t),
    'authors', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT pr.username, pr.display_name, count(p.id) AS posts, COALESCE(sum(p.view_count), 0) AS views
      FROM public.posts p JOIN public.profiles pr ON pr.id = p.author_id
      GROUP BY pr.username, pr.display_name ORDER BY posts DESC LIMIT 10) t),
    'recent_signups', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT username, display_name, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 8) t),
    'recent_comments', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT left(c.content, 140) AS content, c.created_at, p.id AS post_id, p.title AS post_title
      FROM public.comments c JOIN public.posts p ON p.id = c.post_id ORDER BY c.created_at DESC LIMIT 8) t)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.panel_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.panel_stats(integer) TO authenticated;