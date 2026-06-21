import { useQuery } from '@tanstack/react-query';
import { callGetPublicStats, type PublicStats } from '@/lib/firebase';

export const publicStatsKeys = {
  all: ['public-stats'] as const,
};

export const usePublicStats = () =>
  useQuery({
    queryKey: publicStatsKeys.all,
    queryFn: async (): Promise<PublicStats> => {
      const result = await callGetPublicStats();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
