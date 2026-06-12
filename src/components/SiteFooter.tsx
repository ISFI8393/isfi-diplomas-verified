import logo from "@/assets/isfi-logo.png.asset.json";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-24 border-t border-border bg-[var(--gradient-navy)] text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logo.url} alt="ISFI" className="h-12 w-auto rounded bg-white/95 p-1" />
              <div>
                <p className="font-display text-lg font-semibold">ISFI</p>
                <p className="text-xs text-primary-foreground/70">Institut Supérieur de Formation en Informatique</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm text-primary-foreground/75">
              Excellence, innovation et formation professionnelle au service des futurs leaders du numérique en Afrique.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-gold">Plateforme</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/verification" className="hover:text-gold">Vérifier un diplôme</Link></li>
              <li><a href="#formations" className="hover:text-gold">Formations</a></li>
              <li><a href="#" className="hover:text-gold">Candidater</a></li>
              <li><a href="#" className="hover:text-gold">Espace étudiant</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-gold">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              <li>Dakar, Sénégal</li>
              <li>contact@isfi.sn</li>
              <li>+221 33 000 00 00</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Institut Supérieur de Formation en Informatique — Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
