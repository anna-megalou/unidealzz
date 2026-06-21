import { useEffect, useMemo, useState } from "react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAbExperimentStats } from "@/lib/operationsApi";

interface Row {
  experiment_key: string;
  variant: string;
  assignments: number;
  views: number;
  clicks: number;
  conversions: number;
}

const ExperimentsView = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { assignments, events } = await fetchAbExperimentStats();

    const map = new Map<string, Row>();
    const key = (e: string, v: string) => `${e}::${v}`;
    const get = (e: string, v: string) => {
      const k = key(e, v);
      let r = map.get(k);
      if (!r) {
        r = { experiment_key: e, variant: v, assignments: 0, views: 0, clicks: 0, conversions: 0 };
        map.set(k, r);
      }
      return r;
    };

    assignments.forEach((a) => {
      const experimentKey = String((a as Record<string, unknown>).experimentKey ?? (a as Record<string, unknown>).experiment_key ?? "");
      const variant = String((a as Record<string, unknown>).variant ?? "");
      get(experimentKey, variant).assignments++;
    });

    events.forEach((ev) => {
      const data = ev as Record<string, unknown>;
      const experimentKey = String(data.experimentKey ?? data.experiment_key ?? "");
      const variant = String(data.variant ?? "");
      const eventType = String(data.eventType ?? data.event_type ?? "");
      const r = get(experimentKey, variant);
      if (eventType === "view") r.views++;
      else if (eventType === "click") r.clicks++;
      else if (eventType === "conversion") r.conversions++;
    });

    setRows(
      Array.from(map.values()).sort(
        (a, b) =>
          a.experiment_key.localeCompare(b.experiment_key) || a.variant.localeCompare(b.variant),
      ),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const g = new Map<string, Row[]>();
    rows.forEach((r) => {
      if (!g.has(r.experiment_key)) g.set(r.experiment_key, []);
      g.get(r.experiment_key)!.push(r);
    });
    return Array.from(g.entries());
  }, [rows]);

  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <FlaskConical className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">A/B Experiments</h2>
            <p className="text-xs text-muted-foreground">Live results for ongoing tests</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {grouped.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          No experiment data yet. Visitors will start being assigned to variants automatically.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([exp, variants]) => {
            const totalConv = variants.reduce((s, v) => s + v.conversions, 0);
            const totalAssign = variants.reduce((s, v) => s + v.assignments, 0);
            return (
              <div key={exp} className="rounded-2xl border border-border bg-background/40">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h3 className="font-display text-sm font-bold">{exp}</h3>
                  <span className="text-xs text-muted-foreground">
                    {totalAssign} assignments · {totalConv} conversions
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-5 py-2 text-left">Variant</th>
                        <th className="px-3 py-2 text-right">Assignments</th>
                        <th className="px-3 py-2 text-right">Views</th>
                        <th className="px-3 py-2 text-right">Clicks</th>
                        <th className="px-3 py-2 text-right">Conversions</th>
                        <th className="px-5 py-2 text-right">Conv. rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => {
                        const denom = v.views || v.assignments;
                        const rate = denom ? (v.conversions / denom) * 100 : 0;
                        return (
                          <tr key={v.variant} className="border-t border-border/60">
                            <td className="px-5 py-3 font-semibold">Variant {v.variant}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{v.assignments}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{v.views}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{v.clicks}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{v.conversions}</td>
                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary">
                              {rate.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ExperimentsView;
