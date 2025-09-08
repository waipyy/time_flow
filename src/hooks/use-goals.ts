
'use client';

import useSWR from 'swr';
import type { Goal } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useGoals() {
  const { data, error, isLoading } = useSWR<Goal[]>('/api/goals', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    goals: data,
    isLoading,
    isError: error,
  };
}
