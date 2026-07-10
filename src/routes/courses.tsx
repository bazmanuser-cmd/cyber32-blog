import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Lock, Play, Clock } from "lucide-react";

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

const PLACEHOLDER = [
  { title: "مقدمات هک اخلاقی", level: "مقدماتی", hours: 12, free: true, tag: "Ethical Hacking" },
  { title: "تست نفوذ وب پیشرفته", level: "پیشرفته", hours: 24, free: false, tag: "Web PT" },
  { title: "شبکه و امنیت لینوکس", level: "متوسط", hours: 18, free: true, tag: "Linux" },
  { title: "مهندسی معکوس و مالوِر", level: "تخصصی", hours: 30, free: false, tag: "RE" },
  { title: "OSINT — جمع‌آوری اطلاعات", level: "مقدماتی", hours: 8, free: true, tag: "OSINT" },
  { title: "توسعه اکسپلویت", level: "تخصصی", hours: 40, free: false, tag: "Exploit Dev" },
];

function CoursesPage() {
  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// LEARNING_PATHS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">دوره‌های آموزشی</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          مسیرهای یادگیری از مقدماتی تا تخصصی در حوزه هک، امنیت تهاجمی، دفاع سایبری و مهندسی معکوس.
          دوره‌های رایگان همین حالا قابل دسترسی هستند؛ دوره‌های ویژه به‌زودی با خرید آنلاین فعال می‌شوند.
        </p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLACEHOLDER.map((c) => (
            <Card key={c.title} className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="font-mono border-primary/40 text-primary">{c.tag}</Badge>
                {c.free ? (
                  <span className="text-xs font-mono text-emerald-400">رایگان</span>
                ) : (
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" /> ویژه</span>
                )}
              </div>
              <h2 className="text-lg font-bold">{c.title}</h2>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}h</span>
                <span>سطح: {c.level}</span>
              </div>
              <button className="mt-4 w-full py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-sm font-mono flex items-center justify-center gap-2 transition-colors">
                <Play className="w-3 h-3" /> جزئیات دوره
              </button>
            </Card>
          ))}
        </div>

        <div className="mt-14 p-6 rounded-lg border border-primary/20 bg-card/40 backdrop-blur-xl text-center">
          <p className="text-sm text-muted-foreground">
            پیشنهاد دوره جدید یا همکاری به عنوان مدرس؟{" "}
            <Link to="/contact" className="text-primary hover:underline font-mono">تماس با ما</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
