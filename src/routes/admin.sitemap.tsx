import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useRoles } from "@/lib/roles";
import { useAuth } from "@/lib/auth";
import {
  Home, BookOpen, FileText, Info, Mail, HelpCircle, Shield, Crown, HardDrive,
  Users, LayoutDashboard, UserCog, GraduationCap, LogIn, UserPlus, KeyRound,
  FileLock, ScrollText, Map,
} from "lucide-react";

export const Route = createFileRoute("/admin/sitemap")({
  head: () => ({ meta: [{ title: "نقشه سایت | پنل مدیریت" }, { name: "robots", content: "noindex" }] }),
  component: SitemapAdmin,
});

const PUBLIC_ROUTES = [
  { to: "/", label: "خانه", icon: Home },
  { to: "/courses", label: "دوره‌ها", icon: BookOpen },
  { to: "/articles", label: "مقالات", icon: FileText },
  { to: "/team", label: "تیم", icon: Users },
  { to: "/about", label: "درباره ما", icon: Info },
  { to: "/contact", label: "تماس", icon: Mail },
  { to: "/faq", label: "پرسش‌های متداول", icon: HelpCircle },
  { to: "/vip", label: "اشتراک VIP", icon: Crown },
  { to: "/privacy", label: "حریم خصوصی", icon: FileLock },
  { to: "/terms", label: "قوانین", icon: ScrollText },
] as const;

const AUTH_ROUTES = [
  { to: "/login", label: "ورود", icon: LogIn },
  { to: "/register", label: "ثبت‌نام", icon: UserPlus },
  { to: "/forgot-password", label: "فراموشی رمز", icon: KeyRound },
] as const;

const USER_ROUTES = [
  { to: "/dashboard", label: "پنل کاربری", icon: LayoutDashboard },
  { to: "/security", label: "امنیت حساب", icon: Shield },
  { to: "/cloud", label: "فضای ابری", icon: HardDrive },
  { to: "/profile", label: "پروفایل", icon: UserCog },
] as const;

const ADMIN_ROUTES = [
  { to: "/admin", label: "پنل مدیریت پست‌ها", icon: LayoutDashboard },
  { to: "/admin/courses", label: "مدیریت دوره‌ها", icon: GraduationCap },
  { to: "/admin/vip", label: "درخواست‌های VIP", icon: Crown },
  { to: "/admin/sitemap", label: "نقشه سایت", icon: Map },
] as const;

function Section({ title, items }: { title: string; items: readonly { to: string; label: string; icon: React.ElementType }[] }) {
  return (
    <div>
      <h2 className="font-mono text-xs text-primary mb-3">// {title}</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="p-4 bg-card/60 border-primary/20 hover:border-primary/60 transition-all">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-bold text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground font-mono">{to}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SitemapAdmin() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();

  if (loading || rolesLoading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user) return <Layout><div className="p-14 text-center">برای دسترسی وارد شوید.</div></Layout>;
  if (!isAdmin) return <Layout><div className="p-14 text-center">دسترسی فقط برای ادمین‌ها.</div></Layout>;

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-primary" />
          <div>
            <div className="font-mono text-xs text-primary">// SITE_MAP</div>
            <h1 className="text-3xl font-bold mt-1">نقشه کامل سایت</h1>
            <p className="text-sm text-muted-foreground mt-1">تمام مسیرها و صفحات سایت در یک نگاه.</p>
          </div>
        </div>
        <Section title="PUBLIC" items={PUBLIC_ROUTES} />
        <Section title="AUTH" items={AUTH_ROUTES} />
        <Section title="USER_AREA" items={USER_ROUTES} />
        <Section title="ADMIN" items={ADMIN_ROUTES} />
      </section>
    </Layout>
  );
}
