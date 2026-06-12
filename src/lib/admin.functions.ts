import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Allow the currently authenticated user to claim the 'admin' role
 * ONLY if no admin exists yet in the system. Used to bootstrap the first admin.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      return { ok: false, reason: "admin_exists" as const };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
