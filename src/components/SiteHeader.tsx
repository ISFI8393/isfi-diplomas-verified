import { Link } from "@tanstack/react-router";
import logo from "@/assets/isfi-logo.png.asset.json";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="ISFI" className="h-10 w-auto" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold text-primary">ISFI Digital Campus</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Institut Supérieur de Formation en Informatique</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-foreground/80">
          <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
          <Link to="/verification" className="hover:text-primary transition-colors">Vérifier un diplôme</Link>
          <a href="#formations" className="hover:text-primary transition-colors">Formations</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/verification"
            className="hidden sm:inline-flex items-center rounded-md border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Vérifier
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-[var(--gradient-gold)] px-3.5 py-2 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] hover:opacity-90 transition-opacity"
          >
            Espace étudiant
          </Link>
        </div>
      </div>
    </header>
  );
}
