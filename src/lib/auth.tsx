import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getMediaDisplayUrl } from "@/lib/media";

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
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error?: string }>;
  signUpPublic: (email: string, password: string, username: string, displayName?: string) => Promise<{ error?: string; needsVerification?: boolean }>;
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

const RESERVED_TEAM_USERNAMES = new Set([
  "virus32_org", "habibian_00", "arcomion", "port10808", "pound_iran",
  "michaelofficial273", "singeleshah", "mmdtnt_m", "satantom",
]);

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

  const signIn = async (rawInput: string, password: string) => {
    const input = rawInput.trim();
    if (!input) return { error: "نام کاربری یا ایمیل الزامی است" };
    if (!password) return { error: "رمز عبور الزامی است" };

    // Email login (public users)
    if (input.includes("@") && !input.startsWith("@")) {
      const { error } = await supabase.auth.signInWithPassword({ email: input.toLowerCase(), password });
      if (error) return { error: error.message === "Email not confirmed" ? "ایمیل شما هنوز تأیید نشده است. صندوق ورودی خود را بررسی کنید." : "ایمیل یا رمز عبور اشتباه است" };
      return {};
    }

    // Team accounts use their own password; accounts are never provisioned here.
    const username = normalizeUsername(input);
    if (!/^[a-z0-9_]{3,32}$/.test(username)) return { error: "نام کاربری معتبر وارد کنید" };
    const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error || !data.user) return { error: "نام کاربری یا رمز عبور اشتباه است" };
    const { data: assignedRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isTeamAccount = (assignedRoles ?? []).some(({ role }) => ["owner", "admin", "instructor", "author"].includes(role));
    if (!isTeamAccount) {
      await supabase.auth.signOut();
      return { error: "این حساب دسترسی ورود اعضای مجموعه را ندارد" };
    }
    return {};
  };

  const signUpPublic = async (email: string, password: string, rawUsername: string, displayName?: string) => {
    const emailNorm = email.trim().toLowerCase();
    const username = normalizeUsername(rawUsername);
    if (!emailNorm.includes("@")) return { error: "ایمیل معتبر وارد کنید" };
    if (password.length < 8) return { error: "رمز عبور حداقل ۸ کاراکتر" };
    if (username.length < 3) return { error: "نام کاربری حداقل ۳ کاراکتر" };
    if (!/^[a-z0-9_]+$/.test(username)) return { error: "نام کاربری فقط حروف کوچک انگلیسی، عدد و _" };
    if (RESERVED_TEAM_USERNAMES.has(username)) return { error: "این نام کاربری رزرو شده است" };
    // Check username uniqueness
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existing) return { error: "این نام کاربری قبلاً ثبت شده" };

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: {
        data: { username, display_name: displayName || username },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) return { error: error.message };
    return { needsVerification: !data.session };
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
        signUpPublic,
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
