
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Plus } from 'lucide-react';
import { NaturalLanguageInput } from './natural-language-input';
import { EventForm } from './event-form';
import { useState } from 'react';
import { useTags } from '@/hooks/use-tags';
import { SidebarTrigger } from '../ui/sidebar';

export function AppHeader() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'dashboard';

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const { tags } = useTags();


  const viewTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    goals: 'Goals',
    tags: 'Tags',
  };

  const title = viewTitles[view] || 'Dashboard';

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAiModalOpen(true)}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            Log with AI
          </Button>
          <Button onClick={() => setIsManualModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </header>
      <NaturalLanguageInput isOpen={isAiModalOpen} onOpenChange={setIsAiModalOpen} availableTags={tags || []} />
      <EventForm isOpen={isManualModalOpen} onOpenChange={setIsManualModalOpen} availableTags={tags || []} />
    </>
  );
}
