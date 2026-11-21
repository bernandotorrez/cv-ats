import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  Lightbulb,
  ListChecks,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CvData } from "@/lib/cv-types";
import {
  GUIDE_GROUPS,
  evaluateCvGuide,
  guideLevel,
  type GuideItemId,
  type GuideItemResult,
} from "@/lib/cv-guide";

interface CvGuideWidgetProps {
  cvId: string;
  data: CvData;
  targetRole: string;
  activeSection: string;
  /**
   * Tampilkan form untuk section tertentu (`null` = field "Target posisi") dan siapkan entri
   * kosong bila daftarnya masih kosong. Dipanggil sebelum field difokuskan.
   */
  onOpenSection: (sectionId: string | null) => void;
}

const OPEN_KEY = "cvg:open";
const atsKey = (cvId: string) => `cvg:ats:${cvId}`;
const FLASH_CLASSES = ["ring-2", "ring-green-600", "ring-offset-2"];

function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* mode privat / storage diblokir: panduan tetap jalan tanpa persistensi */
  }
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isVisible = (el: HTMLElement) => el.getClientRects().length > 0;

/** Field panduan yang sedang terlihat (form desktop dan form mobile sama-sama ada di DOM). */
function findGuideField(keys: string[]): HTMLElement | null {
  const candidates: HTMLElement[] = [];
  for (const key of keys) {
    document
      .querySelectorAll<HTMLElement>(`[data-guide-field="${key}"]`)
      .forEach((el) => isVisible(el) && candidates.push(el));
  }
  const empty = candidates.find(
    (el) => (el as HTMLInputElement | HTMLTextAreaElement).value === "",
  );
  return empty ?? candidates[0] ?? null;
}

function StatusIcon({ item }: { item: GuideItemResult }) {
  if (item.done) {
    return (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-green-700 bg-green-700 text-white"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-6 w-6 shrink-0 rounded-full border-2",
        item.partial
          ? "border-amber-700 bg-[conic-gradient(var(--color-amber-700)_0_50%,white_50%_100%)]"
          : "border-gray-500 bg-white",
      )}
    />
  );
}

const statusText = (item: GuideItemResult) =>
  item.done ? "Selesai" : item.partial ? "Sebagian" : "Belum";

export function CvGuideWidget({
  cvId,
  data,
  targetRole,
  activeSection,
  onOpenSection,
}: CvGuideWidgetProps) {
  const [open, setOpen] = useState(false);
  const [atsViewed, setAtsViewed] = useState(false);
  const [openTips, setOpenTips] = useState<Set<GuideItemId>>(new Set());
  const [liveMessage, setLiveMessage] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const prevDone = useRef<Set<GuideItemId> | null>(null);

  // Pulihkan pilihan buka/tutup. Kunjungan pertama: terbuka di desktop, tertutup di layar kecil.
  useEffect(() => {
    const saved = readStore(OPEN_KEY);
    setOpen(saved === null ? window.matchMedia("(min-width: 1024px)").matches : saved === "1");
    setAtsViewed(readStore(atsKey(cvId)) === "1");
  }, [cvId]);

  // Langkah "Cek tampilan ATS" selesai begitu section ATS pernah dibuka.
  useEffect(() => {
    if (activeSection !== "ats") return;
    setAtsViewed(true);
    writeStore(atsKey(cvId), "1");
  }, [activeSection, cvId]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const guide = useMemo(
    () => evaluateCvGuide(data, targetRole, atsViewed),
    [data, targetRole, atsViewed],
  );
  const { percent, doneCount, total, next } = guide;
  const complete = percent === 100;

  // Umumkan perubahan status ke pembaca layar (tanpa mengumumkan kondisi awal).
  useEffect(() => {
    const now = new Set(guide.items.filter((i) => i.done).map((i) => i.id));
    const prev = prevDone.current;
    prevDone.current = now;
    if (!prev) return;
    const gained = guide.items.find((i) => now.has(i.id) && !prev.has(i.id));
    const lost = guide.items.find((i) => !now.has(i.id) && prev.has(i.id));
    if (gained) {
      setLiveMessage(
        complete
          ? "Semua langkah selesai. CV kamu lengkap."
          : `Langkah selesai: ${gained.title}. ${doneCount} dari ${total}.`,
      );
    } else if (lost) {
      setLiveMessage(`Langkah belum lengkap lagi: ${lost.title}.`);
    }
  }, [guide.items, complete, doneCount, total]);

  const setPanel = useCallback((next: boolean, moveFocus = true) => {
    setOpen(next);
    writeStore(OPEN_KEY, next ? "1" : "0");
    if (!moveFocus) return;
    // Tunggu panel muncul/hilang di DOM sebelum memindahkan fokus.
    window.requestAnimationFrame(() =>
      next ? titleRef.current?.focus() : launcherRef.current?.focus(),
    );
  }, []);

  const flash = useCallback((el: HTMLElement) => {
    window.clearTimeout(flashTimer.current);
    el.classList.add(...FLASH_CLASSES);
    flashTimer.current = window.setTimeout(() => el.classList.remove(...FLASH_CLASSES), 1800);
  }, []);

  const goTo = useCallback(
    (item: GuideItemResult) => {
      // Di layar kecil panel menutupi form, jadi tutup dulu.
      if (window.matchMedia("(max-width: 639px)").matches) setPanel(false, false);
      onOpenSection(item.sectionId);

      // Section & field dirender setelah state berubah: coba beberapa kali sampai muncul.
      let tries = 0;
      const attempt = () => {
        const el = findGuideField(item.fields);
        if (el) {
          el.scrollIntoView({
            block: "center",
            behavior: prefersReducedMotion() ? "auto" : "smooth",
          });
          el.focus({ preventScroll: true });
          flash(el);
        } else if (++tries < 12) {
          window.setTimeout(attempt, 50);
        }
      };
      window.setTimeout(attempt, 50);
    },
    [flash, onOpenSection, setPanel],
  );

  const toggleTip = (id: GuideItemId) =>
    setOpenTips((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });

  const circumference = 2 * Math.PI * 18;
  const launcherLabel = `Panduan CV, ${percent} persen selesai, ${doneCount} dari ${total} langkah`;

  return (
    <div className="print:hidden">
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[44] bg-gray-900/45 sm:hidden"
          onClick={() => setPanel(false, false)}
        />
      )}

      {/* ── Launcher ── */}
      <button
        ref={launcherRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="cv-guide-panel"
        aria-label={launcherLabel}
        onClick={() => setPanel(!open)}
        className={cn(
          "fixed right-3 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full border border-green-800 py-1.5 pl-1.5 pr-4 text-white shadow-xl shadow-green-900/30 transition-colors",
          "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] sm:right-6 lg:bottom-6",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2",
          complete ? "bg-green-900 hover:bg-green-950" : "bg-green-800 hover:bg-green-900",
        )}
      >
        <span aria-hidden="true" className="relative h-11 w-11 shrink-0">
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="4"
              stroke="rgba(255,255,255,.25)"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="#bbf7d0"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
              className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-display font-extrabold",
              percent >= 100 ? "text-[10.5px] tracking-tight" : "text-xs",
            )}
          >
            {percent}%
          </span>
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-display text-sm font-bold">Panduan CV</span>
          <span className="text-xs text-green-100">
            {complete ? "CV siap dikirim" : `${doneCount} dari ${total} selesai`}
          </span>
        </span>
      </button>

      {/* ── Panel ── */}
      {open && (
        <section
          id="cv-guide-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cv-guide-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setPanel(false);
            }
          }}
          className={cn(
            "fixed z-[45] flex flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl shadow-gray-900/25",
            "animate-in fade-in slide-in-from-bottom-3 duration-200 motion-reduce:animate-none",
            // Mobile: bottom sheet
            "inset-x-0 bottom-0 max-h-[82dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            // Tablet & desktop: kartu melayang di atas launcher
            "sm:inset-x-auto sm:right-6 sm:w-[392px] sm:rounded-2xl sm:pb-0",
            "sm:bottom-[calc(10rem+env(safe-area-inset-bottom))] sm:max-h-[min(680px,calc(100dvh-14rem))]",
            "lg:bottom-[5.75rem] lg:max-h-[min(680px,calc(100dvh-11rem))]",
          )}
        >
          <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-green-50 to-white p-4">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1 w-10 rounded bg-gray-300 sm:hidden"
            />
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white"
              >
                <ListChecks className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="cv-guide-title"
                  ref={titleRef}
                  tabIndex={-1}
                  className="font-display text-[17px] font-extrabold leading-tight text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                >
                  Panduan CV Bagus
                </h2>
                <p className="mt-0.5 text-[13px] text-gray-700">{guideLevel(percent)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanel(false)}
                aria-label="Tutup panduan"
                className="-mr-1.5 -mt-1.5 inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <p
                aria-hidden="true"
                className="min-w-[4.25rem] font-display text-3xl font-extrabold leading-none text-green-800"
              >
                {percent}
                <span className="text-base">%</span>
              </p>
              <div
                role="progressbar"
                aria-label="Kelengkapan CV"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${doneCount} dari ${total} langkah selesai`}
                className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-200 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-green-600 to-green-700 transition-[width] duration-500 motion-reduce:transition-none forced-colors:bg-[Highlight]"
                  style={{ width: `${percent}%` }}
                />
                <span aria-hidden="true" className="absolute inset-0 grid grid-cols-10">
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} className="border-r-2 border-white/90" />
                  ))}
                </span>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-700">
              {complete ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5" /> Semua langkah selesai
                </>
              ) : (
                <>
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  {doneCount} dari {total} langkah · sekitar {guide.remainingMinutes} menit lagi
                </>
              )}
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-3.5">
            {/* Langkah berikutnya / selesai */}
            {next ? (
              <section
                aria-labelledby="cv-guide-next"
                className="mb-4 rounded-2xl border-2 border-green-700 bg-green-50 p-3.5"
              >
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-green-800">
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /> Langkah berikutnya
                </p>
                <h3
                  id="cv-guide-next"
                  className="mb-1 mt-1.5 font-display text-base font-bold leading-snug text-gray-900"
                >
                  {next.title}
                </h3>
                <p className="mb-3 text-[13px] text-gray-700">
                  {next.hint.split(". ")[0].replace(/\.$/, "")}.
                </p>
                <button
                  type="button"
                  onClick={() => goTo(next)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-green-700 px-4 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                >
                  {next.id === "ats" ? "Buka tampilan ATS" : "Isi sekarang"}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </section>
            ) : (
              <section
                aria-labelledby="cv-guide-done"
                className="mb-4 rounded-2xl border-2 border-green-700 bg-gradient-to-br from-green-100 to-white p-3.5"
              >
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-green-800">
                  <Trophy
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-in zoom-in-50 duration-500 motion-reduce:animate-none"
                  />
                  Selesai
                </p>
                <h3
                  id="cv-guide-done"
                  className="mb-1 mt-1.5 font-display text-base font-bold text-gray-900"
                >
                  CV kamu sudah lengkap!
                </h3>
                <p className="mb-3 text-[13px] text-gray-700">
                  Semua langkah inti selesai. Minta AI HR meninjau CV-mu, lalu unduh dan mulai
                  melamar.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/cv-review/$cvId"
                    params={{ cvId }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                  >
                    <Sparkles aria-hidden="true" className="h-4 w-4" /> Review AI
                  </Link>
                  <Link
                    to="/score/$cvId"
                    params={{ cvId }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                  >
                    <BarChart3 aria-hidden="true" className="h-4 w-4" /> Skor ATS
                  </Link>
                </div>
              </section>
            )}

            {/* Checklist */}
            {GUIDE_GROUPS.map((groupName, gi) => {
              const rows = guide.items.filter((i) => i.group === gi);
              if (rows.length === 0) return null;
              const groupDone = rows.filter((r) => r.done).length;
              return (
                <div key={groupName}>
                  <h3
                    id={`cv-guide-g${gi}`}
                    className="mb-1.5 mt-3.5 flex items-center justify-between font-display text-xs font-extrabold uppercase tracking-wider text-gray-700"
                  >
                    {groupName}
                    <span className="font-bold normal-case tracking-normal text-gray-600">
                      {groupDone}/{rows.length}
                    </span>
                  </h3>
                  <ul aria-labelledby={`cv-guide-g${gi}`} className="flex flex-col gap-1.5">
                    {rows.map((item) => {
                      const tipOpen = openTips.has(item.id);
                      const isNext = next?.id === item.id;
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "rounded-xl border bg-white",
                            isNext ? "border-green-600" : "border-gray-200",
                          )}
                        >
                          <h4>
                            <button
                              type="button"
                              aria-expanded={tipOpen}
                              aria-controls={`cv-guide-tip-${item.id}`}
                              onClick={() => toggleTip(item.id)}
                              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
                            >
                              <StatusIcon item={item} />
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    item.done ? "text-gray-700" : "text-gray-900",
                                  )}
                                >
                                  <span className="sr-only">{statusText(item)}: </span>
                                  {item.title}
                                  {item.optional && (
                                    <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                                      Opsional
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    item.warn ? "text-amber-800" : "text-gray-600",
                                  )}
                                >
                                  {item.meta}
                                </span>
                              </span>
                              {!item.done && (
                                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-gray-600">
                                  <Clock aria-hidden="true" className="h-3 w-3" />
                                  {item.minutes} mnt
                                </span>
                              )}
                              <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                  "h-4 w-4 shrink-0 text-gray-600 transition-transform motion-reduce:transition-none",
                                  tipOpen && "rotate-180",
                                )}
                              />
                            </button>
                          </h4>
                          <div
                            id={`cv-guide-tip-${item.id}`}
                            hidden={!tipOpen}
                            className="px-3 pb-3 pl-12 text-[13px] text-gray-700"
                          >
                            <p className="mb-2">{item.hint}</p>
                            <p className="mb-2 rounded-r-lg border-l-[3px] border-green-600 bg-gray-50 px-2.5 py-2 text-gray-800">
                              <strong>Contoh:</strong> {item.example}
                            </p>
                            <button
                              type="button"
                              onClick={() => goTo(item)}
                              className={cn(
                                "inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2",
                                item.done
                                  ? "border border-gray-200 bg-white text-gray-800 hover:border-green-700 hover:bg-green-50"
                                  : "bg-green-700 text-white hover:bg-green-800",
                              )}
                            >
                              {item.done ? "Ubah bagian ini" : "Isi bagian ini"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <footer className="flex shrink-0 items-start gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-700">
            <Lightbulb aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-amber-700" />
            <span>Checklist terisi otomatis dari isi CV kamu. Tidak perlu dicentang manual.</span>
          </footer>
        </section>
      )}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </div>
  );
}
