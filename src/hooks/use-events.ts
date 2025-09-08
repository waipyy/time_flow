
'use client';

import useSWR from 'swr';
import type { TimeEvent } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<TimeEvent[]>('/api/events', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    events: data,
    isLoading,
    isError: error,
    mutateEvents: mutate,
  };
}
