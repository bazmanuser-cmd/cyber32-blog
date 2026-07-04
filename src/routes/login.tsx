import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import { Terminal, KeyRound, User } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/admin" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(username, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("ورود موفق. به سیستم خوش آمدید.");
      navigate({ to: "/admin" });
    }
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
              با نام کاربری تلگرام و رمز عبور تیم وارد شوید.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="username" className="font-mono text-xs">نام کاربری تلگرام</Label>
                <div className="relative mt-1.5">
                  <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
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
              <div>• نام کاربری = آیدی تلگرام شما</div>
              <div>• رمز عبور مشترک اعضای تیم</div>
            </div>

            <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary font-mono">
              بازگشت به خانه ←
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
