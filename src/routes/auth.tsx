import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import logo from "@/assets/isfi-logo.png.asset.json";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — ISFI Verify" },
      { name: "description", content: "Accès réservé au personnel ISFI. Plateforme officielle de vérification des diplômes." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: (redirect as "/admin") || "/admin", replace: true });
    }
  }, [loading, user, navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion réussie.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Identifiants invalides");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[var(--gradient-hero)] text-primary-foreground p-12">
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <img src={logo.url} alt="ISFI" className="h-12 w-auto" />
            <div>
              <p className="font-display text-xl font-bold">ISFI Verify</p>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
                Institut Supérieur de Formation en Informatique
              </p>
            </div>
          </Link>
          <ShieldCheck className="h-10 w-10 text-gold mb-4" />
          <h1 className="font-display text-4xl font-bold mb-3">
            Plateforme officielle de vérification des diplômes
          </h1>
          <p className="text-primary-foreground/80">
            Accès strictement réservé au personnel administratif et académique ISFI.
            Aucune inscription publique n'est autorisée.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={logo.url} alt="ISFI" className="h-12 w-auto" />
          </Link>

          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-primary">ISFI Verify</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Plateforme officielle de vérification des diplômes
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mot de passe</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Système fermé. Les comptes sont créés uniquement par l'administration ISFI.
          </p>
        </div>
      </div>
    </div>
  );
}
