import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAdminCache } from "@/lib/admin";
import type { Database } from "@/integrations/supabase/types";
import {
  Users, Search, Shield, Crown, FileText, Sparkles,
  ChevronDown, Loader2, Pencil, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";

// ─── Security: Pagination Constants ──────────────────────────────────────────────
const PAGE_SIZE = 50; // Max users per page to prevent DoS

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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  // Load users with pagination
  const loadUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    
    const offset = (page - 1) * PAGE_SIZE;
    
    // Get total count first (for pagination info)
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    // Get paginated profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    
    // Get user IDs for related data
    const userIds = (profiles || []).map((p) => p.id);
    
    // Fetch all related data in parallel (with pagination, this is manageable)
    const [subs, roles, cvs, aiUsage] = await Promise.all([
      // Get user subscriptions with tier
      userIds.length > 0 
        ? supabase
            .from("user_subscriptions")
            .select("user_id, status, subscription_tiers!inner(slug)")
            .in("user_id", userIds)
        : { data: [] },
      // Get user roles
      userIds.length > 0 
        ? supabase.from("user_roles").select("*").in("user_id", userIds)
        : { data: [] },
      // Get CV counts per user
      userIds.length > 0 
        ? supabase.from("cvs").select("user_id").in("user_id", userIds)
        : { data: [] },
      // Get AI usage counts this month
      userIds.length > 0 
        ? supabase
            .from("ai_usage")
            .select("user_id")
            .in("user_id", userIds)
            .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        : { data: [] },
    ]);
    
    // Aggregate data
    const cvCountMap: Record<string, number> = {};
    (cvs.data || []).forEach((c: any) => { 
      cvCountMap[c.user_id] = (cvCountMap[c.user_id] || 0) + 1; 
    });
    
    const aiCountMap: Record<string, number> = {};
    (aiUsage.data || []).forEach((a: any) => { 
      aiCountMap[a.user_id] = (aiCountMap[a.user_id] || 0) + 1; 
    });
    
    const subMap: Record<string, any> = {};
    (subs.data || []).forEach((s: any) => { subMap[s.user_id] = s; });
    
    const roleMap: Record<string, string> = {};
    (roles.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    
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
    
    // Apply client-side filters
    let filteredRows = userRows;
    if (filterTier !== "all") {
      filteredRows = filteredRows.filter((u) => u.tier === filterTier);
    }
    if (search) {
      const q = search.toLowerCase();
      filteredRows = filteredRows.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    
    const total = totalCount || 0;
    setUsers(filteredRows);
    setPagination({
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
    setLoading(false);
  }, [filterTier, search]); // Re-run when filters change
  
  // Initial load and filter changes
  useEffect(() => {
    loadUsers(pagination.page);
  }, [pagination.page]);
  
  // Handle filter/search changes - reset to page 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(1);
  }, [filterTier, search]);

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
      
      // SECURITY: Invalidate admin cache for this user
      invalidateAdminCache(editUser.id);
    }

    toast.success(`User ${editUser.full_name || editUser.id.slice(0, 8)} diupdate`);
    setEditUser(null);
    setSaving(false);
    loadUsers(pagination.page);
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };
  
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(pagination.totalPages);
  const goToPrevPage = () => goToPage(pagination.page - 1);
  const goToNextPage = () => goToPage(pagination.page + 1);

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
          <p className="text-sm text-muted-foreground">{pagination.total} pengguna terdaftar</p>
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
      
      {/* ─── Security: Pagination Controls ─────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Menampilkan {((pagination.page - 1) * pagination.pageSize) + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} dari {pagination.total}
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={pagination.page === 1}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 text-sm">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={pagination.page === pagination.totalPages}
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                    <SelectItem value="starter">Starter — Rp 14.900/bln</SelectItem>
                    <SelectItem value="pro">Pro — Rp 39.000/bln</SelectItem>
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
