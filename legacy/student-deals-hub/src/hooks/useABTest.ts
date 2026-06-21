import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ANON_KEY = "ab_anon_id";

const getAnonId = (): string => {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
};

const localKey = (exp: string) => `ab_assignment_${exp}`;

export type ABVariant = "A" | "B";

/**
 * Sticky 50/50 A/B assignment.
 * - Logged-in users: assignment persisted in `ab_assignments` keyed by user_id
 * - Anonymous: assignment stored locally + mirrored to `ab_assignments` by anon_id
 */
export const useABTest = (experimentKey: string) => {
  const { user, loading } = useAuth();
  const [variant, setVariant] = useState<ABVariant | null>(() => {
    const v = localStorage.getItem(localKey(experimentKey));
    return v === "A" || v === "B" ? v : null;
  });

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    (async () => {
      const anonId = getAnonId();

      // 1) Try to fetch existing assignment from DB
      let existing: ABVariant | null = null;
      if (user) {
        const { data } = await supabase
          .from("ab_assignments")
          .select("variant")
          .eq("experiment_key", experimentKey)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.variant === "A" || data?.variant === "B") existing = data.variant as ABVariant;
      } else {
        const { data } = await supabase
          .from("ab_assignments")
          .select("variant")
          .eq("experiment_key", experimentKey)
          .eq("anon_id", anonId)
          .maybeSingle();
        if (data?.variant === "A" || data?.variant === "B") existing = data.variant as ABVariant;
      }

      let chosen: ABVariant;
      if (existing) {
        chosen = existing;
      } else {
        const local = localStorage.getItem(localKey(experimentKey));
        chosen = local === "A" || local === "B" ? (local as ABVariant) : Math.random() < 0.5 ? "A" : "B";

        await supabase.from("ab_assignments").insert([{
          experiment_key: experimentKey,
          variant: chosen,
          user_id: user?.id ?? null,
          anon_id: user ? null : anonId,
        }]);
      }

      localStorage.setItem(localKey(experimentKey), chosen);
      if (!cancelled) setVariant(chosen);
    })();

    return () => {
      cancelled = true;
    };
  }, [experimentKey, user?.id, loading]);

  const track = async (eventType: "view" | "click" | "conversion", metadata: Record<string, unknown> = {}) => {
    if (!variant) return;
    const anonId = getAnonId();
    await supabase.from("ab_events").insert([{
      experiment_key: experimentKey,
      variant,
      event_type: eventType,
      user_id: user?.id ?? null,
      anon_id: user ? null : anonId,
      metadata: metadata as never,
    }]);
  };

  return { variant, track };
};
