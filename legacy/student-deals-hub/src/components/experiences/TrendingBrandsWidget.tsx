import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BrandStat {
  id: string;
  name: string;
  count: number;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const TrendingBrandsWidget = () => {
  const [brands, setBrands] = useState<BrandStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("experience_posts")
        .select("brand:brands(id, name)")
        .eq("visible", true)
        .not("brand_id", "is", null)
        .gte("created_at", since)
        .limit(200);

      if (cancelled) return;

      const counts = new Map<string, BrandStat>();
      (data ?? []).forEach((row: any) => {
        if (!row.brand) return;
        const cur = counts.get(row.brand.id);
        if (cur) cur.count += 1;
        else counts.set(row.brand.id, { id: row.brand.id, name: row.brand.name, count: 1 });
      });
      const top = Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setBrands(top);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="font-display text-base font-bold text-foreground">Trending Brands</h3>
      <div className="mt-4 space-y-3">
        {loading && (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
        {!loading && brands.length === 0 && (
          <p className="text-xs text-muted-foreground">No trending brands yet this week.</p>
        )}
        {brands.map((b) => (
          <div key={b.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initialsOf(b.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
              <p className="text-xs text-muted-foreground">
                {b.count} experience{b.count === 1 ? "" : "s"} this week
              </p>
            </div>
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
        ))}
      </div>
    </div>
  );
};
