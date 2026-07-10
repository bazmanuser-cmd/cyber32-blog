import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "سوالات متداول | سایبر ۳۲" },
      { name: "description", content: "پاسخ سوالات پرتکرار درباره دوره‌ها، اشتراک، حساب کاربری و امنیت در سایبر ۳۲." },
      { property: "og:title", content: "سوالات متداول سایبر ۳۲" },
      { property: "og:description", content: "پاسخ سوالات پرتکرار." },
    ],
  }),
  component: FaqPage,
});

const QA = [
  { q: "چگونه به دوره‌ها دسترسی پیدا کنم؟", a: "دوره‌های رایگان بلافاصله پس از ورود قابل مشاهده هستند. دوره‌های ویژه به‌زودی با خرید یا اشتراک VIP فعال می‌شوند." },
  { q: "آیا محتوای سایت قانونی است؟", a: "بله. تمام آموزش‌ها با رویکرد هک اخلاقی (Ethical Hacking) و صرفاً برای اهداف آموزشی و افزایش امنیت منتشر می‌شوند." },
  { q: "چطور می‌توانم عضو تیم شوم؟", a: "با آیدی @ViRus32_Org در تلگرام تماس بگیرید و رزومه/نمونه‌کار خود را ارسال کنید." },
  { q: "اطلاعات من چقدر امن است؟", a: "تمام رمزها با الگوریتم امن هش می‌شوند، ارتباطات تحت TLS ۱.۳ رمزنگاری شده و دسترسی به داده‌ها با RLS محدود است." },
  { q: "چگونه می‌توانم رمز عبورم را تغییر دهم؟", a: "از پنل کاربری، بخش تنظیمات امنیتی، اقدام به تغییر رمز عبور کنید." },
  { q: "اشتراک VIP چه امکاناتی دارد؟", a: "دسترسی به دوره‌های ویژه، ۱ گیگابایت فضای ابری اختصاصی، دانلود مستقیم و پشتیبانی اولویت‌دار." },
  { q: "آیا API عمومی وجود دارد؟", a: "بله. مستندات کامل REST API با احراز هویت و Rate Limit در حال توسعه است." },
];

function FaqPage() {
  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// FAQ</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">سوالات متداول</h1>
        <p className="text-muted-foreground mt-3">پاسخ سوالاتی که بیشترین تکرار را داشته‌اند.</p>

        <Accordion type="single" collapsible className="mt-8 space-y-3">
          {QA.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-primary/20 rounded-lg bg-card/60 backdrop-blur-xl px-4">
              <AccordionTrigger className="text-right hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-7">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </Layout>
  );
}
