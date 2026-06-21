import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Crown, Sparkles, Bell, Zap, Star, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type RowId = "deals" | "expiring" | "verification" | "newsletter" | "favBrandAlerts";

const rows: { id: RowId; label: string; desc: string }[] = [
  { id: "deals", label: "New premium deals", desc: "Curated picks dropped just for you." },
  { id: "expiring", label: "Expiring soon", desc: "Heads-up when a saved deal is about to end." },
  { id: "favBrandAlerts", label: "Favorite brand alerts", desc: "Email me when brands I've favorited launch new offers." },
  { id: "verification", label: "Verification reminders", desc: "Annual renewal nudges so you never lapse." },
  { id: "newsletter", label: "Monthly digest", desc: "A short recap of the best brand drops each month." },
];

const standardFeatures = [
  "Access to all student deals",
  "Verified student status",
  "Save deals for later",
  "Standard support",
];

const premiumFeatures = [
  { icon: Bell, text: "Notified first about new drops" },
  { icon: Star, text: "Exclusive premium-only discounts" },
  { icon: Zap, text: "Early access to flash sales" },
  { icon: Sparkles, text: "Priority support & perks" },
];

// Map UI rows to columns in user_settings
const rowToColumn: Record<RowId, "email_notifications" | "push_notifications" | "security_alerts" | "newsletter_local" | "favorite_brand_alerts_opt_in"> = {
  deals: "push_notifications",
  expiring: "email_notifications",
  favBrandAlerts: "favorite_brand_alerts_opt_in",
  verification: "security_alerts",
  newsletter: "newsletter_local",
};

const Settings = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<"standard" | "premium">("standard");

  const [prefs, setPrefs] = useState({
    deals: true,
    expiring: true,
    favBrandAlerts: true,
    verification: true,
    newsletter: false,
    reducedMotion: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("email_notifications, push_notifications, security_alerts, theme, marketing_opt_in, favorite_brand_alerts_opt_in")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPrefs({
          deals: data.push_notifications,
          expiring: data.email_notifications,
          favBrandAlerts: (data as any).favorite_brand_alerts_opt_in ?? true,
          verification: data.security_alerts,
          newsletter: (data as any).marketing_opt_in ?? false,
          reducedMotion: data.theme === "reduced-motion",
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = async (next: typeof prefs) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      push_notifications: next.deals,
      email_notifications: next.expiring,
      security_alerts: next.verification,
      marketing_opt_in: next.newsletter,
      favorite_brand_alerts_opt_in: next.favBrandAlerts,
      theme: next.reducedMotion ? "reduced-motion" : "light",
    };
    const { error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" });
    if (error) {
      toast.error("Couldn't save preference");
    } else {
      toast.success("Preferences updated");
    }
  };

  const toggleRow = (id: RowId, checked: boolean) => {
    const next = { ...prefs, [id]: checked };
    setPrefs(next);
    persist(next);
  };

  const toggleMotion = (checked: boolean) => {
    const next = { ...prefs, reducedMotion: checked };
    setPrefs(next);
    persist(next);
    // Apply immediately
    document.documentElement.classList.toggle("reduce-motion", checked);
  };

  const handleUpgrade = () => {
    setCurrentPlan("premium");
    toast.success("Welcome to Premium!", {
      description: "You now have access to exclusive perks.",
    });
  };

  const handleDowngrade = () => {
    setCurrentPlan("standard");
    toast.success("Switched to Standard plan");
  };

  return (
    <StudentHubLayout>
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">Tune notifications and preferences across Unidealz.</p>
      </header>

      {/* Subscription Plans */}
      <section className="mb-6 rounded-2xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-bold text-foreground">Subscription</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current: {currentPlan === "premium" ? "Premium" : "Standard"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your student lifestyle.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Standard Plan */}
          <div
            className={cn(
              "relative rounded-2xl border bg-background p-6 transition-all",
              currentPlan === "standard"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            )}
          >
            {currentPlan === "standard" && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                Your Plan
              </span>
            )}
            <h3 className="font-display text-lg font-bold text-foreground">Standard</h3>
            <p className="text-sm text-muted-foreground">For every verified student</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-foreground">€0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
            <ul className="mt-6 space-y-3">
              {standardFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="mt-6 w-full rounded-xl"
              disabled={currentPlan === "standard"}
              onClick={handleDowngrade}
            >
              {currentPlan === "standard" ? "Active" : "Switch to Standard"}
            </Button>
          </div>

          {/* Premium Plan */}
          <div
            className={cn(
              "relative rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background p-6 transition-all",
              currentPlan === "premium"
                ? "border-primary ring-2 ring-primary/20"
                : "border-primary/40"
            )}
          >
            <span className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
              <Crown className="h-3 w-3" />
              {currentPlan === "premium" ? "Your Plan" : "Recommended"}
            </span>
            <h3 className="font-display text-lg font-bold text-foreground">Premium</h3>
            <p className="text-sm text-muted-foreground">Unlock exclusive perks</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-foreground">€3</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {premiumFeatures.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-sm text-foreground">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "premium" ? (
              <Button className="mt-6 w-full rounded-xl font-semibold" disabled>
                Premium Active
              </Button>
            ) : (
              <Button asChild className="mt-6 w-full rounded-xl font-semibold">
                <Link to="/premium">
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-6 ring-1 ring-border">
        <h2 className="font-display text-xl font-bold text-foreground">Notifications</h2>
        <div className="mt-6 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-4">
              <div>
                <Label htmlFor={r.id} className="text-base font-semibold text-foreground">
                  {r.label}
                </Label>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
              <Switch
                id={r.id}
                checked={prefs[r.id]}
                disabled={loading}
                onCheckedChange={(v) => toggleRow(r.id, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
        <h2 className="font-display text-xl font-bold text-foreground">Appearance</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Reduced motion</p>
            <p className="text-sm text-muted-foreground">Minimize animations across the portal.</p>
          </div>
          <Switch
            checked={prefs.reducedMotion}
            disabled={loading}
            onCheckedChange={toggleMotion}
          />
        </div>
      </section>

      {/* Discreet account deletion — collapsed by default */}
      <Collapsible className="mt-8">
        <CollapsibleTrigger className="group inline-flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground">
          Advanced
          <ChevronDown size={12} className="transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Removes your saved deals and verification history.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-destructive hover:underline">
                  Delete my account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out immediately. Full account deletion is processed by our team —
                    contact support to complete the request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast.success("Signed out. Contact support to fully delete your account.");
                      window.location.href = "/";
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </StudentHubLayout>
  );
};

export default Settings;
