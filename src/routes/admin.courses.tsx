import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Save, Trash2, ArrowRight, ListPlus } from "lucide-react";

type SearchParams = { edit?: string };

export const Route = createFileRoute("/admin/courses")({
  head: () => ({ meta: [{ title: "مدیریت دوره‌ها | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
  component: CourseAdminPage,
});

const slugRegex = /^[a-z0-9-]+$/;

const courseSchema = z.object({
  slug: z.string().min(2, "slug کوتاه است").max(80).regex(slugRegex, "فقط حروف کوچک انگلیسی، عدد و -"),
  title: z.string().trim().min(2, "عنوان الزامی است").max(200),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().max(50000).optional().or(z.literal("")),
  level: z.string().max(40),
  tag: z.string().max(40).optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
  hours: z.number().int().min(0).max(1000),
  price_toman: z.number().int().min(0),
  is_free: z.boolean(),
  published: z.boolean(),
});

type CourseRow = {
  id: string; slug: string; title: string; excerpt: string | null; content: string;
  level: string; tag: string | null; cover_url: string | null; hours: number;
  is_free: boolean; price_toman: number; published: boolean;
};

type LessonRow = { id: string; course_id: string; title: string; content: string; video_url: string | null; sort_order: number; is_free: boolean };

const emptyForm = {
  slug: "", title: "", excerpt: "", content: "", level: "مقدماتی", tag: "",
  cover_url: "", hours: 0, price_toman: 0, is_free: true, published: false,
};

function CourseAdminPage() {
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  // Lessons for editing course
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [newLesson, setNewLesson] = useState({ title: "", video_url: "", content: "", is_free: false });

  const load = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses((data ?? []) as CourseRow[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (search.edit && courses.length) {
      const c = courses.find((x) => x.id === search.edit);
      if (c) startEdit(c);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, courses.length]);

  const loadLessons = async (courseId: string) => {
    const { data } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order");
    setLessons((data ?? []) as LessonRow[]);
  };

  const startEdit = (c: CourseRow) => {
    setEditing(c);
    setForm({
      slug: c.slug, title: c.title, excerpt: c.excerpt ?? "", content: c.content ?? "",
      level: c.level, tag: c.tag ?? "", cover_url: c.cover_url ?? "",
      hours: c.hours, price_toman: c.price_toman, is_free: c.is_free, published: c.published,
    });
    loadLessons(c.id);
  };

  const resetForm = () => {
    setEditing(null); setForm(emptyForm); setLessons([]);
    navigate({ to: "/admin/courses", search: {} });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = courseSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const payload = {
        ...parsed.data,
        excerpt: parsed.data.excerpt || null,
        tag: parsed.data.tag || null,
        cover_url: parsed.data.cover_url || null,
        content: parsed.data.content ?? "",
      };
      if (editing) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("دوره به‌روزرسانی شد");
      } else {
        const { error } = await supabase.from("courses").insert({ ...payload, instructor_id: user!.id });
        if (error) throw error;
        toast.success("دوره ایجاد شد");
        resetForm();
      }
      await load();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف این دوره؟")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("حذف شد"); if (editing?.id === id) resetForm(); load(); }
  };

  const addLesson = async () => {
    if (!editing || !newLesson.title.trim()) return;
    const { error } = await supabase.from("lessons").insert({
      course_id: editing.id,
      title: newLesson.title,
      video_url: newLesson.video_url || null,
      content: newLesson.content,
      is_free: newLesson.is_free,
      sort_order: lessons.length,
    });
    if (error) toast.error(error.message);
    else { toast.success("درس افزوده شد"); setNewLesson({ title: "", video_url: "", content: "", is_free: false }); loadLessons(editing.id); }
  };

  const removeLesson = async (id: string) => {
    if (!confirm("حذف درس؟")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("حذف شد"); if (editing) loadLessons(editing.id); }
  };

  if (loading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; ...</div></Layout>;
  if (!user) return <Layout><div className="p-14 text-center">برای دسترسی وارد شوید.</div></Layout>;

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-primary">// COURSES_ADMIN</div>
            <h1 className="text-3xl font-bold mt-2">مدیریت دوره‌ها</h1>
          </div>
          <Link to="/courses" className="text-primary font-mono text-sm inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> بازگشت
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl lg:col-span-2 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              {editing ? <><Save className="w-4 h-4 text-primary" /> ویرایش «{editing.title}»</> : <><Plus className="w-4 h-4 text-primary" /> دوره جدید</>}
            </h2>
            <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ethical-hacking-101" required /></div>
              <div><Label>عنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>سطح</Label><Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
              <div><Label>برچسب</Label><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></div>
              <div><Label>ساعت</Label><Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} /></div>
              <div><Label>قیمت (تومان)</Label><Input type="number" value={form.price_toman} onChange={(e) => setForm({ ...form, price_toman: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><Label>تصویر کاور (URL)</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." /></div>
              <div className="md:col-span-2"><Label>خلاصه</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
              <div className="md:col-span-2"><Label>محتوای دوره (HTML)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} placeholder="<p>...</p><pre><code class='language-python'>print('hi')</code></pre>" /></div>
              <div className="flex items-center gap-3"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>رایگان</Label></div>
              <div className="flex items-center gap-3"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><Label>منتشرشده</Label></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={busy}>{editing ? "ذخیره تغییرات" : "ایجاد دوره"}</Button>
                {editing && <Button type="button" variant="outline" onClick={resetForm}>لغو</Button>}
              </div>
            </form>

            {editing && (
              <div className="mt-6 pt-6 border-t border-primary/20">
                <h3 className="font-bold flex items-center gap-2 mb-3"><ListPlus className="w-4 h-4 text-primary" /> دروس</h3>
                <div className="space-y-2 mb-4">
                  {lessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded border border-primary/20 text-sm">
                      <span>{l.title} {l.is_free && <span className="text-xs text-emerald-400 font-mono">رایگان</span>}</span>
                      <Button size="sm" variant="destructive" onClick={() => removeLesson(l.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Input placeholder="عنوان درس" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} />
                  <Input placeholder="آدرس ویدیو (اختیاری)" value={newLesson.video_url} onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })} />
                  <Textarea placeholder="محتوای درس (HTML)" value={newLesson.content} onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })} rows={3} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Switch checked={newLesson.is_free} onCheckedChange={(v) => setNewLesson({ ...newLesson, is_free: v })} /><Label>رایگان</Label></div>
                    <Button type="button" onClick={addLesson}><Plus className="w-4 h-4 ml-1" /> افزودن درس</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 bg-card/60 border-primary/20 backdrop-blur-xl">
            <h2 className="font-bold mb-3">لیست دوره‌ها ({courses.length})</h2>
            <div className="space-y-2 max-h-[600px] overflow-auto">
              {courses.map((c) => (
                <div key={c.id} className={`p-3 rounded border ${editing?.id === c.id ? "border-primary bg-primary/10" : "border-primary/20"}`}>
                  <div className="font-bold text-sm">{c.title}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">/{c.slug} · {c.published ? "منتشر" : "پیش‌نویس"}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(c)}>ویرایش</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="text-sm text-muted-foreground">هنوز دوره‌ای ندارید.</p>}
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
