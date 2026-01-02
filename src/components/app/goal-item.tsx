
'use client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { GoalProgressCard } from "./goal-progress-card";
import type { Goal, Tag, TimeEvent } from "@/lib/types";
import { Button } from "../ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoalForm } from "./goal-form";
import { deleteGoal } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTransition } from "react";
import { mutate } from "swr";
import { useTags } from "@/hooks/use-tags";
import { Badge } from "../ui/badge";


interface GoalItemProps {
    goal: Goal;
    events: TimeEvent[];
}

export function GoalItem({ goal, events }: GoalItemProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { tags } = useTags();

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteGoal(goal.id);
            if (result.success) {
                toast({
                    title: "Goal Deleted",
                    description: `"${goal.name}" has been removed.`
                });
                mutate('/api/goals');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not delete the goal.',
                });
            }
        });
    }

    const getTagColor = (tagId: string) => {
        if (!tags) return '#cccccc';
        const tag = tags.find(t => t.id === tagId);
        return tag ? tag.color : '#cccccc';
    }

    const getTagName = (tagId: string) => {
        if (!tags) return tagId;
        const tag = tags.find(t => t.id === tagId);
        return tag ? tag.name : tagId;
    }

    // Get tag IDs (prefer eligibleTagIds, fallback to eligibleTags for backward compat)
    const tagIds = goal.eligibleTagIds?.length
        ? goal.eligibleTagIds
        : (goal.eligibleTags || []);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{goal.name}</CardTitle>
                        <CardDescription className="capitalize pt-1">
                            {goal.timePeriod} {goal.comparison === 'no-more-than' ? 'Limit' : 'Target'}: {goal.targetAmount} hours
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPending}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <GoalForm goalToEdit={goal} availableTags={tags || []}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            </GoalForm>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your goal.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <GoalProgressCard goal={goal} events={events} />
            </CardContent>
            <CardFooter>
                <div className="flex flex-wrap gap-1">
                    {tagIds.map(tagId => (
                        <Badge key={tagId} className="text-xs" style={{ backgroundColor: getTagColor(tagId) }}>
                            {getTagName(tagId)}
                        </Badge>
                    ))}
                </div>
            </CardFooter>
        </Card>
    )
}
