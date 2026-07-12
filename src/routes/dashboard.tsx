import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, GraduationCap, HardDrive, FileText, Bell, Settings, Shield, CreditCard } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "پنل کاربری | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { roles, isAdmin } = useRoles();

  if (loading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user) return (
    <Layout><div className="max-w-md mx-auto p-14 text-center">
      <p className="text-muted-foreground">برای مشاهده پنل کاربری وارد شوید.</p>
      <Link to="/login" className="text-primary font-mono mt-4 inline-block">ورود</Link>
    </div></Layout>
  );

  const items = [
    { icon: GraduationCap, title: "دوره‌های من", desc: "دوره‌های ثبت‌نامی شما", to: "/courses" as const },
    { icon: FileText, title: "مقالات من", desc: "پیش‌نویس‌ها و منتشرشده", to: "/articles" as const },
    { icon: HardDrive, title: "فضای ابری", desc: "۱ گیگابایت (VIP: تا ۵۰GB)", to: "/cloud" as const },
    { icon: CreditCard, title: "اشتراک VIP", desc: "وضعیت و ارتقا", to: "/vip" as const },
    { icon: Bell, title: "اعلان‌ها", desc: "پیام‌ها و رویدادها", to: "/dashboard" as const },
    { icon: Settings, title: "تنظیمات پروفایل", desc: "ویرایش اطلاعات و رمز", to: "/profile" as const },
    { icon: Shield, title: "امنیت حساب", desc: "رمز، ۲FA و لاگ فعالیت", to: "/security" as const },
  ];

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// DASHBOARD</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          خوش آمدی، <span className="text-primary font-mono">@{profile?.username}</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((r) => (
            <span key={r} className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
              {r}
            </span>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ icon: Icon, title, desc, to }) => (
            <Link key={title} to={to}>
              <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl hover:border-primary/60 transition-all h-full">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <div className="font-bold">{title}</div>
                <div className="text-sm text-muted-foreground mt-1">{desc}</div>
              </Card>
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin">
              <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                <Shield className="w-6 h-6 text-primary mb-3" />
                <div className="font-bold text-primary">پنل مدیریت</div>
                <div className="text-sm text-muted-foreground mt-1">مدیریت پست‌ها، کاربران و محتوا</div>
              </Card>
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
}
