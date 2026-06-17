import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertTriangle, ShieldAlert, Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  component: AlertsPage,
});

type Alert = {
  id: string;
  kind: "ip_blocked" | "spike" | string;
  ip: string | null;
  details: Record<string, unknown>;
  notified: boolean;
  created_at: string;
};

function AlertsPage() {
  const [rows, setRows] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.rpc("get_admin_alerts", { p_limit: 200 });
      if (err) setError(err.message);
      else setRows((data ?? []) as Alert[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-primary flex items-center gap-2">
          <Bell className="h-7 w-7" /> Alertes administrateur
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Déclenchées dès qu'une IP est bloquée pour abus ou en cas de pic anormal
          (≥ 200 vérifications en 5 minutes).
        </p>
      </header>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
        <Mail className="h-5 w-5 flex-none" />
        <div>
          <p className="font-semibold">Notifications par email — non activées</p>
          <p className="mt-1">
            Les alertes sont enregistrées ici en temps réel. Pour recevoir une copie
            par email, configurez d'abord un domaine d'envoi dans Cloud → Emails,
            puis demandez l'activation de l'envoi des alertes.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune alerte enregistrée.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => {
              const isSpike = a.kind === "spike";
              const Icon = isSpike ? AlertTriangle : ShieldAlert;
              const tone = isSpike ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
              return (
                <li key={a.id} className="py-3 flex items-start gap-3">
                  <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {isSpike ? "Pic de vérifications détecté" : `IP bloquée — ${a.ip ?? "?"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("fr-FR")}
                    </p>
                    {a.details && Object.keys(a.details).length > 0 && (
                      <pre className="mt-1 text-xs bg-muted/40 rounded p-2 overflow-x-auto">
                        {JSON.stringify(a.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
