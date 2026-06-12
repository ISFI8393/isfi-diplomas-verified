import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import logo from "@/assets/isfi-logo.png.asset.json";
import {
  ShieldCheck,
  GraduationCap,
  QrCode,
  Award,
  Network,
  Code2,
  Lock,
  Brain,
  Globe2,
  Radio,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ISFI Digital Campus — Institut Supérieur de Formation en Informatique" },
      { name: "description", content: "Plateforme officielle de l'ISFI : gestion académique, portails étudiants/enseignants et vérification publique des diplômes par QR Code." },
      { property: "og:title", content: "ISFI Digital Campus" },
      { property: "og:description", content: "Excellence, innovation et formation professionnelle. Vérifiez l'authenticité des diplômes ISFI en ligne." },
    ],
  }),
  component: HomePage,
});

const formations = [
  { icon: Network, name: "Administration Systèmes & Réseaux", desc: "Infrastructure, virtualisation et supervision réseau." },
  { icon: Code2, name: "Génie Logiciel", desc: "Architecture logicielle, agilité, qualité et tests." },
  { icon: Lock, name: "Cybersécurité", desc: "Sécurité offensive, défensive et gouvernance SSI." },
  { icon: Brain, name: "Intelligence Artificielle", desc: "Machine learning, deep learning et data science." },
  { icon: Globe2, name: "Développement Web", desc: "Frontend moderne, backend scalable et cloud." },
  { icon: Radio, name: "Télécommunications", desc: "Réseaux mobiles, fibre optique et IoT." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--gradient-hero)] text-primary-foreground">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.95 0.12 82) 0, transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.7 0.18 250) 0, transparent 45%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Plateforme officielle
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Institut Supérieur de <span className="text-gold">Formation en Informatique</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
              Excellence, Innovation et Formation Professionnelle. Une plateforme universitaire complète pour gérer les
              études et vérifier l'authenticité de chaque diplôme délivré.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/verification"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--gradient-gold)] px-5 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] hover:opacity-95 transition-opacity"
              >
                <ShieldCheck className="h-4 w-4" /> Vérifier un diplôme
              </Link>
              <a
                href="#formations"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-white/10 transition-colors"
              >
                <GraduationCap className="h-4 w-4" /> Candidater
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-primary-foreground/90 hover:text-gold transition-colors"
              >
                Espace étudiant <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                { k: "15+", v: "Années d'excellence" },
                { k: "6", v: "Filières d'expertise" },
                { k: "100%", v: "Diplômes vérifiables" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-3xl font-bold text-gold">{s.k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/70">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-6 rounded-3xl bg-gold/15 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-md shadow-[var(--shadow-elegant)]">
              <img src={logo.url} alt="Logo ISFI" className="mx-auto h-56 w-auto drop-shadow-2xl" />
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                  <QrCode className="h-5 w-5 text-gold" />
                  <p className="mt-2 font-semibold">QR Code unique</p>
                  <p className="text-primary-foreground/70">Sur chaque diplôme</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                  <Award className="h-5 w-5 text-gold" />
                  <p className="mt-2 font-semibold">Signature numérique</p>
                  <p className="text-primary-foreground/70">Authenticité garantie</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification banner */}
      <section className="border-y border-border bg-secondary/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-primary">Vérification publique des diplômes</p>
              <p className="text-sm text-muted-foreground">Employeurs et institutions : confirmez un diplôme en quelques secondes.</p>
            </div>
          </div>
          <Link
            to="/verification"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Vérifier maintenant <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Formations */}
      <section id="formations" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Nos filières</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
            Six pôles d'expertise pour bâtir votre carrière
          </h2>
          <p className="mt-4 text-muted-foreground">
            Des cursus professionnalisants alignés sur les standards internationaux et les besoins du marché.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((f) => (
            <article
              key={f.name}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-primary">{f.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-gold transition-colors">
                Découvrir <ArrowRight className="h-4 w-4" />
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Why verify */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Authenticité</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
              Chaque diplôme ISFI est vérifiable en ligne
            </h2>
            <p className="mt-4 text-muted-foreground">
              Notre plateforme délivre des diplômes sécurisés, signés numériquement et accompagnés d'un QR Code unique.
              Un scan suffit pour confirmer l'identité du diplômé, la filière et la mention obtenue.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Numéro unique par diplôme (ex : ISFI-2017-150129)",
                "QR Code redirigeant vers la page officielle",
                "Cachet et signature électroniques",
                "Filigrane ISFI et archivage numérique sécurisé",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-success" />
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Diplôme</p>
                  <p className="font-display text-xl font-semibold text-primary">ISFI-2017-150129</p>
                </div>
                <div className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  ✓ Authentique
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <Field label="Nom" value="CHEIKH MBACKE KHARMA" />
                <Field label="Année" value="2016 — 2017" />
                <Field label="Diplôme" value="Licence (Bac+3)" />
                <Field label="Mention" value="Bien" />
                <Field label="Option" value="Admin. Systèmes & Réseaux" />
                <Field label="Établissement" value="ISFI" />
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-xl border border-dashed border-border bg-secondary/60 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <QrCode className="h-8 w-8" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scannez le QR Code pour accéder à la page officielle de vérification du diplôme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
