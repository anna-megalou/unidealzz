import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import {
  fetchActiveOffers,
  fetchBrandsSince,
  fetchCategories,
  fetchClaimedOffersSince,
  fetchOfferById,
  fetchSavedOfferIds,
  fetchStudentProfile,
  fetchUniversities,
  countBrandsSince,
  countCollection,
} from '@/lib/firestoreData';

export interface DbOffer {
  id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  discount_percent: number | null;
  discount_code: string | null;
  redirect_url: string | null;
  image_url: string | null;
  terms: string | null;
  featured: boolean;
  active: boolean;
  expires_at: string | null;
  scope?: 'local' | 'national' | 'online' | null;
  university_ids?: string[] | null;
  brand: { id: string; name: string; slug: string; logo_url: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

export const useOffers = () =>
  useQuery({
    queryKey: queryKeys.offers.all,
    queryFn: fetchActiveOffers,
  });

export const useOffer = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.offers.detail(id ?? ''),
    enabled: !!id,
    queryFn: () => fetchOfferById(id!),
  });

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: fetchCategories,
  });

export const useUniversities = () =>
  useQuery({
    queryKey: queryKeys.catalog.universities,
    queryFn: fetchUniversities,
  });

export const useSavedOfferIds = (userId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.offers.saved(userId ?? ''),
    enabled: !!userId,
    queryFn: () => fetchSavedOfferIds(userId!),
  });

export const useStudentProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.user.studentProfile(userId ?? ''),
    enabled: !!userId,
    queryFn: () => fetchStudentProfile(userId!),
  });

export type AnalyticsRange = 7 | 30 | 90;

export interface EngagementPoint {
  date: string;
  label: string;
  fullLabel: string;
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

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const useAnalytics = (range: AnalyticsRange = 30) =>
  useQuery({
    queryKey: queryKeys.analytics.overview(range),
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const startRange = new Date(now);
      startRange.setDate(startRange.getDate() - (range - 1));
      startRange.setHours(0, 0, 0, 0);
      const startIso = startRange.toISOString();

      const [totalBrands, newPartners, recentPartners, claimsRows] = await Promise.all([
        countCollection('brands'),
        countBrandsSince(startIso),
        fetchBrandsSince(startIso, 6),
        fetchClaimedOffersSince(startIso),
      ]);

      const totalClaims = claimsRows.length;
      const dailyAvgRedemptions = Math.round(totalClaims / range);

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
      claimsRows.forEach((row) => {
        const key = new Date(row.claimed_at).toISOString().slice(0, 10);
        if (key in claimsByDay) claimsByDay[key]++;
      });

      const useShortDay = range <= 8;
      const dailyPoints: EngagementPoint[] = orderedKeys.map((key) => {
        const d = new Date(`${key}T00:00:00`);
        return {
          date: key,
          label: useShortDay ? DAY_SHORT[d.getDay()] : `${d.getDate()}`,
          fullLabel: `${DAY_FULL[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`,
          claims: claimsByDay[key],
          signups: signupsByDay[key],
        };
      });

      let engagement: EngagementPoint[] = dailyPoints;
      if (range > 30) {
        const bucketSize = 7;
        const buckets: EngagementPoint[] = [];
        for (let i = 0; i < dailyPoints.length; i += bucketSize) {
          const slice = dailyPoints.slice(i, i + bucketSize);
          const first = slice[0];
          const last = slice[slice.length - 1];
          const firstD = new Date(`${first.date}T00:00:00`);
          const lastD = new Date(`${last.date}T00:00:00`);
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

      return {
        range,
        studentEngagement: totalClaims,
        redemptions: totalClaims,
        dailyAvgRedemptions,
        newPartners,
        totalBrands,
        engagement,
        hasSignups: engagement.some((p) => p.signups > 0),
        topCategories: [],
        recentPartners: recentPartners.map((b) => ({
          id: b.id,
          name: b.name,
          logo_url: b.logo_url,
          created_at: b.created_at,
        })),
      };
    },
  });
