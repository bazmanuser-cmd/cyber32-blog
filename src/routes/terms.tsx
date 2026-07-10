import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "قوانین و مقررات | سایبر ۳۲" },
      { name: "description", content: "قوانین استفاده از خدمات و محتوای سایبر ۳۲." },
      { property: "og:title", content: "قوانین سایبر ۳۲" },
      { property: "og:description", content: "قوانین استفاده از خدمات." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-6">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// TERMS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">قوانین و مقررات</h1>

        <div className="text-muted-foreground leading-8 space-y-4">
          <p>استفاده از خدمات سایبر ۳۲ به معنای پذیرش کامل قوانین زیر است.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۱. اهداف آموزشی</h2>
          <p>تمام محتوای منتشر شده صرفاً برای اهداف آموزشی، افزایش آگاهی امنیتی و پژوهش است. هرگونه سوءاستفاده از دانش کسب‌شده بر عهده کاربر است.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۲. حساب کاربری</h2>
          <p>کاربر مسئول حفظ اطلاعات ورود خود است. اشتراک‌گذاری حساب یا استفاده غیرمجاز ممنوع است.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۳. محتوای کاربر</h2>
          <p>هرگونه پست، مقاله یا فایل آپلود شده توسط کاربر باید مطابق قوانین ایران و اهداف مجموعه باشد. تیم حق حذف محتوای مغایر را دارد.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۴. مالکیت معنوی</h2>
          <p>محتوای اختصاصی سایبر ۳۲ متعلق به این مجموعه است. بازنشر با ذکر منبع مجاز است.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۵. تغییرات قوانین</h2>
          <p>این قوانین ممکن است در هر زمان به‌روزرسانی شوند و از لحظه انتشار قابل اجرا هستند.</p>
        </div>
      </section>
    </Layout>
  );
}
