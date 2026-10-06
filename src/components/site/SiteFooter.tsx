import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, Clock, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { APP_VERSION } from "@/lib/app-version";

const WHATSAPP_URL = "https://wa.me/6285190607141";
const EMAIL = "cs@cvpintar.web.id";

type FooterLink = { to: string; label: string };

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Produk",
    links: [
      { to: "/fitur", label: "Fitur" },
      { to: "/template", label: "Template" },
      { to: "/lowongan", label: "Lowongan Pekerjaan" },
      { to: "/private-coaching", label: "Private Mentoring" },
      { to: "/harga", label: "Harga" },
    ],
  },
  {
    title: "Belajar",
    links: [
      { to: "/panduan-cv-ats", label: "Panduan CV ATS" },
      { to: "/tips-interview", label: "Tips Interview" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { to: "/tentang", label: "Tentang" },
      { to: "/kontak", label: "Kontak" },
      { to: "/changelog", label: "Changelog" },
    ],
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { to: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { to: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { user } = useAuth();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-gray-800 bg-gray-950 text-gray-300 print:hidden">
      <div className="container-page pb-8 pt-14 md:pt-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand + CTA */}
          <div className="flex flex-col items-start gap-5 lg:col-span-4">
            <Link
              to="/"
              aria-label="CV Pintar, ke beranda"
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <img
                src="/apple-touch-icon.png"
                alt=""
                className="h-9 w-9 rounded-full object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="font-display text-xl font-extrabold text-white">
                <span className="text-green-500">CV</span> PINTAR
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-300">
              Buat CV profesional yang lolos ATS, lacak lamaran, dan tingkatkan peluang kariermu
              dari satu tempat.
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 text-sm font-extrabold text-gray-950 shadow-lg shadow-black/20 transition-colors hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {user ? "Ke Dashboard" : "Buat CV Gratis"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          {/* Tautan */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-5"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  {col.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-1">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="inline-flex min-h-8 items-center rounded text-sm text-gray-300 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bantuan */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Butuh bantuan?
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-event="click_whatsapp"
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-green-600 hover:bg-gray-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-green-400" />
                  Chat WhatsApp
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-green-600 hover:bg-gray-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-green-400" />
                  <span className="min-w-0 truncate">{EMAIL}</span>
                </a>
              </li>
            </ul>
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gray-400">
              <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Senin–Jumat, 09.00–18.00 WIB
            </p>
          </div>
        </div>

        {/* Bar bawah */}
        <div className="mt-12 flex flex-col gap-4 border-t border-gray-800 pt-6 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>© {year} CV Pintar. Seluruh hak cipta dilindungi.</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="inline-flex min-h-8 items-center rounded underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/changelog"
              className="inline-flex min-h-8 items-center rounded-full border border-gray-700 px-2.5 text-xs font-semibold text-gray-300 transition-colors hover:border-green-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              {APP_VERSION}
            </Link>
            <button
              type="button"
              onClick={handleScrollToTop}
              aria-label="Kembali ke atas"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <ArrowUp aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
