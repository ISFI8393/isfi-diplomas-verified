import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listUsers, createUser, updateUser, setUserActive, resetPassword, deleteUser, AVAILABLE_ROLES,
  type AppRole,
} from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, KeyRound, Trash2, Power, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  scolarite: "Agent scolarité",
  verificateur: "Vérificateur",
  teacher: "Enseignant",
  student: "Étudiant",
};

function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const update = useServerFn(updateUser);
  const toggle = useServerFn(setUserActive);
  const reset = useServerFn(resetPassword);
  const del = useServerFn(deleteUser);

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const mCreate = useMutation({
    mutationFn: (input: Parameters<typeof create>[0]["data"]) => create({ data: input }),
    onSuccess: () => { toast.success("Utilisateur créé"); refresh(); setShowCreate(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mUpdate = useMutation({
    mutationFn: (input: Parameters<typeof update>[0]["data"]) => update({ data: input }),
    onSuccess: () => { toast.success("Utilisateur mis à jour"); refresh(); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mToggle = useMutation({
    mutationFn: (input: Parameters<typeof toggle>[0]["data"]) => toggle({ data: input }),
    onSuccess: () => { toast.success("Statut modifié"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mReset = useMutation({
    mutationFn: (input: Parameters<typeof reset>[0]["data"]) => reset({ data: input }),
    onSuccess: () => { toast.success("Mot de passe réinitialisé"); setResetting(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelete = useMutation({
    mutationFn: (input: Parameters<typeof del>[0]["data"]) => del({ data: input }),
    onSuccess: () => { toast.success("Utilisateur supprimé"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<NonNullable<typeof data>[number] | null>(null);
  const [resetting, setResetting] = useState<NonNullable<typeof data>[number] | null>(null);

  const rolesUserCanAssign = AVAILABLE_ROLES.filter((r) => isSuperAdmin || r !== "super_admin");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créer, modifier, désactiver ou supprimer les comptes du personnel ISFI.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rôle</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Dernière connexion</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => {
                const active = !u.banned_until || new Date(u.banned_until) <= new Date();
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3">{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-muted-foreground">—</span>}
                        {u.roles.map((r) => (
                          <span key={r} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {ROLE_LABELS[r]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">Actif</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">Désactivé</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("fr-FR") : "Jamais"}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button title="Modifier" onClick={() => setEditing(u)} className="p-1.5 rounded hover:bg-accent">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button title="Réinitialiser le mot de passe" onClick={() => setResetting(u)} className="p-1.5 rounded hover:bg-accent">
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          title={active ? "Désactiver" : "Réactiver"}
                          onClick={() => mToggle.mutate({ id: u.id, active: !active })}
                          className="p-1.5 rounded hover:bg-accent"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => {
                            if (confirm(`Supprimer définitivement ${u.email} ?`)) mDelete.mutate({ id: u.id });
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <UserFormDialog
          title="Créer un utilisateur"
          submitLabel="Créer"
          roles={rolesUserCanAssign}
          onCancel={() => setShowCreate(false)}
          onSubmit={(v) => mCreate.mutate(v)}
          busy={mCreate.isPending}
          withPassword
        />
      )}
      {editing && (
        <UserFormDialog
          title="Modifier l'utilisateur"
          submitLabel="Enregistrer"
          roles={rolesUserCanAssign}
          initial={{
            email: editing.email,
            first_name: editing.first_name ?? "",
            last_name: editing.last_name ?? "",
            role: (editing.roles[0] ?? "student") as AppRole,
          }}
          emailReadonly
          onCancel={() => setEditing(null)}
          onSubmit={(v) => mUpdate.mutate({
            id: editing.id, first_name: v.first_name, last_name: v.last_name, role: v.role,
          })}
          busy={mUpdate.isPending}
        />
      )}
      {resetting && (
        <PasswordDialog
          email={resetting.email}
          busy={mReset.isPending}
          onCancel={() => setResetting(null)}
          onSubmit={(pwd) => mReset.mutate({ id: resetting.id, password: pwd })}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  title, submitLabel, roles, initial, emailReadonly, withPassword, onCancel, onSubmit, busy,
}: {
  title: string;
  submitLabel: string;
  roles: AppRole[];
  initial?: { email: string; first_name: string; last_name: string; role: AppRole };
  emailReadonly?: boolean;
  withPassword?: boolean;
  onCancel: () => void;
  onSubmit: (v: { email: string; password: string; first_name: string; last_name: string; role: AppRole }) => void;
  busy: boolean;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(initial?.first_name ?? "");
  const [lastName, setLastName] = useState(initial?.last_name ?? "");
  const [role, setRole] = useState<AppRole>(initial?.role ?? "verificateur");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password, first_name: firstName, last_name: lastName, role }); }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4"
      >
        <h2 className="font-display text-xl font-bold text-primary">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" value={firstName} onChange={setFirstName} required />
          <Input label="Nom" value={lastName} onChange={setLastName} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={setEmail} required readOnly={emailReadonly} />
        {withPassword && <Input label="Mot de passe" type="password" value={password} onChange={setPassword} required minLength={8} />}
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rôle</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent">
            Annuler
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordDialog({ email, busy, onCancel, onSubmit }: { email: string; busy: boolean; onCancel: () => void; onSubmit: (p: string) => void }) {
  const [pwd, setPwd] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(pwd); }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4"
      >
        <h2 className="font-display text-xl font-bold text-primary">Réinitialiser le mot de passe</h2>
        <p className="text-sm text-muted-foreground">Compte : <strong>{email}</strong></p>
        <Input label="Nouveau mot de passe" type="password" value={pwd} onChange={setPwd} required minLength={8} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent">Annuler</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, minLength, readOnly }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number; readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm read-only:bg-muted read-only:text-muted-foreground"
      />
    </label>
  );
}
