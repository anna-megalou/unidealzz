import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Eye, ArrowRight, Loader2, Archive, ArchiveRestore } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import BrandFormDialog, { type BrandRecord } from "@/components/operations/BrandFormDialog";
import BrandDetailsDialog from "@/components/operations/BrandDetailsDialog";
import CampaignLogDialog from "@/components/operations/CampaignLogDialog";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/activityLog";

type BrandRow = BrandRecord & { created_at: string; archived_at?: string | null };

const campaigns = [
  { brand: "ASOS", category: "Fashion", efficiency: 62, color: "#4F46E5" },
  { brand: "Spotify", category: "Entertainment", efficiency: 78, color: "#7C3AED" },
  { brand: "Uber Eats", category: "Lifestyle", efficiency: 45, color: "#10B981" },
];

export type BrandsViewHandle = { refresh: () => void };

const BrandsView = forwardRef<BrandsViewHandle>((_, ref) => {
  const { isAdmin } = useAuth();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BrandRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewing, setViewing] = useState<BrandRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [archiving, setArchiving] = useState<BrandRow | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedBrands, setArchivedBrands] = useState<BrandRow[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true);
    const { data, error } = await (supabase as any)
      .from("brands")
      .select("id,name,slug,description,logo_url,website,created_at,archived_at")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    if (!error && data) setArchivedBrands(data as BrandRow[]);
    setArchivedLoading(false);
  }, []);

  const openArchived = () => {
    setArchivedOpen(true);
    loadArchived();
  };

  const handleRestore = async (b: BrandRow) => {
    if (!isAdmin) {
      toast.error("Only admins can restore brands");
      return;
    }
    setRestoringId(b.id);
    const { error } = await (supabase as any)
      .from("brands")
      .update({ archived_at: null })
      .eq("id", b.id);
    setRestoringId(null);
    if (error) {
      toast.error(error.message ?? "Could not restore brand");
      return;
    }
    toast.success(`"${b.name}" restored`);
    logActivity({
      action: "brand.restored",
      summary: `Restored brand "${b.name}"`,
      entity: "brand",
      entityId: b.id,
    });
    loadArchived();
    load();
  };

  const openEdit = (b: BrandRow) => {
    setEditing(b);
    setEditOpen(true);
  };

  const openView = (b: BrandRow) => {
    setViewing(b);
    setViewOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("brands")
      .select("id,name,slug,description,logo_url,website,created_at,archived_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (!error && data) setBrands(data as BrandRow[]);
    setLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({ refresh: load }), [load]);

  useEffect(() => {
    load();
  }, [load]);

  const handleArchive = async () => {
    if (!archiving) return;
    if (!isAdmin) {
      toast.error("Only admins can archive brands");
      return;
    }
    setArchiveBusy(true);
    const { error } = await (supabase as any)
      .from("brands")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", archiving.id);
    setArchiveBusy(false);
    if (error) {
      toast.error(error.message ?? "Could not archive brand");
      return;
    }
    toast.success(`"${archiving.name}" archived. Existing offers are preserved.`);
    logActivity({
      action: "brand.archived",
      summary: `Archived brand "${archiving.name}"`,
      entity: "brand",
      entityId: archiving.id,
    });
    setArchiving(null);
    load();
  };

  return (
    <main className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "#842CD3" }}>
            Core Management
          </span>
          <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Partner Ecosystem
          </h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-xl">
            Curate and monitor global brand partnerships. Ensure offer alignment with student personas and manage lifecycle statuses across the Unidealz network.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-3">
            <div className="rounded-2xl bg-[#F1ECFB]/70 px-5 py-4 min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-tight">
                Active<br />Partners
              </p>
              <p className="mt-3 font-display text-3xl font-extrabold" style={{ color: "#842CD3" }}>
                {loading ? "—" : brands.length}
              </p>
            </div>
            <div className="rounded-2xl px-5 py-4 min-w-[130px]" style={{ background: "rgba(111, 251, 190, 0.35)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-900/70 leading-tight">
                Pending Review
              </p>
              <p className="mt-3 font-display text-3xl font-extrabold text-emerald-900">0</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openArchived}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="h-3.5 w-3.5" />
            View archived brands
          </button>
        </div>
      </div>

      {/* Brand grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading brands...
          </div>
        )}

        {!loading && brands.length === 0 && (
          <div className="col-span-full rounded-3xl bg-card/50 p-10 border-2 border-dashed border-border text-center text-muted-foreground">
            No brands yet. Click "Add New Brand" to create your first partner.
          </div>
        )}

        {!loading &&
          brands.map((b) => {
            const isComplete = Boolean(
              b.name?.trim() &&
                b.slug?.trim() &&
                b.website?.trim() &&
                b.description?.trim() &&
                b.logo_url?.trim()
            );
            const isAppleLogo = b.slug === "apple" || b.name.trim().toLowerCase() === "apple";
            return (
              <div
                key={b.id}
                className={`rounded-3xl p-3 overflow-hidden ${
                  isComplete ? "bg-card shadow-sm" : "bg-card/50 border-2 border-dashed border-border"
                }`}
              >
                <div className="relative h-44 rounded-2xl overflow-hidden bg-white border border-border/40">
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={`${b.name} brand`}
                      width={768}
                      height={576}
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full object-contain p-6 ${isAppleLogo ? "invert" : ""}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-4xl font-extrabold" style={{ color: "#842CD3" }}>
                        {b.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {isComplete ? (
                    <span className="absolute top-3 right-3 rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      ACTIVE
                    </span>
                  ) : (
                    <span
                      className="absolute top-3 right-3 rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white"
                      style={{ background: "#842CD3" }}
                    >
                      Onboarding
                    </span>
                  )}
                </div>
                <div className="px-3 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-extrabold text-foreground truncate">{b.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {b.description || b.website || b.slug}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-xl font-extrabold text-foreground">0</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Live Offers</p>
                    </div>
                  </div>
                  {isComplete ? (
                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openEdit(b)}
                        className="flex-1 h-11 rounded-full bg-muted hover:bg-muted/70 font-display font-semibold text-foreground"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openView(b)}
                        aria-label={`View ${b.name} details`}
                        className="h-11 w-11 rounded-full bg-[#EEF0FF] hover:bg-[#E1E5FF] text-primary"
                      >
                        <Eye className="h-4 w-4" style={{ color: "#7073FF" }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArchiving(b)}
                        aria-label={`Archive ${b.name}`}
                        title="Archive brand"
                        className="h-11 w-11 rounded-full bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openEdit(b)}
                        className="flex-1 h-11 rounded-full bg-card hover:bg-muted/40 font-display font-semibold border-border"
                      >
                        Complete Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openView(b)}
                        aria-label={`View ${b.name} details`}
                        className="h-11 w-11 rounded-full bg-[#EEF0FF] hover:bg-[#E1E5FF] text-primary"
                      >
                        <Eye className="h-4 w-4" style={{ color: "#7073FF" }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArchiving(b)}
                        aria-label={`Archive ${b.name}`}
                        title="Archive brand"
                        className="h-11 w-11 rounded-full bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </section>

      {/* Active Campaign Monitor */}
      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-extrabold text-foreground">Active Campaign Monitor</h2>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: "#842CD3" }}
          >
            View Detailed Log <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 rounded-3xl bg-muted/40 p-2">
          <div className="grid grid-cols-[1.2fr_1.2fr_1.5fr_0.8fr] gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <span>Brand</span>
            <span>Category</span>
            <span>Offer Efficiency</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="rounded-2xl bg-card">
            {campaigns.map((c, idx) => (
              <div
                key={c.brand}
                className={`grid grid-cols-[1.2fr_1.2fr_1.5fr_0.8fr] gap-4 items-center px-6 py-5 ${
                  idx !== campaigns.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <span className="font-display font-bold text-foreground">{c.brand}</span>
                <span className="text-sm text-muted-foreground">{c.category}</span>
                <div className="h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
                  <div className="h-full rounded-full" style={{ width: `${c.efficiency}%`, background: c.color }} />
                </div>
                <button className="text-right text-sm font-semibold hover:underline" style={{ color: "#842CD3" }}>
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BrandFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
        brand={editing}
      />
      <BrandDetailsDialog open={viewOpen} onOpenChange={setViewOpen} brand={viewing} />
      <CampaignLogDialog open={logOpen} onOpenChange={setLogOpen} />

      <AlertDialog open={!!archiving} onOpenChange={(o) => !o && !archiveBusy && setArchiving(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-extrabold">
              Archive “{archiving?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The brand will be hidden from the active partner list. Existing offers and historical
              claims are preserved. You can restore it later from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveBusy} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveBusy}
              onClick={(e) => {
                e.preventDefault();
                handleArchive();
              }}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Archiving...
                </>
              ) : (
                "Archive brand"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={archivedOpen} onOpenChange={setArchivedOpen}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold flex items-center gap-2">
              <Archive className="h-5 w-5" /> Archived Brands
            </DialogTitle>
            <DialogDescription>
              Hidden from the active partner list. Restore to bring them back.
            </DialogDescription>
          </DialogHeader>

          {archivedLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : archivedBrands.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              No archived brands.
            </div>
          ) : (
            <ul className="flex flex-col gap-2 mt-2">
              {archivedBrands.map((b) => {
                const isAppleLogo = b.slug === "apple" || b.name.trim().toLowerCase() === "apple";
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-white border border-border/40 overflow-hidden flex items-center justify-center">
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          className={`h-full w-full object-contain p-1.5 ${isAppleLogo ? "invert" : ""}`}
                        />
                      ) : (
                        <span className="font-display font-extrabold text-foreground">
                          {b.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-foreground truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Archived {b.archived_at ? new Date(b.archived_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={restoringId === b.id || !isAdmin}
                      onClick={() => handleRestore(b)}
                      className="rounded-full bg-muted hover:bg-muted/70 font-display font-semibold"
                    >
                      {restoringId === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-1.5" />
                          Restore
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
});

BrandsView.displayName = "BrandsView";

export default BrandsView;
