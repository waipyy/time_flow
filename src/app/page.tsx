
'use client';

import {
  Sidebar,
  SidebarContent as SidebarContentWrapper,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { TimeFlowLogo } from '@/components/icons';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MainContent } from '@/components/app/main-content';
import { SidebarContent } from '@/components/app/sidebar-content';

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar className="bg-sidebar" collapsible="icon">
          <SidebarHeader className="items-center justify-center p-4">
            <TimeFlowLogo className="size-8" />
            <h1 className="font-semibold text-xl text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              TimeFlow
            </h1>
          </SidebarHeader>
          <Suspense>
            <SidebarContent />
          </Suspense>
        </Sidebar>
        <div className="flex flex-col flex-1 w-full pr-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <MainContent />
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardSkeleton() {
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
  );
}
/* Test sync from GitHub to Studio */
