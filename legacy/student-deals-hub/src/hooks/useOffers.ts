import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  scope?: "local" | "national" | "online" | null;
  university_ids?: string[] | null;
  brand: { id: string; name: string; slug: string; logo_url: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

export const useOffers = () =>
  useQuery({
    queryKey: ["offers"],
    queryFn: async (): Promise<DbOffer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, brand:brands(id,name,slug,logo_url), category:categories(id,name,slug)")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbOffer[];
    },
  });

export const useOffer = (id: string | undefined) =>
  useQuery({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async (): Promise<DbOffer | null> => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, brand:brands(id,name,slug,logo_url), category:categories(id,name,slug)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as DbOffer | null;
    },
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const useUniversities = () =>
  useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSavedOfferIds = (userId: string | undefined) =>
  useQuery({
    queryKey: ["saved-offers", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("saved_offers")
        .select("offer_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.offer_id);
    },
  });

export const useStudentProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: ["student-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*, university:universities(id,name,short_code)")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
