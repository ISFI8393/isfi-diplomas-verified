import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  Loader2,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";
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

type StatsRow = {
  numero_diplome: string;
  nom_complet: string | null;
  program_id: string | null;
  total: number;
  success_count: number;
  fail_count: number;
  last_at: string;
};

type DailyPoint = {
  day: string;
  total: number;
  success_count: number;
  blocked_count: number;
};

type Program = { id: string; nom_filiere: string; code: string | null };

function VerificationsAnalytics() {
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [trend, setTrend] = useState<DailyPoint[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [days, setDays] = useState(30);
  const [programId, setProgramId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    supabase
      .from("programs")
      .select("id, nom_filiere, code")
      .order("nom_filiere", { ascending: true })
      .then(({ data }) => setPrograms((data ?? []) as Program[]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [statsRes, dailyRes] = await Promise.all([
        supabase.rpc("get_verification_stats_filtered", {
          p_days: days,
          p_program_id: programId || undefined,
          p_status: status || undefined,
          p_search: search || undefined,
          p_limit: 200,
        }),
        supabase.rpc("get_verification_daily_trend", { p_days: days }),
      ]);
      if (cancelled) return;
      if (statsRes.error || dailyRes.error) {
        setError(statsRes.error?.message || dailyRes.error?.message || "Erreur");
      } else {
        setStats((statsRes.data ?? []) as StatsRow[]);
        setTrend(
          ((dailyRes.data ?? []) as DailyPoint[]).map((d) => ({
            ...d,
            day: new Date(d.day).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
            }),
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [days, programId, status, search]);

  const totals = useMemo(
    () =>
      stats.reduce(
        (acc, r) => ({
          total: acc.total + Number(r.total),
          success: acc.success + Number(r.success_count),
          fail: acc.fail + Number(r.fail_count),
        }),
        { total: 0, success: 0, fail: 0 },
      ),
    [stats],
  );

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-primary">Vérifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Statistiques, tendances et historique des vérifications de diplômes.
        </p>
      </header>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
          <Filter className="h-4 w-4" /> Filtres
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={365}>1 an</option>
          </select>

          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Toutes les filières</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom_filiere}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="authentic">Authentique</option>
            <option value="not_authentic">Non authentique</option>
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="N° diplôme ou nom"
              className="w-full bg-transparent text-sm py-2 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                }}
                className="text-xs text-muted-foreground"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total vérifications" value={totals.total} icon={Activity} tone="primary" />
        <StatCard label="Authentiques" value={totals.success} icon={TrendingUp} tone="success" />
        <StatCard label="Non authentiques" value={totals.fail} icon={ShieldAlert} tone="danger" />
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
          <BarChart3 className="h-5 w-5" /> Diplômes vérifiés
        </h2>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat pour ces filtres.</p>
        ) : (
          <>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="numero_diplome"
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Vérifications" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">N° diplôme</th>
                    <th className="py-2 pr-4">Titulaire</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Authentiques</th>
                    <th className="py-2 pr-4">Non auth.</th>
                    <th className="py-2 pr-4">Dernière</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr key={row.numero_diplome} className="border-t border-border">
                      <td className="py-2 pr-4 font-mono">{row.numero_diplome}</td>
                      <td className="py-2 pr-4">{row.nom_complet ?? "—"}</td>
                      <td className="py-2 pr-4">{row.total}</td>
                      <td className="py-2 pr-4 text-emerald-700">{row.success_count}</td>
                      <td className="py-2 pr-4 text-red-700">{row.fail_count}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(row.last_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          to="/admin/verifications/$numero"
                          params={{ numero: row.numero_diplome }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Historique <ExternalLink className="h-3 w-3" />
                        </Link>
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
