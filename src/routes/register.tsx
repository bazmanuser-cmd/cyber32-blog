import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "ثبت‌نام | سایبر ۳۲" }, { name: "description", content: "عضویت در تیم سایبر ۳۲." }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <Layout>
      <section className="max-w-lg mx-auto px-4 py-20 text-center">
        <UserPlus className="w-12 h-12 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold">ثبت‌نام</h1>
        <p className="text-muted-foreground mt-4 leading-8">
          عضویت در سایبر ۳۲ در حال حاضر <span className="text-primary font-mono">فقط با دعوت‌نامه</span> از سمت مالک مجموعه انجام می‌شود.
          برای درخواست عضویت با آیدی زیر تماس بگیرید:
        </p>
        <a href="https://t.me/ViRus32_Org" target="_blank" rel="noreferrer" className="inline-block mt-6 px-6 py-3 rounded-md bg-primary text-primary-foreground font-mono">
          @ViRus32_Org
        </a>
        <div className="mt-8 text-sm text-muted-foreground">
          حساب دارید؟ <Link to="/login" className="text-primary hover:underline font-mono">ورود</Link>
        </div>
      </section>
    </Layout>
  );
}
