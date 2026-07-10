import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://cyber32-blog.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = [
          { path: "/", priority: "1.0", changefreq: "daily" as const },
          { path: "/courses", priority: "0.9", changefreq: "weekly" as const },
          { path: "/articles", priority: "0.9", changefreq: "daily" as const },
          { path: "/team", priority: "0.7", changefreq: "monthly" as const },
          { path: "/about", priority: "0.6", changefreq: "monthly" as const },
          { path: "/contact", priority: "0.6", changefreq: "monthly" as const },
          { path: "/faq", priority: "0.5", changefreq: "monthly" as const },
          { path: "/privacy", priority: "0.3", changefreq: "yearly" as const },
          { path: "/terms", priority: "0.3", changefreq: "yearly" as const },
          { path: "/login", priority: "0.4", changefreq: "yearly" as const },
        ];

        // Include published posts
        let posts: { id: string; updated_at?: string }[] = [];
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
            const { data } = await sb.from("posts").select("id, updated_at").order("updated_at", { ascending: false }).limit(500);
            posts = (data ?? []) as { id: string; updated_at?: string }[];
          }
        } catch { /* ignore */ }

        const urls = [
          ...paths.map((e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`),
          ...posts.map((p) => `  <url>
    <loc>${BASE_URL}/post/${p.id}</loc>
    ${p.updated_at ? `<lastmod>${new Date(p.updated_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),
        ].join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
