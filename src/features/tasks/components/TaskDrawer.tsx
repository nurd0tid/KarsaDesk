'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUiStore } from '@/stores/ui.store';
import { useTask, useCreateTask, useUpdateTask } from '@/features/tasks/hooks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { TaskStatus } from '@/types';
import { AlertCircle } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum(['feature', 'bug', 'chore', 'refactor', 'docs']),
  estimate_days: z.coerce.number().min(0).optional(),
  estimate_hours: z.coerce.number().min(0).optional(),
  acceptance_criteria: z.string().optional(),
  related_files: z.string().optional(),
  related_docs: z.string().optional(),
  dependencies: z.string().optional(),
  blocked_reason: z.string().optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const TYPE_OPTIONS = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'chore', label: 'Chore' },
  { value: 'refactor', label: 'Refactor' },
  { value: 'docs', label: 'Docs' },
];

export function TaskDrawer() {
  const { isTaskDrawerOpen, activeTaskId, closeTaskDrawer, activeProjectId } = useUiStore();
  const { data: existingTask, isLoading: isLoadingTask } = useTask(activeTaskId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!activeTaskId;
  const blockedReasonRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskSchema as any) as any,
    defaultValues: {
      title: '',
      description: '',
      status: 'backlog',
      priority: 'medium',
      type: 'feature',
      estimate_days: undefined,
      estimate_hours: undefined,
      acceptance_criteria: '',
      related_files: '',
      related_docs: '',
      dependencies: '',
      blocked_reason: '',
      progress: undefined,
    },
  });

  const currentStatus = watch('status');

  useEffect(() => {
    if (existingTask && isEditing) {
      reset({
        title: existingTask.title,
        description: existingTask.description || '',
        status: existingTask.status,
        priority: (existingTask.priority as TaskFormValues['priority']) || 'medium',
        type: (existingTask.type as TaskFormValues['type']) || 'feature',
        estimate_days: existingTask.estimate_days ?? undefined,
        estimate_hours: existingTask.estimate_hours ?? undefined,
        acceptance_criteria: existingTask.acceptance_criteria || '',
        related_files: existingTask.related_files || '',
        related_docs: existingTask.related_docs || '',
        dependencies: existingTask.dependencies || '',
        blocked_reason: existingTask.blocked_reason || '',
        progress: existingTask.progress ?? undefined,
      });
    } else if (!isEditing && isTaskDrawerOpen) {
      reset({
        title: '',
        description: '',
        status: 'backlog',
        priority: 'medium',
        type: 'feature',
        estimate_days: undefined,
        estimate_hours: undefined,
        acceptance_criteria: '',
        related_files: '',
        related_docs: '',
        dependencies: '',
        blocked_reason: '',
        progress: undefined,
      });
    }
  }, [existingTask, isEditing, isTaskDrawerOpen, reset]);

  const onSubmit = (values: TaskFormValues) => {
    if (isEditing && existingTask) {
      updateTask.mutate(
        { id: existingTask.Id, ...values },
        {
          onSuccess: () => {
            toast.success('Task updated successfully');
            closeTaskDrawer();
          },
          onError: (err) => {
            toast.error('Failed to update task', { description: err.message });
          },
        }
      );
    } else {
      createTask.mutate(
        { ...values, project_id: Number(activeProjectId) },
        {
          onSuccess: () => {
            toast.success('Task created successfully');
            closeTaskDrawer();
          },
          onError: (err) => {
            toast.error('Failed to create task', { description: err.message });
          },
        }
      );
    }
  };

  const markBlocked = () => {
    setValue('status', 'blocked');
    setTimeout(() => {
      if (blockedReasonRef.current) {
        blockedReasonRef.current.focus();
      }
    }, 100);
  };

  const isMutating = createTask.isPending || updateTask.isPending;

  const { ref: registeredBlockedReasonRef, ...blockedReasonRest } = register('blocked_reason');

  return (
    <Sheet open={isTaskDrawerOpen} onOpenChange={(open) => !open && closeTaskDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Task' : 'New Task'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </SheetDescription>
        </SheetHeader>

        {isEditing && isLoadingTask ? (
          <div className="space-y-4 px-4 py-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : (
          <form
            id="task-drawer-form"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={handleSubmit(onSubmit as any)}
            className="flex flex-col gap-4 px-4 py-4"
          >
            {currentStatus !== 'blocked' && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={markBlocked} className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-800">
                  <AlertCircle className="size-4 mr-1.5" />
                  Mark Blocked
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" {...register('title')} placeholder="Task title" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                {...register('description')}
                placeholder="Describe the task..."
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-progress">Progress (%)</Label>
                <Input
                  id="task-progress"
                  type="number"
                  min="0"
                  max="100"
                  {...register('progress')}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-estimate-days">Estimate (days)</Label>
                <Input
                  id="task-estimate-days"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimate_days')}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-estimate-hours">Estimate (hours)</Label>
                <Input
                  id="task-estimate-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimate_hours')}
                  placeholder="0"
                />
              </div>
            </div>

            {currentStatus === 'blocked' && (
              <div className="space-y-2">
                <Label htmlFor="task-blocked-reason" className="text-red-500">Blocked Reason</Label>
                <Textarea
                  id="task-blocked-reason"
                  placeholder="Why is this task blocked?"
                  className="min-h-20 border-red-300 dark:border-red-800"
                  {...blockedReasonRest}
                  ref={(e) => {
                    registeredBlockedReasonRef(e);
                    if (blockedReasonRef) {
                      (blockedReasonRef as any).current = e;
                    }
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-acceptance">Acceptance Criteria</Label>
              <Textarea
                id="task-acceptance"
                {...register('acceptance_criteria')}
                placeholder="Define what done looks like..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-dependencies">Dependencies</Label>
              <Textarea
                id="task-dependencies"
                {...register('dependencies')}
                placeholder="List dependency task IDs or details..."
                className="min-h-16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-related-files">Related Files</Label>
              <Input
                id="task-related-files"
                {...register('related_files')}
                placeholder="e.g. src/components/Button.tsx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-related-docs">Related Docs</Label>
              <Input
                id="task-related-docs"
                {...register('related_docs')}
                placeholder="e.g. docs/api.md"
              />
            </div>
          </form>
        )}

        <SheetFooter>
          <Button variant="outline" onClick={closeTaskDrawer} disabled={isMutating}>
            Cancel
          </Button>
          <Button form="task-drawer-form" type="submit" disabled={isMutating}>
            {isMutating ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
