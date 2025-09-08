
'use client';

import useSWR from 'swr';
import type { Tag } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useTags() {
  const { data, error, isLoading } = useSWR<Tag[]>('/api/tags', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    tags: data,
    isLoading,
    isError: error,
  };
}
