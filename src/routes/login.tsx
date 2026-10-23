import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Terminal, KeyRound, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: search.type === "team" || search.type === "owner" ? search.type : "user",
  }),
  head: () => ({ meta: [{ title: "ورود | سایبر ۳۲" }, { name: "description", content: "ورود اعضا و کاربران سایبر ۳۲." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Login,
});

function Login() {
  const { type } = Route.useSearch();
  const { signIn, user } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(identifier, password);
    if (error) {
      setLoading(false);
      toast.error(error);
      return;
    }
    if (type === "team" || type === "owner") {
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      const { data: roles } = signedInUser
        ? await supabase.from("user_roles").select("role").eq("user_id", signedInUser.id)
        : { data: [] };
      const requiredRole = type === "owner" ? "owner" : undefined;
      const allowed = (roles ?? []).some(({ role }) => requiredRole
        ? role === requiredRole
        : ["owner", "admin", "instructor", "author"].includes(role));
      if (!allowed) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error(type === "owner" ? "این حساب دسترسی مالک ندارد" : "این حساب عضو مجموعه نیست");
        return;
      }
    }
    setLoading(false);
    toast.success("ورود موفق.");
    navigate({ to: type === "owner" ? "/owner" : "/dashboard" });
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="p-8 scanline border-primary/30 shadow-glow relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="font-mono text-xs text-primary mb-2">// SECURE_LOGIN</div>
            <h1 className="text-3xl font-bold font-mono text-drip">ACCESS</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {type === "owner" ? "ورود مالک به پنل خصوصی مدیریت سایت." : type === "team" ? "ورود اعضای مجموعه با نام کاربری و رمز شخصی." : "ورود کاربران با ایمیل و رمز شخصی."}
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="identifier" className="font-mono text-xs">{type === "user" ? "ایمیل کاربری" : "نام کاربری"}</Label>
                <div className="relative mt-1.5">
                  <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={type === "user" ? "email@example.com" : "نام کاربری مجموعه"}
                    className="pr-10 font-mono"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="font-mono text-xs">رمز عبور</Label>
                <div className="relative mt-1.5">
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="pr-10 font-mono"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-mono" disabled={loading}>
                {loading ? (
                  <><Terminal className="w-4 h-4 animate-pulse" /> در حال اتصال...</>
                ) : (
                  <>&gt; AUTHENTICATE</>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-xs text-muted-foreground font-mono space-y-1">
              <div>برای ورود اعضا باید حساب اختصاصی و رمز شخصی داشته باشید.</div>
              <div><Link to="/forgot-password" className="text-primary hover:underline">فراموشی رمز عبور؟</Link></div>
            </div>

            <div className="mt-4 text-center text-sm">
              حساب ندارید؟ <Link to="/register" className="text-primary font-mono hover:underline">ثبت‌نام</Link>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs">
              <Link to="/login" search={{ type: "team" }} className="text-muted-foreground hover:text-primary">ورود اعضای مجموعه</Link>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
