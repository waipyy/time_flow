

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
import { startOfWeek, isWithinInterval } from 'date-fns';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { getTagColor, getTagColorDark } from '@/lib/utils';

interface TimeBreakdownChartProps {
  events: TimeEvent[];
  allTags: Tag[];
}

const parseDate = (dateString: string | Date) => {
  return typeof dateString === 'string' ? new Date(dateString) : dateString;
};

export function TimeBreakdownChart({ events: rawEvents, allTags }: TimeBreakdownChartProps) {
  const { resolvedTheme } = useTheme();

  const events = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents.map(e => ({
      ...e,
      startTime: parseDate(e.startTime),
      endTime: parseDate(e.endTime),
    }))
  }, [rawEvents]);

  const chartData = useMemo(() => {
    const tagDurations: { [key: string]: number } = {};
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday

    const recentEvents = events.filter(e =>
      isWithinInterval(e.startTime, { start: startOfThisWeek, end: today })
    );

    recentEvents.forEach(event => {
      event.tagIds?.forEach((tagId: string) => {
        if (!tagDurations[tagId]) {
          tagDurations[tagId] = 0;
        }
        tagDurations[tagId] += event.duration;
      });
    });

    // Map tag IDs to tag info for display
    return Object.entries(tagDurations).map(([tagId, value]) => {
      const tag = allTags.find(t => t.id === tagId);
      const tagName = tag?.name || 'Unknown';
      const tagColor = tag?.color || '#cccccc';
      return {
        name: tagName,
        value: value / 60, // Display in hours
        fill: resolvedTheme === 'dark' ? darkenColor(tagColor) : tagColor,
      };
    });
  }, [events, resolvedTheme, allTags]);

  // Helper to darken a hex color for dark mode
  function darkenColor(color: string): string {
    if (!color.startsWith('#')) return color;
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    r = Math.floor(r * 0.6);
    g = Math.floor(g * 0.6);
    b = Math.floor(b * 0.6);
    return `rgb(${r}, ${g}, ${b})`;
  }

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
        No time logged this week.
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
