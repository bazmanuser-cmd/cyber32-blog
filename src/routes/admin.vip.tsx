import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowRight, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vip")({
  head: () => ({ meta: [{ title: "مدیریت VIP | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: AdminVip,
});

type Row = { id: string; user_id: string; plan: string; status: string; amount_toman: number; starts_at: string | null; expires_at: string | null; storage_quota_mb: number; admin_note: string | null; created_at: string };

function AdminVip() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username: string; display_name: string | null }>>({});

  const load = async () => {
    const { data } = await supabase.from("vip_subscriptions").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      const map: Record<string, { username: string; display_name: string | null }> = {};
      (profs ?? []).forEach((p) => { map[p.id] = { username: p.username, display_name: p.display_name }; });
      setProfiles(map);
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const approve = async (r: Row) => {
    const days = r.plan === "yearly" ? 365 : r.plan === "quarterly" ? 90 : 30;
    const now = new Date();
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("vip_subscriptions").update({
      status: "active", starts_at: now.toISOString(), expires_at: expires.toISOString(),
    }).eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("فعال شد"); load(); }
  };

  const reject = async (r: Row) => {
    const { error } = await supabase.from("vip_subscriptions").update({ status: "rejected" }).eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("رد شد"); load(); }
  };

  const cancel = async (r: Row) => {
    if (!confirm("لغو اشتراک؟")) return;
    const { error } = await supabase.from("vip_subscriptions").update({ status: "cancelled" }).eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("لغو شد"); load(); }
  };

  if (loading || rolesLoading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user || !isAdmin) return <Layout><div className="p-14 text-center">دسترسی مجاز نیست.</div></Layout>;

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-primary flex items-center gap-2"><Crown className="w-3 h-3" /> // VIP_ADMIN</div>
            <h1 className="text-3xl font-bold mt-2">مدیریت اشتراک‌های VIP</h1>
          </div>
          <Link to="/admin" className="text-primary font-mono text-sm inline-flex items-center gap-2"><ArrowRight className="w-4 h-4" /> بازگشت</Link>
        </div>

        <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
          <div className="space-y-3">
            {rows.map((r) => {
              const p = profiles[r.user_id];
              return (
                <div key={r.id} className="p-4 rounded border border-primary/20 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-bold">{p?.display_name || p?.username || r.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground font-mono">@{p?.username ?? "?"}</div>
                    <div className="text-xs mt-1 font-mono">
                      پلن {r.plan} · {r.amount_toman.toLocaleString("fa-IR")} تومان · {r.storage_quota_mb} MB
                      {r.expires_at && ` · تا ${new Date(r.expires_at).toLocaleDateString("fa-IR")}`}
                    </div>
                  </div>
                  <Badge variant={r.status === "active" ? "default" : r.status === "pending" ? "outline" : "secondary"}>
                    {r.status}
                  </Badge>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => approve(r)}><Check className="w-3 h-3 ml-1" /> تأیید</Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(r)}><X className="w-3 h-3" /></Button>
                    </>
                  )}
                  {r.status === "active" && <Button size="sm" variant="destructive" onClick={() => cancel(r)}>لغو</Button>}
                </div>
              );
            })}
            {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">هنوز درخواستی ثبت نشده.</p>}
          </div>
        </Card>
      </section>
    </Layout>
  );
}
