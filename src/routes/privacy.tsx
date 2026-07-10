import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "حریم خصوصی | سایبر ۳۲" },
      { name: "description", content: "سیاست حریم خصوصی و نحوه نگهداری و استفاده از اطلاعات کاربران در سایبر ۳۲." },
      { property: "og:title", content: "حریم خصوصی سایبر ۳۲" },
      { property: "og:description", content: "سیاست حریم خصوصی." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// PRIVACY</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">حریم خصوصی</h1>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-8 space-y-4">
          <p>این صفحه سیاست حریم خصوصی مجموعه سایبر ۳۲ را توضیح می‌دهد. این صفحه توسط مالک مجموعه نگهداری می‌شود.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۱. اطلاعات جمع‌آوری‌شده</h2>
          <p>هنگام ثبت‌نام، آیدی تلگرام و رمز عبور کاربر ذخیره می‌شود. اطلاعات اضافی مانند نام نمایشی، بیوگرافی و تصویر پروفایل اختیاری هستند.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۲. نحوه نگهداری</h2>
          <p>رمزهای عبور به صورت هش شده و رمزنگاری‌شده ذخیره می‌شوند. ارتباطات از طریق TLS انجام می‌شود و دسترسی به داده‌ها با سیاست‌های Row-Level Security محدود است.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۳. اشتراک‌گذاری با اشخاص ثالث</h2>
          <p>اطلاعات کاربران با هیچ شخص ثالثی به اشتراک گذاشته نمی‌شود مگر با درخواست قانونی مستند.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۴. کوکی‌ها</h2>
          <p>از کوکی‌ها صرفاً برای نگهداری نشست ورود کاربر استفاده می‌شود.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۵. حذف حساب</h2>
          <p>کاربران می‌توانند در هر زمان با تماس با مالک، درخواست حذف حساب و داده‌های خود را ثبت کنند.</p>

          <h2 className="text-foreground text-xl font-bold mt-6">۶. تماس</h2>
          <p>سوالات مربوط به حریم خصوصی: <a className="text-primary" href="https://t.me/ViRus32_Org">@ViRus32_Org</a></p>
        </div>
      </section>
    </Layout>
  );
}
