export type TimeEvent = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  startTime: Date | string; // Allow string for serialization
  endTime: Date | string; // Allow string for serialization
  duration: number; // in minutes
};

export type Goal = {
  id: string;
  name: string;
  eligibleTags: string[];
  targetAmount: number; // in hours
  timePeriod: 'daily' | 'weekly' | 'monthly';
  comparison: 'at-least' | 'no-more-than';
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};
