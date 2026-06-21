import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  PiggyBank,
  TrendingUp,
  CreditCard,
  IdCard,
  Zap,
  Pencil,
  Check,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseRow {
  id: string;
  merchant: string;
  amount_paid: number;
  amount_saved: number;
  currency: string;
  payment_method: string | null;
  note: string | null;
  source: "manual" | "auto";
  purchased_at: string;
}

const formatMoney = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const Purchases = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("there");
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Goal state
  const [goal, setGoal] = useState<number>(2000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("2000");

  // Form state
  const [merchant, setMerchant] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [amountSaved, setAmountSaved] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [note, setNote] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: purchases, error }, { data: profile }, { data: settings }] =
      await Promise.all([
        supabase
          .from("purchases")
          .select(
            "id, merchant, amount_paid, amount_saved, currency, payment_method, note, source, purchased_at",
          )
          .eq("user_id", user.id)
          .order("purchased_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select("savings_goal")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    if (error) toast.error("Couldn't load your purchases");
    setRows(((purchases ?? []) as PurchaseRow[]));
    setDisplayName(
      profile?.display_name ||
        (user.user_metadata?.display_name as string | undefined) ||
        (user.email ? user.email.split("@")[0] : "there"),
    );
    if (settings?.savings_goal != null) {
      const g = Number(settings.savings_goal);
      setGoal(g);
      setGoalDraft(String(g));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totals = useMemo(() => {
    const now = new Date();
    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const thisMonthKey = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = monthKey(lastMonthDate);

    let paid = 0;
    let saved = 0;
    let savedThisMonth = 0;
    let savedLastMonth = 0;
    const merchantTotals = new Map<string, number>();
    const merchantSet = new Set<string>();

    rows.forEach((r) => {
      const p = Number(r.amount_paid);
      const s = Number(r.amount_saved);
      paid += p;
      saved += s;
      const key = monthKey(new Date(r.purchased_at));
      if (key === thisMonthKey) savedThisMonth += s;
      if (key === lastMonthKey) savedLastMonth += s;
      const m = r.merchant.trim();
      merchantSet.add(m.toLowerCase());
      merchantTotals.set(m, (merchantTotals.get(m) ?? 0) + s);
    });

    const delta =
      savedLastMonth > 0
        ? ((savedThisMonth - savedLastMonth) / savedLastMonth) * 100
        : savedThisMonth > 0
          ? 100
          : 0;

    let topMerchant: { name: string; amount: number } | null = null;
    merchantTotals.forEach((amount, name) => {
      if (!topMerchant || amount > topMerchant.amount)
        topMerchant = { name, amount };
    });

    return {
      paid,
      saved,
      savedThisMonth,
      delta,
      brandsCount: merchantSet.size,
      topMerchant,
    };
  }, [rows]);

  const goalProgress = goal > 0 ? Math.min(100, (totals.saved / goal) * 100) : 0;
  const goalRemaining = Math.max(0, goal - totals.saved);

  const recentMerchants = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const r of rows) {
      const key = r.merchant.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(r.merchant);
      if (list.length >= 3) break;
    }
    return list;
  }, [rows]);

  const resetForm = () => {
    setMerchant("");
    setAmountPaid("");
    setAmountSaved("");
    setPaymentMethod("card");
    setNote("");
    setPurchasedAt(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const paidNum = parseFloat(amountPaid);
    const savedNum = amountSaved ? parseFloat(amountSaved) : 0;
    if (!merchant.trim() || isNaN(paidNum) || paidNum < 0) {
      toast.error("Please enter a merchant and valid amount");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      merchant: merchant.trim(),
      amount_paid: paidNum,
      amount_saved: isNaN(savedNum) ? 0 : savedNum,
      currency: "EUR",
      payment_method: paymentMethod,
      note: note.trim() || null,
      source: "manual",
      purchased_at: new Date(purchasedAt).toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save purchase");
      return;
    }
    toast.success("Purchase logged");
    resetForm();
    setOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== id));
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) {
      setRows(previous);
      toast.error("Couldn't delete purchase");
    } else {
      toast.success("Purchase removed");
    }
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    const num = parseFloat(goalDraft);
    if (isNaN(num) || num < 0) {
      toast.error("Enter a valid goal amount");
      return;
    }
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, savings_goal: num },
        { onConflict: "user_id" },
      );
    if (error) {
      toast.error("Couldn't save goal");
      return;
    }
    setGoal(num);
    setEditingGoal(false);
    toast.success("Goal updated");
  };

  const firstName = displayName.split(" ")[0];

  return (
    <StudentHubLayout>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          {/* Hero */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Overview
              </p>
              <h1 className="mt-2 font-display text-5xl font-bold leading-tight text-foreground">
                Savings & History
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Welcome back, {firstName}. Here's a look at your financial wins
                from every Unidealz offer you've redeemed.
              </p>
            </div>
            <div
              className={`hidden shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold sm:inline-flex ${
                totals.delta >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <TrendingUp size={16} />
              <div className="leading-tight">
                <p>
                  {totals.delta >= 0 ? "+" : ""}
                  {Math.round(totals.delta)}%
                </p>
                <p className="text-[10px] font-medium opacity-80">
                  vs Last Month
                </p>
              </div>
            </div>
          </div>

          {/* Lifetime savings card */}
          <div className="mt-8 rounded-3xl bg-muted/60 p-7 ring-1 ring-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <PiggyBank size={18} className="text-primary" />
              Total Lifetime Savings
            </div>
            <p className="mt-4 font-display text-6xl font-bold text-primary">
              {formatMoney(totals.saved)}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2">
                {recentMerchants.length > 0 ? (
                  recentMerchants.map((m) => (
                    <div
                      key={m}
                      title={m}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-[10px] font-bold text-foreground ring-2 ring-background"
                    >
                      {initials(m)}
                    </div>
                  ))
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-[10px] font-bold text-muted-foreground ring-2 ring-background">
                    —
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Saved across{" "}
                <span className="font-bold text-foreground">
                  {totals.brandsCount}
                </span>{" "}
                {totals.brandsCount === 1 ? "brand" : "brands"}
              </p>
            </div>
          </div>

          {/* Recent purchases */}
          <div className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Recent Purchases
              </h2>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full font-semibold">
                    <Plus size={14} /> Log purchase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log a purchase</DialogTitle>
                    <DialogDescription>
                      Add what you paid and how much you saved.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="merchant">Merchant / Brand</Label>
                      <Input
                        id="merchant"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        placeholder="e.g. Coffee Island"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="paid">Amount paid (€)</Label>
                        <Input
                          id="paid"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="saved">Amount saved (€)</Label>
                        <Input
                          id="saved"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountSaved}
                          onChange={(e) => setAmountSaved(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="method">Payment method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger id="method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="apple_pay">Apple Pay</SelectItem>
                            <SelectItem value="google_pay">
                              Google Pay
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={purchasedAt}
                          onChange={(e) => setPurchasedAt(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Note (optional)</Label>
                      <Textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Anything memorable about this purchase…"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full"
                      >
                        {submitting ? "Saving…" : "Save purchase"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
                <p className="font-display text-lg font-bold text-foreground">
                  No purchases yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log your first purchase to start tracking savings.
                </p>
                <Button
                  size="sm"
                  className="mt-4 rounded-full font-semibold"
                  onClick={() => setOpen(true)}
                >
                  <Plus size={14} /> Log purchase
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {rows.slice(0, 8).map((r) => (
                  <li
                    key={r.id}
                    className="group flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initials(r.merchant)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-foreground">
                        {r.merchant}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(r.purchased_at)}
                        {r.payment_method
                          ? ` • ${r.payment_method.replace("_", " ")}`
                          : ""}
                        {r.note ? ` • ${r.note}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-bold text-emerald-600">
                        Saved {formatMoney(Number(r.amount_saved), r.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Transaction: {formatMoney(Number(r.amount_paid), r.currency)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      aria-label="Delete"
                      className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          {/* Purchases logged */}
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
            <p className="text-sm font-semibold opacity-90">Purchases Logged</p>
            <p className="mt-2 font-display text-6xl font-bold">{rows.length}</p>
            {totals.topMerchant && (
              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Most Used
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                    {initials(totals.topMerchant.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold">
                      {totals.topMerchant.name}
                    </p>
                    <p className="text-[11px] opacity-80">
                      Saved {formatMoney(totals.topMerchant.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Automatic tracking (stub) */}
          <div className="rounded-3xl bg-muted/60 p-6">
            <h3 className="font-display text-xl font-bold text-foreground">
              Automatic Tracking
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Stop manually logging your savings. Link your bank card or
              Student ID to automatically track every cent you save at checkout.
            </p>
            <Button
              className="mt-5 w-full rounded-full font-semibold"
              disabled
              title="Coming soon"
            >
              <CreditCard size={16} /> Link Bank Card
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full rounded-full font-semibold"
              disabled
              title="Coming soon"
            >
              <IdCard size={16} /> Connect Student ID
            </Button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Coming soon
            </p>
          </div>

          {/* Saving goal */}
          <div className="rounded-3xl bg-[hsl(var(--category-fashion))]/10 p-6 ring-1 ring-[hsl(var(--category-fashion))]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--category-fashion))] text-white">
                  <Zap size={16} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Saving Goal
                </h3>
              </div>
              {!editingGoal ? (
                <button
                  onClick={() => {
                    setGoalDraft(String(goal));
                    setEditingGoal(true);
                  }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Edit goal"
                >
                  <Pencil size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveGoal}
                    className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-100"
                    aria-label="Save goal"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setGoalDraft(String(goal));
                      setEditingGoal(false);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-background"
                    aria-label="Cancel"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    className="h-8 w-28"
                  />
                  <span className="text-muted-foreground">Goal</span>
                </div>
              ) : (
                <span className="font-semibold text-foreground">
                  {formatMoney(goal)} Goal
                </span>
              )}
              <span className="font-bold text-foreground">
                {Math.round(goalProgress)}%
              </span>
            </div>

            <Progress
              value={goalProgress}
              className="mt-3 h-2 bg-background"
            />

            <p className="mt-4 text-xs italic text-muted-foreground">
              {goalRemaining > 0
                ? `You're just ${formatMoney(goalRemaining)} away from your savings target. Keep it up!`
                : `🎉 You've smashed your savings goal! Set a new one anytime.`}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Looking for redemption history?{" "}
            <Link
              to="/student-hub/claimed"
              className="text-primary hover:underline"
            >
              View claimed offers
            </Link>
          </p>
        </aside>
      </div>
    </StudentHubLayout>
  );
};

export default Purchases;
