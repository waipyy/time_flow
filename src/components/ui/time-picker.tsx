
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
    if (!isNaN(hours) && hours >= 0 && hours <= 23) {
      // Create a new date object with the correct local time
      const newDate = new Date(date);
      newDate.setHours(hours);
      setDate(newDate);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes >= 0 && minutes <= 59) {
      // Create a new date object with the correct local time
      const newDate = new Date(date);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };
  
  const formatTwoDigits = (num: number) => {
    return num.toString().padStart(2, '0');
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={23}
        value={date ? formatTwoDigits(date.getHours()) : ''}
        onChange={handleHourChange}
        className="w-16"
        aria-label="Hour"
      />
      <span>:</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={date ? formatTwoDigits(date.getMinutes()) : ''}
        onChange={handleMinuteChange}
        className="w-16"
        aria-label="Minute"
      />
    </div>
  );
}
