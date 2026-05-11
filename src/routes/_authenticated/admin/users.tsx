import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Users, Search, Shield, Crown, FileText, Sparkles,
  ChevronDown, Loader2, Pencil, Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => buildSeo({ title: "Admin Users — CV Pintar", description: "Kelola pengguna.", path: "/admin/users", noindex: true }),
  component: AdminUsersPage,
});

interface UserRow {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
  tier: string;
  tier_status: string;
  cv_count: number;
  ai_count: number;
  created_at: string;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editTier, setEditTier] = useState("");
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);

    // Get all profiles
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, created_at");

    // Get user subscriptions with tier
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, status, subscription_tiers!inner(slug)");
    const { data: roles } = await supabase.from("user_roles").select("*");

    // Get CV counts per user
    const { data: cvs } = await supabase.from("cvs").select("user_id");

    // Get AI usage counts this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { data: aiUsage } = await supabase
      .from("ai_usage")
      .select("user_id")
      .gte("created_at", monthStart.toISOString());

    // Aggregate
    const cvCountMap: Record<string, number> = {};
    cvs?.forEach((c: any) => { cvCountMap[c.user_id] = (cvCountMap[c.user_id] || 0) + 1; });

    const aiCountMap: Record<string, number> = {};
    aiUsage?.forEach((a: any) => { aiCountMap[a.user_id] = (aiCountMap[a.user_id] || 0) + 1; });

    const subMap: Record<string, any> = {};
    subs?.forEach((s: any) => { subMap[s.user_id] = s; });

    const roleMap: Record<string, string> = {};
    roles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const userRows: UserRow[] = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      role: roleMap[p.id] || "user",
      tier: subMap[p.id]?.subscription_tiers?.slug || "free",
      tier_status: subMap[p.id]?.status || "active",
      cv_count: cvCountMap[p.id] || 0,
      ai_count: aiCountMap[p.id] || 0,
      created_at: p.created_at,
    }));

    setUsers(userRows);
    setLoading(false);
  };

  const handleEdit = (u: UserRow) => {
    setEditUser(u);
    setEditTier(u.tier);
    setEditRole(u.role);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);

    // Update tier — change the tier_id on user_subscriptions
    // Find the tier_id for the selected slug
    const { data: tierData } = await supabase
      .from("subscription_tiers")
      .select("id")
      .eq("slug", editTier)
      .single();

    if (tierData) {
      const { error: tierErr } = await supabase
        .from("user_subscriptions")
        .update({ tier_id: tierData.id })
        .eq("user_id", editUser.id)
        .eq("status", "active");

      if (tierErr) { toast.error(tierErr.message); setSaving(false); return; }
    }

    // Update role (delete old, insert new)
    if (editRole !== editUser.role) {
      await (supabase as any).from("user_roles").delete().eq("user_id", editUser.id).eq("role", editUser.role);
      if (editRole === "admin") {
        await (supabase as any).from("user_roles").insert({ user_id: editUser.id, role: "admin" });
      } else {
        await supabase.from("user_roles").insert({ user_id: editUser.id, role: "user" });
      }
    }

    toast.success(`User ${editUser.full_name || editUser.id.slice(0, 8)} diupdate`);
    setEditUser(null);
    setSaving(false);
    loadUsers();
  };

  const filtered = users.filter((u) => {
    if (filterTier !== "all" && u.tier !== filterTier) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <p className="text-sm text-muted-foreground">Memuat data pengguna...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" /> Manage Users
          </h2>
          <p className="text-sm text-muted-foreground">{users.length} pengguna terdaftar</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau ID..."
            className="pl-9"
          />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tier</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Cards */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {u.full_name || <span className="text-muted-foreground italic">Tanpa Nama</span>}
                </span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {u.id.slice(0, 12)}...
                </code>
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  {u.role}
                </Badge>
                <Badge
                  className={`text-xs gap-1 ${
                    u.tier === "pro" ? "bg-warning text-warning-foreground" :
                    u.tier === "starter" ? "bg-primary text-primary-foreground" :
                    "bg-muted"
                  }`}
                >
                  <Crown className="h-3 w-3" />
                  {u.tier}
                </Badge>
                {u.tier_status !== "active" && (
                  <Badge variant="outline" className="text-xs text-destructive">{u.tier_status}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {u.cv_count} CV
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {u.ai_count} AI/bln
                </span>
                <span>
                  Daftar: {new Date(u.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleEdit(u)} className="shrink-0 gap-1">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Tidak ada pengguna ditemukan.
          </p>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => { if (!v) setEditUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah tier subscription dan role untuk user ini.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama: </span>
                  <strong>{editUser.full_name || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">ID: </span>
                  <code className="text-xs">{editUser.id}</code>
                </div>
                <div className="flex gap-3">
                  <span><span className="text-muted-foreground">CV:</span> {editUser.cv_count}</span>
                  <span><span className="text-muted-foreground">AI/bln:</span> {editUser.ai_count}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subscription Tier</label>
                <Select value={editTier} onValueChange={setEditTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free — Rp 0</SelectItem>
                    <SelectItem value="starter">Starter — Rp 19.000/bln</SelectItem>
                    <SelectItem value="pro">Pro — Rp 49.000/bln</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditUser(null)}>Batal</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
