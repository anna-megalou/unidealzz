import { useState } from "react";
import { Calendar, Download, TrendingUp, UtensilsCrossed, Shirt, Zap, ArrowRight, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnalytics, type EngagementPoint, type AnalyticsData, type AnalyticsRange } from "@/hooks/useAnalytics";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string; slug: string }[] = [
  { value: 7, label: "Last 7 Days", slug: "last-7-days" },
  { value: 30, label: "Last 30 Days", slug: "last-30-days" },
  { value: 90, label: "Last 90 Days", slug: "last-90-days" },
];

const csvEscape = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const buildCsv = (data: AnalyticsData, rangeLabel: string): string => {
  const lines: string[] = [];
  lines.push(`Unidealz Analytics Export — ${rangeLabel}`);
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");
  lines.push("Summary");
  lines.push("Metric,Value");
  lines.push(`Student Engagement,${data.studentEngagement}`);
  lines.push(`Total Redemptions,${data.redemptions}`);
  lines.push(`Daily Avg Redemptions,${data.dailyAvgRedemptions}`);
  lines.push(`New Partners,${data.newPartners}`);
  lines.push(`Total Brands,${data.totalBrands}`);
  lines.push("");
  lines.push("Daily Engagement");
  lines.push("Date,Day,Daily Claims,Daily Signups");
  data.engagement.forEach((p) => {
    lines.push([csvEscape(p.date), csvEscape(p.fullLabel), p.claims, p.signups].join(","));
  });
  lines.push("");
  lines.push("Top Categories");
  lines.push("Category,Slug,Claims,Percent");
  data.topCategories.forEach((c) => {
    lines.push([csvEscape(c.name), csvEscape(c.slug), c.count, `${c.percent}%`].join(","));
  });
  lines.push("");
  lines.push("Recent Partner Growth");
  lines.push("Brand,Onboarded At");
  data.recentPartners.forEach((p) => {
    lines.push([csvEscape(p.name), csvEscape(p.created_at)].join(","));
  });
  return lines.join("\n");
};



const FALLBACK_ENGAGEMENT: EngagementPoint[] = Array.from({ length: 7 }).map((_, i) => ({
  date: `fallback-${i}`,
  label: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i],
  fullLabel: "No data yet",
  claims: 0,
  signups: 0,
}));

const CATEGORY_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  food: { icon: UtensilsCrossed, color: "#4F46E5", bg: "#E1E5FF" },
  "food-drink": { icon: UtensilsCrossed, color: "#4F46E5", bg: "#E1E5FF" },
  coffee: { icon: UtensilsCrossed, color: "#4F46E5", bg: "#E1E5FF" },
  fashion: { icon: Shirt, color: "#842CD3", bg: "#F1ECFB" },
  technology: { icon: Zap, color: "#10B981", bg: "#D1FAE5" },
  tech: { icon: Zap, color: "#10B981", bg: "#D1FAE5" },
  travel: { icon: Zap, color: "#0EA5E9", bg: "#E0F2FE" },
};

const styleFor = (slug: string) =>
  CATEGORY_STYLES[slug] ?? { icon: Tag, color: "#842CD3", bg: "#F1ECFB" };

const formatCompact = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
};

const AnalyticsView = () => {
  const [range, setRange] = useState<AnalyticsRange>(30);
  const { data, isLoading } = useAnalytics(range);
  const rangeOption = RANGE_OPTIONS.find((r) => r.value === range)!;

  const engagement = data?.engagement?.length ? data.engagement : FALLBACK_ENGAGEMENT;
  const maxTotal = Math.max(...engagement.map((p) => p.claims + p.signups), 1);
  const showSignups = data?.hasSignups ?? false;
  const categories = data?.topCategories ?? [];
  const partners = data?.recentPartners ?? [];

  const handleDownload = () => {
    if (!data) {
      toast.error("Analytics data not ready yet");
      return;
    }
    const csv = buildCsv(data, rangeOption.label);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unidealz-analytics-${rangeOption.slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  };

  return (
    <main className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "#842CD3" }}>
            Performance Overview
          </span>
          <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Analytics Dashboard
          </h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-xl">
            Monitoring real-time student engagement, redemption trends, and ecosystem growth for Unidealz.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm font-semibold text-foreground border border-border/60 hover:bg-card/80 transition-colors">
                <Calendar className="h-4 w-4" />
                {rangeOption.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              {RANGE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className="rounded-xl text-sm font-semibold cursor-pointer"
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleDownload}
            disabled={isLoading || !data}
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full bg-card border border-border/60"
            aria-label="Export analytics CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[452fr_238fr_214fr] md:items-start">
        <div className="relative flex w-full flex-col items-start overflow-hidden bg-white shadow-sm" style={{ height: "200px", padding: "32px 32px 36px", borderRadius: "32px" }}>
          <p className="text-sm font-semibold text-muted-foreground">Student Engagement</p>
          <p className="mt-3 font-display text-6xl font-extrabold" style={{ color: "#4F46E5" }}>
            {isLoading ? "—" : formatCompact(data?.studentEngagement ?? 0)}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            Live signal across students, claims & saves
          </div>
          <span
            className="pointer-events-none absolute bottom-0 right-0"
            style={{ width: "226px", height: "100px", background: "rgba(74, 75, 215, 0.15)", borderTopLeftRadius: "9999px" }}
          />
        </div>

        <div className="flex w-full flex-col items-start justify-between" style={{ height: "200px", padding: "32px", background: "#EAE7F1", borderRadius: "32px" }}>
          <p className="text-sm font-semibold text-muted-foreground">Redemptions</p>
          <p className="font-display text-5xl font-extrabold text-foreground">
            {isLoading ? "—" : (data?.redemptions ?? 0).toLocaleString()}
          </p>
          <p className="text-sm font-semibold" style={{ color: "#4F46E5" }}>
            Daily Avg: {data?.dailyAvgRedemptions ?? 0}
          </p>
        </div>

        <div className="flex w-full flex-col items-start justify-between" style={{ height: "200px", padding: "32px", background: "#EAE7F1", borderRadius: "32px" }}>
          <p className="text-sm font-semibold text-muted-foreground">Partner Growth</p>
          <p className="font-display text-5xl font-extrabold text-foreground">
            +{data?.newPartners ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              New
            </span>
            <span className="text-sm text-muted-foreground">Total {data?.totalBrands ?? 0} Brands</span>
          </div>
        </div>
      </div>

      {/* Engagement Trends + Top Categories */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold text-foreground">Engagement Trends</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "#4F46E5" }} />
                Daily Claims
              </span>
              {showSignups && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#842CD3" }} />
                  New Signups
                </span>
              )}
              <span className="text-muted-foreground">{rangeOption.label}</span>
            </div>
          </div>

          <TooltipProvider delayDuration={80}>
            <div className="mt-6" style={{ paddingTop: "24px" }}>
              {(() => {
                const count = engagement.length;
                // Adapt visuals to range size
                const gapClass = count > 30 ? "gap-[2px]" : count > 14 ? "gap-1" : "gap-2";
                const radiusClass = count > 30 ? "rounded-sm" : count > 14 ? "rounded-md" : "rounded-full";
                // Thin labels so they don't overlap on long ranges
                const labelStride = count > 60 ? 10 : count > 30 ? 5 : count > 14 ? 3 : 1;
                return (
                  <>
                    <div className={`flex items-end justify-between ${gapClass}`} style={{ height: "256px" }}>
                      {engagement.map((p, i) => {
                        const total = p.claims + p.signups;
                        const totalPct = Math.round((total / maxTotal) * 100);
                        const barHeight = total === 0 ? 6 : Math.max(8, totalPct);
                        const claimsShare = total === 0 ? 0 : (p.claims / total) * 100;
                        const signupsShare = 100 - claimsShare;
                        return (
                          <Tooltip key={p.date + i}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`${p.fullLabel}: ${p.claims} claims, ${p.signups} signups`}
                                className={`flex-1 min-w-0 flex flex-col justify-end ${radiusClass} overflow-hidden cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                                style={{
                                  height: `${barHeight}%`,
                                  background: total === 0 ? "#EEF0FF" : "#E1E5FF",
                                }}
                              >
                                {showSignups && total > 0 && (
                                  <span
                                    className="block w-full"
                                    style={{ height: `${signupsShare}%`, background: "#842CD3" }}
                                  />
                                )}
                                {total > 0 && (
                                  <span
                                    className="block w-full"
                                    style={{ height: `${claimsShare}%`, background: "#4F46E5" }}
                                  />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-bold">{p.fullLabel}</p>
                              <p className="mt-1 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ background: "#4F46E5" }} />
                                {p.claims} {p.claims === 1 ? "claim" : "claims"}
                              </p>
                              {showSignups && (
                                <p className="mt-0.5 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full" style={{ background: "#842CD3" }} />
                                  {p.signups} {p.signups === 1 ? "sign-up" : "sign-ups"}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div className={`mt-3 flex justify-between ${gapClass}`}>
                      {engagement.map((p, i) => {
                        const show = i % labelStride === 0 || i === count - 1;
                        return (
                          <span
                            key={p.date + i}
                            className="flex-1 min-w-0 text-center text-[10px] font-bold uppercase tracking-normal text-muted-foreground whitespace-nowrap overflow-visible"
                          >
                            {show ? p.label : ""}
                          </span>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </TooltipProvider>
        </section>

        <section className="rounded-3xl bg-[#F1ECFB]/50 p-6">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Top Categories</h2>
          <div className="mt-6 flex flex-col gap-5">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No redemptions yet — categories will appear once students start claiming offers.
              </p>
            )}
            {categories.map((c) => {
              const s = styleFor(c.slug);
              const Icon = s.icon;
              return (
                <div key={c.slug} className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: s.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground">{c.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      {c.percent}% OF TOTAL
                    </p>
                  </div>
                  <p className="font-display text-xl font-extrabold" style={{ color: s.color }}>
                    {formatCompact(c.count)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* New Partner Growth + Side cards */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-muted/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-foreground">New Partner Growth</h2>
            <button className="flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: "#842CD3" }}>
              View All Partners <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partners.length === 0 && (
              <p className="text-sm text-muted-foreground italic col-span-full">
                No partners onboarded yet.
              </p>
            )}
            {partners.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-4">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 overflow-hidden">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    "brand"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground italic">
                    Onboarded {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
                  Active
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section
            className="rounded-3xl p-6 text-center"
            style={{ background: "rgba(111, 251, 190, 0.35)" }}
          >
            <span className="inline-block rounded-full bg-emerald-200/80 text-emerald-900 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
              Trending Now
            </span>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-foreground leading-tight">
              {categories[0]?.name ?? "Awaiting first claims"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {categories[0]
                ? `Leading category with ${categories[0].percent}% of redemptions`
                : "Top category will appear once students redeem offers"}
            </p>
          </section>

          <section className="rounded-3xl bg-[#F1ECFB] p-6 text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white"
              style={{ background: "#842CD3" }}
            >
              System Health
            </span>
            <p className="mt-3 font-display text-5xl font-extrabold" style={{ color: "#842CD3" }}>
              99.9<span className="text-2xl">%</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              API response time optimal at 42ms
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AnalyticsView;
