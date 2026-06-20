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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div>
          <p className="font-medium text-sm">Mengekstrak teks dari CV...</p>
          <p className="text-xs text-muted-foreground mt-1">{currentFile?.name}</p>
        </div>
      </div>
    );
  }

  if (currentFile && !error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(currentFile.size / 1024).toFixed(0)} KB ·{" "}
            {currentFile.name.endsWith(".pdf") ? "PDF" : "DOCX"}
          </p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  const displayError = validationError || error;

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all",
          dragOver
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">Seret & lepas CV kamu di sini</p>
          <p className="text-xs text-muted-foreground mt-1">PDF atau DOCX · Maks 10MB</p>
        </div>
        <span className="text-xs text-primary font-medium">atau klik untuk pilih file</span>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
          <FileWarning className="h-4 w-4 shrink-0" />
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
