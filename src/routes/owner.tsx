import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, ScrollText, Search, Settings2, Shield, UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "پنل مالک | Cyber32" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: OwnerPanel,
});

type OwnerProfile = { id: string; username: string; display_name: string | null };
type AuditEntry = { id: string; user_id: string | null; action: string; entity: string | null; ip: string | null; user_agent: string | null; created_at: string };
type TeamApplication = { id: string; full_name: string; email: string; username: string; answers: Record<string, unknown>; status: string; created_at: string };
type FormField = { key: string; label: string; type: "text" | "textarea"; required: boolean };
type SeoSettings = { title: string; description: string };

const initialSeo: SeoSettings = {
  title: "Cyber32 | تیم امنیت سایبری و هک",
  description: "بلاگ رسمی تیم سایبر ۳۲ — هک، امنیت، کانفیگ، دیتابیس، سورس کد و آموزش.",
};

function OwnerPanel() {
  const { user, loading } = useAuth();
  const { isOwner, isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<OwnerProfile[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [seo, setSeo] = useState(initialSeo);
  const [formEnabled, setFormEnabled] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    else if (!loading && user && !rolesLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, user, rolesLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const load = async () => {
      const [profileResult, rolesResult, logsResult, settingsResult, applicationsResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name").order("username"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("audit_logs").select("id,user_id,action,entity,ip,user_agent,created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("site_settings").select("key,value").in("key", ["seo", "team_application"]),
        supabase.from("team_applications").select("id,full_name,email,username,answers,status,created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      if (profileResult.error || rolesResult.error || logsResult.error || settingsResult.error || applicationsResult.error) {
        toast.error("برخی اطلاعات پنل مالک بارگذاری نشد.");
      }
      const rows = (profileResult.data ?? []) as OwnerProfile[];
      setProfiles(rows);
      if (rows[0]) setSelectedId((current) => current || rows[0].id);
      setAdminIds((rolesResult.data ?? []).filter((row) => row.role === "admin").map((row) => row.user_id));
      setLogs((logsResult.data ?? []) as AuditEntry[]);
      setApplications((applicationsResult.data ?? []) as TeamApplication[]);
      const settings = Object.fromEntries((settingsResult.data ?? []).map((item) => [item.key, item.value])) as Record<string, { title?: string; description?: string; enabled?: boolean; fields?: FormField[] }>;
      setSeo({ title: settings.seo?.title ?? initialSeo.title, description: settings.seo?.description ?? initialSeo.description });
      setFormEnabled(settings.team_application?.enabled !== false);
      setFields(settings.team_application?.fields ?? []);
    };
    void load();
  }, [user, isAdmin]);

  if (loading || rolesLoading || !user || !isAdmin) {
    return <Layout><div className="p-20 text-center text-muted-foreground">در حال بررسی مجوز مالک...</div></Layout>;
  }

  const grantAdmin = async (targetId: string, enabled: boolean) => {
    const { error } = await supabase.rpc("set_admin_role", { _target_user_id: targetId, _enabled: enabled });
    if (error) toast.error("تغییر دسترسی مدیر انجام نشد: " + error.message);
    else {
      setAdminIds((ids) => enabled ? [...new Set([...ids, targetId])] : ids.filter((id) => id !== targetId));
      toast.success(enabled ? "دسترسی مدیر اعطا شد" : "دسترسی مدیر لغو شد");
    }
  };

  const saveSetting = async (key: string, value: object) => {
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key, value: value as Json });
    setBusy(false);
    if (error) toast.error("ذخیره تنظیمات انجام نشد: " + error.message);
    else toast.success("تنظیمات ذخیره شد");
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("team_applications").update({ status }).eq("id", id);
    if (error) toast.error("وضعیت درخواست تغییر نکرد.");
    else setApplications((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  };

  const addField = () => setFields((items) => [...items, { key: `field_${Date.now()}`, label: "پرسش جدید", type: "text", required: false }]);
  const updateField = (index: number, patch: Partial<FormField>) => setFields((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const visibleProfiles = profiles.filter((item) => `${item.username} ${item.display_name ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap border-b border-border pb-6">
          <div>
            <div className="font-mono text-xs text-primary">// OWNER_CONTROL</div>
            <h1 className="text-3xl font-bold mt-2">پنل مالک</h1>
            <p className="text-sm text-muted-foreground mt-2">مدیریت دسترسی، تنظیمات سایت و سوابق مدیریتی</p>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><Shield className="w-4 h-4" /> پنل مدیریت محتوا</Link>
        </header>

        {isOwner && <section aria-labelledby="admin-access-heading">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary" /><h2 id="admin-access-heading" className="text-xl font-bold">اعطای دسترسی مدیر</h2></div>
          <Card className="p-5 space-y-4">
            <div className="relative max-w-md"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی حساب‌ها" className="pr-9" /></div>
            <div className="max-h-80 overflow-auto divide-y divide-border">
              {visibleProfiles.map((item) => {
                const isAdmin = adminIds.includes(item.id);
                const isSelf = item.id === user.id;
                return <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0"><div className="font-medium truncate">{item.display_name || item.username}</div><div className="text-xs text-muted-foreground font-mono">@{item.username}</div></div>
                  <Button size="sm" variant={isAdmin ? "outline" : "default"} disabled={isSelf} onClick={() => void grantAdmin(item.id, !isAdmin)}>
                    {isAdmin ? "لغو مدیر" : <><UserPlus className="w-4 h-4" /> اعطای مدیر</>}
                  </Button>
                </div>;
              })}
              {visibleProfiles.length === 0 && <p className="py-5 text-sm text-muted-foreground">حسابی پیدا نشد.</p>}
            </div>
          </Card>
        </section>}

        <section aria-labelledby="seo-heading">
          <div className="flex items-center gap-2 mb-4"><Settings2 className="w-5 h-5 text-primary" /><h2 id="seo-heading" className="text-xl font-bold">عنوان و توضیحات سئو</h2></div>
          <Card className="p-5 space-y-4">
            <div><Label htmlFor="seo-title">عنوان پیش‌فرض</Label><Input id="seo-title" value={seo.title} maxLength={180} onChange={(event) => setSeo({ ...seo, title: event.target.value })} className="mt-1.5" /></div>
            <div><Label htmlFor="seo-description">توضیحات پیش‌فرض</Label><Textarea id="seo-description" value={seo.description} maxLength={320} rows={3} onChange={(event) => setSeo({ ...seo, description: event.target.value })} className="mt-1.5" /></div>
            <Button disabled={busy} onClick={() => void saveSetting("seo", seo)}>ذخیره تنظیمات سئو</Button>
          </Card>
        </section>

        <section aria-labelledby="application-heading">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary" /><h2 id="application-heading" className="text-xl font-bold">فرم عضویت تیم</h2></div>
          <Card className="p-5 space-y-4">
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={formEnabled} onChange={(event) => setFormEnabled(event.target.checked)} /> پذیرش درخواست جدید فعال باشد</label>
            {fields.map((field, index) => <div key={field.key} className="grid md:grid-cols-[1fr_160px_auto_auto] gap-3 items-center">
              <Input aria-label="عنوان پرسش" value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} />
              <select aria-label="نوع پاسخ" value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FormField["type"] })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="text">پاسخ کوتاه</option><option value="textarea">پاسخ بلند</option></select>
              <label className="flex items-center gap-2 text-sm whitespace-nowrap"><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} /> اجباری</label>
              <Button variant="outline" size="sm" onClick={() => setFields((items) => items.filter((_, i) => i !== index))}>حذف</Button>
            </div>)}
            <div className="flex gap-2 flex-wrap"><Button variant="outline" onClick={addField}>افزودن پرسش</Button><Button disabled={busy} onClick={() => void saveSetting("team_application", { enabled: formEnabled, fields })}>ذخیره فرم</Button><Link to="/team" className="inline-flex items-center text-sm text-primary underline underline-offset-4">پیش‌نمایش فرم</Link></div>
          </Card>
        </section>

        <section aria-labelledby="applications-heading">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary" /><h2 id="applications-heading" className="text-xl font-bold">درخواست‌های عضویت</h2></div>
          <div className="space-y-3">
            {applications.map((application) => <Card key={application.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div><h3 className="font-bold">{application.full_name}</h3><p className="text-sm text-muted-foreground">{application.email} · @{application.username}</p><p className="text-xs text-muted-foreground mt-1">{new Date(application.created_at).toLocaleString("fa-IR")}</p></div>
                <select aria-label={`وضعیت درخواست ${application.full_name}`} value={application.status} onChange={(event) => void updateApplicationStatus(application.id, event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="pending">در انتظار</option><option value="reviewed">بررسی‌شده</option><option value="accepted">پذیرفته</option><option value="declined">ردشده</option></select>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(application.answers ?? {}).map(([key, answer]) => <div key={key}><dt className="text-xs text-muted-foreground">{key}</dt><dd className="text-sm whitespace-pre-wrap break-words">{String(answer)}</dd></div>)}</dl>
            </Card>)}
            {applications.length === 0 && <Card className="p-5 text-sm text-muted-foreground">درخواستی ثبت نشده است.</Card>}
          </div>
        </section>

        <section aria-labelledby="owner-security-heading">
          <div className="flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-primary" /><h2 id="owner-security-heading" className="text-xl font-bold">امنیت پنل مالک</h2></div>
          <Card className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">پنل مالک از نوار عمومی پنهان است و تمام داده‌های حساس با نقش مالک در پایگاه‌داده محافظت می‌شوند. برای محدودسازی ورود بر اساس IP یا دستگاه، لایهٔ استقرار و ارائه‌دهندهٔ احراز هویت باید سیاست اجرایی داشته باشند؛ این قابلیت با تنظیم مرورگری به‌تنهایی امن نیست.</p>
            <Link to="/security" className="inline-flex items-center text-sm text-primary underline underline-offset-4">تنظیم تأیید دومرحله‌ای حساب</Link>
          </Card>
        </section>

        <section aria-labelledby="audit-heading">
          <div className="flex items-center gap-2 mb-4"><ScrollText className="w-5 h-5 text-primary" /><h2 id="audit-heading" className="text-xl font-bold">گزارش رویدادها</h2></div>
          <Card className="divide-y divide-border overflow-hidden">
            {logs.map((entry) => <div key={entry.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-2 text-sm">
              <div><span className="font-mono text-primary">{entry.action}</span>{entry.entity && <span className="text-muted-foreground"> · {entry.entity}</span>}<div className="mt-1 text-xs text-muted-foreground">شناسه کاربر: {entry.user_id ?? "سیستم"}{entry.ip && ` · IP: ${entry.ip}`}</div></div>
              <time className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("fa-IR")}</time>
            </div>)}
            {logs.length === 0 && <p className="p-5 text-sm text-muted-foreground">رویدادی برای نمایش ثبت نشده است.</p>}
          </Card>
        </section>
      </section>
    </Layout>
  );
}