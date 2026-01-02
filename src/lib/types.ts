export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimeEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Duration in minutes
  tags?: string[]; // DEPRECATED: Array of tag names (for backward compat)
  tagIds?: string[]; // Array of tag IDs (preferred)
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  deadline?: Date; // Optional deadline
  createdAt: Date;
  tags?: string[]; // Array of tag names
}

export interface Goal {
  id: string;
  name?: string; // Goal name
  title?: string; // Legacy field
  frequency?: 'daily' | 'weekly' | 'monthly';
  timePeriod?: 'daily' | 'weekly' | 'monthly';
  targetHours?: number;
  targetAmount?: number;
  comparison?: 'at-least' | 'no-more-than';
  eligibleTags?: string[]; // DEPRECATED: Array of tag names (for backward compat)
  eligibleTagIds?: string[]; // Array of tag IDs (preferred)
  tags?: string[]; // Legacy field
}
