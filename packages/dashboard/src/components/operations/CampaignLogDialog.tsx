import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { fetchActiveOffers } from "@/lib/firestoreData";
import { Loader2 } from "lucide-react";

interface LogRow {
  id: string;
  title: string;
  brand_name: string;
  category_name: string;
  active: boolean;
  featured: boolean;
  claims: number;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CampaignLogDialog = ({ open, onOpenChange }: Props) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const offers = await fetchActiveOffers();
      if (cancelled) return;
      setRows(
        offers.slice(0, 50).map((o) => ({
          id: o.id,
          title: o.title,
          brand_name: o.brand?.name ?? "—",
          category_name: o.category?.name ?? "—",
          active: o.active,
          featured: o.featured,
          claims: 0,
          created_at: "",
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Campaign Activity Log</DialogTitle>
          <DialogDescription>Latest 50 offers across all brand partners</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading log...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">No campaigns yet.</p>
        )}

        {!loading && rows.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Offer</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Claims</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i !== rows.length - 1 ? "border-b border-border/60" : ""}>
                    <td className="px-4 py-3 font-display font-bold text-foreground">{r.brand_name}</td>
                    <td className="px-4 py-3 text-foreground">{r.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.category_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          r.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                      {r.featured && (
                        <span
                          className="ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                          style={{ background: "#842CD3" }}
                        >
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-foreground">{r.claims}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignLogDialog;
