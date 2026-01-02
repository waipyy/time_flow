
'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardView } from '@/components/app/dashboard-view';
import { CalendarView } from '@/components/app/calendar-view';
import { GoalsView } from '@/components/app/goals-view';
import { TagsView } from '@/components/app/tags-view';
import { useEvents } from '@/hooks/use-events';
import { useGoals } from '@/hooks/use-goals';
import { useTags } from '@/hooks/use-tags';
import { Skeleton } from '../ui/skeleton';
import { AppHeader } from './app-header';
import { cn } from '@/lib/utils';

function FullPageSkeleton() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Skeleton className="h-[300px] rounded-lg" />
          </div>
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Skeleton className="h-[300px] rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  )
}

export function MainContent() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const { events, isLoading: isLoadingEvents } = useEvents();
  const { goals, isLoading: isLoadingGoals } = useGoals();
  const { tags, isLoading: isLoadingTags } = useTags();

  const isLoading = isLoadingEvents || isLoadingGoals || isLoadingTags;

  const mainContentClass = cn(
    "flex-1",
    currentView === 'calendar'
      ? 'flex flex-col overflow-hidden'
      : 'p-4 sm:p-6 lg:p-8'
  );

  return (
    <>
      <AppHeader />
      <main className={mainContentClass}>
        {isLoading ? <FullPageSkeleton /> : (
          <>
            {currentView === 'dashboard' && <DashboardView events={events || []} goals={goals || []} tags={tags || []} />}
            {currentView === 'calendar' && <CalendarView events={events || []} tags={tags || []} />}
            {currentView === 'goals' && <GoalsView events={events || []} goals={goals || []} />}
            {currentView === 'tags' && <TagsView tags={tags || []} goals={goals || []} />}
          </>
        )}
      </main>
    </>
  );
}
