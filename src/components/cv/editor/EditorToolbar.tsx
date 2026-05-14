import { Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Loader2,
  Share2,
  Wrench,
  BarChart3,
  MessageSquare,
  Palette,
  Upload,
  Sparkles,
  CheckCircle2,
  Crown,
  Zap,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Download,
  Crosshair,
  AlertCircle,
} from "lucide-react";
import { DownloadDropdown } from "@/components/cv/DownloadDropdown";
import { TEMPLATES, type TemplateId, type CvData } from "@/lib/cv-types";

interface EditorToolbarProps {
  id: string;
  title: string;
  onTitleChange: (v: string) => void;
  targetRole: string;
  onTargetRoleChange: (v: string) => void;
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
}

export function EditorToolbar({
  id,
  title,
  onTitleChange,
  targetRole,
  onTargetRoleChange,
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
}: EditorToolbarProps) {
  const templateName = TEMPLATES.find((t) => t.id === templateId)?.name || "Template";

  return (
    <div className="sticky top-16 z-50 shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 print:hidden">
      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 lg:px-4">
        {/* Back button + title */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl p-0"
            aria-label="Kembali ke daftar CV"
          >
            <Link to="/cv">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="relative min-w-0">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-9 w-[150px] rounded-xl border-border/70 bg-muted/40 text-sm font-semibold shadow-none transition-all hover:bg-background focus-visible:bg-background sm:w-[190px] md:w-[220px]"
              aria-label="Judul CV"
            />
          </div>
        </div>

        {/* Target Role */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-border/70 bg-muted/35 px-2 py-1 md:flex">
          <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={targetRole}
            onChange={(e) => onTargetRoleChange(e.target.value)}
            className="h-7 w-[170px] border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
            placeholder="Target posisi"
            aria-label="Target Posisi"
          />
        </div>

        {/* Template */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTemplatePicker}
          className="h-9 shrink-0 gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
        >
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{templateName}</span>
        </Button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-border shrink-0 hidden lg:block" />

        {/* Save Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs shrink-0">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> Gagal simpan
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-2" />

        {/* Nav toggle (desktop) */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-9 w-9 shrink-0 rounded-xl p-0 lg:flex"
          onClick={onToggleNav}
          title="Toggle panel section"
          aria-label="Tampilkan atau sembunyikan panel section"
        >
          {showNav ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share */}
          <Button
            variant={shareEnabled ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 rounded-xl p-0",
              shareEnabled && "bg-primary text-primary-foreground",
            )}
            onClick={onToggleShare}
            disabled={shareGenerating}
            title={shareEnabled ? "Link Aktif" : "Bagikan"}
          >
            {shareGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Upload CV */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl p-0"
            onClick={onOpenCvUpload}
            title="Upload CV"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>

          {/* Tools */}
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0">
            <Link to="/tools" search={{ cvId: id }}>
              <Wrench className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* Score */}
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0">
            <Link to="/score/$cvId" params={{ cvId: id }}>
              <BarChart3 className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* Chat Toggle */}
          <Button
            variant={chatOpen ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 rounded-xl p-0",
              chatOpen && "bg-primary text-primary-foreground",
            )}
            onClick={onToggleChat}
            title="AI Chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>

          {/* Download */}
          <DownloadDropdown
            cv={cvData}
            fileName={title}
            templateId={templateId}
            showWatermark={userTier === "free"}
            cvId={id}
            userId={userId}
          />

          {/* Save */}
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-sm"
            onClick={onSave}
            disabled={saving || saveStatus === "saving"}
          >
            {saving || saveStatus === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Simpan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
