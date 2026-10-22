import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaDisplayUrl } from "@/lib/media";
import { stripRichText } from "@/lib/rich-text";
import { CYBER32_CHANNELS } from "@/lib/team";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Zap, Lock, ArrowLeft, Calendar, Database, Cloud, ShieldCheck, Eye, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

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

function Index() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: postData } = await supabase
        .from("posts")
        .select("*, profiles:author_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(60);
      const withMedia = await Promise.all(
        (((postData ?? []) as unknown as Post[])).map(async (post) => ({
          ...post,
          display_media_url: await getMediaDisplayUrl(post.media_path, post.media_url),
        })),
      );
      setPosts(withMedia);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "seo").maybeSingle().then(({ data }) => {
      const settings = data?.value as { title?: string; description?: string } | undefined;
      if (settings?.title) document.title = settings.title;
      const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (description && settings?.description) description.content = settings.description;
    });
  }, []);

  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const visiblePosts = posts.filter((post) => post.id !== featuredPost?.id);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <Badge className="font-mono bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
              // SECURE CHANNEL ESTABLISHED
            </Badge>
            <h1 className="mt-4 text-5xl md:text-7xl font-black font-mono text-drip animate-flicker leading-none">
              CYBER<span className="text-foreground">32</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
              تیم امنیت سایبری، آموزش هک، انتشار کانفیگ‌ها، دیتابیس‌ها و سورس‌کدها.
              همه‌ی چیزهایی که به «سایبری» ختم می‌شوند، اینجاست.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="font-mono animate-pulse-glow">
                <a href="https://t.me/cyber32_ir" target="_blank" rel="noreferrer">
                  <Zap className="w-4 h-4" /> عضویت در کانال
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-mono">
                <Link to="/team"><Lock className="w-4 h-4" /> درخواست عضویت در تیم</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-terminal animate-pulse" />
              <span>SYSTEM STATUS: OPERATIONAL</span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { icon: Database, label: "پست‌ها", value: posts.length },
                { icon: Cloud, label: "رسانه‌ها", value: posts.filter((p) => p.media_path || p.media_url).length },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <stat.icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-2xl font-mono font-bold">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative scanline rounded-lg overflow-hidden border border-primary/30 shadow-glow min-h-72 bg-card/70 grid place-items-center">
            <div className="text-center p-8">
              <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
              <div className="mt-5 font-mono text-sm text-primary">CYBER32 / SECURITY KNOWLEDGE</div>
              <div className="mt-2 text-sm text-muted-foreground">مقالات و آموزش‌های امنیت سایبری</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 font-mono text-xs text-primary/90 bg-background/60 px-2 py-1 rounded backdrop-blur">
              @cyber32_ir
            </div>
          </div>
        </div>
      </section>

      {/* Sub-channels strip */}
      <section className="border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {CYBER32_CHANNELS.map((c) => (
            <a
              key={c.name}
              href={`https://t.me/${c.name.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="group border border-border/60 rounded-lg p-3 hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="font-mono text-sm mt-1 group-hover:text-primary transition-colors">{c.name}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Posts */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="font-mono text-xs text-primary">// LATEST_TRANSMISSIONS</div>
            <h2 className="text-3xl font-bold mt-1">پست‌های اخیر</h2>
          </div>
          <Terminal className="w-6 h-6 text-primary" />
        </div>

        {loading ? (
          <div className="text-center py-20 font-mono text-muted-foreground">
            &gt; در حال رمزگشایی داده‌ها...
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Terminal className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">هنوز پستی منتشر نشده است.</p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              اعضای تیم می‌توانند از پنل ادمین پست بگذارند.
            </p>
          </Card>
        ) : (
          <>
          {featuredPost && (
            <Link to="/post/$id" params={{ id: featuredPost.id }} className="block mb-6">
              <Card className="overflow-hidden border-primary/45 bg-card/70 hover:shadow-glow-soft transition-all">
                <div className="grid md:grid-cols-[1.2fr_0.8fr]">
                  <div className="p-6 md:p-8">
                    <Badge className="font-mono mb-4"><Star className="w-3 h-3" /> FEATURED</Badge>
                    <h3 className="text-2xl md:text-3xl font-bold leading-snug hover:text-primary transition-colors">{featuredPost.title}</h3>
                    <p className="mt-3 text-muted-foreground line-clamp-3">{featuredPost.excerpt || stripRichText(featuredPost.content)}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(featuredPost.tags ?? []).slice(0, 5).map((tag) => <span key={tag} className="text-xs font-mono text-primary">#{tag}</span>)}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span>@{featuredPost.profiles?.username ?? "unknown"}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(featuredPost.created_at).toLocaleDateString("fa-IR")}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {featuredPost.view_count}</span>
                    </div>
                  </div>
                  <div className="min-h-64 bg-muted">
                    {featuredPost.display_media_url && featuredPost.media_type?.startsWith("image") ? (
                      <img src={featuredPost.display_media_url} alt={featuredPost.title} className="w-full h-full object-cover" />
                    ) : featuredPost.display_media_url && featuredPost.media_type?.startsWith("video") ? (
                      <video src={featuredPost.display_media_url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <div className="h-full grid-bg flex items-center justify-center"><Terminal className="w-12 h-12 text-primary" /></div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePosts.map((p) => (
              <Link key={p.id} to="/post/$id" params={{ id: p.id }}>
                <Card className="overflow-hidden h-full hover:border-primary/60 transition-all hover:shadow-glow-soft group bg-card/70 backdrop-blur">
                  {p.display_media_url && p.media_type?.startsWith("image") && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img src={p.display_media_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  {p.display_media_url && p.media_type?.startsWith("video") && (
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <video src={p.display_media_url} className="w-full h-full object-cover" muted playsInline />
                    </div>
                  )}
                  <div className="p-5">
                    {p.category && (
                      <Badge variant="outline" className="font-mono text-[10px] mb-3 border-primary/40 text-primary">
                        {p.category}
                      </Badge>
                    )}
                    <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {p.excerpt || stripRichText(p.content)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(p.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="text-[10px] font-mono text-primary/80">#{tag}</span>)}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>@{p.profiles?.username ?? "unknown"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.created_at).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      خواندن ادامه <ArrowLeft className="w-3 h-3" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          </>
        )}
      </section>
    </Layout>
  );
}
