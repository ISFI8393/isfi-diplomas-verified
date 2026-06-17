import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ScrollText,
  LogOut,
  ShieldCheck,
  Loader2,
  UserCog,
  Activity,
  ShieldOff,
  Bell,
} from "lucide-react";
import logo from "@/assets/isfi-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; adminOnly?: boolean };
const nav: NavItem[] = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/verifications", label: "Vérifications", icon: Activity },
  { to: "/admin/alerts", label: "Alertes", icon: Bell, adminOnly: true },
  { to: "/admin/blocked-ips", label: "IP bloquées", icon: ShieldOff, adminOnly: true },
  { to: "/admin/users", label: "Utilisateurs", icon: UserCog, adminOnly: true },
  { to: "/admin/programs", label: "Formations", icon: BookOpen, adminOnly: true },
  { to: "/admin/students", label: "Étudiants", icon: GraduationCap },
  { to: "/admin/teachers", label: "Enseignants", icon: Users, adminOnly: true },
  { to: "/admin/diplomas", label: "Diplômes", icon: ScrollText },
];

function AdminLayout() {
  const { user, isAdminLevel, isSuperAdmin, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const canAccess = isAdminLevel || roles.includes("scolarite") || roles.includes("verificateur");

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-primary">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte ({user?.email}) n'a aucun rôle autorisé sur cette console.
            Contactez un administrateur ISFI pour obtenir un accès.
          </p>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const visibleNav = nav.filter((n) => !n.adminOnly || isAdminLevel);
  const roleLabel = isSuperAdmin ? "Super Administrateur" : isAdminLevel ? "Administrateur" : roles[0] ?? "—";

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <img src={logo.url} alt="ISFI" className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-primary">ISFI Verify</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Console</p>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
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
            <p className="text-muted-foreground capitalize">{roleLabel}</p>
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
