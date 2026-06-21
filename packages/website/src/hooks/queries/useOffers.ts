import { useQuery } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type Brand, type Category, type Offer } from '@unidealz/shared';
import { db } from '@/lib/firebase';
import {
  mapBrand,
  mapCategory,
  mapOffer,
  type PublicOffer,
} from '@/lib/offerMappers';

export const offerKeys = {
  all: ['offers'] as const,
  detail: (id: string) => ['offer', id] as const,
};

async function fetchActiveOffers(): Promise<PublicOffer[]> {
  const offersRef = collection(db, COLLECTIONS.offers);
  const offersSnap = await getDocs(
    query(offersRef, where('active', '==', true)),
  );

  const [brandsSnap, categoriesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.brands)),
    getDocs(collection(db, COLLECTIONS.categories)),
  ]);

  const brands = new Map(
    brandsSnap.docs.map((d) => {
      const data = { id: d.id, ...d.data() } as Brand;
      return [data.id, mapBrand(data)];
    }),
  );
  const categories = new Map(
    categoriesSnap.docs.map((d) => {
      const data = { id: d.id, ...d.data() } as Category;
      return [data.id, mapCategory(data)];
    }),
  );

  return offersSnap.docs
    .map((d) => {
      const data = { id: d.id, ...d.data() } as Offer;
      return mapOffer(
        data,
        brands.get(data.brandId) ?? null,
        categories.get(data.categoryId) ?? null,
      );
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });
}

async function fetchOfferById(id: string): Promise<PublicOffer | null> {
  const offerSnap = await getDoc(doc(db, COLLECTIONS.offers, id));
  if (!offerSnap.exists()) return null;

  const data = { id: offerSnap.id, ...offerSnap.data() } as Offer;
  if (!data.active) return null;

  const [brandSnap, categorySnap] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.brands, data.brandId)),
    getDoc(doc(db, COLLECTIONS.categories, data.categoryId)),
  ]);

  const brand = brandSnap.exists()
    ? mapBrand({ id: brandSnap.id, ...brandSnap.data() } as Brand)
    : null;
  const category = categorySnap.exists()
    ? mapCategory({ id: categorySnap.id, ...categorySnap.data() } as Category)
    : null;

  return mapOffer(data, brand, category);
}

export const useOffers = () =>
  useQuery({
    queryKey: offerKeys.all,
    queryFn: fetchActiveOffers,
  });

export const useOffer = (id: string | undefined) =>
  useQuery({
    queryKey: offerKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: () => fetchOfferById(id!),
  });

export type { PublicOffer as DbOffer };
