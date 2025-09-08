
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, Duration } from 'date-fns';
import type { TimeEvent, Tag } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTagColor(tag: string, allTags: Tag[]): string {
  const foundTag = allTags.find(t => t.name === tag);
  if (foundTag) {
    return foundTag.color;
  }

  // Fallback color generation
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 80%)`;
};

export function getTagColorDark(tag: string, allTags: Tag[]): string {
  const foundTag = allTags.find(t => t.name === tag);
  if (foundTag) {
    // A bit of logic to darken the color for dark mode
    // This is a simplistic approach. A better one might involve color libraries.
    const color = foundTag.color;
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    r = Math.floor(r * 0.6);
    g = Math.floor(g * 0.6);
    b = Math.floor(b * 0.6);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Fallback color generation
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 40%, 30%)`;
};

export const getTimePeriodDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

export const getUniqueTags = (events: TimeEvent[]): string[] => {
  const allTags = events.flatMap(event => event.tags);
  return [...new Set(allTags)];
}
