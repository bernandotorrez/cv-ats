import { Link } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Buyer = {
  name: string;
  role: string;
  avatar: string;
};

const buyers = [
  {
    name: "Devi R***",
    role: "Fresh Graduate",
    avatar: "DR",
  },
  {
    name: "Rangga P***",
    role: "Career Switcher",
    avatar: "RP",
  },
  {
    name: "Maya A***",
    role: "Admin Staff",
    avatar: "MA",
  },
  {
    name: "Fajar N***",
    role: "Software Engineer",
    avatar: "FN",
  },
  {
    name: "Nadia S***",
    role: "Marketing Specialist",
    avatar: "NS",
  },
  {
    name: "Putri K***",
    role: "Finance Officer",
    avatar: "PK",
  },
  {
    name: "Bima W***",
    role: "Data Analyst",
    avatar: "BW",
  },
  {
    name: "Intan L***",
    role: "HR Generalist",
    avatar: "IL",
  },
  {
    name: "Yoga T***",
    role: "Project Manager",
    avatar: "YT",
  },
  {
    name: "Alya M***",
    role: "Content Creator",
    avatar: "AM",
  },
  {
    name: "Dimas H***",
    role: "Sales Executive",
    avatar: "DH",
  },
  {
    name: "Siska V***",
    role: "Customer Support",
    avatar: "SV",
  },
  {
    name: "Arif B***",
    role: "Operations Staff",
    avatar: "AB",
  },
  {
    name: "Citra Y***",
    role: "Graphic Designer",
    avatar: "CY",
  },
  {
    name: "Reza F***",
    role: "Backend Developer",
    avatar: "RF",
  },
  {
    name: "Laras D***",
    role: "Account Executive",
    avatar: "LD",
  },
  {
    name: "Kevin J***",
    role: "Product Analyst",
    avatar: "KJ",
  },
  {
    name: "Tiara C***",
    role: "Teacher",
    avatar: "TC",
  },
  {
    name: "Hendra G***",
    role: "Procurement Staff",
    avatar: "HG",
  },
  {
    name: "Mira Q***",
    role: "Business Admin",
    avatar: "MQ",
  },
] as const satisfies readonly Buyer[];

const tiers = ["Starter", "Pro"] as const;

// Waktu tampil acak (ms). Kartu muncul berulang selama pengunjung masih di halaman publik,
// dibatasi MAX_PER_SESSION supaya tidak mengganggu.
const FIRST_DELAY_MS: [number, number] = [3_000, 10_000];
const GAP_MS: [number, number] = [20_000, 50_000];
const VISIBLE_MS: [number, number] = [5_500, 8_000];
const MAX_PER_SESSION = 5;
const COUNT_KEY = "cvp_fake_buyer_count";
const DISMISSED_KEY = "cvp_fake_buyer_dismissed";

function between([min, max]: [number, number]) {
  return Math.round(min + Math.random() * (max - min));
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore storage failures (private browsing, disabled storage)
  }
}

export function FakeBuyerCard({ disabled = false }: { disabled?: boolean }) {
  const [dismissed, setDismissed] = useState(() => readSession(DISMISSED_KEY) === "1");
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [tier, setTier] = useState<(typeof tiers)[number]>("Starter");
  const [visible, setVisible] = useState(false);
  const [visibleMs, setVisibleMs] = useState(VISIBLE_MS[0]);
  const lastBuyerRef = useRef<string | null>(null);

  const shouldShow = !disabled && !dismissed;

  // Dijadwalkan ulang setiap `disabled`/`dismissed` berubah: kartu tidak lagi "mati" hanya karena
  // halaman pertama yang dibuka kebetulan halaman yang menonaktifkannya.
  useEffect(() => {
    if (!shouldShow) {
      setVisible(false);
      return;
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let cancelled = false;

    const scheduleNext = (delay: number) => {
      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        const shown = Number(readSession(COUNT_KEY) ?? "0");
        if (shown >= MAX_PER_SESSION) return;

        // Hindari nama yang sama dua kali berturut-turut
        let next = pickRandom(buyers);
        for (let i = 0; i < 5 && next.name === lastBuyerRef.current; i++) next = pickRandom(buyers);
        lastBuyerRef.current = next.name;

        const duration = between(VISIBLE_MS);
        setBuyer(next);
        setTier(pickRandom(tiers));
        setVisibleMs(duration);
        setVisible(true);
        writeSession(COUNT_KEY, String(shown + 1));

        hideTimer = window.setTimeout(() => {
          setVisible(false);
          scheduleNext(between(GAP_MS));
        }, duration);
      }, delay);
    };

    scheduleNext(between(FIRST_DELAY_MS));

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      setVisible(false);
    };
  }, [shouldShow]);

  const handleDismiss = () => {
    writeSession(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const productName = useMemo(() => `CV Pintar ${tier}`, [tier]);

  const show = shouldShow && buyer !== null && visible;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {show && buyer && (
          <motion.aside
            key="buyer-card"
            aria-label="Notifikasi pembelian paket"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm print:hidden md:bottom-6 md:left-6"
          >
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/15">
              <div className="flex items-start gap-3 p-4 pr-3">
                <div
                  aria-hidden="true"
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-base font-extrabold text-white ring-4 ring-green-100"
                >
                  {buyer.avatar}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-gray-950 ring-2 ring-white">
                    <ShoppingBag className="h-3 w-3" />
                  </span>
                </div>

                <div role="status" className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {buyer.name}
                    <span className="font-medium text-gray-600"> · {buyer.role}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">Baru saja membeli paket</p>
                  <p className="mt-1 font-display text-base font-extrabold text-green-800">
                    {productName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Tutup notifikasi pembelian"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <Link
                to="/harga"
                className="group flex items-center justify-between gap-2 border-t border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-800 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
              >
                Lihat paket
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>

              {/* Sisa waktu tampil */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left bg-green-700"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: visibleMs / 1000, ease: "linear" }}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
