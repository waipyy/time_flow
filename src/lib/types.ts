export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimeEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  tags?: string[]; // Array of tag names
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
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetHours: number;
  tags: string[]; // Array of tag names
}
