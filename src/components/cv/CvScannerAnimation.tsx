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
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* CV Document mockup */}
        <div className="relative mx-auto w-64">
          {/* Document background */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Document header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground truncate">{cvTitle}</span>
              </div>
            </div>

            {/* Document content lines */}
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-2 bg-gray-100 dark:bg-gray-700 rounded"
                  style={{ width: `${60 + Math.random() * 40}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                />
              ))}
            </div>

            {/* Scanning line effect */}
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Scan glow effect */}
            <motion.div
              className="absolute left-0 right-0 h-20 pointer-events-none"
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: "linear-gradient(180deg, transparent, rgba(var(--primary-rgb), 0.1), transparent)",
              }}
            />

            {/* Corner scan markers */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary" />
          </motion.div>

          {/* Pulse ring effect */}
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-primary/30"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>

        {/* Progress section */}
        <div className="mt-8 text-center">
          {/* Phase indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              {(() => {
                const Icon = scanPhases[currentPhase].icon;
                return (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </motion.div>
                );
              })()}
              <span className="text-sm font-medium text-foreground">
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
