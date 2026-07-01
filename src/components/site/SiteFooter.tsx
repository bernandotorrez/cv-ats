import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate subscribe
    alert("Terima kasih telah berlangganan!");
    setEmail("");
  };

  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-900 pt-16 pb-8 print:hidden relative">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="flex items-center gap-2 font-display font-bold">
              <img
                src="/apple-touch-icon.png"
                alt="CV Pintar Logo"
                className="h-8 w-8 object-contain rounded-full"
              />
              <span className="flex items-center gap-1 font-display text-lg font-extrabold text-white">
                <span className="text-green-500">CV</span>
                <span>PINTAR</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Buat CV profesional, lacak lamaran, dan tingkatkan peluang kariermu.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-4 mt-2">
              <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FooterCol
              title="Produk"
              links={[
                { to: "/fitur", label: "Fitur" },
                { to: "/template", label: "Template" },
                { to: "/lowongan", label: "Lowongan Pekerjaan" },
                { to: "/private-coaching", label: "Private Mentoring" },
                { to: "/harga", label: "Harga" },
              ]}
            />
            <FooterCol
              title="Belajar"
              links={[
                { to: "/panduan-cv-ats", label: "Panduan CV ATS" },
                { to: "/tips-interview", label: "Tips Interview" },
                { to: "/blog", label: "Blog" },
              ]}
            />
            <FooterCol
              title="Perusahaan"
              links={[
                { to: "/tentang", label: "Tentang" },
                { to: "/changelog", label: "Changelog" },
                { to: "/kontak", label: "Kontak" },
                { to: "/kebijakan-privasi", label: "Kebijakan Privasi" },
                { to: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
              ]}
            />
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Dapatkan tips karir terbaru langsung ke email kamu.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Kamu"
                className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-700 flex-1 min-w-0"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-3 py-2 shrink-0"
              >
                Langganan
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom copyright & Scroll to top */}
        <div className="border-t border-gray-900 pt-8 flex items-center justify-between text-xs text-gray-500">
          <p>© 2026 CV Pintar. All rights reserved.</p>
          <button
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-800 shadow-lg transition-transform hover:-translate-y-1"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
        {title}
      </h3>
      <ul className="flex flex-col gap-2 text-xs">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
