import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Buyer = {
  name: string;
  role: string;
  accent: string;
  avatar: string;
};

const buyers = [
  {
    name: "Devi R***",
    role: "Fresh Graduate",
    accent: "from-sky-500 to-emerald-400",
    avatar: "DR",
  },
  {
    name: "Rangga P***",
    role: "Career Switcher",
    accent: "from-violet-500 to-cyan-400",
    avatar: "RP",
  },
  {
    name: "Maya A***",
    role: "Admin Staff",
    accent: "from-rose-500 to-amber-400",
    avatar: "MA",
  },
  {
    name: "Fajar N***",
    role: "Software Engineer",
    accent: "from-primary to-teal-400",
    avatar: "FN",
  },
  {
    name: "Nadia S***",
    role: "Marketing Specialist",
    accent: "from-indigo-500 to-lime-400",
    avatar: "NS",
  },
  {
    name: "Putri K***",
    role: "Finance Officer",
    accent: "from-cyan-500 to-blue-500",
    avatar: "PK",
  },
  {
    name: "Bima W***",
    role: "Data Analyst",
    accent: "from-amber-500 to-pink-500",
    avatar: "BW",
  },
  {
    name: "Intan L***",
    role: "HR Generalist",
    accent: "from-emerald-500 to-lime-400",
    avatar: "IL",
  },
  {
    name: "Yoga T***",
    role: "Project Manager",
    accent: "from-blue-500 to-violet-500",
    avatar: "YT",
  },
  {
    name: "Alya M***",
    role: "Content Creator",
    accent: "from-fuchsia-500 to-rose-400",
    avatar: "AM",
  },
  {
    name: "Dimas H***",
    role: "Sales Executive",
    accent: "from-teal-500 to-sky-400",
    avatar: "DH",
  },
  {
    name: "Siska V***",
    role: "Customer Support",
    accent: "from-orange-500 to-yellow-400",
    avatar: "SV",
  },
  {
    name: "Arif B***",
    role: "Operations Staff",
    accent: "from-slate-600 to-cyan-400",
    avatar: "AB",
  },
  {
    name: "Citra Y***",
    role: "Graphic Designer",
    accent: "from-purple-500 to-pink-400",
    avatar: "CY",
  },
  {
    name: "Reza F***",
    role: "Backend Developer",
    accent: "from-green-500 to-emerald-400",
    avatar: "RF",
  },
  {
    name: "Laras D***",
    role: "Account Executive",
    accent: "from-red-500 to-orange-400",
    avatar: "LD",
  },
  {
    name: "Kevin J***",
    role: "Product Analyst",
    accent: "from-sky-600 to-indigo-400",
    avatar: "KJ",
  },
  {
    name: "Tiara C***",
    role: "Teacher",
    accent: "from-lime-500 to-teal-400",
    avatar: "TC",
  },
  {
    name: "Hendra G***",
    role: "Procurement Staff",
    accent: "from-yellow-500 to-emerald-400",
    avatar: "HG",
  },
  {
    name: "Mira Q***",
    role: "Business Admin",
    accent: "from-pink-500 to-violet-400",
    avatar: "MQ",
  },
] as const satisfies readonly Buyer[];

const tiers = ["Starter", "Pro"] as const;
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 10000;
const VISIBLE_DURATION_MS = 5000;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

export function FakeBuyerCard({ disabled = false }: { disabled?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [tier, setTier] = useState<(typeof tiers)[number]>("Starter");
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | undefined>(undefined);
  const hideTimerRef = useRef<number | undefined>(undefined);

  const shouldShow = !disabled && !dismissed;

  useEffect(() => {
    const clearTimers = () => {
      window.clearTimeout(showTimerRef.current);
      window.clearTimeout(hideTimerRef.current);
    };

    if (!shouldShow) {
      clearTimers();
      setVisible(false);
      return;
    }

    const scheduleNext = () => {
      showTimerRef.current = window.setTimeout(() => {
        setBuyer(pickRandom(buyers));
        setTier(pickRandom(tiers));
        setVisible(true);

        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false);
          scheduleNext();
        }, VISIBLE_DURATION_MS);
      }, randomDelay());
    };

    scheduleNext();

    return clearTimers;
  }, [shouldShow]);

  useEffect(() => {
    if (buyer) return;

    if (shouldShow) {
      setBuyer(pickRandom(buyers));
      setTier(pickRandom(tiers));
    }
  }, [buyer, shouldShow]);

  const productName = useMemo(() => `CV Pintar ${tier}`, [tier]);

  if (!shouldShow || !buyer || !visible) return null;

  return (
    <aside
      aria-label="Notifikasi pembelian paket"
      className="fixed bottom-5 left-4 z-50 w-[calc(100vw-2rem)] max-w-[31rem] print:hidden md:bottom-6 md:left-6"
    >
      <div className="overflow-hidden rounded-lg border border-border/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] ring-1 ring-black/5">
        <div className={cn("h-1.5 bg-gradient-to-r", buyer.accent)} />
        <div className="grid grid-cols-[3.4rem_1fr_auto] gap-3 px-4 py-4 sm:grid-cols-[4rem_1fr_auto] sm:gap-4 sm:px-5">
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-inner ring-4 ring-slate-100 sm:h-16 sm:w-16 sm:text-base",
              buyer.accent,
            )}
            aria-hidden="true"
          >
            {buyer.avatar}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate text-base font-bold leading-tight text-slate-950 sm:text-lg">
                {buyer.name}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {buyer.role}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">Baru saja membeli</p>

            <Link
              to="/harga"
              className="mt-2 flex max-w-full items-center gap-2 text-left text-base font-semibold leading-snug text-primary transition-colors hover:text-primary/80 sm:text-lg"
            >
              <BriefcaseBusiness className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{productName}</span>
            </Link>

            <Link
              to="/harga"
              className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100 hover:text-teal-800"
            >
              Lihat Paket
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Tutup notifikasi pembelian"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
