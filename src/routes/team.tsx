import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Users } from "lucide-react";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "درخواست عضویت در تیم | Cyber32" },
      { name: "description", content: "فرم درخواست همکاری با تیم سایبر ۳۲." },
    ],
  }),
  component: TeamApplicationPage,
});

type ApplicationField = { key: string; label: string; type: "text" | "textarea"; required: boolean };
type ApplicationSettings = { enabled?: boolean; fields?: ApplicationField[] };

function TeamApplicationPage() {
  const [settings, setSettings] = useState<ApplicationSettings>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "team_application").maybeSingle()
      .then(({ data }) => setSettings((data?.value ?? {}) as ApplicationSettings));
  }, []);

  const fields = settings.fields ?? [];

  const submitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("team_applications").insert({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim(),
      answers,
    });
    setBusy(false);
    if (error) toast.error("ثبت درخواست انجام نشد. دوباره تلاش کنید.");
    else setSubmitted(true);
  };

  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-6 h-6 text-primary" />
          <span className="font-mono text-xs text-primary">// TEAM_APPLICATION</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">درخواست همکاری با تیم</h1>
        <p className="mt-3 text-muted-foreground">برای بررسی درخواست، اطلاعات زیر را کامل کنید.</p>

        {submitted ? (
          <Card className="mt-8 p-8 border-primary/30">
            <Check className="w-8 h-8 text-primary mb-3" />
            <h2 className="text-xl font-bold">درخواست شما ثبت شد</h2>
            <p className="mt-2 text-sm text-muted-foreground">پس از بررسی، با شما از طریق ایمیل تماس می‌گیریم.</p>
          </Card>
        ) : settings.enabled === false ? (
          <Card className="mt-8 p-8 text-muted-foreground">ثبت درخواست عضویت در حال حاضر بسته است.</Card>
        ) : (
          <Card className="mt-8 p-6 md:p-8">
            <form onSubmit={submitApplication} className="space-y-5">
              <div>
                <Label htmlFor="application-name">نام و نام خانوادگی</Label>
                <Input id="application-name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required className="mt-1.5" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="application-email">ایمیل</Label>
                  <Input id="application-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={320} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="application-username">نام کاربری تلگرام</Label>
                  <Input id="application-username" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={80} required className="mt-1.5" />
                </div>
              </div>
              {fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`application-${field.key}`}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea id={`application-${field.key}`} value={answers[field.key] ?? ""} onChange={(event) => setAnswers({ ...answers, [field.key]: event.target.value })} required={field.required} rows={4} className="mt-1.5" />
                  ) : (
                    <Input id={`application-${field.key}`} value={answers[field.key] ?? ""} onChange={(event) => setAnswers({ ...answers, [field.key]: event.target.value })} required={field.required} className="mt-1.5" />
                  )}
                </div>
              ))}
              <Button type="submit" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت درخواست"}</Button>
            </form>
          </Card>
        )}
      </section>
    </Layout>
  );
}