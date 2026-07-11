import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import {
  changePassword,
  listMyAuditLogs,
  enrollTotp,
  verifyTotp,
  disableTotp,
} from "@/lib/security.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, KeyRound, ScrollText, Smartphone } from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "امنیت حساب | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  metadata: unknown;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

function SecurityPage() {
  const { user, loading } = useAuth();
  const changePw = useServerFn(changePassword);
  const listLogs = useServerFn(listMyAuditLogs);
  const doEnroll = useServerFn(enrollTotp);
  const doVerify = useServerFn(verifyTotp);
  const doDisable = useServerFn(disableTotp);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [enrollUri, setEnrollUri] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    listLogs({}).then((r) => setLogs(r as AuditRow[])).catch(() => {});
    supabase.from("profiles").select("two_factor_enabled").eq("id", user.id).maybeSingle()
      .then(({ data }) => setTwoFAEnabled(Boolean(data?.two_factor_enabled)));
  }, [user, listLogs]);

  if (loading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user) return <Layout><div className="p-14 text-center">برای دسترسی وارد شوید.</div></Layout>;

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) { toast.error("رمز عبور و تکرار آن یکی نیستند"); return; }
    setBusy(true);
    try {
      await changePw({ data: { newPassword: pw } });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setPw(""); setPw2("");
      listLogs({}).then((r) => setLogs(r as AuditRow[]));
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const startEnroll = async () => {
    try {
      const r = await doEnroll({});
      setEnrollUri(r.uri); setEnrollSecret(r.secret);
    } catch (e) { toast.error((e as Error).message); }
  };

  const submitCode = async () => {
    try {
      await doVerify({ data: { code } });
      toast.success("۲FA فعال شد");
      setEnrollUri(null); setEnrollSecret(null); setCode(""); setTwoFAEnabled(true);
    } catch (e) { toast.error((e as Error).message); }
  };

  const turnOff = async () => {
    try { await doDisable({}); toast.success("۲FA غیرفعال شد"); setTwoFAEnabled(false); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// SECURITY</span>
        </div>
        <h1 className="text-3xl font-bold">امنیت حساب</h1>

        <Card className="p-6 bg-card/60 border-primary/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-primary" /><h2 className="font-bold">تغییر رمز عبور</h2></div>
          <form onSubmit={submitPw} className="space-y-3 max-w-md">
            <div><Label>رمز عبور جدید</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required /></div>
            <div><Label>تکرار رمز جدید</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required /></div>
            <Button type="submit" disabled={busy}>ذخیره</Button>
          </form>
        </Card>

        <Card className="p-6 bg-card/60 border-primary/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4"><Smartphone className="w-5 h-5 text-primary" /><h2 className="font-bold">تأیید دو مرحله‌ای (TOTP)</h2></div>
          {twoFAEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">۲FA برای حساب شما <span className="text-primary font-mono">فعال</span> است.</p>
              <Button variant="destructive" onClick={turnOff}>غیرفعال‌سازی</Button>
            </div>
          ) : enrollUri ? (
            <div className="space-y-3">
              <p className="text-sm">این آدرس/کلید را در برنامه Authenticator خود ثبت کنید:</p>
              <div className="font-mono text-xs bg-background/50 p-3 rounded border border-primary/20 break-all">{enrollUri}</div>
              <div className="font-mono text-xs">کلید: <span className="text-primary">{enrollSecret}</span></div>
              <div className="max-w-xs">
                <Label>کد ۶ رقمی</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" />
              </div>
              <Button onClick={submitCode} disabled={code.length !== 6}>تأیید و فعال‌سازی</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">با فعال‌سازی، برای عملیات حساس یک کد از اپلیکیشن Authenticator تولید می‌شود.</p>
              <Button onClick={startEnroll}>شروع فعال‌سازی</Button>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card/60 border-primary/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4"><ScrollText className="w-5 h-5 text-primary" /><h2 className="font-bold">لاگ فعالیت‌ها</h2></div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {logs.length === 0 && <p className="text-sm text-muted-foreground">هنوز رخدادی ثبت نشده است.</p>}
            {logs.map((l) => (
              <div key={l.id} className="text-xs font-mono flex items-center justify-between border border-primary/10 rounded px-3 py-2">
                <span className="text-primary">{l.action}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </Layout>
  );
}
