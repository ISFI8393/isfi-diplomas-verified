import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Monitor, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/verifications/$numero")({
  component: DiplomaHistoryPage,
});

type Row = {
  id: string;
  numero_diplome: string;
  ip: string | null;
  user_agent: string | null;
  success: boolean;
  date_verification: string;
  total_count: number;
};

const PAGE_SIZE = 25;

function DiplomaHistoryPage() {
  const { numero } = useParams({ from: "/_authenticated/admin/verifications/$numero" });
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.rpc("get_verification_history_paginated", {
        p_numero: numero,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else {
        const list = (data ?? []) as Row[];
        setRows(list);
        setTotal(list[0]?.total_count ? Number(list[0].total_count) : 0);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [numero, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <Link
        to="/admin/verifications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux vérifications
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold text-primary">
          Historique de vérification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Diplôme <span className="font-mono">{numero}</span> — {total} consultations
        </p>
      </header>

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
          <p className="text-sm text-muted-foreground">Aucune consultation enregistrée.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">
                      <Globe className="inline h-3.5 w-3.5 mr-1" /> IP
                    </th>
                    <th className="py-2 pr-4">
                      <Monitor className="inline h-3.5 w-3.5 mr-1" /> User-agent
                    </th>
                    <th className="py-2 pr-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(r.date_verification).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 pr-4 font-mono">{r.ip ?? "—"}</td>
                      <td className="py-2 pr-4 max-w-md truncate text-muted-foreground" title={r.user_agent ?? ""}>
                        {r.user_agent ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.success
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {r.success ? "Authentique" : "Non authentique"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 disabled:opacity-50"
                >
                  Suivant <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
