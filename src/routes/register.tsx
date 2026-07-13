import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, KeyRound, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "ثبت‌نام | سایبر ۳۲" }, { name: "description", content: "ثبت‌نام کاربر عادی در سایبر ۳۲ با ایمیل." }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { signUpPublic } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) { toast.error("رمز عبور و تکرار آن یکسان نیست"); return; }
    setBusy(true);
    const res = await signUpPublic(email, password, username, displayName);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    if (res.needsVerification) {
      setDone(true);
      toast.success("ایمیل تأیید ارسال شد.");
    } else {
      toast.success("ثبت‌نام موفق.");
      nav({ to: "/dashboard" });
    }
  };

  if (done) return (
    <Layout>
      <section className="max-w-lg mx-auto px-4 py-16 text-center">
        <Mail className="w-14 h-14 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold">تأیید ایمیل لازم است</h1>
        <p className="text-muted-foreground mt-4 leading-8">
          لینک فعال‌سازی به <span className="font-mono text-primary">{email}</span> ارسال شد. پس از تأیید، وارد شوید.
        </p>
        <Link to="/login" className="inline-block mt-6 px-6 py-3 rounded-md bg-primary text-primary-foreground font-mono">ورود</Link>
      </section>
    </Layout>
  );

  return (
    <Layout>
      <section className="max-w-lg mx-auto px-4 py-12">
        <Card className="p-8 border-primary/30 backdrop-blur-xl scanline relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-xs text-primary mb-2">
              <UserPlus className="w-3 h-3" /> // NEW_USER
            </div>
            <h1 className="text-3xl font-bold">ثبت‌نام</h1>
            <p className="text-sm text-muted-foreground mt-2">
              کاربر عادی می‌تواند نظر بگذارد و در بحث‌ها شرکت کند. انتشار پست/دوره فقط برای اعضای تیم است.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label className="font-mono text-xs">ایمیل</Label>
                <div className="relative mt-1.5">
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 font-mono" required placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">نام کاربری (لاتین)</Label>
                <div className="relative mt-1.5">
                  <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pr-10 font-mono" required pattern="[a-zA-Z0-9_]{3,}" minLength={3} placeholder="my_name" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">فقط حروف کوچک، عدد و _</p>
              </div>
              <div>
                <Label className="font-mono text-xs">نام نمایشی</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5" placeholder="نام شما" />
              </div>
              <div>
                <Label className="font-mono text-xs">رمز عبور (حداقل ۸ کاراکتر)</Label>
                <div className="relative mt-1.5">
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 font-mono" required minLength={8} />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">تکرار رمز عبور</Label>
                <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} className="mt-1.5 font-mono" required minLength={8} />
              </div>
              <Button type="submit" className="w-full font-mono" disabled={busy}>
                {busy ? "در حال ارسال..." : "> CREATE ACCOUNT"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              حساب دارید؟ <Link to="/login" className="text-primary font-mono hover:underline">ورود</Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground text-center font-mono">
              عضو تیم هستید؟ برای دعوت‌نامه با <a href="https://t.me/ViRus32_Org" target="_blank" rel="noreferrer" className="text-primary hover:underline">@ViRus32_Org</a> در ارتباط باشید.
            </p>
          </div>
        </Card>
      </section>
    </Layout>
  );
}
