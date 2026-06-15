import logo from "@/assets/isfi-logo.png.asset.json";
import { Link } from "@tanstack/react-router";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-white/5 bg-[#000F24] pb-12 pt-24 text-white"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white p-1.5">
                <img src={logo.url} alt="ISFI" className="h-full w-auto" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                ISFI Campus
              </span>
            </div>
            <p className="text-sm leading-relaxed text-blue-100/40">
              L'excellence académique au cœur de l'innovation. Préparer aujourd'hui les leaders
              technologiques de demain.
            </p>
          </div>

          {/* Plateforme */}
          <div>
            <h4 className="mb-8 font-display text-lg font-bold text-[#C5A059]">Plateforme</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/" className="text-blue-100/50 transition-colors hover:text-white">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/verification" className="text-blue-100/50 transition-colors hover:text-white">
                  Vérifier un diplôme
                </Link>
              </li>
              <li>
                <a href="/#formations" className="text-blue-100/50 transition-colors hover:text-white">
                  Formations
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100/50 transition-colors hover:text-white">
                  Espace étudiant
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-8 font-display text-lg font-bold text-[#C5A059]">Contact</h4>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]/60" />
                <span className="leading-relaxed text-blue-100/50">Dakar, Sénégal</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="h-4 w-4 shrink-0 text-[#C5A059]/60" />
                <a
                  href="mailto:contact@isfi.sn"
                  className="text-blue-100/50 transition-colors hover:text-white"
                >
                  contact@isfi.sn
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="h-4 w-4 shrink-0 text-[#C5A059]/60" />
                <span className="text-blue-100/50">+221 33 000 00 00</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-8 font-display text-lg font-bold text-[#C5A059]">Newsletter</h4>
            <p className="mb-4 text-[10px] uppercase tracking-widest text-blue-100/40">
              Actualités académiques
            </p>
            <form
              className="flex"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label htmlFor="footer-newsletter" className="sr-only">
                Email
              </label>
              <input
                id="footer-newsletter"
                type="email"
                placeholder="Email"
                className="w-full rounded-l-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-colors placeholder:text-white/30 focus:border-[#C5A059]/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="S'abonner"
                className="rounded-r-sm bg-[#C5A059] px-4 text-[#001B3D] transition-colors hover:bg-[#B38E46]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 md:flex-row">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/30">
            © {new Date().getFullYear()} Institut Supérieur de Formation en Informatique. Tous droits réservés.
          </p>
          <div className="flex gap-10 text-[10px] uppercase tracking-widest text-blue-100/30">
            <a href="#" className="transition-colors hover:text-[#C5A059]">
              Légal
            </a>
            <a href="#" className="transition-colors hover:text-[#C5A059]">
              Confidentialité
            </a>
            <a href="#" className="transition-colors hover:text-[#C5A059]">
              Accessibilité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
