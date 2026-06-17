import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, BarChart3, ShieldAlert, TrendingUp, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/verifications")({
  component: VerificationsAnalytics,
});

type PerDiploma = {
  numero_diplome: string;
  total: number;
  success_count: number;
  last_at: string;
};

type DailyPoint = {
  day: string;
  total: number;
  success_count: number;
  blocked_count: number;
};

function VerificationsAnalytics() {
  const [perDiploma, setPerDiploma] = useState<PerDiploma[]>([]);
  const [trend, setTrend] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [stats, daily] = await Promise.all([
        supabase.rpc("get_verification_stats_per_diploma", { p_limit: 25 }),
        supabase.rpc("get_verification_daily_trend", { p_days: days }),
      ]);
      if (cancelled) return;
      if (stats.error || daily.error) {
        setError(stats.error?.message || daily.error?.message || "Erreur");
      } else {
        setPerDiploma((stats.data ?? []) as PerDiploma[]);
        setTrend(
          ((daily.data ?? []) as DailyPoint[]).map((d) => ({
            ...d,
            day: new Date(d.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const totals = trend.reduce(
    (acc, d) => ({
      total: acc.total + d.total,
      success: acc.success + d.success_count,
      blocked: acc.blocked + d.blocked_count,
    }),
    { total: 0, success: 0, blocked: 0 },
  );

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Vérifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi du nombre de vérifications par diplôme et tendances quotidiennes.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total vérifications" value={totals.total} icon={Activity} tone="primary" />
        <StatCard label="Vérifications réussies" value={totals.success} icon={TrendingUp} tone="success" />
        <StatCard label="Tentatives bloquées" value={totals.blocked} icon={ShieldAlert} tone="danger" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Tendance quotidienne
        </h2>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="success_count" name="Réussies" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="blocked_count" name="Bloquées" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Top diplômes vérifiés
        </h2>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : perDiploma.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vérification enregistrée.</p>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perDiploma.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="numero_diplome" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Vérifications" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">N° diplôme</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Réussies</th>
                    <th className="py-2 pr-4">Dernière vérification</th>
                  </tr>
                </thead>
                <tbody>
                  {perDiploma.map((row) => (
                    <tr key={row.numero_diplome} className="border-t border-border">
                      <td className="py-2 pr-4 font-mono">{row.numero_diplome}</td>
                      <td className="py-2 pr-4">{row.total}</td>
                      <td className="py-2 pr-4">{row.success_count}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(row.last_at).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone: "primary" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "danger"
        ? "bg-red-50 text-red-700"
        : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-primary">{value.toLocaleString("fr-FR")}</p>
      </div>
    </div>
  );
}
