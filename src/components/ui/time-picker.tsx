
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { set } from 'date-fns';

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;
    const hours = parseInt(e.target.value, 10);
    if (hours >= 0 && hours <= 23) {
      setDate(set(date, { hours }));
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;
    const minutes = parseInt(e.target.value, 10);
    if (minutes >= 0 && minutes <= 59) {
      setDate(set(date, { minutes }));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={23}
        value={date ? date.getHours() : ''}
        onChange={handleHourChange}
        className="w-16"
        aria-label="Hour"
      />
      <span>:</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={date ? date.getMinutes() : ''}
        onChange={handleMinuteChange}
        className="w-16"
        aria-label="Minute"
      />
    </div>
  );
}
