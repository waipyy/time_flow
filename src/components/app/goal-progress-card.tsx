import type { Goal, TimeEvent } from '@/lib/types';
import { getTimePeriodDateRange } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GoalProgressCardProps {
  goal: Goal;
  events: TimeEvent[];
}

export function GoalProgressCard({ goal, events }: GoalProgressCardProps) {
  const { start, end } = getTimePeriodDateRange(goal.timePeriod);

  const relevantEvents = events.filter(event => {
    // Ensure startTime is a Date object before calling getTime()
    const eventTime = (typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime).getTime();
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

  const totalMinutes = relevantEvents.reduce(
    (acc, event) => acc + event.duration,
    0
  );
  const totalHours = totalMinutes / 60;

  const progress =
    goal.targetAmount > 0
      ? (totalHours / goal.targetAmount) * 100
      : 100;

  const isOverLimit = goal.comparison === 'no-more-than' && totalHours > goal.targetAmount;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <h4 className="font-semibold text-sm">{goal.name}</h4>
        <p className="text-xs text-muted-foreground">
          {totalHours.toFixed(1)}h / {goal.targetAmount}h
        </p>
      </div>
      <Progress value={progress} className={cn(isOverLimit && '[&>div]:bg-destructive')} />
    </div>
  );
}
