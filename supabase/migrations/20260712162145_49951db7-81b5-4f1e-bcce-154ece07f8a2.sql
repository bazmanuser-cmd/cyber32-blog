
-- VIP Subscriptions
CREATE TABLE public.vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  amount_toman INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  admin_note TEXT,
  storage_quota_mb INTEGER NOT NULL DEFAULT 1024,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_subscriptions TO authenticated;
GRANT ALL ON public.vip_subscriptions TO service_role;

ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_vip_select" ON public.vip_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "own_vip_insert" ON public.vip_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "admin_vip_update" ON public.vip_subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "admin_vip_delete" ON public.vip_subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_vip_updated_at BEFORE UPDATE ON public.vip_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vip_user ON public.vip_subscriptions(user_id, status);

-- is_vip helper
CREATE OR REPLACE FUNCTION public.is_vip(_user_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- User Files (cloud storage metadata)
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  folder TEXT NOT NULL DEFAULT '/',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_files TO authenticated;
GRANT ALL ON public.user_files TO service_role;

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_files_all" ON public.user_files FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_userfiles_updated_at BEFORE UPDATE ON public.user_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_userfiles_user ON public.user_files(user_id, created_at DESC);

-- Storage quota trigger (default 1024 MB, VIP overrides via active subscription)
CREATE OR REPLACE FUNCTION public.enforce_storage_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  used_bytes BIGINT;
  quota_mb INTEGER;
BEGIN
  SELECT COALESCE(SUM(size_bytes),0) INTO used_bytes
    FROM public.user_files WHERE user_id = NEW.user_id;
  SELECT COALESCE(MAX(storage_quota_mb), 1024) INTO quota_mb
    FROM public.vip_subscriptions
    WHERE user_id = NEW.user_id AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now());
  IF quota_mb IS NULL THEN quota_mb := 1024; END IF;
  IF (used_bytes + NEW.size_bytes) > (quota_mb::BIGINT * 1024 * 1024) THEN
    RAISE EXCEPTION 'Storage quota exceeded: % MB limit', quota_mb;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_enforce_storage_quota BEFORE INSERT ON public.user_files
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storage_quota();

-- Storage policies for media bucket: allow authenticated users to manage their own folder cloud/<uid>/*
CREATE POLICY "cloud_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'cloud' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "cloud_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'cloud' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "cloud_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'cloud' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "cloud_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'cloud' AND (storage.foldername(name))[2] = auth.uid()::text);
