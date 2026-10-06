import { useState, useRef, useCallback, type DragEvent } from "react";
import { Upload, FileText, X, Loader2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateCvFile } from "@/lib/cv-text-extractor";

type Props = {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  extracting?: boolean;
  error?: string | null;
  currentFile?: File | null;
  onClear?: () => void;
};

export function CvFileUpload({
  onFileReady,
  disabled = false,
  extracting = false,
  error = null,
  currentFile = null,
  onClear,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);
      const err = validateCvFile(file);
      if (err) {
        setValidationError(err);
        return;
      }
      onFileReady(file);
    },
    [onFileReady],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || extracting) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, extracting, handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = () => {
    if (disabled || extracting) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (extracting) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 p-10 text-center"
      >
        <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-green-700" />
        <div>
          <p className="font-bold text-gray-900">Membaca teks dari CV…</p>
          <p className="mt-1 break-all text-sm text-gray-600">{currentFile?.name}</p>
        </div>
      </div>
    );
  }

  if (currentFile && !error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-green-200 bg-green-50 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-700 ring-1 ring-green-200">
          <FileText aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{currentFile.name}</p>
          <p className="text-sm text-gray-600">
            {(currentFile.size / 1024).toFixed(0)} KB ·{" "}
            {currentFile.name.endsWith(".pdf") ? "PDF" : "DOCX"}
          </p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Hapus file"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  const displayError = validationError || error;

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Pilih file CV (PDF atau DOCX)"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 sm:p-12",
          dragOver
            ? "border-green-700 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-green-700 hover:bg-green-50/60",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-700 ring-1 ring-green-200">
          <Upload aria-hidden="true" className="h-7 w-7" />
        </span>
        <div>
          <p className="font-display text-base font-extrabold text-gray-900">
            Seret & lepas CV kamu di sini
          </p>
          <p className="mt-1 text-sm text-gray-600">PDF atau DOCX · maksimal 10MB</p>
        </div>
        <span className="inline-flex h-10 items-center rounded-xl bg-green-700 px-5 text-sm font-bold text-white">
          Pilih file
        </span>
      </div>

      {displayError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <FileWarning aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
