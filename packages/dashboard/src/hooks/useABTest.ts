import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createAbAssignment, fetchAbAssignment, trackAbEvent } from '@/lib/firestoreData';

const ANON_KEY = 'ab_anon_id';

const getAnonId = (): string => {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
};

const localKey = (exp: string) => `ab_assignment_${exp}`;

export type ABVariant = 'A' | 'B';

export const useABTest = (experimentKey: string) => {
  const { user, loading } = useAuth();
  const [variant, setVariant] = useState<ABVariant | null>(() => {
    const v = localStorage.getItem(localKey(experimentKey));
    return v === 'A' || v === 'B' ? v : null;
  });

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    (async () => {
      let existing: ABVariant | null = null;
      if (user) {
        existing = await fetchAbAssignment(user.uid, experimentKey);
      }

      let chosen: ABVariant;
      if (existing) {
        chosen = existing;
      } else {
        const local = localStorage.getItem(localKey(experimentKey));
        chosen = local === 'A' || local === 'B' ? (local as ABVariant) : Math.random() < 0.5 ? 'A' : 'B';

        if (user) {
          await createAbAssignment({
            userId: user.uid,
            experimentKey,
            variant: chosen,
          });
        } else {
          getAnonId();
        }
      }

      localStorage.setItem(localKey(experimentKey), chosen);
      if (!cancelled) setVariant(chosen);
    })();

    return () => {
      cancelled = true;
    };
  }, [experimentKey, user?.uid, loading]);

  const track = async (eventType: 'view' | 'click' | 'conversion', metadata: Record<string, unknown> = {}) => {
    if (!variant || !user) return;
    await trackAbEvent({
      userId: user.uid,
      experimentKey,
      variant,
      eventType,
      metadata,
    });
  };

  return { variant, track };
};
