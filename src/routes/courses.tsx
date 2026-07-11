import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Lock, Play, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "دوره‌های آموزشی سایبر ۳۲ | هک و امنیت" },
      { name: "description", content: "دوره‌های حرفه‌ای هک اخلاقی، تست نفوذ، امنیت شبکه و توسعه اکسپلویت از تیم Cyber32." },
      { property: "og:title", content: "دوره‌های آموزشی سایبر ۳۲" },
      { property: "og:description", content: "دوره‌های حرفه‌ای هک، امنیت و تست نفوذ." },
    ],
  }),
  component: CoursesPage,
});

type Course = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  level: string;
  tag: string | null;
  cover_url: string | null;
  hours: number;
  is_free: boolean;
  price_toman: number;
  published: boolean;
};

function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, slug, title, excerpt, level, tag, cover_url, hours, is_free, price_toman, published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCourses((data ?? []) as Course[]);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="font-mono text-xs text-primary">// LEARNING_PATHS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">دوره‌های آموزشی</h1>
          </div>
          {user && (
            <Link
              to="/admin/courses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> افزودن دوره
            </Link>
          )}
        </div>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          مسیرهای یادگیری از مقدماتی تا تخصصی در حوزه هک، امنیت تهاجمی، دفاع سایبری و مهندسی معکوس.
        </p>

        {loading ? (
          <div className="mt-16 text-center font-mono text-muted-foreground">&gt; loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="mt-16 p-10 rounded-lg border border-primary/20 bg-card/40 text-center">
            <p className="text-muted-foreground">هنوز دوره‌ای منتشر نشده است.</p>
            {user && <Link to="/admin/courses" className="text-primary font-mono mt-3 inline-block">افزودن اولین دوره</Link>}
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link key={c.id} to="/courses/$slug" params={{ slug: c.slug }}>
                <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl hover:border-primary/50 transition-colors h-full flex flex-col">
                  {c.cover_url && (
                    <img src={c.cover_url} alt={c.title} className="w-full h-32 object-cover rounded mb-4" />
                  )}
                  <div className="flex items-center justify-between mb-3">
                    {c.tag && <Badge variant="outline" className="font-mono border-primary/40 text-primary">{c.tag}</Badge>}
                    {c.is_free ? (
                      <span className="text-xs font-mono text-emerald-400">رایگان</span>
                    ) : (
                      <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {c.price_toman.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{c.title}</h2>
                  {c.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.excerpt}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}h</span>
                    <span>سطح: {c.level}</span>
                    {!c.published && <span className="text-amber-400">پیش‌نویس</span>}
                  </div>
                  <div className="mt-4 w-full py-2 rounded-md bg-primary/10 text-primary text-sm font-mono flex items-center justify-center gap-2">
                    <Play className="w-3 h-3" /> جزئیات دوره
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
