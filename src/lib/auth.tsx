import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TEAM_ROSTER } from "@/lib/team";
import { getMediaDisplayUrl } from "@/lib/media";

export const SHARED_PASSWORD = "avesta27cret88";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  role_title: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  banner_url: string | null;
  banner_path: string | null;
  bio: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUsername(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

function usernameToEmail(username: string) {
  return `${username}@cyber32.local`;
}

const ALLOWED_USERNAMES = new Set(TEAM_ROSTER.map((member) => member.username.toLowerCase()));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, role_title, avatar_url, avatar_path, banner_url, banner_path, bio")
      .eq("id", userId)
      .maybeSingle();
    if (!data) {
      setProfile(null);
      return;
    }
    const [avatarUrl, bannerUrl] = await Promise.all([
      getMediaDisplayUrl(data.avatar_path, data.avatar_url),
      getMediaDisplayUrl(data.banner_path, data.banner_url),
    ]);
    setProfile({ ...data, avatar_url: avatarUrl, banner_url: bannerUrl });
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (rawUsername: string, password: string) => {
    const username = normalizeUsername(rawUsername);
    if (!username) return { error: "نام کاربری الزامی است" };
    if (!ALLOWED_USERNAMES.has(username)) {
      return { error: "این نام کاربری در فهرست اعضای سایبر ۳۲ تعریف نشده است" };
    }
    if (!password) return { error: "رمز عبور الزامی است" };

    const email = usernameToEmail(username);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) return {};

    if (password !== SHARED_PASSWORD) {
      return { error: "رمز عبور اشتباه است" };
    }

    const member = TEAM_ROSTER.find((item) => item.username.toLowerCase() === username);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: SHARED_PASSWORD,
      options: {
        data: {
          username,
          display_name: member?.displayName ?? username,
          role_title: member?.role ?? null,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password: SHARED_PASSWORD,
    });
    if (retryError) return { error: retryError.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
