import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaDisplayUrl } from "@/lib/media";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Eye, Calendar } from "lucide-react";

export const Route = createFileRoute("/articles")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : "",
  }),
  head: () => ({
    meta: [
      { title: "مقالات هک و امنیت | سایبر ۳۲" },
      { name: "description", content: "آخرین مقالات، رایتاپ‌ها و تحلیل‌های تیم Cyber32 در حوزه هک، امنیت سایبری و دیفنس." },
      { property: "og:title", content: "مقالات سایبر ۳۲" },
      { property: "og:description", content: "مقالات و رایتاپ‌های امنیتی." },
    ],
  }),
  component: ArticlesPage,
});

type Row = {
  id: string; title: string; excerpt: string | null; category: string | null; tags: string[];
  created_at: string; view_count: number; media_url: string | null; media_path: string | null; media_type: string | null;
  display_media_url?: string | null;
};

function ArticlesPage() {
  const { category } = Route.useSearch();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("posts")
        .select("id,title,excerpt,category,tags,created_at,view_count,media_url,media_path,media_type")
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Row[];
      const withUrls = await Promise.all(list.map(async (r) => ({
        ...r,
        display_media_url: await getMediaDisplayUrl(r.media_path, r.media_url),
      })));
      setRows(withUrls);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (category && r.category !== category) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.title.toLowerCase().includes(s) || (r.excerpt ?? "").toLowerCase().includes(s) || (r.tags ?? []).some((t) => t.toLowerCase().includes(s));
  });

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// KNOWLEDGE_BASE</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">مقالات و رایتاپ‌ها</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          آرشیو کامل مقالات فنی، تحلیل باگ‌ها، رایتاپ CTF و راهنماهای تیم سایبر ۳۲.
        </p>

        <div className="mt-8 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در مقالات..." className="pr-9 font-mono" />
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <p className="text-muted-foreground font-mono col-span-full">&gt; در حال بارگذاری...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-muted-foreground font-mono col-span-full">مقاله‌ای یافت نشد.</p>
          )}
          {filtered.map((p) => (
            <Link key={p.id} to="/post/$id" params={{ id: p.id }}>
              <Card className="p-4 bg-card/60 border-primary/20 backdrop-blur-xl hover:border-primary/50 transition-all h-full group">
                {p.display_media_url && p.media_type?.startsWith("image") && (
                  <img src={p.display_media_url} alt={p.title} className="w-full h-40 object-cover rounded-md mb-3 border border-border" />
                )}
                {p.category && <Badge variant="outline" className="font-mono border-primary/40 text-primary mb-2">{p.category}</Badge>}
                <h2 className="text-lg font-bold group-hover:text-primary transition-colors">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString("fa-IR")}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
