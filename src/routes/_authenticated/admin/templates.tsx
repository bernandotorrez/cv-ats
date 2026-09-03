import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Palette, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/login", search: {} as any });
    }
    const { data } = await supabase
      .rpc("has_role", { _user_id: sessionData.session.user.id, _role: "admin" });
    if (!data) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Admin Templates — CV Pintar",
      description: "Kelola template.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminTemplatesPage,
});

interface TemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview_url: string | null;
  color: string;
  is_premium: boolean;
  sort_order: number;
}

function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#468432");
  const [formPremium, setFormPremium] = useState(false);
  const [formSort, setFormSort] = useState(0);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("templates")
      .select("*")
      .order("sort_order", { ascending: true });
    setTemplates((data as TemplateRow[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setFormSlug("");
    setFormName("");
    setFormDesc("");
    setFormColor("#468432");
    setFormPremium(false);
    setFormSort(templates.length + 1);
    setDialogOpen(true);
  };

  const openEdit = (t: TemplateRow) => {
    setEditing(t);
    setFormSlug(t.slug);
    setFormName(t.name);
    setFormDesc(t.description || "");
    setFormColor(t.color || "#468432");
    setFormPremium(t.is_premium);
    setFormSort(t.sort_order);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formSlug.trim() || !formName.trim()) {
      toast.error("Slug dan nama wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      slug: formSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      name: formName.trim(),
      description: formDesc.trim(),
      color: formColor,
      is_premium: formPremium,
      sort_order: formSort,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("templates").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("templates").insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Template diupdate!" : "Template dibuat!");
    setDialogOpen(false);
    loadTemplates();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("templates").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Template dihapus");
    setDeleteTarget(null);
    loadTemplates();
  };

  const handleTogglePremium = async (t: TemplateRow) => {
    const { error } = await supabase
      .from("templates")
      .update({ is_premium: !t.is_premium })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    loadTemplates();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Palette className="h-3.5 w-3.5" />
            Templates
          </div>
          <h2 className="font-display text-2xl font-bold tracking-normal sm:text-3xl">
            Kelola template CV yang tersedia.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Atur template yang tampil di galeri, urutan, dan status premium.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Template Baru
        </Button>
      </section>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat template...</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              <div
                className="h-16 w-16 rounded-lg shrink-0 flex items-center justify-center text-white font-display font-bold text-xs"
                style={{ background: t.color || "#468432" }}
              >
                {t.name.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{t.name}</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.slug}</code>
                  {t.is_premium && (
                    <Badge className="bg-warning text-warning-foreground text-xs">Premium</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Urutan: {t.sort_order}</span>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={t.is_premium}
                      onCheckedChange={() => handleTogglePremium(t)}
                      aria-label="Toggle premium"
                    />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(t)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(t)}
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "Template Baru"}</DialogTitle>
            <DialogDescription>
              Template yang dibuat di sini akan muncul di galeri template user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="modern-pro"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground">
                ID unik, tidak bisa diubah setelah dibuat.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Template *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Modern Pro"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Template modern dengan..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Warna Aksen</Label>
                <div className="flex gap-2">
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input
                  value={formSort}
                  onChange={(e) => setFormSort(Number(e.target.value))}
                  type="number"
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Premium (hanya Pro/Starter)</Label>
              <Switch checked={formPremium} onCheckedChange={setFormPremium} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Simpan" : "Buat Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus template "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Template akan hilang dari galeri template user. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
