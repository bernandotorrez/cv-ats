import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/40 print:hidden">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-display font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              CV Pintar
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Bantu pelamar kerja Indonesia bikin CV yang lolos ATS dan menarik perhatian HR.
            </p>
          </div>

          <FooterCol
            title="Produk"
            links={[
              { to: "/fitur", label: "Fitur" },
              { to: "/template", label: "Template" },
              { to: "/private-coaching", label: "Private Coaching" },
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
              { to: "/kontak", label: "Kontak" },
              { to: "/kebijakan-privasi", label: "Kebijakan Privasi" },
              { to: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>© {year} CV Pintar. Semua hak dilindungi.</p>
          <p>Dibuat dengan ❤️ untuk pencari kerja di Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
