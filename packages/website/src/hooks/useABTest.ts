import { useEffect, useState } from 'react';

const ANON_KEY = 'ab_anon_id';
const localKey = (exp: string) => `ab_assignment_${exp}`;

export type ABVariant = 'A' | 'B';

const getAnonId = (): string => {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
};

/** Local-only A/B assignment for public marketing surfaces. */
export const useABTest = (experimentKey: string) => {
  const [variant, setVariant] = useState<ABVariant | null>(() => {
    const v = localStorage.getItem(localKey(experimentKey));
    return v === 'A' || v === 'B' ? v : null;
  });

  useEffect(() => {
    if (variant) return;
    const chosen: ABVariant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(localKey(experimentKey), chosen);
    setVariant(chosen);
  }, [experimentKey, variant]);

  const track = async (
    _eventType: 'view' | 'click' | 'conversion',
    _metadata: Record<string, unknown> = {},
  ) => {
    void getAnonId();
  };

  return { variant, track };
};
