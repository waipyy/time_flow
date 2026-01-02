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
  tagIds: string[]; // Array of tag IDs
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
  name: string;
  timePeriod: 'daily' | 'weekly' | 'monthly';
  targetAmount: number;
  comparison: 'at-least' | 'no-more-than';
  eligibleTagIds: string[]; // Array of tag IDs
}
