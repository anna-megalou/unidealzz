import { useEffect, useMemo, useState } from "react";
import { UserPlus, MoreVertical, Loader2, Mail, X, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity, type ActivityRow } from "@/lib/activityLog";
import { formatDistanceToNow } from "date-fns";

type RoleKey = "ADMIN" | "MANAGER" | "CURATOR" | "ANALYST";

type StaffMember = {
  user_id: string;
  name: string;
  email?: string | null;
  role: RoleKey;
  avatar_url?: string | null;
};

type TeamInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
};

const roleStyles: Record<RoleKey, string> = {
  ADMIN: "bg-[#E1E5FF] text-[#4F46E5]",
  MANAGER: "bg-[#E1E5FF] text-[#4F46E5]",
  CURATOR: "bg-[#F1ECFB] text-[#842CD3]",
  ANALYST: "bg-emerald-100 text-emerald-700",
};

const accessRows = [
  { label: "Core API", filled: 2, color: "#4F46E5" },
  { label: "Brand Relations", filled: 3, color: "#842CD3" },
  { label: "Financial Data", filled: 1, color: "#4F46E5" },
];

const inviteSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  role: z.enum(["admin", "curator", "analyst"]),
  full_name: z.string().trim().max(120).optional(),
});

const normalizeRole = (r: string): RoleKey => {
  const v = r.toLowerCase();
  if (v === "admin") return "ADMIN";
  if (v === "curator") return "CURATOR";
  if (v === "analyst") return "ANALYST";
  if (v === "manager") return "MANAGER";
  return "CURATOR";
};

const TeamView = () => {
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "curator" | "analyst">("curator");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    // Staff = users with non-student roles
    const { data: roleRows } = await (supabase as any)
      .from("user_roles")
      .select("user_id, role")
      .neq("role", "student");

    let staffList: StaffMember[] = [];
    if (roleRows && roleRows.length) {
      const userIds = Array.from(new Set(roleRows.map((r: any) => r.user_id)));
      const { data: profileRows } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map<string, any>();
      (profileRows ?? []).forEach((p: any) => profileMap.set(p.user_id, p));

      // De-dup users with multiple roles, keeping the highest priority
      const seen = new Map<string, RoleKey>();
      const priority: Record<RoleKey, number> = { ADMIN: 4, MANAGER: 3, CURATOR: 2, ANALYST: 1 };
      roleRows.forEach((r: any) => {
        const role = normalizeRole(r.role);
        const cur = seen.get(r.user_id);
        if (!cur || priority[role] > priority[cur]) seen.set(r.user_id, role);
      });

      staffList = Array.from(seen.entries()).map(([uid, role]) => {
        const p = profileMap.get(uid);
        const isMe = user?.id === uid;
        return {
          user_id: uid,
          name: p?.display_name || (isMe && user?.email ? user.email.split("@")[0] : "Team Member"),
          email: isMe ? user?.email ?? null : null,
          role,
          avatar_url: p?.avatar_url ?? null,
        };
      });
    }
    setStaff(staffList);

    // Invites + activity feed (admin-only via RLS)
    if (isAdmin) {
      const [{ data: inviteRows }, { data: activityRows }] = await Promise.all([
        (supabase as any)
          .from("team_invites")
          .select("id, email, role, status, invited_at")
          .order("invited_at", { ascending: false }),
        (supabase as any)
          .from("activity_log")
          .select("id, actor_id, action, entity, entity_id, summary, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setInvites((inviteRows ?? []) as TeamInvite[]);
      setActivity((activityRows ?? []) as ActivityRow[]);
    } else {
      setInvites([]);
      setActivity([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh when invites are accepted (new role assigned) or invite status changes
    const channel = (supabase as any)
      .channel("team-view-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_invites" },
        () => loadData()
      )
      .subscribe();

    // Lightweight polling fallback (every 20s) in case realtime isn't enabled
    const interval = setInterval(() => loadData(), 20000);

    return () => {
      try { (supabase as any).removeChannel(channel); } catch (_) {}
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin]);

  const pendingInvites = useMemo(() => invites.filter((i) => i.status === "pending"), [invites]);

  const filteredStaff = useMemo(() => {
    if (filter === "active") return staff;
    return staff;
  }, [staff, filter]);

  const handleInvite = async () => {
    if (!isAdmin) {
      toast.error("Only admins can invite staff");
      return;
    }
    const parsed = inviteSchema.safeParse({
      email: inviteEmail,
      role: inviteRole,
      full_name: inviteFullName || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setInviteBusy(true);
    const { data, error } = await supabase.functions.invoke("send-team-invite", {
      body: {
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        full_name: parsed.data.full_name ?? "",
      },
    });
    setInviteBusy(false);

    if (error || (data && (data as any).error)) {
      const msg = (data as any)?.error ?? error?.message ?? "Could not send invite";
      toast.error(msg);
      return;
    }
    toast.success((data as any)?.already_pending ? `Invite is already pending for ${parsed.data.email}` : `Invite email sent to ${parsed.data.email}`);
    setInviteEmail("");
    setInviteFullName("");
    setInviteRole("curator");
    setInviteOpen(false);
    loadData();
  };

  const handleRevoke = async (id: string) => {
    if (!isAdmin) return;
    setRevokingId(id);
    const { error } = await (supabase as any)
      .from("team_invites")
      .update({ status: "revoked" })
      .eq("id", id);
    setRevokingId(null);
    if (error) {
      toast.error(error.message ?? "Could not revoke invite");
      return;
    }
    toast.success("Invite revoked");
    const inv = invites.find((i) => i.id === id);
    logActivity({
      action: "team.invite_revoked",
      summary: inv ? `Revoked invite for ${inv.email}` : "Revoked team invite",
      entity: "team_invite",
      entityId: id,
    });
    loadData();
  };

  const handleRemoveMember = async () => {
    if (!isAdmin || !removeTarget) return;
    if (removeTarget.user_id === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    setRemovingId(removeTarget.user_id);
    const { data, error } = await supabase.functions.invoke("delete-staff-member", {
      body: { user_id: removeTarget.user_id, delete_auth_user: true },
    });
    setRemovingId(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Could not remove staff member");
      return;
    }
    toast.success(`${removeTarget.name} removed. You can re-invite them now.`);
    setRemoveTarget(null);
    loadData();
  };

  return (
    <main className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Team Management
          </h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-xl">
            Oversee your internal task force. Manage permissions, track curator activity, and expand the Unidealz operations ecosystem.
          </p>
        </div>
        <Button
          onClick={() => {
            if (!isAdmin) {
              toast.error("Only admins can invite staff");
              return;
            }
            setInviteOpen(true);
          }}
          className="h-14 rounded-2xl px-6 font-display font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7073FF 0%, #842CD3 100%)" }}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Invite New Staff
        </Button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "Active Members", value: loading ? "—" : String(staff.length).padStart(2, "0") },
          { label: "Pending Invites", value: loading ? "—" : String(pendingInvites.length).padStart(2, "0") },
          { label: "Average Uptime", value: "98%" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-[32px] p-8 h-[140px] flex flex-col justify-between"
            style={{ background: "#F6F2FB" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            <p className="font-display text-4xl font-extrabold text-foreground">{s.value}</p>
            <span
              className="pointer-events-none absolute right-0 top-0 h-24 w-24"
              style={{ background: "rgba(74, 75, 215, 0.05)", borderRadius: "0px 0px 0px 9999px" }}
            />
          </div>
        ))}
      </div>

      {/* Staff Directory + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Directory */}
        <section className="rounded-3xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-foreground">Staff Directory</h2>
            <div className="flex items-center gap-2 rounded-full bg-muted/60 p-1">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  filter === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  filter === "active" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Active Only
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading team...
              </div>
            )}
            {!loading && filteredStaff.length === 0 && (
              <div className="rounded-2xl bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                No staff members yet. Invite someone to get started.
              </div>
            )}
            {!loading &&
              filteredStaff.map((s) => {
                const initial = (s.name || "?").charAt(0).toUpperCase();
                return (
                  <div
                    key={s.user_id}
                    className="flex items-center gap-4 rounded-2xl border border-border/60 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="relative">
                      {s.avatar_url ? (
                        <img
                          src={s.avatar_url}
                          alt={s.name}
                          width={512}
                          height={512}
                          loading="lazy"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-[#F1ECFB] flex items-center justify-center font-display font-extrabold text-foreground" style={{ color: "#842CD3" }}>
                          {initial}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.email ?? "—"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${roleStyles[s.role]}`}>
                      {s.role}
                    </span>
                    {isAdmin && s.user_id !== user?.id ? (
                      <button
                        onClick={() => setRemoveTarget(s)}
                        disabled={removingId === s.user_id}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label={`Remove ${s.name}`}
                        title="Remove from staff"
                      >
                        {removingId === s.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <button className="text-muted-foreground hover:text-foreground p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}

            {/* Pending invites inline */}
            {!loading && isAdmin && pendingInvites.length > 0 && (
              <>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Pending Invites
                </p>
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-3"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(inv.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${roleStyles[normalizeRole(inv.role)]}`}>
                      {inv.role.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revokingId === inv.id}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Revoke invite"
                    >
                      {revokingId === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Access Control */}
          <section className="rounded-3xl bg-[#F1ECFB]/60 p-6">
            <h3 className="font-display text-xl font-extrabold text-foreground">Access Control</h3>
            <div className="mt-5 flex flex-col gap-4">
              {accessRows.map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-sm"
                        style={{ background: i < r.filled ? r.color : "#D9D5E4" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-6 h-11 w-full rounded-full bg-card font-display font-semibold border-border">
              Audit Permissions
            </Button>
          </section>

          {/* Recent Activity */}
          <section className="rounded-3xl bg-[#F1ECFB]/60 p-6">
            <h3 className="font-display text-xl font-extrabold text-foreground">Recent Activity</h3>
            <div className="mt-5 flex flex-col gap-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              ) : (
                activity.slice(0, 5).map((a) => {
                  const accent = a.action.startsWith("brand.archived")
                    ? "#7073FF"
                    : a.action.startsWith("brand")
                    ? "#842CD3"
                    : a.action.startsWith("team")
                    ? "#4F46E5"
                    : a.action.startsWith("security")
                    ? "#10B981"
                    : "#842CD3";
                  return (
                    <div key={a.id} className="flex gap-3">
                      <span className="w-1 rounded-full shrink-0" style={{ background: accent }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">
                          {a.summary}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.action.replace(/\./g, " · ")}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => !inviteBusy && setInviteOpen(o)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">Invite New Staff</DialogTitle>
            <DialogDescription>
              Send an invite to a new team member. They'll be added with the selected role once they accept.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-name">Full name (optional)</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Jane Doe"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="curator">Curator</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              disabled={inviteBusy}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteBusy}
              className="rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #7073FF 0%, #842CD3 100%)" }}
            >
              {inviteBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove staff confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-extrabold">
              Remove {removeTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes their staff access and deletes their account so you can re-invite them with a fresh email. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={!!removingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRemoveMember(); }}
              disabled={!!removingId}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingId ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing...</>
              ) : (
                "Remove member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default TeamView;
