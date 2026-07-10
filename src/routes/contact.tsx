import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Send, MessageCircle, Users } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تماس با سایبر ۳۲" },
      { name: "description", content: "راه‌های ارتباط با تیم Cyber32: تلگرام، کانال‌ها، پشتیبانی." },
      { property: "og:title", content: "تماس با سایبر ۳۲" },
      { property: "og:description", content: "راه‌های ارتباط با تیم Cyber32." },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  { href: "https://t.me/ViRus32_Org", label: "@ViRus32_Org", desc: "مالک مجموعه" },
  { href: "https://t.me/ArcoMion", label: "@ArcoMion", desc: "توسعه‌دهنده وب" },
  { href: "https://t.me/cyber32_ir", label: "@cyber32_ir", desc: "کانال اصلی اطلاع‌رسانی" },
  { href: "https://t.me/Cyber32_config", label: "@Cyber32_config", desc: "کانفیگ‌ها" },
  { href: "https://t.me/Cyber32_DB", label: "@Cyber32_DB", desc: "دیتابیس‌ها" },
  { href: "https://t.me/Cyber32_SRC", label: "@Cyber32_SRC", desc: "سورس‌کدها" },
  { href: "https://t.me/IranWar_N", label: "@IranWar_N", desc: "اخبار جنگی" },
  { href: "https://t.me/Cyber32_Gap", label: "@Cyber32_Gap", desc: "گروه چت" },
];

function ContactPage() {
  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 py-14">
        <span className="font-mono text-xs text-primary">// CONTACT</span>
        <h1 className="text-4xl md:text-5xl font-bold mt-2">با ما در ارتباط باشید</h1>
        <p className="text-muted-foreground mt-3">
          سریع‌ترین راه ارتباط با تیم سایبر ۳۲ از طریق کانال‌ها و آیدی‌های تلگرام زیر است.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-3">
          {CHANNELS.map((c) => (
            <a key={c.href} href={c.href} target="_blank" rel="noreferrer"
              className="p-4 rounded-lg border border-primary/20 bg-card/60 backdrop-blur-xl hover:border-primary/60 hover:bg-card/80 transition-all flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-primary">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
              </div>
              <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </a>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-lg border border-primary/20 bg-card/40 backdrop-blur-xl flex items-center gap-4">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <div className="font-bold">همکاری با تیم؟</div>
            <p className="text-sm text-muted-foreground mt-1">
              اگر متخصص، مدرس، پژوهشگر یا نویسنده هستید، از طریق آیدی مالک با ما در تماس باشید.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
