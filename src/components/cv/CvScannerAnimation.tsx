/**
 * CV Scanner Animation
 * QR Code-like scanning animation for CV review loading state
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FileText, Search, CheckCircle2, Sparkles } from "lucide-react";

interface CvScannerAnimationProps {
  cvTitle: string;
  onComplete?: () => void;
}

const scanPhases = [
  { icon: FileText, text: "Membaca struktur CV...", duration: 2000 },
  { icon: Search, text: "Menganalisis konten & format...", duration: 2500 },
  { icon: Brain, text: "Evaluasi dari sudut pandang HR...", duration: 3000 },
  { icon: Sparkles, text: "Menyiapkan rekomendasi...", duration: 2000 },
];

export function CvScannerAnimation({ cvTitle }: CvScannerAnimationProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = scanPhases.reduce((acc, p) => acc + p.duration, 0);
    const startTime = Date.now();
    let phaseIndex = 0;
    let phaseStartTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const phaseElapsed = Date.now() - phaseStartTime;
      
      // Update progress
      setProgress(Math.min((elapsed / totalDuration) * 100, 95));

      // Check if we need to move to next phase
      if (phaseIndex < scanPhases.length - 1 && phaseElapsed >= scanPhases[phaseIndex].duration) {
        phaseIndex++;
        phaseStartTime = Date.now();
        setCurrentPhase(phaseIndex);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--primary-rgb), 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--primary-rgb), 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/30"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: 0,
            }}
            animate={{
              x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
              y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main scanner card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl mx-auto px-4"
      >
        {/* CV Document mockup (Enlarged) */}
        <div className="relative mx-auto w-full max-w-md">
          {/* Document background */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-border/80"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Document header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-base font-bold text-foreground block truncate">{cvTitle}</span>
                  <span className="text-xs text-muted-foreground">Scanning CV Document...</span>
                </div>
              </div>
            </div>

            {/* Document content lines (Realistic CV skeleton layout) */}
            <div className="p-6 space-y-4">
              <div className="space-y-2 pb-3 border-b border-border/40">
                <div className="h-4 bg-primary/20 rounded-md w-1/2" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4" />
              </div>
              
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-md w-1/4" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-full" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-11/12" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-4/5" />
              </div>

              <div className="space-y-2 pt-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-md w-1/3" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-full" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-5/6" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-md w-3/4" />
              </div>
            </div>

            {/* Scanning line effect */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]"
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Scan glow effect */}
            <motion.div
              className="absolute left-0 right-0 h-28 pointer-events-none"
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: "linear-gradient(180deg, transparent, rgba(var(--primary-rgb), 0.15), transparent)",
              }}
            />

            {/* Corner scan markers */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-sm" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-sm" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-sm" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-sm" />
          </motion.div>

          {/* Pulse ring effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/30"
            animate={{
              scale: [1, 1.04, 1],
              opacity: [0.6, 0.1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>

        {/* Progress section */}
        <div className="mt-8 text-center max-w-sm mx-auto">
          {/* Phase indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              {(() => {
                const Icon = scanPhases[currentPhase].icon;
                return (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                );
              })()}
              <span className="text-sm font-semibold text-foreground">
                {scanPhases[currentPhase].text}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "500%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Phase dots */}
          <div className="flex justify-center gap-2 mt-4">
            {scanPhases.map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i <= currentPhase ? "bg-primary" : "bg-muted"
                }`}
                animate={i === currentPhase ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>

          {/* HR persona badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <span className="text-xs font-bold text-white">HA</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Hira AI</p>
              <p className="text-[10px] text-muted-foreground">HR Expert • 20+ tahun</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
