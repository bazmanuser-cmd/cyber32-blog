import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Clock, Lock, Play, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RichContent } from "@/components/RichContent";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `دوره ${params.slug} | سایبر ۳۲` },
      { name: "description", content: "جزئیات دوره آموزشی سایبر ۳۲" },
    ],
  }),
  component: CourseDetail,
});

type Course = {
  id: string; slug: string; title: string; excerpt: string | null; content: string;
  level: string; tag: string | null; cover_url: string | null; hours: number;
  is_free: boolean; price_toman: number; published: boolean; instructor_id: string | null;
};
type Lesson = { id: string; title: string; content: string; video_url: string | null; sort_order: number; is_free: boolean };

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Lesson | null>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as Course);
      const { data: ls } = await supabase
        .from("lessons").select("*").eq("course_id", c.id).order("sort_order", { ascending: true });
      const arr = (ls ?? []) as Lesson[];
      setLessons(arr);
      setActive(arr[0] ?? null);
      setLoading(false);
    })();
  }, [slug]);

  const remove = async () => {
    if (!course) return;
    if (!confirm("حذف این دوره؟")) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) toast.error(error.message);
    else { toast.success("حذف شد"); navigate({ to: "/courses" }); }
  };

  if (loading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; loading...</div></Layout>;
  if (!course) return (
    <Layout>
      <div className="max-w-md mx-auto p-14 text-center">
        <p className="text-muted-foreground">دوره یافت نشد.</p>
        <Link to="/courses" className="text-primary font-mono mt-4 inline-block">بازگشت</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-12">
        <Link to="/courses" className="inline-flex items-center gap-2 text-primary font-mono text-sm mb-6">
          <ArrowRight className="w-4 h-4" /> بازگشت به دوره‌ها
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {course.cover_url && (
              <img src={course.cover_url} alt={course.title} className="w-full rounded-lg border border-primary/20" />
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <GraduationCap className="w-6 h-6 text-primary" />
                {course.tag && <Badge variant="outline" className="font-mono border-primary/40 text-primary">{course.tag}</Badge>}
                <span className="text-xs font-mono text-muted-foreground">سطح: {course.level}</span>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {course.hours}h</span>
                {!course.published && <span className="text-xs font-mono text-amber-400">پیش‌نویس</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mt-3">{course.title}</h1>
              {course.excerpt && <p className="text-muted-foreground mt-3">{course.excerpt}</p>}
            </div>

            {course.content && <RichContent html={course.content} className="text-lg" />}

            {active && (
              <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
                <div className="font-mono text-xs text-primary">// LESSON</div>
                <h2 className="text-xl font-bold mt-2">{active.title}</h2>
                {active.video_url && (
                  <video src={active.video_url} controls className="w-full mt-4 rounded border border-primary/20" />
                )}
                {active.content && <RichContent html={active.content} className="mt-4" />}
              </Card>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold">
                  {course.is_free ? (
                    <span className="text-emerald-400">رایگان</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1"><Lock className="w-4 h-4" /> {course.price_toman.toLocaleString("fa-IR")} تومان</span>
                  )}
                </div>
              </div>
              <Button className="w-full font-mono"><Play className="w-4 h-4 ml-2" /> شروع یادگیری</Button>
              {user && (
                <div className="mt-3 flex gap-2">
                  <Link to="/admin/courses" search={{ edit: course.id }} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full"><Pencil className="w-3 h-3 ml-1" /> ویرایش</Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-3 h-3" /></Button>
                </div>
              )}
            </Card>

            <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
              <div className="font-bold mb-3">فهرست دروس ({lessons.length})</div>
              {lessons.length === 0 && <p className="text-sm text-muted-foreground">هنوز درسی اضافه نشده.</p>}
              <ul className="space-y-2">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => setActive(l)}
                      className={`w-full text-right p-2 rounded text-sm flex items-center justify-between transition-colors ${
                        active?.id === l.id ? "bg-primary/20 text-primary" : "hover:bg-primary/10"
                      }`}
                    >
                      <span>{l.title}</span>
                      {l.is_free && <span className="text-xs text-emerald-400 font-mono">رایگان</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
