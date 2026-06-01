import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAdminCache } from "@/lib/admin";
import {
  Users,
  Search,
  Shield,
  Crown,
  FileText,
  Sparkles,
  Loader2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// ─── Security: Pagination Constants ──────────────────────────────────────────────
const PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () =>
    buildSeo({
      title: "Admin Users — CV Pintar",
      description: "Kelola pengguna.",
      path: "/admin/users",
      noindex: true,
    }),
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
  auth_created_at?: string;
  last_sign_in_at?: string | null;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AdminUsersResponse {
  users: UserRow[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  error?: string;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const loadUsers = useCallback(async (page: number = 1, query = "", tier = "all") => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!token || !supabaseUrl) {
      toast.error("Session admin tidak valid. Silakan login ulang.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(PAGE_SIZE),
    });

    if (query) params.set("search", query);
    if (tier !== "all") params.set("tier", tier);

    const response = await fetch(`${supabaseUrl}/functions/v1/admin-users?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await response.json()) as AdminUsersResponse;

    if (!response.ok || data.error) {
      toast.error(data.error || "Gagal memuat semua user terdaftar");
      setUsers([]);
      setLoading(false);
      return;
    }

    const rows = data?.users || [];
    setUsers(rows);
    setPagination({
      page: data?.page || page,
      pageSize: data?.perPage || PAGE_SIZE,
      total: data?.total || rows.length,
      totalPages: data?.totalPages || Math.ceil(rows.length / PAGE_SIZE),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filterTier]);

  useEffect(() => {
    loadUsers(pagination.page, debouncedSearch, filterTier);
  }, [debouncedSearch, filterTier, loadUsers, pagination.page]);

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

      if (tierErr) {
        toast.error(tierErr.message);
        setSaving(false);
        return;
      }
    }

    // Update role (delete old, insert new)
    if (editRole !== editUser.role) {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editUser.id)
        .eq("role", editUser.role);
      if (editRole === "admin") {
        await supabase.from("user_roles").insert({ user_id: editUser.id, role: "admin" });
      } else {
        await supabase.from("user_roles").insert({ user_id: editUser.id, role: "user" });
      }

      // SECURITY: Invalidate admin cache for this user
      invalidateAdminCache(editUser.id);
    }

    toast.success(`User ${editUser.full_name || editUser.id.slice(0, 8)} diupdate`);
    setEditUser(null);
    setSaving(false);
    loadUsers(pagination.page, debouncedSearch, filterTier);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(pagination.totalPages);
  const goToPrevPage = () => goToPage(pagination.page - 1);
  const goToNextPage = () => goToPage(pagination.page + 1);

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
            placeholder="Cari nama, email, atau ID..."
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

      <div className="space-y-3">
        {loading ? (
          <AdminUsersSkeleton />
        ) : (
          users.map((u) => (
            <Card key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {u.full_name || (
                      <span className="text-muted-foreground italic">Tanpa Nama</span>
                    )}
                  </span>
                  {u.email && (
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {u.email}
                    </span>
                  )}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {u.id.slice(0, 12)}...
                  </code>
                  <Badge
                    variant={u.role === "admin" ? "default" : "secondary"}
                    className="text-xs gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {u.role}
                  </Badge>
                  <Badge
                    className={`text-xs gap-1 ${
                      u.tier === "pro"
                        ? "bg-warning text-warning-foreground"
                        : u.tier === "starter"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    }`}
                  >
                    <Crown className="h-3 w-3" />
                    {u.tier}
                  </Badge>
                  {u.tier_status !== "active" && (
                    <Badge variant="outline" className="text-xs text-destructive">
                      {u.tier_status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {u.cv_count} CV
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {u.ai_count} AI/bln
                  </span>
                  <span>Daftar: {new Date(u.created_at).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(u)}
                className="shrink-0 gap-1"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Card>
          ))
        )}
        {!loading && users.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Tidak ada pengguna ditemukan.
          </p>
        )}
      </div>

      {/* ─── Security: Pagination Controls ─────────────────────────────────────── */}
      {pagination.totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-2 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} dari{" "}
            {pagination.total}
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
      <Dialog
        open={!!editUser}
        onOpenChange={(v) => {
          if (!v) setEditUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Ubah tier subscription dan role untuk user ini.</DialogDescription>
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
                  <span>
                    <span className="text-muted-foreground">CV:</span> {editUser.cv_count}
                  </span>
                  <span>
                    <span className="text-muted-foreground">AI/bln:</span> {editUser.ai_count}
                  </span>
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
                <Button variant="outline" onClick={() => setEditUser(null)}>
                  Batal
                </Button>
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

function AdminUsersSkeleton() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <Card key={index} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
        </Card>
      ))}
    </>
  );
}
