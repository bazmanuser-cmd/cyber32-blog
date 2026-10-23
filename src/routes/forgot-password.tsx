import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { KeyRound, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "فراموشی رمز عبور | سایبر ۳۲" }, { name: "robots", content: "noindex" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <Layout>
      <section className="max-w-lg mx-auto px-4 py-20 text-center">
        <KeyRound className="w-12 h-12 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold">فراموشی رمز عبور</h1>
        <p className="text-muted-foreground mt-4 leading-8">
          برای بازیابی امن حساب، به پشتیبانی ایمیل بزنید. پس از بررسی مالکیت حساب، راه امن بازیابی
          در اختیارتان قرار می‌گیرد.
        </p>
        <a
          href="mailto:bazmanuser@gmail.com?subject=درخواست%20بازیابی%20حساب"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-md bg-primary text-primary-foreground font-mono"
        >
          <Mail className="w-4 h-4" />
          bazmanuser@gmail.com
        </a>
        <p className="text-xs text-muted-foreground mt-4">
          نام کاربری‌تان را در پیام بنویسید؛ رمز عبور یا کد تأیید را برای هیچ‌کس ارسال نکنید.
        </p>
        <div className="mt-8 text-sm text-muted-foreground">
          <Link to="/login" search={{ type: "user" }} className="text-primary hover:underline font-mono">
            بازگشت به ورود
          </Link>
        </div>
      </section>
    </Layout>
  );
}
