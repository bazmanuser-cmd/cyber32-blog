import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRoles } from "@/lib/roles";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getMediaDisplayUrl, formatFileSize } from "@/lib/media";
import { sanitizeRichText, stripRichText } from "@/lib/rich-text";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Edit3,
  PlusCircle,
  X,
  User as UserIcon,
  Terminal,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Heading2,
  Heading3,
  Eye,
  Save,
  KeyRound,
  Users,
  Database,
  HardDrive,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

type Post = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  media_url: string | null;
  media_path: string | null;
  media_name: string | null;
  media_size: number | null;
  media_type: string | null;
  tags: string[];
  featured: boolean;
  view_count: number;
  created_at: string;
  author_id: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  display_media_url?: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  role_title: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
};

type TeamMember = {
  id: string;
  username: string;
  display_name: string;
  role_title: string;
  telegram_url: string | null;
  is_owner: boolean;
  sort_order: number;
};

const CATEGORIES = ["هک", "امنیت", "آموزش", "کانفیگ", "دیتابیس", "سورس‌کد", "اخبار", "متفرقه"];

const toolbarActions = [
  { label: "Bold", icon: Bold, before: "<strong>", after: "</strong>" },
  { label: "Italic", icon: Italic, before: "<em>", after: "</em>" },
  { label: "Underline", icon: Underline, before: "<u>", after: "</u>" },
  { label: "Strike", icon: Strikethrough, before: "<s>", after: "</s>" },
  { label: "H2", icon: Heading2, before: "<h2>", after: "</h2>" },
  { label: "H3", icon: Heading3, before: "<h3>", after: "</h3>" },
  { label: "Quote", icon: Quote, before: "<blockquote>", after: "</blockquote>" },
  { label: "Code", icon: Code2, before: "<pre><code>", after: "</code></pre>" },
  { label: "UL", icon: List, before: "<ul>\n<li>", after: "</li>\n</ul>" },
  { label: "OL", icon: ListOrdered, before: "<ol>\n<li>", after: "</li>\n</ol>" },
];

function Admin() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "profiles" | "team" | "cloud">("posts");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ url: string | null; path: string | null; type: string | null; name: string | null; size: number | null }>({ url: null, path: null, type: null, name: null, size: null });

  // Profile edit
  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { type: "user" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && !rolesLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, user, rolesLoading, isAdmin, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setRoleTitle(profile.role_title ?? "");
      setBio(profile.bio ?? "");
      setSelectedProfileId(profile.id);
    }
  }, [profile]);

  const loadPosts = async () => {
    if (!user) return;
    let q = supabase
      .from("posts")
      .select("*, profiles:author_id(username, display_name, avatar_url)")
      .order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("author_id", user.id);
    const { data, error } = await q;
    if (error) {
      toast.error("خطا در دریافت پست‌ها: " + error.message);
      return;
    }

    const withMedia = await Promise.all(
      (((data ?? []) as unknown as Post[])).map(async (post) => ({
        ...post,
        display_media_url: await getMediaDisplayUrl(post.media_path, post.media_url),
      })),
    );
    setPosts(withMedia);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, role_title, avatar_url, banner_url, bio")
      .order("username", { ascending: true });
    if (error) toast.error("خطا در دریافت پروفایل‌ها: " + error.message);
    else setProfiles((data as ProfileRow[]) ?? []);
  };

  const loadTeam = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, username, display_name, role_title, telegram_url, is_owner, sort_order")
      .order("sort_order", { ascending: true });
    if (error) toast.error("خطا در دریافت تیم: " + error.message);
    else setTeamMembers((data as TeamMember[]) ?? []);
  };

  useEffect(() => {
    if (user) {
      loadPosts();
      loadProfiles();
      loadTeam();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    const selected = profiles.find((item) => item.id === selectedProfileId);
    if (!selected) return;
    setDisplayName(selected.display_name ?? "");
    setRoleTitle(selected.role_title ?? "");
    setBio(selected.bio ?? "");
  }, [selectedProfileId, profiles]);

  const resetForm = () => {
    setTitle(""); setContent(""); setExcerpt(""); setTags(""); setFeatured(false); setCategory(CATEGORIES[0]);
    setFile(null); setEditing(null); setExistingMedia({ url: null, path: null, type: null, name: null, size: null });
    setShowForm(false);
  };

  const startEdit = (p: Post) => {
    setEditing(p);
    setTitle(p.title); setContent(p.content);
    setExcerpt(p.excerpt ?? "");
    setTags((p.tags ?? []).join("، "));
    setFeatured(Boolean(p.featured));
    setCategory(p.category ?? CATEGORIES[0]);
    setExistingMedia({ url: p.display_media_url ?? p.media_url, path: p.media_path, type: p.media_type, name: p.media_name, size: p.media_size });
    setFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadMedia = async (f: File, folder = "posts"): Promise<{ url: string; path: string; type: string; name: string; size: number } | null> => {
    if (!user) return null;
    const ext = f.name.split(".").pop();
    const path = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, f, {
      contentType: f.type, upsert: false,
    });
    if (error) { toast.error("خطا در آپلود: " + error.message); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { url: data.publicUrl, path, type: f.type, name: f.name, size: f.size };
  };

  const applyFormat = (before: string, after: string) => {
    const textarea = document.getElementById("post-content") as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || "متن";
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) return toast.error("عنوان و متن الزامی است");
    setSaving(true);

    let media_url = editing?.media_url ?? existingMedia.url;
    let media_path = existingMedia.path;
    let media_type = existingMedia.type;
    let media_name = existingMedia.name;
    let media_size = existingMedia.size;

    if (file) {
      const up = await uploadMedia(file);
      if (up) { media_url = up.url; media_path = up.path; media_type = up.type; media_name = up.name; media_size = up.size; }
    }

    const cleanContent = sanitizeRichText(content);
    const cleanExcerpt = excerpt.trim() || stripRichText(cleanContent).slice(0, 220);
    const normalizedTags = tags
      .split(/[،,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (editing) {
      const { error } = await supabase.from("posts").update({
        title: title.trim(), content: cleanContent, excerpt: cleanExcerpt, category, media_url, media_path, media_type, media_name, media_size, tags: normalizedTags, featured,
      }).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("پست ویرایش شد");
    } else {
      const { error } = await supabase.from("posts").insert({
        title: title.trim(), content: cleanContent, excerpt: cleanExcerpt, category, media_url, media_path, media_type, media_name, media_size, tags: normalizedTags, featured, author_id: user.id,
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
    const targetProfile = activeTab === "profiles"
      ? profiles.find((item) => item.id === selectedProfileId)
      : profile;
    const targetId = activeTab === "profiles" ? (selectedProfileId || user.id) : user.id;
    let avatar_url = targetProfile?.avatar_url ?? null;
    let avatar_path = null;
    let banner_url = targetProfile?.banner_url ?? null;
    let banner_path = null;
    if (avatarFile) {
      const up = await uploadMedia(avatarFile, "avatars");
      if (up) { avatar_url = up.url; avatar_path = up.path; }
    }
    if (bannerFile) {
      const up = await uploadMedia(bannerFile, "banners");
      if (up) { banner_url = up.url; banner_path = up.path; }
    }
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      role_title: roleTitle,
      bio,
      avatar_url,
      ...(avatar_path ? { avatar_path } : {}),
      banner_url,
      ...(banner_path ? { banner_path } : {}),
    }).eq("id", targetId);
    if (error) toast.error(error.message);
    else {
      toast.success("پروفایل به‌روزرسانی شد");
      refreshProfile();
      loadProfiles();
      setAvatarFile(null);
      setBannerFile(null);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error("رمز جدید حداقل ۸ کاراکتر باشد");
    if (newPassword !== confirmPassword) return toast.error("تکرار رمز با رمز جدید یکسان نیست");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("رمز عبور حساب شما تغییر کرد");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const updateTeamMember = async (member: TeamMember, patch: Partial<TeamMember>) => {
    const { error } = await supabase.from("team_members").update(patch).eq("id", member.id);
    if (error) toast.error(error.message);
    else {
      toast.success("اطلاعات عضو ذخیره شد");
      loadTeam();
    }
  };

  if (loading || !user || rolesLoading || !isAdmin) {
    return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; در حال بررسی دسترسی...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs text-primary">// ADMIN_PANEL</div>
            <h1 className="text-3xl font-bold mt-1">مرکز فرماندهی سایبر ۳۲</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              @{profile?.username} — {posts.length} پست — {profiles.length} پروفایل — {teamMembers.length} عضو
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/owner" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">تنظیمات سایت</Link>
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="font-mono">
              {showForm ? <><X className="w-4 h-4" /> بستن</> : <><PlusCircle className="w-4 h-4" /> پست جدید</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { id: "posts", label: "پست‌ها", icon: Database, value: posts.length },
            { id: "profiles", label: "پروفایل‌ها", icon: Users, value: profiles.length },
            { id: "team", label: "اعضا", icon: UserIcon, value: teamMembers.length },
            { id: "cloud", label: "فضای ابری", icon: HardDrive, value: posts.filter((p) => p.media_path || p.media_url).length },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`p-4 rounded-lg border text-right transition-all ${activeTab === item.id ? "border-primary bg-primary/10 shadow-glow-soft" : "border-border/70 bg-card/60 hover:border-primary/40"}`}
            >
              <item.icon className="w-5 h-5 text-primary mb-3" />
              <div className="text-2xl font-mono font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </button>
          ))}
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
                <div className="mt-2 flex flex-wrap gap-1 rounded-lg border border-border/70 bg-background/60 p-2">
                  {toolbarActions.map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={action.label}
                      onClick={() => applyFormat(action.before, action.after)}
                    >
                      <action.icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="mt-1.5 font-sans leading-8"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-xs">خلاصه کوتاه</Label>
                  <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1.5" placeholder="اگر خالی باشد خودکار ساخته می‌شود" />
                </div>
                <div>
                  <Label className="font-mono text-xs">تگ‌ها</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1.5 font-mono" placeholder="network, bug bounty, linux" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-current" />
                نمایش به‌عنوان پست برجسته
              </label>
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
                    فایل فعلی حفظ می‌شود: {existingMedia.name ?? "media"} ({formatFileSize(existingMedia.size)})
                  </div>
                )}
              </div>
              {content && (
                <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-mono text-primary"><Eye className="w-3.5 h-3.5" /> PREVIEW</div>
                  <div className="rich-content text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }} />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="font-mono">
                  {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "انتشار پست"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          <div className={activeTab === "posts" ? "" : "hidden"}>
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
                        <img src={p.display_media_url ?? p.media_url} className="w-20 h-20 rounded object-cover shrink-0" alt="" />
                      )}
                      {p.display_media_url && p.media_type?.startsWith("video") && (
                        <div className="w-20 h-20 rounded bg-muted flex items-center justify-center shrink-0"><Video className="w-7 h-7 text-primary" /></div>
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
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt || stripRichText(p.content)}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(p.tags ?? []).slice(0, 4).map((tag) => <span key={tag} className="text-[10px] font-mono text-primary/80">#{tag}</span>)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className={activeTab === "profiles" ? "md:col-span-2" : "hidden"}>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// PROFILES</h2>
            <div className="grid lg:grid-cols-[260px_1fr] gap-4">
              <Card className="p-3 space-y-2 max-h-[560px] overflow-auto">
                {profiles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProfileId(item.id)}
                    className={`w-full flex items-center gap-3 rounded-md p-2 text-right transition-colors ${selectedProfileId === item.id ? "bg-primary/15 text-primary" : "hover:bg-accent/60"}`}
                  >
                    {item.avatar_url ? <img src={item.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" /> : <UserIcon className="w-5 h-5" />}
                    <span className="min-w-0">
                      <span className="block font-mono text-xs truncate">@{item.username}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{item.display_name || "بدون نام"}</span>
                    </span>
                  </button>
                ))}
              </Card>
              <Card className="p-5">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-mono">نام کاربری قفل‌شده</Label>
                    <Input value={`@${profiles.find((p) => p.id === selectedProfileId)?.username ?? profile?.username ?? ""}`} readOnly className="mt-1 font-mono opacity-80" />
                  </div>
                  <div>
                    <Label className="text-xs font-mono">نام نمایشی</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-mono">نقش / امضا</Label>
                    <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-mono">بیوگرافی</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-mono">تصویر پروفایل</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className="mt-1 cursor-pointer" />
                  </div>
                  <div>
                    <Label className="text-xs font-mono">بنر پروفایل</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} className="mt-1 cursor-pointer" />
                  </div>
                </div>
                <Button onClick={saveProfile} className="mt-4 font-mono"><Save className="w-4 h-4" /> ذخیره پروفایل</Button>
              </Card>
            </div>
          </div>

          <div className={activeTab === "team" ? "md:col-span-2" : "hidden"}>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// اعضای ثبت‌شده</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {teamMembers.map((member) => (
                <Card key={member.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-primary">@{member.username}</div>
                      <div className="text-xs text-muted-foreground">نام کاربری قفل‌شده</div>
                    </div>
                    {member.is_owner && <Badge className="font-mono">OWNER</Badge>}
                  </div>
                  <Input defaultValue={member.display_name} onBlur={(e) => e.target.value !== member.display_name && updateTeamMember(member, { display_name: e.target.value })} />
                  <Textarea defaultValue={member.role_title} rows={2} onBlur={(e) => e.target.value !== member.role_title && updateTeamMember(member, { role_title: e.target.value })} />
                </Card>
              ))}
            </div>
          </div>

          <div className={activeTab === "cloud" ? "md:col-span-2" : "hidden"}>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// CLOUD_MEDIA</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.filter((p) => p.media_path || p.media_url).map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {p.display_media_url && p.media_type?.startsWith("image") ? <img src={p.display_media_url} alt={p.title} className="w-full h-full object-cover" /> : <Video className="w-10 h-10 text-primary" />}
                  </div>
                  <div className="p-4">
                    <div className="font-bold line-clamp-1">{p.title}</div>
                    <div className="mt-2 text-xs text-muted-foreground font-mono space-y-1">
                      <div>{p.media_type?.startsWith("image") ? <ImageIcon className="inline w-3 h-3" /> : <Video className="inline w-3 h-3" />} {p.media_name ?? "media"}</div>
                      <div>{formatFileSize(p.media_size)}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className={activeTab === "posts" ? "" : "hidden"}>
            <h2 className="font-bold mb-4 font-mono text-sm text-muted-foreground">// ACCOUNT</h2>
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
                  <div className="text-xs text-muted-foreground">نام کاربری ثابت</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-mono">نام نمایشی</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-mono">نقش</Label>
                  <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="mt-1" />
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
                <div className="pt-4 border-t border-border/50 space-y-2">
                  <Label className="text-xs font-mono flex items-center gap-2"><KeyRound className="w-3.5 h-3.5" /> تغییر رمز عبور</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز جدید" />
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز جدید" />
                  <Button size="sm" variant="outline" onClick={changePassword} className="w-full font-mono">ذخیره رمز</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
