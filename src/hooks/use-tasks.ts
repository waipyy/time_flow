
'use client';

import useSWR from 'swr';
import type { Task } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>('/api/tasks', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    tasks: data,
    isLoading,
    isError: error,
    mutateTasks: mutate,
  };
}
