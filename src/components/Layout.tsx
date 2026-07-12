import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User, Users, FileText, Home, GraduationCap, HelpCircle, LayoutDashboard, Info, Crown } from "lucide-react";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-glow-soft">
              <Shield className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-mono text-primary text-glow font-bold text-lg tracking-wider">
                CYBER<span className="text-foreground">32</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                @cyber32_ir
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 mr-auto">
            <Link to="/" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <Home className="w-4 h-4" /> خانه
            </Link>
            <Link to="/courses" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> دوره‌ها
            </Link>
            <Link to="/articles" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" /> مقالات
            </Link>
            <Link to="/team" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" /> تیم
            </Link>
            <Link to="/about" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <Info className="w-4 h-4" /> درباره
            </Link>
            <Link to="/faq" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> سوالات
            </Link>
            <Link to="/vip" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2 text-primary">
              <Crown className="w-4 h-4" /> VIP
            </Link>
            {user && (
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> پنل
              </Link>
            )}
            {user && (
              <Link to="/admin" className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4" /> ادمین
              </Link>
            )}
          </nav>

          <div className="mr-auto md:mr-0 flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/50 hover:bg-accent transition-colors text-sm"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-mono">@{profile?.username ?? "..."}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  title="خروج"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="default" size="sm" className="font-mono">
                <Link to="/login">ورود</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 mt-16 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="font-mono text-primary text-glow text-lg font-bold">CYBER32</div>
            <p className="text-sm text-muted-foreground mt-2">
              تیم امنیت سایبری، آموزش هک، انتشار سورس‌ها و پایگاه‌داده‌ها.
            </p>
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              مالک: <a href="https://t.me/ViRus32_Org" target="_blank" rel="noreferrer" className="text-primary">@ViRus32_Org</a>
            </p>
          </div>
          <div>
            <div className="text-sm font-bold mb-3">کانال‌ها</div>
            <ul className="space-y-1.5 text-sm text-muted-foreground font-mono">
              <li><a target="_blank" rel="noreferrer" href="https://t.me/cyber32_ir" className="hover:text-primary">@cyber32_ir — اصلی</a></li>
              <li><a target="_blank" rel="noreferrer" href="https://t.me/Cyber32_config" className="hover:text-primary">@Cyber32_config — کانفیگ‌ها</a></li>
              <li><a target="_blank" rel="noreferrer" href="https://t.me/Cyber32_DB" className="hover:text-primary">@Cyber32_DB — دیتابیس‌ها</a></li>
              <li><a target="_blank" rel="noreferrer" href="https://t.me/Cyber32_SRC" className="hover:text-primary">@Cyber32_SRC — سورس‌ها</a></li>
              <li><a target="_blank" rel="noreferrer" href="https://t.me/IranWar_N" className="hover:text-primary">@IranWar_N — اخبار جنگی</a></li>
              <li><a target="_blank" rel="noreferrer" href="https://t.me/Cyber32_Gap" className="hover:text-primary">@Cyber32_Gap — گروه چت</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold mb-3">درباره</div>
            <p className="text-sm text-muted-foreground">
              محتوای ما در حوزه هک، امنیت، آموزش و همه چیزهایی که به «سایبری» ختم می‌شود است.
            </p>
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              ساخته شده توسط <span className="text-primary">Avesta</span>
            </p>
          </div>
        </div>
        <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} Cyber32 Team — All Systems Encrypted
        </div>
      </footer>
    </div>
  );
}
