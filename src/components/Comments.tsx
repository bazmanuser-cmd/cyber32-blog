import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageCircle, Trash2, Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function Comments({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, profiles:user_id(username, display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Comment[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const content = text.trim();
    if (content.length < 1 || content.length > 2000) { toast.error("متن نظر بین ۱ تا ۲۰۰۰ کاراکتر"); return; }
    setBusy(true);
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content });
    setBusy(false);
    if (error) toast.error(error.message);
    else { setText(""); toast.success("نظر شما ثبت شد"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف نظر؟")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <section className="mt-12 border-t border-primary/20 pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">نظرات و پرسش‌ها</h2>
        <span className="text-sm text-muted-foreground font-mono">({items.length})</span>
      </div>

      {user ? (
        <form onSubmit={submit} className="mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="نظر یا سوال خود را بنویسید..."
            rows={3}
            maxLength={2000}
            className="bg-card/60 border-primary/20"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground font-mono">
              @{profile?.username ?? "you"} · {text.length}/2000
            </span>
            <Button type="submit" disabled={busy || !text.trim()} size="sm">
              <Send className="w-4 h-4 ml-1" /> ارسال
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-5 mb-6 bg-card/40 border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">
            برای گذاشتن نظر <Link to="/login" search={{ type: "user" }} className="text-primary font-mono hover:underline">وارد شوید</Link> یا <Link to="/register" className="text-primary font-mono hover:underline">ثبت‌نام</Link> کنید.
          </p>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground font-mono text-sm">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">هنوز نظری ثبت نشده. اولین نفر باشید.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id} className="p-4 bg-card/50 border-primary/20">
              <div className="flex items-start gap-3">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-mono text-sm">
                      <span className="text-primary">@{c.profiles?.username ?? "user"}</span>
                      {c.profiles?.display_name && <span className="text-muted-foreground mr-2">· {c.profiles.display_name}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(c.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap break-words">{c.content}</p>
                </div>
                {user && user.id === c.user_id && (
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
