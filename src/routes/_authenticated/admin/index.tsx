import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Users, BookOpen, ScrollText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function useCount(table: "students" | "teachers" | "programs" | "diplomas" | "verification_logs") {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });
}

function AdminDashboard() {
  const students = useCount("students");
  const teachers = useCount("teachers");
  const programs = useCount("programs");
  const diplomas = useCount("diplomas");
  const verifs = useCount("verification_logs");

  const cards = [
    { label: "Étudiants", value: students.data, icon: GraduationCap, color: "text-primary" },
    { label: "Enseignants", value: teachers.data, icon: Users, color: "text-primary" },
    { label: "Formations", value: programs.data, icon: BookOpen, color: "text-primary" },
    { label: "Diplômes délivrés", value: diplomas.data, icon: ScrollText, color: "text-gold" },
    { label: "Vérifications", value: verifs.data, icon: ShieldCheck, color: "text-success" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-primary">Tableau de bord</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aperçu de l'activité de ISFI Digital Campus.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <p className="mt-3 text-3xl font-bold font-display text-foreground">
              {c.value ?? "—"}
            </p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-primary">Bienvenue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Utilisez le menu latéral pour gérer vos formations, enseignants, étudiants et diplômes.
          Chaque diplôme délivré génère automatiquement un PDF officiel avec QR Code de vérification.
        </p>
      </div>
    </div>
  );
}
