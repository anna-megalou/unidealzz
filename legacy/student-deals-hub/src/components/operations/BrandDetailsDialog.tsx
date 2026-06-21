import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Tag, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { BrandRecord } from "@/components/operations/BrandFormDialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type BrandDetail = BrandRecord & { created_at?: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandDetail | null;
}

const BrandDetailsDialog = ({ open, onOpenChange, brand }: Props) => {
  const [offersCount, setOffersCount] = useState<number | null>(null);
  const [claimsCount, setClaimsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !brand?.id) return;
    let cancelled = false;
    (async () => {
      const offers = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.id);
      if (cancelled) return;
      setOffersCount(offers.count ?? 0);

      const offerIds = await supabase.from("offers").select("id").eq("brand_id", brand.id);
      const ids = (offerIds.data ?? []).map((o) => o.id);
      if (ids.length === 0) {
        if (!cancelled) setClaimsCount(0);
        return;
      }
      const claims = await supabase
        .from("claimed_offers")
        .select("id", { count: "exact", head: true })
        .in("offer_id", ids);
      if (!cancelled) setClaimsCount(claims.count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, brand?.id]);

  if (!brand) return null;

  const isAppleLogo = brand.slug === "apple" || brand.name.trim().toLowerCase() === "apple";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">{brand.name}</DialogTitle>
          <DialogDescription>Partner overview and live performance</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative h-40 rounded-2xl overflow-hidden bg-white border border-border/40">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className={`absolute inset-0 h-full w-full object-contain p-6 ${isAppleLogo ? "invert" : ""}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-5xl font-extrabold" style={{ color: "#842CD3" }}>
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {brand.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F1ECFB]/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Live Offers</p>
              <p className="mt-2 font-display text-3xl font-extrabold" style={{ color: "#842CD3" }}>
                {offersCount ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-[#EEF0FF] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Total Claims</p>
              <p className="mt-2 font-display text-3xl font-extrabold" style={{ color: "#4F46E5" }}>
                {claimsCount ?? "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Slug:</span>
              <span className="font-semibold text-foreground">{brand.slug}</span>
            </div>
            {brand.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {brand.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {brand.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Onboarded:</span>
                <span className="font-semibold text-foreground">
                  {format(new Date(brand.created_at), "PPP")}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrandDetailsDialog;
