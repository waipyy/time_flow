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
    const eventTime = (typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime).getTime();
    if (eventTime < start.getTime() || eventTime > end.getTime()) return false;
    return goal.eligibleTagIds?.some(tagId => event.tagIds?.includes(tagId)) ?? false;
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
