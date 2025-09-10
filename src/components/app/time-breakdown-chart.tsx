'use client';

import type { TimeEvent, Tag } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { getTagColor, getTagColorDark } from '@/lib/utils';

interface TimeBreakdownChartProps {
  events: TimeEvent[];
  allTags: Tag[];
}

const parseUTC = (dateString: string | Date) => {
  if (dateString instanceof Date) {
    return dateString;
  }
  const date = new Date(dateString);
  return date;
};

export function TimeBreakdownChart({ events: rawEvents, allTags }: TimeBreakdownChartProps) {
  const { resolvedTheme } = useTheme();

  const events = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents.map(e => ({
    ...e,
    startTime: parseUTC(e.startTime),
    endTime: parseUTC(e.endTime),
  }))}, [rawEvents]);
  
  const chartData = useMemo(() => {
    const tagDurations: { [key: string]: number } = {};
    const recentEvents = events.filter(
      e => differenceInDays(new Date(), e.startTime) <= 7
    );

    recentEvents.forEach(event => {
      event.tags.forEach(tag => {
        if (!tagDurations[tag]) {
          tagDurations[tag] = 0;
        }
        tagDurations[tag] += event.duration;
      });
    });

    return Object.entries(tagDurations).map(([name, value]) => ({
      name,
      value: value / 60, // Display in hours
      fill: resolvedTheme === 'dark' ? getTagColorDark(name, allTags) : getTagColor(name, allTags),
    }));
  }, [events, resolvedTheme, allTags]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    chartData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No time logged in the last 7 days.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value) => `${(value as number).toFixed(1)}h`}
            hideLabel 
          />}
        />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60}>
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2"
        />
      </PieChart>
    </ChartContainer>
  );
}
