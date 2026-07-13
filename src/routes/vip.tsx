import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Zap, Shield, HardDrive, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "اشتراک VIP سایبر ۳۲ | امکانات ویژه" },
      { name: "description", content: "اشتراک ویژه سایبر ۳۲: دسترسی به دوره‌های پرمیوم، فضای ابری بیشتر، پشتیبانی اختصاصی و مزایای انحصاری." },
      { property: "og:title", content: "اشتراک VIP سایبر ۳۲" },
      { property: "og:description", content: "امکانات ویژه و دسترسی حرفه‌ای." },
    ],
  }),
  component: VipPage,
});

type Sub = { id: string; plan: string; status: string; expires_at: string | null; amount_toman: number; storage_quota_mb: number };

const plans = [
  { key: "monthly", title: "ماهانه", price: 199000, days: 30, quota: 5120, features: ["دسترسی به تمام دوره‌های VIP", "۵ گیگابایت فضای ابری", "نشان VIP در پروفایل", "پشتیبانی سریع"] },
  { key: "quarterly", title: "سه‌ماهه", price: 499000, days: 90, quota: 10240, features: ["تمام مزایای ماهانه", "۱۰ گیگابایت فضای ابری", "کارگاه اختصاصی ماهانه", "تخفیف ۱۵٪"] },
  { key: "yearly", title: "سالانه", price: 1690000, days: 365, quota: 51200, features: ["تمام مزایای سه‌ماهه", "۵۰ گیگابایت فضای ابری", "منتورشیپ خصوصی", "تخفیف ۳۰٪"] },
];

function VipPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("vip_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSubs((data ?? []) as Sub[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const active = subs.find((s) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date()));

  const contact = (planKey: string) => {
    const plan = plans.find((p) => p.key === planKey)!;
    const msg = encodeURIComponent(`سلام، درخواست اشتراک VIP پلن «${plan.title}» را دارم.`);
    window.open(`https://t.me/ViRus32_Org?text=${msg}`, "_blank");
    toast.info("برای فعال‌سازی با مالک در تلگرام تماس بگیرید.");
  };
  void busy; void setBusy;

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 font-mono text-xs text-primary">
            <Crown className="w-3 h-3" /> VIP_MEMBERSHIP
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 text-glow">اشتراک ویژه سایبر ۳۲</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            دسترسی نامحدود به محتوای پرمیوم، فضای ابری اختصاصی، منتورشیپ و ابزارهای حرفه‌ای امنیت سایبری.
          </p>
        </div>

        {active && (
          <Card className="p-5 bg-primary/10 border-primary/40 backdrop-blur-xl mb-8">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <div className="font-bold">اشتراک فعال شما</div>
                <div className="text-sm text-muted-foreground font-mono">
                  پلن {active.plan} · فضا: {active.storage_quota_mb} MB
                  {active.expires_at && ` · تا ${new Date(active.expires_at).toLocaleDateString("fa-IR")}`}
                </div>
              </div>
              <Link to="/cloud" className="text-primary font-mono text-sm">فضای ابری ←</Link>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <Card key={p.key} className={`p-6 bg-card/60 backdrop-blur-xl border ${p.key === "quarterly" ? "border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)]" : "border-primary/20"}`}>
              {p.key === "quarterly" && <Badge className="mb-3 font-mono">پیشنهاد ویژه</Badge>}
              <h3 className="text-2xl font-bold">{p.title}</h3>
              <div className="mt-3 font-mono">
                <span className="text-3xl font-bold text-primary">{p.price.toLocaleString("fa-IR")}</span>
                <span className="text-muted-foreground text-sm"> تومان</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full mt-6" disabled={busy || !user || !!active} onClick={() => request(p.key)}>
                {!user ? "ابتدا وارد شوید" : active ? "اشتراک فعال دارید" : "درخواست اشتراک"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: Zap, title: "دسترسی سریع", desc: "دوره‌ها و ابزارهای انحصاری بدون محدودیت." },
            { icon: HardDrive, title: "فضای ابری", desc: "تا ۵۰ گیگابایت فضای امن رمزنگاری‌شده." },
            { icon: Shield, title: "پشتیبانی اختصاصی", desc: "پاسخ‌گویی سریع تیم امنیت." },
            { icon: Sparkles, title: "کارگاه‌های زنده", desc: "دسترسی رایگان به رویدادها." },
            { icon: Crown, title: "نشان VIP", desc: "نمایش نشان ویژه در پروفایل و مقالات." },
            { icon: Check, title: "لغو در هر زمان", desc: "بدون قرارداد بلندمدت." },
          ].map((f, i) => (
            <Card key={i} className="p-4 bg-card/40 border-primary/20">
              <f.icon className="w-6 h-6 text-primary mb-2" />
              <div className="font-bold">{f.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-muted-foreground font-mono">
          &gt; پس از ثبت درخواست، تیم پشتیبانی برای فعال‌سازی از طریق تلگرام با شما در ارتباط است.
        </div>
      </section>
    </Layout>
  );
}
