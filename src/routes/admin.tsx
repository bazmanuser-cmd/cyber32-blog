import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, Edit3, PlusCircle, X, User as UserIcon, Terminal } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

type Post = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  author_id: string;
};

const CATEGORIES = ["هک", "امنیت", "آموزش", "کانفیگ", "دیتابیس", "سورس‌کد", "اخبار", "متفرقه"];

function Admin() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ url: string | null; type: string | null }>({ url: null, type: null });

  // Profile edit
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  const loadPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setPosts((data as any) ?? []);
  };

  useEffect(() => { loadPosts(); }, [user]);

  const resetForm = () => {
    setTitle(""); setContent(""); setCategory(CATEGORIES[0]);
    setFile(null); setEditing(null); setExistingMedia({ url: null, type: null });
    setShowForm(false);
  };

  const startEdit = (p: Post) => {
    setEditing(p);
    setTitle(p.title); setContent(p.content);
    setCategory(p.category ?? CATEGORIES[0]);
    setExistingMedia({ url: p.media_url, type: p.media_type });
    setFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadMedia = async (f: File): Promise<{ url: string; type: string } | null> => {
    if (!user) return null;
    const ext = f.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, f, {
      contentType: f.type, upsert: false,
    });
    if (error) { toast.error("خطا در آپلود: " + error.message); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { url: data.publicUrl, type: f.type };
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) return toast.error("عنوان و متن الزامی است");
    setSaving(true);

    let media_url = existingMedia.url;
    let media_type = existingMedia.type;

    if (file) {
      const up = await uploadMedia(file);
      if (up) { media_url = up.url; media_type = up.type; }
    }

    if (editing) {
      const { error } = await supabase.from("posts").update({
        title, content, category, media_url, media_type,
      }).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("پست ویرایش شد");
    } else {
      const { error } = await supabase.from("posts").insert({
        title, content, category, media_url, media_type, author_id: user.id,
      });
      if (error) toast.error(error.message); else toast.success("پست منتشر شد");
    }
    setSaving(false);
    resetForm();
    loadPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("حذف این پست؟")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("پست حذف شد"); loadPosts(); }
  };

  const saveProfile = async () => {
    if (!user) return;
    let avatar_url = profile?.avatar_url ?? null;
    if (avatarFile) {
      const up = await uploadMedia(avatarFile);
      if (up) avatar_url = up.url;
    }
    const { error } = await supabase.from("profiles").update({
      display_name: displayName, bio, avatar_url,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("پروفایل به‌روزرسانی شد"); refreshProfile(); setAvatarFile(null); }
  };

  if (loading || !user) {
    return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; در حال بررسی دسترسی...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs text-primary">// ADMIN_PANEL</div>
            <h1 className="text-3xl font-bold mt-1">پنل مدیریت</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              @{profile?.username} — {posts.length} پست
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="font-mono">
            {showForm ? <><X className="w-4 h-4" /> بستن</> : <><PlusCircle className="w-4 h-4" /> پست جدید</>}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8 border-primary/40 shadow-glow-soft">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              {editing ? "ویرایش پست" : "پست جدید"}
            </h2>
            <form onSubmit={submitPost} className="space-y-4">
              <div>
                <Label className="font-mono text-xs">عنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label className="font-mono text-xs">دسته‌بندی</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                        category === c
                          ? "bg-primary text-primary-foreground border-primary shadow-glow-soft"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">متن پست</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="mt-1.5 font-sans"
                  required
                />
              </div>
              <div>
                <Label className="font-mono text-xs flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> عکس یا ویدیو (اختیاری)
                </Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 cursor-pointer"
                />
                {existingMedia.url && !file && (
                  <div className="mt-2 text-xs text-muted-foreground font-mono">
                    فایل فعلی حفظ می‌شود. برای تغییر، فایل جدید انتخاب کنید.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="font-mono">
                  {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "انتشار پست"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// MY_POSTS</h2>
            {posts.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground text-sm border-dashed">
                هنوز پستی منتشر نکرده‌اید.
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => (
                  <Card key={p.id} className="p-4 hover:border-primary/40 transition-colors">
                    <div className="flex gap-3 items-start">
                      {p.media_url && p.media_type?.startsWith("image") && (
                        <img src={p.media_url} className="w-20 h-20 rounded object-cover shrink-0" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to="/post/$id" params={{ id: p.id }} className="font-bold hover:text-primary line-clamp-1 block">
                              {p.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {p.category && <Badge variant="outline" className="text-[10px] font-mono">{p.category}</Badge>}
                              <span className="text-xs text-muted-foreground font-mono">
                                {new Date(p.created_at).toLocaleDateString("fa-IR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Edit3 className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deletePost(p.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.content}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// PROFILE</h2>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/40" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-mono text-primary">@{profile?.username}</div>
                  <div className="text-xs text-muted-foreground">تلگرام</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-mono">نام نمایشی</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-mono">بیوگرافی</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-mono">تصویر پروفایل</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className="mt-1 cursor-pointer" />
                </div>
                <Button size="sm" onClick={saveProfile} className="w-full font-mono">ذخیره پروفایل</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
