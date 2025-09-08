
'use client'

import { GoalItem } from './goal-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GoalForm } from './goal-form';
import { Plus } from 'lucide-react';
import type { Goal, TimeEvent } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useTags } from '@/hooks/use-tags';

function GoalsSkeleton() {
  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-full" /></CardContent>
          <div className="p-6 pt-0"><Skeleton className="h-4 w-1/3" /></div>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-full" /></CardContent>
          <div className="p-6 pt-0"><Skeleton className="h-4 w-1/2" /></div>
        </Card>
      </div>
    </div>
  )
}

interface GoalsViewProps {
  goals: Goal[];
  events: TimeEvent[];
}

export function GoalsView({ goals, events }: GoalsViewProps) {
  const { tags } = useTags();

  if (!goals || !events || !tags) {
    return <GoalsSkeleton />;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Goals</h2>
          <p className="text-muted-foreground">
            Create and manage your time-based goals.
          </p>
        </div>
        <GoalForm availableTags={tags}>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
            </Button>
        </GoalForm>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} events={events} />
        ))}
      </div>
       {goals.length === 0 && (
         <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center">
           <CardHeader>
             <CardTitle>No goals yet!</CardTitle>
             <CardDescription>Click "New Goal" to set your first time-tracking objective.</CardDescription>
           </CardHeader>
           <CardContent>
             <GoalForm availableTags={tags}>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Create a Goal
               </Button>
             </GoalForm>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
