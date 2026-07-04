import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$id")({ component: PostPage });

type Post = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  author_id: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null; bio: string | null } | null;
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
        .select("*, profiles:author_id(username, display_name, avatar_url, bio)")
        .eq("id", id)
        .maybeSingle();
      setPost(data as any);
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

  const isAuthor = user?.id === post.author_id;

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
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-primary/30" />
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
          {isAuthor && (
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

        {post.media_url && post.media_type?.startsWith("image") && (
          <img src={post.media_url} alt={post.title} className="w-full rounded-lg mt-8 border border-border" />
        )}
        {post.media_url && post.media_type?.startsWith("video") && (
          <video src={post.media_url} controls className="w-full rounded-lg mt-8 border border-border" />
        )}

        <div className="mt-8 prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <Card className="mt-12 p-5 bg-card/50 border-primary/20">
          <div className="text-xs font-mono text-primary mb-2">// SIGNED_BY</div>
          <div className="flex items-center gap-3">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
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
              {post.profiles?.bio && <p className="text-sm text-muted-foreground mt-1">{post.profiles.bio}</p>}
            </div>
          </div>
        </Card>
      </article>
    </Layout>
  );
}
