import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield } from "lucide-react";
import { TEAM_ROSTER } from "@/lib/team";
import teamImage from "@/assets/cyber32-team.jpg";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "اعضای تیم | Cyber32" },
      { name: "description", content: "معرفی اعضای تیم سایبر ۳۲ و مسئولیت‌هایشان." },
    ],
  }),
  component: Team,
});

const OWNER = TEAM_ROSTER.find((member) => member.isOwner) ?? TEAM_ROSTER[0];
const MEMBERS = TEAM_ROSTER.filter((member) => !member.isOwner);

function Team() {
  return (
    <Layout>
      <section className="relative border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="font-mono text-xs text-primary">// TEAM_ROSTER</div>
          <h1 className="text-4xl md:text-6xl font-bold font-mono text-drip mt-2">CYBER32</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            تیمی از متخصصان امنیت سایبری، توسعه‌دهندگان و پژوهشگران در حوزه هک، امنیت و اطلاعات.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        {/* Owner */}
        <Card className="p-6 md:p-8 mb-10 border-primary/50 shadow-glow relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="relative flex items-center gap-6 flex-wrap">
            <div className="relative">
              <img src={teamImage} alt="Owner" className="w-24 h-24 rounded-lg object-cover border-2 border-primary/60" />
              <Crown className="absolute -top-3 -right-3 w-7 h-7 text-primary" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Badge className="font-mono bg-primary/20 text-primary border-primary/40">مالک</Badge>
              <h2 className="text-2xl font-bold mt-2">{OWNER.displayName}</h2>
              <a href={`https://t.me/${OWNER.username}`} target="_blank" rel="noreferrer" className="font-mono text-primary hover:underline">
                @{OWNER.username}
              </a>
              <p className="text-muted-foreground mt-2 text-sm">{OWNER.role}</p>
            </div>
          </div>
        </Card>

        {/* Members */}
        <div className="font-mono text-xs text-muted-foreground mb-4">// MEMBERS [{MEMBERS.length}]</div>
        <div className="grid md:grid-cols-2 gap-4">
          {MEMBERS.map((m, i) => (
            <Card key={i} className="p-5 hover:border-primary/40 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-primary/30 shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{m.displayName}</h3>
                    <span className="font-mono text-xs text-muted-foreground">#{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <a href={`https://t.me/${m.username}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-primary hover:underline">
                    @{m.username}
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">{m.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground font-mono">
          ساخته شده توسط <span className="text-primary">Avesta</span>
        </div>
      </section>
    </Layout>
  );
}
