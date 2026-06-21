import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS, type Category } from '@unidealz/shared';
import { db } from '@/lib/firebase';
import { mapCategory, type OfferCategory } from '@/lib/offerMappers';

export const categoryKeys = {
  all: ['categories'] as const,
};

export const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.all,
    queryFn: async (): Promise<OfferCategory[]> => {
      const snap = await getDocs(collection(db, COLLECTIONS.categories));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Category))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(mapCategory);
    },
  });
