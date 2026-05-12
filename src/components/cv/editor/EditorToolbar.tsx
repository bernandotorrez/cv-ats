import { Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Loader2, Share2, Wrench, BarChart3,
  MessageSquare, Palette, Upload, Sparkles, CheckCircle2,
  Crown, Zap, PanelLeftClose, PanelLeft, Menu, Download,
  Crosshair,
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
  id, title, onTitleChange, targetRole, onTargetRoleChange,
  templateId, onOpenTemplatePicker, saveStatus, onSave, saving,
  shareEnabled, shareGenerating, onToggleShare,
  chatOpen, onToggleChat, showNav, onToggleNav,
  cvData, userTier, userId, onOpenCvUpload,
}: EditorToolbarProps) {
  const templateName = TEMPLATES.find((t) => t.id === templateId)?.name || "Template";

  return (
    <div className="shrink-0 border-b border-border bg-gradient-to-r from-background via-background to-muted/50 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-16 z-30 print:hidden">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 px-3 py-2.5 lg:px-4 overflow-x-auto">
        {/* Back button + title */}
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
            <Link to="/cv"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="hidden sm:inline text-xs text-muted-foreground font-medium">|</span>
          <div className="relative">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-8 max-w-[140px] md:max-w-[180px] text-sm font-display font-semibold border-transparent hover:border-border focus:border-primary bg-transparent focus:bg-background"
              aria-label="Judul CV"
            />
          </div>
        </div>

        {/* Target Role */}
        <div className="hidden md:flex items-center gap-1">
          <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={targetRole}
            onChange={(e) => onTargetRoleChange(e.target.value)}
            className="h-8 max-w-[150px] text-sm border-transparent hover:border-border focus:border-primary bg-transparent focus:bg-background"
            placeholder="Target posisi..."
            aria-label="Target Posisi"
          />
        </div>

        {/* Template */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTemplatePicker}
          className="h-8 gap-1.5 text-xs shrink-0 rounded-xl hover:bg-primary/5 hover:text-primary"
        >
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{templateName}</span>
        </Button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-border shrink-0 hidden lg:block" />

        {/* Save Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs shrink-0">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
              ⚠️ Gagal simpan
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-2" />

        {/* Nav toggle (desktop) */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:flex h-8 w-8 p-0 rounded-xl shrink-0"
          onClick={onToggleNav}
          title="Toggle panel section"
        >
          {showNav ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share */}
          <Button
            variant={shareEnabled ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 w-8 p-0 rounded-xl", shareEnabled && "bg-primary text-primary-foreground")}
            onClick={onToggleShare}
            disabled={shareGenerating}
            title={shareEnabled ? "Link Aktif" : "Bagikan"}
          >
            {shareGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          </Button>

          {/* Upload CV */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={onOpenCvUpload} title="Upload CV">
            <Upload className="h-3.5 w-3.5" />
          </Button>

          {/* Tools */}
          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
            <Link to="/tools" search={{ cvId: id }}><Wrench className="h-3.5 w-3.5" /></Link>
          </Button>

          {/* Score */}
          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
            <Link to="/score/$cvId" params={{ cvId: id }}><BarChart3 className="h-3.5 w-3.5" /></Link>
          </Button>

          {/* Chat Toggle */}
          <Button
            variant={chatOpen ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 w-8 p-0 rounded-xl", chatOpen && "bg-primary text-primary-foreground")}
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
            className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
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
