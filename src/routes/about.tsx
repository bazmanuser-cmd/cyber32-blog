import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Shield, Target, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره سایبر ۳۲ | تیم امنیت سایبری" },
      { name: "description", content: "سایبر ۳۲ مجموعه‌ای تخصصی در حوزه هک، امنیت سایبری، انتشار سورس و پایگاه داده. بشناسید ما را." },
      { property: "og:title", content: "درباره سایبر ۳۲" },
      { property: "og:description", content: "تیم حرفه‌ای امنیت سایبری Cyber32." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 py-14 space-y-10">
        <div>
          <span className="font-mono text-xs text-primary">// WHO_WE_ARE</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-2">درباره سایبر ۳۲</h1>
          <p className="text-muted-foreground mt-4 leading-8">
            سایبر ۳۲ یک مجموعه تخصصی ایرانی در حوزه امنیت سایبری، هک اخلاقی، تست نفوذ، مهندسی معکوس و انتشار
            محتوای فنی است. ما زیرمجموعه‌های تخصصی برای کانفیگ‌ها، دیتابیس‌ها، سورس‌کدها و اخبار داریم و
            هدف‌مان بالا بردن سطح دانش امنیتی جامعه فارسی‌زبان است.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Target, title: "ماموریت", body: "انتقال دانش عملی و کاربردی در امنیت تهاجمی و دفاعی." },
            { icon: Shield, title: "چشم‌انداز", body: "بزرگ‌ترین جامعه فنی امنیت سایبری فارسی‌زبان." },
            { icon: Users, title: "تیم", body: "متخصصین Red Team، Blue Team، توسعه‌دهنده و مدرس." },
            { icon: Zap, title: "روش", body: "کیفیت، شفافیت، پژوهش عمیق و انتشار مستمر." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-5 rounded-lg border border-primary/20 bg-card/60 backdrop-blur-xl">
              <Icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{body}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-lg border border-primary/20 bg-card/40 backdrop-blur-xl">
          <div className="text-xs font-mono text-primary mb-2">// LEADERSHIP</div>
          <p className="text-sm">
            مالک: <a href="https://t.me/ViRus32_Org" target="_blank" rel="noreferrer" className="text-primary font-mono">@ViRus32_Org</a>
          </p>
          <p className="text-sm mt-1">
            توسعه‌دهنده وب: <a href="https://t.me/ArcoMion" target="_blank" rel="noreferrer" className="text-primary font-mono">@ArcoMion</a>
          </p>
          <p className="text-sm mt-1">
            کانال اصلی: <a href="https://t.me/cyber32_ir" target="_blank" rel="noreferrer" className="text-primary font-mono">@cyber32_ir</a>
          </p>
        </div>
      </section>
    </Layout>
  );
}
