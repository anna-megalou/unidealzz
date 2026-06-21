import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Store, Users, Settings as SettingsIcon, Plus, User, LifeBuoy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import BrandsView, { type BrandsViewHandle } from "@/components/operations/BrandsView";
import TeamView from "@/components/operations/TeamView";
import AnalyticsView from "@/components/operations/AnalyticsView";
import SettingsView from "@/components/operations/SettingsView";
import SupportTicketsView from "@/components/operations/SupportTicketsView";
import ExperimentsView from "@/components/operations/ExperimentsView";
import BrandFormDialog from "@/components/operations/BrandFormDialog";
import ChangeInitialPasswordDialog from "@/components/operations/ChangeInitialPasswordDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Analytics", icon: BarChart3, key: "analytics" },
  { label: "Experiments", icon: FlaskConical, key: "experiments" },
  { label: "Brands", icon: Store, key: "brands" },
  { label: "Support", icon: LifeBuoy, key: "support" },
  { label: "Team", icon: Users, key: "team" },
  { label: "Settings", icon: SettingsIcon, key: "settings" },
];

const Operations = () => {
  const [activeNav, setActiveNav] = useState("analytics");
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const brandsRef = useRef<BrandsViewHandle>(null);
  const { isAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-accept a team invite when redirected here with ?accept_invite=...
  useEffect(() => {
    const inviteId = searchParams.get("accept_invite");
    if (!inviteId || !user) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("accept-team-invite", { body: {} });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error ?? error?.message ?? "Could not accept invite");
      } else {
        toast.success("Invite accepted — welcome to the team!");
        setActiveNav("team");
      }
      // Clear the param
      const next = new URLSearchParams(searchParams);
      next.delete("accept_invite");
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAddBrandClick = () => {
    if (!isAdmin) {
      toast.error("Only admins can create brands");
      return;
    }
    setActiveNav("brands");
    setAddBrandOpen(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}
    >
      <Navbar />

      <div className="container flex-1 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl bg-[#F1ECFB]/60 p-6 self-start">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold leading-tight" style={{ color: "#842CD3" }}>
                  Operations Portal
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Internal Management</p>
              </div>
            </div>

            <nav className="mt-8 flex flex-col gap-1.5">
              {navItems.map((item) => {
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveNav(item.key)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <Button
              onClick={handleAddBrandClick}
              className="mt-8 h-12 w-full rounded-full font-display font-semibold"
              style={{ background: "linear-gradient(135deg, #7073FF 0%, #842CD3 100%)" }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add New Brand
            </Button>
          </aside>

          {/* Main */}
          {activeNav === "team" ? (
            <TeamView />
          ) : activeNav === "brands" ? (
            <BrandsView ref={brandsRef} />
          ) : activeNav === "support" ? (
            <SupportTicketsView />
          ) : activeNav === "settings" ? (
            <SettingsView />
          ) : activeNav === "experiments" ? (
            <ExperimentsView />
          ) : (
            <AnalyticsView />
          )}
        </div>
      </div>

      <BrandFormDialog
        open={addBrandOpen}
        onOpenChange={setAddBrandOpen}
        onSaved={() => brandsRef.current?.refresh()}
      />

      <ChangeInitialPasswordDialog />
    </div>
  );
};

export default Operations;
