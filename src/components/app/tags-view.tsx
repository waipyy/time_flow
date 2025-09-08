
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TagForm } from './tag-form';
import type { Goal, Tag } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { TagsTable } from './tags-table';


function TagsSkeleton() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="rounded-lg border">
        <div className="p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

interface TagsViewProps {
  tags: Tag[];
  goals: Goal[];
}

export function TagsView({ tags, goals }: TagsViewProps) {
  if (!tags || !goals) {
    return <TagsSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Tags</h2>
          <p className="text-muted-foreground">
            Create and manage your tags for events and goals.
          </p>
        </div>
        <TagForm>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Tag
          </Button>
        </TagForm>
      </div>

       {tags.length > 0 ? (
          <TagsTable tags={tags} goals={goals} />
       ) : (
         <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center">
           <CardHeader>
             <CardTitle>No tags yet!</CardTitle>
             <CardDescription>Click "New Tag" to create your first tag.</CardDescription>
           </CardHeader>
           <CardContent>
             <TagForm>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Create a Tag
               </Button>
             </TagForm>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
