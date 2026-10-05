import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Palette,
  PanelLeft,
  PanelLeftClose,
  Save,
  Share2,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";
import { DownloadDropdown } from "@/components/cv/DownloadDropdown";
import { TEMPLATES, type TemplateId, type CvData } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";

interface EditorToolbarProps {
  id: string;
  title: string;
  onTitleChange: (v: string) => void;
  templateId: TemplateId;
  onOpenTemplatePicker: () => void;
  saveStatus: "idle" | "saving" | "saved" | "unsaved";
  onSave: () => void;
  saving: boolean;
  shareEnabled: boolean;
  shareGenerating: boolean;
  onToggleShare: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  showNav: boolean;
  onToggleNav: () => void;
  cvData: CvData;
  userTier: string;
  userId?: string;
  onOpenCvUpload: () => void;
  cvLanguage: CvUiLang;
  onLanguageChange: (lang: CvUiLang) => void;
}

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-50";
const iconBtnActive = "bg-green-700 text-white hover:bg-green-800 hover:text-white";

function SaveStatus({ status }: { status: EditorToolbarProps["saveStatus"] }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-gray-600">
        <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" /> Menyimpan…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-green-800">
        <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> Tersimpan
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
        <AlertCircle aria-hidden="true" className="h-3 w-3" /> Gagal simpan
      </span>
    );
  }
  return <span className="text-gray-600">Disimpan otomatis</span>;
}

export function LanguageSwitch({
  value,
  onChange,
  className,
}: {
  value: CvUiLang;
  onChange: (lang: CvUiLang) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Bahasa CV"
      className={cn("flex shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-0.5", className)}
    >
      {(["id", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          aria-pressed={value === lang}
          title={lang === "id" ? "CV Bahasa Indonesia" : "CV Bahasa Inggris"}
          className={cn(
            "h-8 min-w-9 rounded-[10px] px-2 text-xs font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
            value === lang
              ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
              : "text-gray-600 hover:text-gray-900",
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

export function EditorToolbar({
  id,
  title,
  onTitleChange,
  templateId,
  onOpenTemplatePicker,
  saveStatus,
  onSave,
  saving,
  shareEnabled,
  shareGenerating,
  onToggleShare,
  chatOpen,
  onToggleChat,
  showNav,
  onToggleNav,
  cvData,
  userTier,
  userId,
  onOpenCvUpload,
  cvLanguage,
  onLanguageChange,
}: EditorToolbarProps) {
  const templateName = TEMPLATES.find((t) => t.id === templateId)?.name || "Template";
  const isSaving = saving || saveStatus === "saving";

  return (
    <header className="z-30 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-2 sm:gap-3 sm:px-3 lg:px-4 print:hidden">
      {/* Back + logo */}
      <Link
        to="/cv"
        className={iconBtn}
        aria-label="Kembali ke daftar CV"
        title="Kembali ke daftar CV"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <Link to="/dashboard" className="hidden shrink-0 2xl:block" aria-label="Dashboard CV Pintar">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full"
        />
      </Link>

      {/* Title + save status */}
      <div className="min-w-0 flex-1 lg:w-48 lg:flex-none xl:w-60">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Judul CV"
          className="h-8 w-full truncate rounded-lg border-transparent bg-transparent px-2 font-display text-base font-bold text-gray-900 shadow-none hover:border-gray-200 focus-visible:border-green-700 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-green-700/20"
        />
        <p className="truncate px-2 text-xs" aria-live="polite">
          <SaveStatus status={saveStatus} />
        </p>
      </div>

      {/* Desktop: CV settings */}
      <div className="hidden items-center gap-2 lg:flex">
        <span aria-hidden="true" className="h-8 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onOpenTemplatePicker}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
          title="Ganti template"
        >
          <Palette aria-hidden="true" className="h-4 w-4 text-green-700" />
          <span className="max-w-24 truncate xl:max-w-none">{templateName}</span>
        </button>
        <LanguageSwitch value={cvLanguage} onChange={onLanguageChange} />
      </div>

      <div className="hidden flex-1 lg:block" />

      {/* Desktop: secondary actions */}
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          to="/cv-review/$cvId"
          params={{ cvId: id }}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-green-200 bg-green-50 px-3 text-sm font-bold text-green-800 transition-colors hover:border-green-700 hover:bg-green-100"
          title="Review CV dengan AI HR"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          <span className="hidden 2xl:inline">Review AI</span>
        </Link>
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={onToggleNav}
            className={iconBtn}
            aria-label={showNav ? "Sembunyikan panel edit" : "Tampilkan panel edit"}
            aria-pressed={!showNav}
            title={showNav ? "Fokus ke preview" : "Tampilkan panel edit"}
          >
            {showNav ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleShare}
            disabled={shareGenerating}
            className={cn(iconBtn, shareEnabled && iconBtnActive)}
            aria-label={shareEnabled ? "Link berbagi aktif" : "Bagikan CV"}
            aria-pressed={shareEnabled}
            title={shareEnabled ? "Link berbagi aktif" : "Bagikan CV"}
          >
            {shareGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleChat}
            className={cn(iconBtn, chatOpen && iconBtnActive)}
            aria-label="AI Chat"
            aria-pressed={chatOpen}
            title="AI Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <Link
            to="/tools"
            search={{ cvId: id }}
            className={iconBtn}
            aria-label="Tools CV"
            title="Tools CV"
          >
            <Wrench className="h-4 w-4" />
          </Link>
          <Link
            to="/score/$cvId"
            params={{ cvId: id }}
            className={iconBtn}
            aria-label="Skor ATS lengkap"
            title="Skor ATS lengkap"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile / tablet: language + more menu */}
      <LanguageSwitch
        value={cvLanguage}
        onChange={onLanguageChange}
        className="hidden sm:flex lg:hidden"
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(iconBtn, "h-10 w-10 border border-gray-200 lg:hidden")}
          aria-label="Menu lainnya"
        >
          <MoreHorizontal className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl p-1.5">
          {/* Language lives here on phones (switch is hidden below sm) */}
          <div className="px-2 pb-1.5 pt-1 sm:hidden">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
              Bahasa CV
            </p>
            <LanguageSwitch
              value={cvLanguage}
              onChange={onLanguageChange}
              className="w-full [&>button]:flex-1"
            />
          </div>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem onSelect={onOpenTemplatePicker} className="gap-2.5 rounded-xl py-2.5">
            <Palette className="h-4 w-4 text-green-700" />
            <span className="min-w-0 flex-1 truncate">Template: {templateName}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenCvUpload} className="gap-2.5 rounded-xl py-2.5">
            <Upload className="h-4 w-4 text-green-700" /> Import dari CV lama
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 rounded-xl py-2.5">
            <Link to="/cv-review/$cvId" params={{ cvId: id }}>
              <Sparkles className="h-4 w-4 text-green-700" /> Review CV AI
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onToggleShare}
            disabled={shareGenerating}
            className="gap-2.5 rounded-xl py-2.5"
          >
            <Share2 className="h-4 w-4 text-green-700" />
            {shareEnabled ? "Link berbagi aktif" : "Bagikan CV"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleChat} className="gap-2.5 rounded-xl py-2.5">
            <MessageSquare className="h-4 w-4 text-green-700" />
            {chatOpen ? "Tutup AI Chat" : "AI Chat"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 rounded-xl py-2.5">
            <Link to="/tools" search={{ cvId: id }}>
              <Wrench className="h-4 w-4 text-green-700" /> Tools CV
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 rounded-xl py-2.5">
            <Link to="/score/$cvId" params={{ cvId: id }}>
              <BarChart3 className="h-4 w-4 text-green-700" /> Skor ATS lengkap
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Download + Save */}
      <DownloadDropdown
        cv={cvData}
        fileName={title}
        templateId={templateId}
        showWatermark={userTier === "free"}
        cvId={id}
        userId={userId}
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:opacity-70 sm:px-4"
        aria-label="Simpan CV"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span className="hidden sm:inline">Simpan</span>
      </button>
    </header>
  );
}
