import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Inbox, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Ticket {
  id: string;
  user_id: string | null;
  full_name: string;
  student_email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type Status = (typeof STATUSES)[number];

const statusTone: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  in_progress: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  resolved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  closed: "bg-muted text-muted-foreground hover:bg-muted",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const SupportTicketsView = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) {
      toast.error("Couldn't load support tickets");
      return;
    }
    setTickets((data as Ticket[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setReply("");
  }, [selected?.id]);

  const updateStatus = async (id: string, next: Status) => {
    setUpdating(true);
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    setUpdating(false);
    if (error) {
      toast.error("Couldn't update ticket");
      return;
    }
    setTickets((cur) =>
      cur.map((t) => (t.id === id ? { ...t, status: next } : t))
    );
    if (selected?.id === id) setSelected({ ...selected, status: next });
    toast.success(`Marked as ${statusLabel[next] ?? next}`);
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const agentName =
      (user?.user_metadata?.display_name as string | undefined) ||
      user?.email?.split("@")[0] ||
      undefined;

    const { error } = await supabase.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName: "support-reply",
          recipientEmail: selected.student_email,
          idempotencyKey: `support-reply-${selected.id}-${Date.now()}`,
          templateData: {
            name: selected.full_name,
            agentName,
            originalSubject: selected.subject,
            originalMessage: selected.message,
            replyMessage: reply.trim(),
          },
        },
      }
    );

    if (error) {
      setSending(false);
      toast.error("Couldn't send reply. Please try again.");
      return;
    }

    // Auto-move to in_progress if currently open
    if (selected.status === "open") {
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", selected.id);
      setTickets((cur) =>
        cur.map((t) =>
          t.id === selected.id ? { ...t, status: "in_progress" } : t
        )
      );
      setSelected({ ...selected, status: "in_progress" });
    }

    setSending(false);
    setReply("");
    toast.success(`Reply sent to ${selected.student_email}`);
  };

  const filtered = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.student_email.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Support Tickets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages submitted from the Contact page.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </header>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              filter === s
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/40 hover:bg-muted/60"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {s === "all" ? "All" : statusLabel[s]}
            </p>
            <p className="mt-1.5 font-display text-2xl font-extrabold text-foreground">
              {counts[s as keyof typeof counts]}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, subject…"
            className="h-11 rounded-full pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-2">
        {loading && tickets.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tickets…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-base font-semibold">No tickets</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tickets.length === 0
                ? "Submitted tickets will appear here."
                : "Nothing matches your filters."}
            </p>
          </div>
        )}

        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-foreground">
                  {t.subject}
                </span>
                <Badge className={`rounded-full ${statusTone[t.status] ?? ""}`}>
                  {statusLabel[t.status] ?? t.status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t.full_name} · {t.student_email}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {t.message}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {selected.subject}
                </DialogTitle>
                <DialogDescription>
                  From <strong>{selected.full_name}</strong> ·{" "}
                  <a
                    href={`mailto:${selected.student_email}`}
                    className="text-primary hover:underline"
                  >
                    {selected.student_email}
                  </a>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={`rounded-full ${statusTone[selected.status] ?? ""}`}
                  >
                    {statusLabel[selected.status] ?? selected.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Submitted{" "}
                    {formatDistanceToNow(new Date(selected.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Status
                  </span>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => updateStatus(selected.id, v as Status)}
                    disabled={updating}
                  >
                    <SelectTrigger className="h-10 w-44 rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reply composer */}
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-bold text-foreground">
                        Reply to student
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Sent from <span className="font-medium text-foreground">noreply@unidealz.gr</span> · arrives in their inbox
                      </p>
                    </div>
                  </div>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply here…"
                    className="mt-3 min-h-[140px] rounded-xl"
                    disabled={sending}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={sendReply}
                      disabled={!reply.trim() || sending}
                      className="rounded-full"
                    >
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SupportTicketsView;
