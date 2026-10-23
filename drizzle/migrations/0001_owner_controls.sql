CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

INSERT INTO public.site_settings (key, value)
VALUES
  ('seo', '{"title":"Cyber32 | تیم امنیت سایبری و هک","description":"بلاگ رسمی تیم سایبر ۳۲ — هک، امنیت، کانفیگ، دیتابیس، سورس کد و آموزش."}'::jsonb),
  ('team_application', '{"enabled":true,"fields":[{"key":"experience","label":"تجربه و مهارت‌ها","type":"textarea","required":true},{"key":"motivation","label":"دلیل علاقه‌مندی به همکاری","type":"textarea","required":true}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.team_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (length(email) <= 320),
  username text NOT NULL CHECK (length(username) <= 80),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.team_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.team_applications TO authenticated;
GRANT ALL ON public.team_applications TO service_role;
ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit team applications" ON public.team_applications;
CREATE POLICY "Anyone can submit team applications"
  ON public.team_applications FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "Admins can review team applications" ON public.team_applications;
CREATE POLICY "Admins can review team applications"
  ON public.team_applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
DROP POLICY IF EXISTS "Admins can update team applications" ON public.team_applications;
CREATE POLICY "Admins can update team applications"
  ON public.team_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
DROP POLICY IF EXISTS "Admins can delete team applications" ON public.team_applications;
CREATE POLICY "Admins can delete team applications"
  ON public.team_applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Owners can read all roles" ON public.user_roles;
CREATE POLICY "Owners can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.set_admin_role(_target_user_id uuid, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = 'admin';
  END IF;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (auth.uid(), CASE WHEN _enabled THEN 'admin_role_granted' ELSE 'admin_role_revoked' END,
    'user_roles', _target_user_id::text, jsonb_build_object('role', 'admin'));
END;
$$;
REVOKE ALL ON FUNCTION public.set_admin_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_admin_role(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_site_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_key text;
BEGIN
  IF TG_OP = 'DELETE' THEN changed_key := OLD.key; ELSE changed_key := NEW.key; END IF;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (auth.uid(), 'site_setting_changed', 'site_settings', changed_key, jsonb_build_object('operation', TG_OP));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS audit_site_settings_change_trigger ON public.site_settings;
CREATE TRIGGER audit_site_settings_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_site_settings_change();