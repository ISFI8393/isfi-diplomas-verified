import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ScrollText,
  LogOut,
  ShieldCheck,
  Crown,
  Loader2,
} from "lucide-react";
import logo from "@/assets/isfi-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/programs", label: "Formations", icon: BookOpen },
  { to: "/admin/students", label: "Étudiants", icon: GraduationCap },
  { to: "/admin/teachers", label: "Enseignants", icon: Users },
  { to: "/admin/diplomas", label: "Diplômes", icon: ScrollText },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading, signOut, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const claim = useServerFn(claimFirstAdmin);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function onClaim() {
    setClaiming(true);
    try {
      const res = await claim();
      if (res.ok) {
        toast.success("Vous êtes maintenant administrateur.");
        await refreshRoles();
      } else {
        toast.error("Un administrateur existe déjà. Demandez à un admin de vous ajouter.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-primary">Accès administrateur requis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte ({user?.email}) n'a pas le rôle administrateur. Si vous êtes le premier
            utilisateur de la plateforme, vous pouvez vous attribuer le rôle administrateur.
          </p>
          <button
            onClick={onClaim}
            disabled={claiming}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--gradient-gold)] px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] disabled:opacity-60"
          >
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            Devenir le premier administrateur
          </button>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="mt-3 block w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <img src={logo.url} alt="ISFI" className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-primary">ISFI Admin</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Console</p>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="px-2 py-2 text-xs">
            <p className="font-medium truncate">{user?.email}</p>
            <p className="text-muted-foreground">Administrateur</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="mt-2 w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
