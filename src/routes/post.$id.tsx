import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getMediaDisplayUrl } from "@/lib/media";
import { RichContent } from "@/components/RichContent";
import { Layout } from "@/components/Layout";
import { Comments } from "@/components/Comments";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User, Edit3, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$id")({ component: PostPage });

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
  view_count: number;
  created_at: string;
  author_id: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null; avatar_path: string | null; bio: string | null; role_title: string | null } | null;
  display_media_url?: string | null;
  display_avatar_url?: string | null;
};

function PostPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles:author_id(username, display_name, avatar_url, avatar_path, bio, role_title)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const post = data as unknown as Post;
        const [mediaUrl, avatarUrl] = await Promise.all([
          getMediaDisplayUrl(post.media_path, post.media_url),
          getMediaDisplayUrl(post.profiles?.avatar_path, post.profiles?.avatar_url),
        ]);
        setPost({ ...post, display_media_url: mediaUrl, display_avatar_url: avatarUrl });
      } else {
        setPost(null);
      }
      setLoading(false);
    })();
  }, [id]);

  const del = async () => {
    if (!confirm("حذف این پست؟")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("پست حذف شد"); navigate({ to: "/" }); }
  };

  if (loading) return <Layout><div className="p-20 text-center font-mono text-muted-foreground">&gt; در حال بارگذاری...</div></Layout>;
  if (!post) return <Layout><div className="p-20 text-center">پست یافت نشد.</div></Layout>;

  const canManage = Boolean(user);

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary font-mono inline-flex items-center gap-1 mb-6">
          <ArrowRight className="w-3 h-3" /> بازگشت
        </Link>

        {post.category && (
          <Badge variant="outline" className="font-mono border-primary/40 text-primary mb-4">
            {post.category}
          </Badge>
        )}
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">{post.title}</h1>

        <div className="mt-6 flex items-center justify-between border-y border-border/50 py-4">
          <div className="flex items-center gap-3">
            {post.display_avatar_url ? (
              <img src={post.display_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-primary/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="font-mono text-sm">
                <a href={`https://t.me/${post.profiles?.username}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  @{post.profiles?.username}
                </a>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                {new Date(post.created_at).toLocaleDateString("fa-IR")}
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate({ to: "/admin" })}>
                <Edit3 className="w-3.5 h-3.5" /> ویرایش
              </Button>
              <Button size="sm" variant="outline" onClick={del}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(post.tags ?? []).map((tag) => <span key={tag} className="text-xs font-mono text-primary">#{tag}</span>)}
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count}</span>
        </div>

        {post.display_media_url && post.media_type?.startsWith("image") && (
          <img src={post.display_media_url} alt={post.title} className="w-full rounded-lg mt-8 border border-border" />
        )}
        {post.display_media_url && post.media_type?.startsWith("video") && (
          <video src={post.display_media_url} controls className="w-full rounded-lg mt-8 border border-border" />
        )}

        <RichContent html={post.content} className="mt-8 text-lg" />

        <Card className="mt-12 p-5 bg-card/50 border-primary/20">
          <div className="text-xs font-mono text-primary mb-2">// SIGNED_BY</div>
          <div className="flex items-center gap-3">
            {post.display_avatar_url ? (
              <img src={post.display_avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-bold">{post.profiles?.display_name || post.profiles?.username}</div>
              <a href={`https://t.me/${post.profiles?.username}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary">
                @{post.profiles?.username}
              </a>
              {post.profiles?.role_title && <p className="text-xs text-primary/80 mt-1">{post.profiles.role_title}</p>}
              {post.profiles?.bio && <p className="text-sm text-muted-foreground mt-1">{post.profiles.bio}</p>}
            </div>
          </div>
        </Card>
      </article>
    </Layout>
  );
}
