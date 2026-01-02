

'use client'

import type { TimeEvent, Goal, Tag } from '@/lib/types';
import { KpiCard } from './kpi-card';
import { GoalProgressCard } from './goal-progress-card';
import { TimeBreakdownChart } from './time-breakdown-chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { startOfWeek, isWithinInterval } from 'date-fns';
import { Hourglass, Trophy } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { getTimePeriodDateRange } from '@/lib/utils';


function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
        <div className="col-span-12 lg:col-span-1 space-y-4">
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface DashboardViewProps {
  events: TimeEvent[];
  goals: Goal[];
  tags: Tag[];
}

export function DashboardView({ events, goals, tags }: DashboardViewProps) {
  if (!events || !goals || !tags) {
    return <DashboardSkeleton />;
  }

  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday

  const weeklyTotalHours =
    events
      .filter(e => {
        const eventDate = new Date(e.startTime);
        return isWithinInterval(eventDate, { start: startOfThisWeek, end: today });
      })
      .reduce((acc, event) => acc + event.duration, 0) / 60;

  const targetGoals = goals.filter(g => g.comparison === 'at-least');

  const goalsAchieved = targetGoals.filter(goal => {
    const { start, end } = getTimePeriodDateRange(goal.timePeriod);
    const relevantEvents = events.filter(event => {
      const eventTime = new Date(event.startTime).getTime();
      if (eventTime < start.getTime() || eventTime > end.getTime()) return false;

      // Get goal's tag IDs (prefer eligibleTagIds, fallback to eligibleTags for backward compat)
      const goalTagIds = goal.eligibleTagIds || [];
      const goalTagNames = goal.eligibleTags || [];

      // Get event's tag IDs (prefer tagIds, fallback to tags for backward compat)
      const eventTagIds = event.tagIds || [];
      const eventTagNames = event.tags || [];

      // Match by IDs first
      if (goalTagIds.length > 0 && eventTagIds.length > 0) {
        return goalTagIds.some(tagId => eventTagIds.includes(tagId));
      }

      // Fallback: match by names (for non-migrated data)
      if (goalTagNames.length > 0 && eventTagNames.length > 0) {
        return goalTagNames.some(tagName => eventTagNames.includes(tagName));
      }

      return false;
    });
    const totalHours = relevantEvents.reduce((acc, event) => acc + event.duration, 0) / 60;

    if (goal.comparison === 'at-least') {
      return totalHours >= goal.targetAmount;
    }
    // For 'no-more-than' goals, "achieved" means staying under the limit.
    // We are only showing achievement rate for target goals for now.
    return false;
  }).length;

  const goalAchievementRate = targetGoals.length > 0 ? (goalsAchieved / targetGoals.length) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          title="This Week's Hours Logged"
          value={`${weeklyTotalHours.toFixed(1)}h`}
          icon={Hourglass}
          tooltip="Total hours logged from Monday to today."
        />
        <KpiCard
          title="Goal Achievement Rate"
          value={`${goalAchievementRate.toFixed(0)}%`}
          icon={Trophy}
          tooltip="Percentage of 'at-least' goals achieved in their current time period."
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Time Breakdown by Tag (This Week)</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeBreakdownChart events={events} allTags={tags} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-4 pr-4">
                  {goals.map(goal => (
                    <GoalProgressCard key={goal.id} goal={goal} events={events} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
