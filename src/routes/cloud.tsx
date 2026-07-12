import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Upload, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/media";

export const Route = createFileRoute("/cloud")({
  head: () => ({ meta: [{ title: "فضای ابری من | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: CloudPage,
});

type UserFile = { id: string; name: string; path: string; size_bytes: number; mime_type: string | null; created_at: string };

function CloudPage() {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [quotaMb, setQuotaMb] = useState(1024);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const [{ data: fs }, { data: sub }] = await Promise.all([
      supabase.from("user_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vip_subscriptions").select("storage_quota_mb, expires_at").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setFiles((fs ?? []) as UserFile[]);
    if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) setQuotaMb(sub.storage_quota_mb);
    else setQuotaMb(1024);
    setBusy(false);
  };
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const usedBytes = files.reduce((s, f) => s + f.size_bytes, 0);
  const quotaBytes = quotaMb * 1024 * 1024;
  const percent = Math.min(100, (usedBytes / quotaBytes) * 100);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (usedBytes + file.size > quotaBytes) { toast.error("سقف فضای شما پر است"); return; }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `cloud/${user.id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("user_files").insert({
        user_id: user.id, name: file.name, path, size_bytes: file.size, mime_type: file.type || null,
      });
      if (dbErr) { await supabase.storage.from("media").remove([path]); throw dbErr; }
      toast.success("فایل بارگذاری شد");
      load();
    } catch (err) { toast.error((err as Error).message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const remove = async (f: UserFile) => {
    if (!confirm(`حذف «${f.name}»؟`)) return;
    await supabase.storage.from("media").remove([f.path]);
    const { error } = await supabase.from("user_files").delete().eq("id", f.id);
    if (error) toast.error(error.message);
    else { toast.success("حذف شد"); load(); }
  };

  const download = async (f: UserFile) => {
    const { data, error } = await supabase.storage.from("media").createSignedUrl(f.path, 60 * 10);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank");
  };

  if (authLoading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user) return <Layout><div className="p-14 text-center">برای دسترسی به فضای ابری وارد شوید.</div></Layout>;

  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// CLOUD_DRIVE</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">فضای ابری من</h1>
        <p className="text-muted-foreground mt-2 text-sm">فایل‌های خود را به‌صورت امن و رمزنگاری‌شده روی سرورهای سایبر ۳۲ نگهداری کنید.</p>

        <Card className="mt-6 p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
          <div className="flex items-center justify-between text-sm font-mono mb-2">
            <span>{formatFileSize(usedBytes)} از {quotaMb.toLocaleString("fa-IR")} MB</span>
            <span className={percent > 90 ? "text-destructive" : "text-primary"}>{percent.toFixed(1)}%</span>
          </div>
          <Progress value={percent} className="h-2" />
          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer">
              <Input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm hover:opacity-90">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری…</> : <><Upload className="w-4 h-4" /> بارگذاری فایل</>}
              </div>
            </label>
            <span className="text-xs text-muted-foreground font-mono">حداکثر ۵۰ مگابایت برای هر فایل</span>
          </div>
        </Card>

        <Card className="mt-4 p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
          <h2 className="font-bold mb-3">فایل‌ها ({files.length})</h2>
          {busy ? (
            <div className="text-center py-8 font-mono text-muted-foreground">&gt; loading...</div>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">هنوز فایلی بارگذاری نکرده‌اید.</p>
          ) : (
            <div className="divide-y divide-primary/10">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-3">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatFileSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString("fa-IR")}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => download(f)}><Download className="w-3 h-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(f)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </Layout>
  );
}
