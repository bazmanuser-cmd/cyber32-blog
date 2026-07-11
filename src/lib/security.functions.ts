import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RATE_WINDOW_SEC = 60;

async function checkRate(key: string, limit: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const bucket = new Date(Math.floor(Date.now() / (RATE_WINDOW_SEC * 1000)) * RATE_WINDOW_SEC * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("rate_limits")
    .select("count")
    .eq("key", key)
    .eq("window_start", bucket)
    .maybeSingle();
  const cur = data?.count ?? 0;
  if (cur >= limit) return false;
  await supabaseAdmin
    .from("rate_limits")
    .upsert({ key, window_start: bucket, count: cur + 1 }, { onConflict: "key,window_start" });
  return true;
}

async function writeAudit(
  userId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
  entity?: string,
  entityId?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();
  const ua = (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })();
  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    entity: entity ?? null,
    entity_id: entityId ?? null,
    metadata,
    ip,
    user_agent: ua,
  });
}

const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .max(128, "رمز عبور بیش از حد بلند است");

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { newPassword: string }) =>
    z.object({ newPassword: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ok = await checkRate(`chpw:${context.userId}`, 5);
    if (!ok) {
      await writeAudit(context.userId, "password_change_rate_limited");
      throw new Error("تعداد تلاش‌ها بیش از حد مجاز است. لحظاتی صبر کنید.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (error) {
      await writeAudit(context.userId, "password_change_failed", { error: error.message });
      throw new Error(error.message);
    }
    await writeAudit(context.userId, "password_changed");
    return { ok: true };
  });

export const listMyAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, action, entity, metadata, ip, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const enrollTotp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const otpauth = await import("otpauth");
    const secret = new otpauth.Secret({ size: 20 });
    const { data: profile } = await context.supabase
      .from("profiles").select("username").eq("id", context.userId).maybeSingle();
    const totp = new otpauth.TOTP({
      issuer: "Cyber32",
      label: profile?.username ?? "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ two_factor_secret: secret.base32, two_factor_enabled: false })
      .eq("id", context.userId);
    await writeAudit(context.userId, "totp_enrollment_started");
    return { secret: secret.base32, uri: totp.toString() };
  });

export const verifyTotp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().regex(/^\d{6}$/, "کد باید ۶ رقم باشد") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ok = await checkRate(`totp:${context.userId}`, 10);
    if (!ok) throw new Error("تلاش بیش از حد. لحظاتی صبر کنید.");
    const { data: profile } = await context.supabase
      .from("profiles").select("two_factor_secret").eq("id", context.userId).maybeSingle();
    if (!profile?.two_factor_secret) throw new Error("ابتدا 2FA را فعال‌سازی کنید");
    const otpauth = await import("otpauth");
    const totp = new otpauth.TOTP({
      issuer: "Cyber32",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(profile.two_factor_secret),
    });
    const delta = totp.validate({ token: data.code, window: 1 });
    if (delta === null) {
      await writeAudit(context.userId, "totp_verify_failed");
      throw new Error("کد نامعتبر است");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ two_factor_enabled: true }).eq("id", context.userId);
    await writeAudit(context.userId, "totp_enabled");
    return { ok: true };
  });

export const disableTotp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ two_factor_enabled: false, two_factor_secret: null })
      .eq("id", context.userId);
    await writeAudit(context.userId, "totp_disabled");
    return { ok: true };
  });
