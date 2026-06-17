import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldOff, Loader2, Unlock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blocked-ips")({
  component: BlockedIPsPage,
});

type BlockedIP = {
  ip: string;
  total_blocks: number;
  last_block: string;
  last_unblock: string | null;
  is_active: boolean;
  last_user_agent: string | null;
};

function BlockedIPsPage() {
  const [rows, setRows] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIp, setBusyIp] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("get_blocked_ips");
    if (err) setError(err.message);
    else setRows((data ?? []) as BlockedIP[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnblock(ip: string) {
    if (!confirm(`Lever le blocage de l'IP ${ip} ?`)) return;
    setBusyIp(ip);
    const { error: err } = await supabase.rpc("unblock_ip", { p_ip: ip });
    setBusyIp(null);
    if (err) {
      alert("Erreur: " + err.message);
    } else {
      load();
    }
  }

  const active = rows.filter((r) => r.is_active);
  const history = rows;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">IP bloquées</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Liste des IP ayant déclenché la protection anti-abus, avec possibilité de
            lever un blocage temporaire.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" /> Rafraîchir
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-red-600" /> Blocages actifs ({active.length})
        </h2>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun blocage actif.</p>
        ) : (
          <Table rows={active} onUnblock={handleUnblock} busyIp={busyIp} showAction />
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-primary mb-4">
          Historique des blocages
        </h2>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun blocage enregistré.</p>
        ) : (
          <Table rows={history} onUnblock={handleUnblock} busyIp={busyIp} />
        )}
      </section>
    </div>
  );
}

function Table({
  rows,
  onUnblock,
  busyIp,
  showAction,
}: {
  rows: BlockedIP[];
  onUnblock: (ip: string) => void;
  busyIp: string | null;
  showAction?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">IP</th>
            <th className="py-2 pr-4">Blocages</th>
            <th className="py-2 pr-4">Dernier blocage</th>
            <th className="py-2 pr-4">Dernier déblocage</th>
            <th className="py-2 pr-4">Statut</th>
            <th className="py-2 pr-4">User-agent</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ip} className="border-t border-border">
              <td className="py-2 pr-4 font-mono">{r.ip}</td>
              <td className="py-2 pr-4">{r.total_blocks}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(r.last_block).toLocaleString("fr-FR")}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {r.last_unblock ? new Date(r.last_unblock).toLocaleString("fr-FR") : "—"}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.is_active
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {r.is_active ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="py-2 pr-4 max-w-xs truncate text-muted-foreground" title={r.last_user_agent ?? ""}>
                {r.last_user_agent ?? "—"}
              </td>
              <td className="py-2 pr-4">
                {(showAction || r.is_active) && (
                  <button
                    onClick={() => onUnblock(r.ip)}
                    disabled={busyIp === r.ip || !r.is_active}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {busyIp === r.ip ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    Lever
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
