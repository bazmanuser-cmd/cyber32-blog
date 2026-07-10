import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "فراموشی رمز عبور | سایبر ۳۲" }, { name: "robots", content: "noindex" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <Layout>
      <section className="max-w-lg mx-auto px-4 py-20 text-center">
        <KeyRound className="w-12 h-12 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold">فراموشی رمز عبور</h1>
        <p className="text-muted-foreground mt-4 leading-8">
          چون ورود اعضا با آیدی تلگرام است، برای بازیابی رمز عبور با مالک مجموعه در تلگرام تماس بگیرید تا رمز شما به مقدار پیش‌فرض
          <span className="font-mono text-primary"> avesta27cret88 </span>
          بازگردانده شود. سپس در پروفایل، رمز جدید انتخاب کنید.
        </p>
        <a href="https://t.me/ViRus32_Org" target="_blank" rel="noreferrer" className="inline-block mt-6 px-6 py-3 rounded-md bg-primary text-primary-foreground font-mono">
          تماس با @ViRus32_Org
        </a>
        <div className="mt-8 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-mono">بازگشت به ورود</Link>
        </div>
      </section>
    </Layout>
  );
}
