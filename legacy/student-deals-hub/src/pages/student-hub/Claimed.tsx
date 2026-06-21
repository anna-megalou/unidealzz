import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ClaimRow {
  id: string;
  claimedAt: string;
  codeRevealed: string | null;
  offerId: string;
  title: string;
  image: string;
  brand: string;
  category: string;
  discountLabel: string | null;
  discountPercent: number | null;
  redirectUrl: string | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Claimed = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("claimed_offers")
        .select(
          `id, claimed_at, code_revealed,
           offer:offers(
             id, title, image_url, discount_label, discount_percent, redirect_url,
             brand:brands(name),
             category:categories(name)
           )`,
        )
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        toast.error("Couldn't load your claimed offers");
        setLoading(false);
        return;
      }

      const mapped: ClaimRow[] = (data ?? [])
        .filter((r: any) => r.offer)
        .map((r: any) => ({
          id: r.id,
          claimedAt: r.claimed_at,
          codeRevealed: r.code_revealed,
          offerId: r.offer.id,
          title: r.offer.title,
          image: r.offer.image_url ?? FALLBACK_IMAGE,
          brand: r.offer.brand?.name ?? "Brand",
          category: (r.offer.category?.name ?? "Offer").toUpperCase(),
          discountLabel:
            r.offer.discount_label ??
            (r.offer.discount_percent ? `${r.offer.discount_percent}% off` : null),
          discountPercent: r.offer.discount_percent,
          redirectUrl: r.offer.redirect_url,
        }));

      setRows(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy code");
    }
  };

  return (
    <StudentHubLayout>
      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Claimed <span className="italic text-primary">Offers</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Your full redemption history. Re-open codes or revisit brand pages
            anytime.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-card px-4 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-border md:self-auto">
          <span>{rows.length} Claims</span>
          <span className="text-muted-foreground/50">•</span>
          <Link to="/offers" className="text-primary hover:underline">
            Browse offers
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your history…</p>
      ) : rows.length === 0 ? (
        <section className="rounded-3xl bg-card p-10 text-center ring-1 ring-border">
          <Ticket size={28} className="mx-auto text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
            No claims yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you claim an offer, it'll show up here so you can find your
            codes again.
          </p>
          <Button asChild className="mt-6 rounded-full font-semibold">
            <Link to="/offers">Explore offers</Link>
          </Button>
        </section>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-border md:flex-row md:items-center"
            >
              <Link
                to={`/offers/${r.offerId}`}
                className="block h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-32"
              >
                <img
                  src={r.image}
                  alt={r.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {r.category} • {r.brand}
                </p>
                <Link to={`/offers/${r.offerId}`}>
                  <h3 className="mt-1 font-display text-lg font-bold text-foreground hover:text-primary">
                    {r.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  Claimed {formatDate(r.claimedAt)}
                  {r.discountLabel ? ` • ${r.discountLabel}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {r.codeRevealed && (
                  <button
                    onClick={() => copyCode(r.codeRevealed!)}
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70"
                  >
                    <span className="font-mono">{r.codeRevealed}</span>
                    <Copy size={12} />
                  </button>
                )}
                {r.redirectUrl && (
                  <a
                    href={r.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Visit <ExternalLink size={12} />
                  </a>
                )}
                <Button asChild variant="secondary" size="sm" className="rounded-full">
                  <Link to={`/offers/${r.offerId}`}>View</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </StudentHubLayout>
  );
};

export default Claimed;
