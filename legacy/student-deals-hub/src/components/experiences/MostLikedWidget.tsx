import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TopOffer {
  id: string;
  title: string;
  imageUrl: string | null;
  likeCount: number;
}

export const MostLikedWidget = () => {
  const [items, setItems] = useState<TopOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, image_url, favorites:favorites(id)")
        .eq("active", true)
        .limit(50);

      if (cancelled) return;

      const ranked = (data ?? [])
        .map((o: any) => ({
          id: o.id,
          title: o.title,
          imageUrl: o.image_url,
          likeCount: (o.favorites ?? []).length,
        }))
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 2);
      setItems(ranked);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="font-display text-base font-bold text-foreground">Most Liked</h3>
      <div className="mt-4 space-y-4">
        {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">Nothing trending yet.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                <Heart size={11} className="fill-rose-600" />
                {item.likeCount} likes
              </p>
              <Link
                to={`/offers/${item.id}`}
                className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-primary hover:underline"
              >
                View Deal
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
