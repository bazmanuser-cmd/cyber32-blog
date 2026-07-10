import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { TerminalSquare, Home } from "lucide-react";

export const Route = createFileRoute("/$")({
  head: () => ({ meta: [{ title: "۴۰۴ — یافت نشد | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <Layout>
      <section className="max-w-2xl mx-auto px-4 py-24 text-center">
        <TerminalSquare className="w-14 h-14 text-primary mx-auto mb-6" />
        <div className="font-mono text-xs text-primary">// ERROR_CODE: 404</div>
        <h1 className="text-6xl md:text-8xl font-bold mt-4 text-glow">404</h1>
        <p className="text-muted-foreground mt-4 font-mono">
          &gt; مسیر درخواست‌شده در این سرور یافت نشد.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">شاید حذف شده یا هرگز وجود نداشته است.</p>
        <Link to="/" className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-mono hover:opacity-90 transition-opacity">
          <Home className="w-4 h-4" /> بازگشت به خانه
        </Link>
      </section>
    </Layout>
  );
}
