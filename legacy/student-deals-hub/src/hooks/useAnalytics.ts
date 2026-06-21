import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsRange = 7 | 30 | 90;

export interface EngagementPoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // e.g. "WED" or "Apr 22"
  fullLabel: string; // e.g. "Wednesday, Apr 22"
  claims: number;
  signups: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  studentEngagement: number;
  redemptions: number;
  dailyAvgRedemptions: number;
  newPartners: number;
  totalBrands: number;
  engagement: EngagementPoint[];
  hasSignups: boolean;
  topCategories: { name: string; slug: string; count: number; percent: number }[];
  recentPartners: { id: string; name: string; logo_url: string | null; created_at: string }[];
}

const DAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const useAnalytics = (range: AnalyticsRange = 30) =>
  useQuery({
    queryKey: ["analytics-overview", range],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const startRange = new Date(now);
      startRange.setDate(startRange.getDate() - (range - 1));
      startRange.setHours(0, 0, 0, 0);

      const [
        brandsRes,
        newBrandsRes,
        recentBrandsRes,
        claimsInRangeRes,
        signupsInRangeRes,
        savesInRangeRes,
        categoryClaimsRes,
      ] = await Promise.all([
        supabase.from("brands").select("id", { count: "exact", head: true }),
        supabase
          .from("brands")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startRange.toISOString()),
        supabase
          .from("brands")
          .select("id,name,logo_url,created_at")
          .gte("created_at", startRange.toISOString())
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("claimed_offers")
          .select("claimed_at")
          .gte("claimed_at", startRange.toISOString()),
        supabase
          .from("student_profiles")
          .select("created_at")
          .gte("created_at", startRange.toISOString()),
        supabase
          .from("saved_offers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startRange.toISOString()),
        supabase
          .from("claimed_offers")
          .select("offer:offers(category:categories(id,name,slug))")
          .gte("claimed_at", startRange.toISOString()),
      ]);

      const claimsRows = claimsInRangeRes.data ?? [];
      const signupRows = signupsInRangeRes.data ?? [];
      const totalClaims = claimsRows.length;
      const totalSignups = signupRows.length;
      const totalSaved = savesInRangeRes.count ?? 0;

      const studentEngagement = totalSignups + totalClaims + totalSaved;
      const dailyAvgRedemptions = Math.round(totalClaims / range);

      // Daily buckets
      const claimsByDay: Record<string, number> = {};
      const signupsByDay: Record<string, number> = {};
      const orderedKeys: string[] = [];
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        orderedKeys.push(key);
        claimsByDay[key] = 0;
        signupsByDay[key] = 0;
      }
      claimsRows.forEach((row: any) => {
        const key = new Date(row.claimed_at).toISOString().slice(0, 10);
        if (key in claimsByDay) claimsByDay[key]++;
      });
      signupRows.forEach((row: any) => {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        if (key in signupsByDay) signupsByDay[key]++;
      });

      const useShortDay = range <= 8;
      const dailyPoints: EngagementPoint[] = orderedKeys.map((key) => {
        const d = new Date(key + "T00:00:00");
        return {
          date: key,
          label: useShortDay ? DAY_SHORT[d.getDay()] : `${d.getDate()}`,
          fullLabel: `${DAY_FULL[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`,
          claims: claimsByDay[key],
          signups: signupsByDay[key],
        };
      });

      // For long ranges, aggregate into ~weekly buckets so the chart stays
      // visually compact (similar density to 7/30-day views).
      let engagement: EngagementPoint[] = dailyPoints;
      if (range > 30) {
        const bucketSize = 7;
        const buckets: EngagementPoint[] = [];
        for (let i = 0; i < dailyPoints.length; i += bucketSize) {
          const slice = dailyPoints.slice(i, i + bucketSize);
          const first = slice[0];
          const last = slice[slice.length - 1];
          const firstD = new Date(first.date + "T00:00:00");
          const lastD = new Date(last.date + "T00:00:00");
          buckets.push({
            date: first.date,
            label: `${MONTH[firstD.getMonth()]} ${firstD.getDate()}`,
            fullLabel: `${MONTH[firstD.getMonth()]} ${firstD.getDate()} – ${MONTH[lastD.getMonth()]} ${lastD.getDate()}`,
            claims: slice.reduce((s, p) => s + p.claims, 0),
            signups: slice.reduce((s, p) => s + p.signups, 0),
          });
        }
        engagement = buckets;
      }

      const hasSignups = engagement.some((p) => p.signups > 0);

      // Top categories within range
      const catMap = new Map<string, { name: string; slug: string; count: number }>();
      (categoryClaimsRes.data ?? []).forEach((row: any) => {
        const cat = row?.offer?.category;
        if (!cat) return;
        const cur = catMap.get(cat.id) ?? { name: cat.name, slug: cat.slug, count: 0 };
        cur.count++;
        catMap.set(cat.id, cur);
      });
      const totalCatClaims = Array.from(catMap.values()).reduce((s, c) => s + c.count, 0) || 1;
      const topCategories = Array.from(catMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((c) => ({ ...c, percent: Math.round((c.count / totalCatClaims) * 100) }));

      return {
        range,
        studentEngagement,
        redemptions: totalClaims,
        dailyAvgRedemptions,
        newPartners: newBrandsRes.count ?? 0,
        totalBrands: brandsRes.count ?? 0,
        engagement,
        hasSignups,
        topCategories,
        recentPartners: (recentBrandsRes.data ?? []) as AnalyticsData["recentPartners"],
      };
    },
  });
