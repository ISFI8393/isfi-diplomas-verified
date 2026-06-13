import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "super_admin" | "admin" | "scolarite" | "verificateur" | "teacher" | "student";

const ALL_ROLES: AppRole[] = ["super_admin", "admin", "scolarite", "verificateur", "teacher", "student"];

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["super_admin", "admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: admin rights required");
  return data.map((r) => r.role as AppRole);
}

async function isSuperAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return !!data;
}

async function audit(event: string, metadata: Record<string, unknown>, actorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("auth_audit_logs").insert({
    user_id: actorId,
    event,
    metadata: metadata as never,
  });
}

// ============ LIST USERS ============
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersList, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = usersList.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const rolesByUser = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      rolesByUser.set(r.user_id, list);
    });
    const profileById = new Map<string, { first_name: string | null; last_name: string | null }>();
    (profiles ?? []).forEach((p) => profileById.set(p.id, p));
    return usersList.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
      roles: rolesByUser.get(u.id) ?? [],
      first_name: profileById.get(u.id)?.first_name ?? null,
      last_name: profileById.get(u.id)?.last_name ?? null,
    }));
  });

// ============ CREATE USER ============
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  role: z.enum(["super_admin", "admin", "scolarite", "verificateur", "teacher", "student"]),
});
export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof createUserSchema>) => createUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.role === "super_admin" && !(await isSuperAdmin(context.userId))) {
      throw new Error("Only a SUPER_ADMIN can create another SUPER_ADMIN.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.first_name, last_name: data.last_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
    });
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    await audit("user_created", { target: created.user.id, email: data.email, role: data.role }, context.userId);
    return { ok: true, id: created.user.id };
  });

// ============ UPDATE USER (name + role) ============
const updateUserSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  role: z.enum(["super_admin", "admin", "scolarite", "verificateur", "teacher", "student"]),
});
export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof updateUserSchema>) => updateUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.role === "super_admin" && !(await isSuperAdmin(context.userId))) {
      throw new Error("Only a SUPER_ADMIN can assign SUPER_ADMIN role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({
      first_name: data.first_name,
      last_name: data.last_name,
    }).eq("id", data.id);

    // Replace roles with the single chosen role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });
    if (error) throw new Error(error.message);

    await audit("user_updated", { target: data.id, role: data.role }, context.userId);
    return { ok: true };
  });

// ============ DEACTIVATE / REACTIVATE ============
const toggleSchema = z.object({ id: z.string().uuid(), active: z.boolean() });
export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof toggleSchema>) => toggleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.active ? "none" : "876000h", // ~100 years
    });
    if (error) throw new Error(error.message);
    await audit(data.active ? "user_reactivated" : "user_deactivated", { target: data.id }, context.userId);
    return { ok: true };
  });

// ============ RESET PASSWORD ============
const resetSchema = z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) });
export const resetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof resetSchema>) => resetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    await audit("password_reset", { target: data.id }, context.userId);
    return { ok: true };
  });

// ============ DELETE USER ============
const delSchema = z.object({ id: z.string().uuid() });
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof delSchema>) => delSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Block deleting the last super_admin
    const { data: target } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.id);
    if ((target ?? []).some((r) => r.role === "super_admin")) {
      const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
      if ((count ?? 0) <= 1) throw new Error("Cannot delete the last SUPER_ADMIN.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await audit("user_deleted", { target: data.id }, context.userId);
    return { ok: true };
  });

export const AVAILABLE_ROLES = ALL_ROLES;
