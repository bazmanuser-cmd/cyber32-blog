import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SHARED_PASSWORD = "avesta27cret88";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data ?? null);
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
    if (password !== SHARED_PASSWORD) return { error: "رمز عبور اشتباه است" };

    const email = usernameToEmail(username);

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: SHARED_PASSWORD,
    });

    if (!signInError) return {};

    // If user doesn't exist, sign up
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: SHARED_PASSWORD,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    // Sign in after signup
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
