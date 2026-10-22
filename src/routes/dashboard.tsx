import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, GraduationCap, HardDrive, FileText, Bell, Settings, Shield, CreditCard, Map, BookOpen, Crown } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "پنل کاربری | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type DashboardPost = { id: string; title: string; created_at: string; view_count: number };

function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { roles, isAdmin, isOwner } = useRoles();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("posts").select("id,title,created_at,view_count").eq("author_id", user.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => {
        setPosts((data ?? []) as DashboardPost[]);
        setPostsLoading(false);
      });
  }, [user]);

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

        <section className="mt-8" aria-labelledby="my-post-stats">
          <div className="flex items-end justify-between gap-4 mb-3">
            <h2 id="my-post-stats" className="text-lg font-bold">آمار محتوای من</h2>
            <span className="text-xs text-muted-foreground">نمایش جزئیات حداکثر ۱۰۰ پست اخیر</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Card className="p-4"><div className="text-xs text-muted-foreground">تعداد پست‌ها</div><div className="text-2xl font-mono font-bold mt-1">{postsLoading ? "..." : posts.length}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">مجموع بازدید پست‌ها</div><div className="text-2xl font-mono font-bold mt-1">{postsLoading ? "..." : posts.reduce((total, post) => total + post.view_count, 0).toLocaleString("fa-IR")}</div></Card>
          </div>
          <Card className="divide-y divide-border overflow-hidden">
            {posts.map((post) => <div key={post.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0"><Link to="/post/$id" params={{ id: post.id }} className="font-medium truncate block hover:text-primary">{post.title}</Link><time className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("fa-IR")}</time></div>
              <div className="text-sm font-mono whitespace-nowrap">{post.view_count.toLocaleString("fa-IR")} بازدید</div>
            </div>)}
            {!postsLoading && posts.length === 0 && <p className="p-4 text-sm text-muted-foreground">هنوز پستی ندارید.</p>}
          </Card>
        </section>

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
            <>
              <Link to="/admin">
                <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                  <Shield className="w-6 h-6 text-primary mb-3" />
                  <div className="font-bold text-primary">پنل مدیریت پست‌ها</div>
                  <div className="text-sm text-muted-foreground mt-1">پست‌های اختصاصی و مدیریت محتوا</div>
                </Card>
              </Link>
              <Link to="/admin/courses">
                <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                  <BookOpen className="w-6 h-6 text-primary mb-3" />
                  <div className="font-bold text-primary">مدیریت دوره‌ها</div>
                  <div className="text-sm text-muted-foreground mt-1">افزودن، ویرایش و انتشار دوره‌ها</div>
                </Card>
              </Link>
              <Link to="/admin/vip">
                <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                  <Crown className="w-6 h-6 text-primary mb-3" />
                  <div className="font-bold text-primary">درخواست‌های VIP</div>
                  <div className="text-sm text-muted-foreground mt-1">تأیید و مدیریت اشتراک‌ها</div>
                </Card>
              </Link>
              <Link to="/admin/sitemap">
                <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                  <Map className="w-6 h-6 text-primary mb-3" />
                  <div className="font-bold text-primary">نقشه کامل سایت</div>
                  <div className="text-sm text-muted-foreground mt-1">دسترسی به تمام مسیرها</div>
                </Card>
              </Link>
            </>
          )}
          {isOwner && (
            <Link to="/owner">
              <Card className="p-5 bg-primary/5 border-primary/40 backdrop-blur-xl hover:border-primary transition-all h-full">
                <Shield className="w-6 h-6 text-primary mb-3" />
                <div className="font-bold text-primary">پنل مالک</div>
                <div className="text-sm text-muted-foreground mt-1">دسترسی‌ها، تنظیمات سایت و گزارش‌ها</div>
              </Card>
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
}
