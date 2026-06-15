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

      {/* Hero — Prestige académique */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-[#001B3D] text-white">
        {/* Decorative radial gradient */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, #002D62 0%, #001B3D 55%, #000F24 100%)",
          }}
        />
        {/* Academic grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
          <svg className="h-full w-full" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="academic-grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" stroke="white" strokeWidth="0.08" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#academic-grid)" />
          </svg>
        </div>
        {/* Soft gold glow */}
        <div className="absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-[#C5A059]/10 blur-[140px]" aria-hidden />
        <div className="absolute -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-[#002D62]/40 blur-[120px]" aria-hidden />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-12 lg:py-28">
          {/* Text */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-6 duration-1000">
            <span className="inline-flex items-center gap-3 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C5A059] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C5A059]" />
              </span>
              Plateforme officielle
            </span>

            <h1 className="font-display text-5xl font-black leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              Institut Supérieur de <br />
              <span className="text-[#C5A059]">Formation en Informatique</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-blue-100/70">
              L'excellence académique au service de l'innovation technologique. Rejoignez l'institution
              de référence pour les futurs experts du numérique.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#formations"
                className="inline-flex items-center gap-2 rounded-sm bg-[#C5A059] px-8 py-4 text-sm font-bold text-[#001B3D] shadow-xl shadow-[#C5A059]/20 transition-all hover:-translate-y-0.5 hover:bg-[#B38E46]"
              >
                <GraduationCap className="h-4 w-4" /> Candidater
              </a>
              <Link
                to="/verification"
                className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/10"
              >
                <ShieldCheck className="h-4 w-4" /> Vérifier un diplôme
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-2 py-4 text-sm font-medium text-blue-200/80 underline decoration-[#C5A059]/40 decoration-2 underline-offset-8 transition-colors hover:text-white"
              >
                Espace étudiant <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-3 gap-8 border-t border-white/10 pt-12">
              {[
                { k: "15+", v: "Années d'expertise" },
                { k: "6", v: "Pôles de formation" },
                { k: "100%", v: "Diplômes vérifiables" },
              ].map((s, i) => (
                <div
                  key={s.v}
                  className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{ animationDuration: "900ms", animationDelay: `${400 + i * 120}ms` }}
                >
                  <dt className="font-display text-3xl font-bold text-[#C5A059]">{s.k}</dt>
                  <dd className="mt-1 text-[10px] uppercase tracking-[0.2em] text-blue-200/50">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Seal card */}
          <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="absolute -inset-6 rounded-3xl bg-[#C5A059]/10 blur-3xl" aria-hidden />
            <div className="relative rounded-lg bg-white p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] transition-transform duration-700 lg:rotate-2 lg:hover:rotate-0">
              <div className="pointer-events-none absolute inset-4 rounded border border-[#001B3D]/5" />
              <img src={logo.url} alt="Sceau ISFI" className="mx-auto h-44 w-auto" />
              <p className="mt-8 border-t border-[#001B3D]/10 pt-6 text-center font-display text-[10px] font-bold uppercase tracking-[0.3em] text-[#001B3D]">
                Sceau de Certification Officiel
              </p>
            </div>

            {/* QR mini card */}
            <div className="absolute -bottom-8 -left-8 rotate-[-6deg] rounded-md border border-slate-100 bg-white p-4 shadow-2xl transition-transform hover:rotate-[-2deg]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[#001B3D] text-[#C5A059]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Authentification</p>
                  <p className="text-xs font-bold text-[#001B3D]">QR Code Sécurisé</p>
                </div>
              </div>
            </div>

            {/* Signature mini card */}
            <div className="absolute -top-6 -right-6 rotate-12 rounded-md bg-[#C5A059] p-4 shadow-2xl transition-transform hover:rotate-6">
              <div className="flex items-center gap-3 text-[#001B3D]">
                <Award className="h-5 w-5" />
                <p className="text-xs font-bold">Signature Numérique</p>
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
