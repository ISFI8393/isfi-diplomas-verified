import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, QrCode, Search, Calendar, Award, BookOpen, Building2, Hash, User } from "lucide-react";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Vérifier un diplôme — ISFI" },
      { name: "description", content: "Vérifiez l'authenticité d'un diplôme délivré par l'Institut Supérieur de Formation en Informatique (ISFI) grâce au numéro de diplôme ou au QR Code." },
      { property: "og:title", content: "Vérification de diplôme ISFI" },
      { property: "og:description", content: "Confirmez en quelques secondes l'authenticité d'un diplôme ISFI." },
    ],
  }),
  component: VerificationPage,
});

type DiplomaResult = {
  numero: string;
  nom: string;
  date_naissance: string;
  diplome: string;
  option: string;
  mention: string;
  annee: string;
  etablissement: string;
  date_delivrance: string;
  photo?: string;
};

// Démo statique — sera remplacée par un appel à la base Supabase à l'activation Cloud.
const DEMO: Record<string, DiplomaResult> = {
  "ISFI-2017-150129": {
    numero: "ISFI-2017-150129",
    nom: "CHEIKH MBACKE KHARMA",
    date_naissance: "18/01/1989",
    diplome: "Licence (Bac+3)",
    option: "Administration Système & Réseaux Télécoms",
    mention: "Bien",
    annee: "2016 — 2017",
    etablissement: "Institut Supérieur de Formation en Informatique",
    date_delivrance: "12/09/2017",
  },
};

function VerificationPage() {
  const [numero, setNumero] = useState("");
  const [nom, setNom] = useState("");
  const [result, setResult] = useState<DiplomaResult | null>(null);
  const [status, setStatus] = useState<"idle" | "found" | "not_found">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const key = numero.trim().toUpperCase();
    const found = DEMO[key];
    if (found && (!nom.trim() || found.nom.toLowerCase().includes(nom.trim().toLowerCase()))) {
      setResult(found);
      setStatus("found");
    } else {
      setResult(null);
      setStatus("not_found");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-[var(--gradient-hero)] text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Vérification officielle
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">Vérifier un diplôme</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Saisissez le numéro de diplôme ou le nom du diplômé. Vous pouvez également scanner le QR Code imprimé sur le diplôme.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-3xl px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Numéro du diplôme</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="ISFI-2017-150129"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nom et prénom</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <QrCode className="h-4 w-4" /> Scanner le QR Code
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Search className="h-4 w-4" /> Vérifier
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Démo : essayez le numéro <span className="font-mono font-semibold text-primary">ISFI-2017-150129</span>.
          </p>
        </form>
      </section>

      <section className="mx-auto mt-10 max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        {status === "not_found" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-display text-lg font-semibold text-destructive">Aucun diplôme trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez le numéro saisi. En cas de doute, contactez l'administration de l'ISFI.
            </p>
          </div>
        )}

        {status === "found" && result && <DiplomaCard result={result} />}
      </section>

      <SiteFooter />
    </div>
  );
}

function DiplomaCard({ result }: { result: DiplomaResult }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-[var(--gradient-navy)] px-6 py-4 text-primary-foreground">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-gold" />
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Statut</p>
            <p className="font-display text-lg font-semibold">Diplôme Authentique</p>
          </div>
        </div>
        <div className="rounded-lg bg-success/15 px-3 py-1.5 text-sm font-semibold text-gold">
          ✓ Vérifié
        </div>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-44 w-36 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/60 text-muted-foreground">
            <User className="h-12 w-12" />
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-16 w-16" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Diplômé</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-primary">{result.nom}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Né(e) le {result.date_naissance}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Row icon={Award} label="Diplôme" value={result.diplome} />
            <Row icon={BookOpen} label="Option" value={result.option} />
            <Row icon={Award} label="Mention" value={result.mention} />
            <Row icon={Calendar} label="Année académique" value={result.annee} />
            <Row icon={Building2} label="Établissement" value={result.etablissement} />
            <Row icon={Hash} label="N° de diplôme" value={result.numero} mono />
            <Row icon={Calendar} label="Date de délivrance" value={result.date_delivrance} />
          </dl>
        </div>
      </div>
    </article>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/5 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
        <dd className={`mt-0.5 text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
      </div>
    </div>
  );
}
