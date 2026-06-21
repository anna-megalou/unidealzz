import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS, type Brand } from '@unidealz/shared';
import { db } from '@/lib/firebase';
import { mapBrand, type OfferBrand } from '@/lib/offerMappers';

export const brandKeys = {
  all: ['brands'] as const,
};

export const useBrands = () =>
  useQuery({
    queryKey: brandKeys.all,
    queryFn: async (): Promise<OfferBrand[]> => {
      const snap = await getDocs(collection(db, COLLECTIONS.brands));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Brand))
        .filter((b) => b.archivedAt == null)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(mapBrand);
    },
  });
